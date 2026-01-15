<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accounting\Bill;
use App\Models\Accounting\BillItem;
use App\Http\Requests\Accounting\StoreBillRequest;
use App\Http\Requests\Accounting\UpdateBillRequest;
use App\Helpers\JournalHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

class BillController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:bills.view')->only(['index', 'show']);
        $this->middleware('permission:bills.create')->only(['store']);
        $this->middleware('permission:bills.edit')->only(['update']);
        $this->middleware('permission:bills.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = Bill::with('vendor');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('bill_number', 'like', "%{$search}%")
                ->orWhere('reference_number', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $bills = $query->latest()->paginate($request->input('limit', 10));
        return response()->json($bills);
    }

    public function store(StoreBillRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // Generate bill number
            $billCount = Bill::count() + 1;
            $billNumber = 'BILL-' . str_pad($billCount, 5, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $taxTotal = 0;

            foreach ($validated['items'] as $item) {
                $subtotal += ($item['unit_price'] * $item['quantity']);
                $taxTotal += ($item['tax_amount'] ?? 0);
            }

            $total = $subtotal + $taxTotal;

            $bill = Bill::create([
                'bill_number' => $billNumber,
                'vendor_id' => $validated['vendor_id'],
                'bill_date' => $validated['bill_date'],
                'due_date' => $validated['due_date'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxTotal,
                'total_amount' => $total,
                'balance' => $total,
                'status' => $validated['status'] ?? 'pending',
                'notes' => $validated['notes'] ?? null,
                'reference_number' => $validated['reference_number'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                BillItem::create([
                    'bill_id' => $bill->id,
                    'chart_of_account_id' => $item['chart_of_account_id'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_amount' => $item['tax_amount'] ?? 0,
                    'line_total' => ($item['unit_price'] * $item['quantity']) + ($item['tax_amount'] ?? 0),
                ]);
            }

            // Create Journal Entry
            JournalHelper::createBillJournal($bill);

            AuditLog::log('created', 'bills', $bill->id, ['bill_number' => $billNumber]);

            DB::commit();
            return response()->json($bill->load('items'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating bill: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $bill = Bill::with(['vendor', 'items.account'])->findOrFail($id);
        return response()->json($bill);
    }

    public function update(UpdateBillRequest $request, $id)
    {
        $bill = Bill::findOrFail($id);
        $validated = $request->validated();

        DB::beginTransaction();
        try {
            // 1. Update Bill Header
            $subtotal = collect($validated['items'])->sum(function ($item) {
                return $item['unit_price'] * $item['quantity'];
            });

            $taxAmount = collect($validated['items'])->sum(fn($item) => $item['tax_amount'] ?? 0);
            $totalAmount = $subtotal + $taxAmount;

            $bill->update([
                'vendor_id' => $validated['vendor_id'],
                'bill_date' => $validated['bill_date'],
                'due_date' => $validated['due_date'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'balance' => $totalAmount - $bill->paid_amount,
                'notes' => $validated['notes'] ?? null,
                'reference_number' => $validated['reference_number'] ?? null,
            ]);

            // 2. Sync Items (Delete and Recreate)
            $bill->items()->delete();

            foreach ($validated['items'] as $item) {
                BillItem::create([
                    'bill_id' => $bill->id,
                    'chart_of_account_id' => $item['chart_of_account_id'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_amount' => $item['tax_amount'] ?? 0,
                    'line_total' => ($item['unit_price'] * $item['quantity']) + ($item['tax_amount'] ?? 0),
                ]);
            }

            // 3. Sync Journal Entry
            JournalHelper::deleteRelatedJournal('BILL-' . $bill->bill_number);
            JournalHelper::createBillJournal($bill);

            AuditLog::log('updated', 'bills', $bill->id, ['bill_number' => $bill->bill_number]);

            DB::commit();
            return response()->json($bill->load('items'));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating bill: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $bill = Bill::findOrFail($id);
        $bill->delete();

        AuditLog::log('deleted', 'bills', $id, ['bill_number' => $bill->bill_number]);

        return response()->json(['message' => 'Bill deleted successfully']);
    }
}
