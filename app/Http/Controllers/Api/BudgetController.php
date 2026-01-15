<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accounting\Budget;
use App\Models\Accounting\BudgetItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

class BudgetController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:budgets.view')->only(['index', 'show']);
        $this->middleware('permission:budgets.create')->only(['store']);
        $this->middleware('permission:budgets.edit')->only(['update']);
        $this->middleware('permission:budgets.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = Budget::query();

        if ($request->filled('fiscal_year')) {
            $query->where('fiscal_year', $request->fiscal_year);
        }

        $budgets = $query->latest()->paginate($request->input('limit', 10));
        return response()->json($budgets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'fiscal_year' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'items' => 'required|array|min:1',
            'items.*.chart_of_account_id' => 'required|exists:chart_of_accounts,id',
            'items.*.budgeted_amount' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $totalAmount = collect($validated['items'])->sum('budgeted_amount');

            $budget = Budget::create([
                'name' => $validated['name'],
                'fiscal_year' => $validated['fiscal_year'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'total_budgeted_amount' => $totalAmount,
                'status' => 'active'
            ]);

            foreach ($validated['items'] as $item) {
                BudgetItem::create([
                    'budget_id' => $budget->id,
                    'chart_of_account_id' => $item['chart_of_account_id'],
                    'budgeted_amount' => $item['budgeted_amount'],
                ]);
            }

            AuditLog::log('created', 'budgets', $budget->id, ['name' => $budget->name]);

            DB::commit();
            return response()->json($budget->load('items'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating budget: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $budget = Budget::with('items.account')->findOrFail($id);
        return response()->json($budget);
    }

    public function destroy($id)
    {
        $budget = Budget::findOrFail($id);
        $budget->delete();

        AuditLog::log('deleted', 'budgets', $id, ['name' => $budget->name]);

        return response()->json(['message' => 'Budget deleted successfully']);
    }

    public function refreshActuals($id)
    {
        $budget = Budget::with('items')->findOrFail($id);

        DB::beginTransaction();
        try {
            $totalActual = 0;
            foreach ($budget->items as $item) {
                // Sum journal items for this account during budget period
                $debits = \App\Models\Accounting\JournalItem::where('chart_of_account_id', $item->chart_of_account_id)
                    ->whereHas('journalEntry', function ($q) use ($budget) {
                        $q->whereBetween('date', [$budget->start_date, $budget->end_date]);
                    })->sum('debit');

                $credits = \App\Models\Accounting\JournalItem::where('chart_of_account_id', $item->chart_of_account_id)
                    ->whereHas('journalEntry', function ($q) use ($budget) {
                        $q->whereBetween('date', [$budget->start_date, $budget->end_date]);
                    })->sum('credit');

                // Assuming expense/asset accounts (Debit normal)
                // For revenue/liability, it would be credit - debit.
                // We'll use absolute movement or check account type.
                $account = \App\Models\Accounting\ChartOfAccount::find($item->chart_of_account_id);
                $actual = ($account->type === 'asset' || $account->type === 'expense')
                    ? ($debits - $credits)
                    : ($credits - $debits);

                $item->update(['actual_amount' => $actual]);
                $totalActual += $actual;
            }

            $budget->update(['total_actual_amount' => $totalActual]);

            DB::commit();
            return response()->json($budget->load('items'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error refreshing actuals: ' . $e->getMessage()], 500);
        }
    }
}
