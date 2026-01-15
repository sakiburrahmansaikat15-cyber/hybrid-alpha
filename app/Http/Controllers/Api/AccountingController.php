<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAccount;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalItem;
use App\Models\Accounting\Invoice;
use App\Models\Accounting\Bill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\Accounting\StoreAccountRequest;
use App\Http\Requests\Accounting\StoreJournalRequest;

class AccountingController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:accounts.view')->only(['getAccounts']);
        $this->middleware('permission:accounts.create')->only(['storeAccount']);
        $this->middleware('permission:journals.view')->only(['getJournals']);
        $this->middleware('permission:journals.create')->only(['storeJournal']);
        $this->middleware('permission:accounting.view_dashboard')->only(['getDashboardStats']);
    }
    // --- Chart of Accounts ---
    public function getAccounts(Request $request)
    {
        $query = ChartOfAccount::query();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%$keyword%")
                    ->orWhere('code', 'like', "%$keyword%");
            });
        }

        $limit = $request->limit ?? 10;
        $accounts = $query->orderBy('code')->paginate($limit);

        return response()->json([
            'data' => $accounts->items(),
            'pagination' => [
                'current_page' => $accounts->currentPage(),
                'per_page' => $accounts->perPage(),
                'total_items' => $accounts->total(),
                'total_pages' => $accounts->lastPage(),
            ]
        ]);
    }

    public function storeAccount(StoreAccountRequest $request)
    {
        $account = ChartOfAccount::create($request->validated());
        return response()->json($account, 201);
    }

    public function showAccount($id)
    {
        $account = ChartOfAccount::find($id);
        if (!$account)
            return response()->json(['message' => 'Account not found'], 404);
        return response()->json($account);
    }

    public function updateAccount(Request $request, $id)
    {
        $account = ChartOfAccount::find($id);
        if (!$account)
            return response()->json(['message' => 'Account not found'], 404);

        $validated = $request->validate([
            'code' => 'required|string|unique:chart_of_accounts,code,' . $id,
            'name' => 'required|string',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'sub_type' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $account->update($validated);
        return response()->json($account);
    }

    public function deleteAccount($id)
    {
        $account = ChartOfAccount::find($id);
        if (!$account)
            return response()->json(['message' => 'Account not found'], 404);

        // Check if account has transactions (JournalItems)
        if ($account->journalItems()->exists()) {
            return response()->json(['message' => 'Cannot delete account with existing transactions'], 422);
        }

        $account->delete();
        return response()->json(['message' => 'Account deleted successfully']);
    }

    // --- Journal Entries ---
    public function getJournals(Request $request)
    {
        $query = JournalEntry::with('items.account')->latest('date');

        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('reference', 'like', "%$keyword%")
                    ->orWhere('description', 'like', "%$keyword%");
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        $limit = $request->limit ?? 10;
        $journals = $query->paginate($limit);

        // Append calculated totals to pagination data if needed, but model accessors do it already if accessed.
        // However, accessors are not automatically in JSON unless appends is set.
        // We will just let the frontend calculate or use resource.
        // For simplicity, we stick to direct model output but ensure items are loaded.

        return response()->json([
            'data' => $journals->items(),
            'pagination' => [
                'current_page' => $journals->currentPage(),
                'per_page' => $journals->perPage(),
                'total_items' => $journals->total(),
                'total_pages' => $journals->lastPage(),
            ]
        ]);
    }

    public function storeJournal(StoreJournalRequest $request)
    {
        $validated = $request->validated();

        // Verify balance
        $totalDebit = collect($request->items)->sum('debit');
        $totalCredit = collect($request->items)->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return response()->json(['message' => 'Journal entry is not balanced.'], 422);
        }

        DB::beginTransaction();
        try {
            $journal = JournalEntry::create([
                'date' => $request->date,
                'reference' => $request->reference,
                'description' => $request->description,
                'status' => 'posted'
            ]);

            foreach ($request->items as $item) {
                JournalItem::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $item['chart_of_account_id'],
                    'debit' => $item['debit'],
                    'credit' => $item['credit']
                ]);
            }

            DB::commit();
            return response()->json($journal->load('items.account'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function showJournal($id)
    {
        $journal = JournalEntry::with('items.account')->find($id);
        if (!$journal)
            return response()->json(['message' => 'Journal not found'], 404);
        return response()->json($journal);
    }

    public function updateJournal(StoreJournalRequest $request, $id)
    {
        $journal = JournalEntry::find($id);
        if (!$journal)
            return response()->json(['message' => 'Journal not found'], 404);

        // Verify balance
        $totalDebit = collect($request->items)->sum('debit');
        $totalCredit = collect($request->items)->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return response()->json(['message' => 'Journal entry is not balanced.'], 422);
        }

        DB::beginTransaction();
        try {
            $journal->update([
                'date' => $request->date,
                'reference' => $request->reference,
                'description' => $request->description,
            ]);

            // Replace items: Delete old, create new.
            $journal->items()->delete();

            foreach ($request->items as $item) {
                JournalItem::create([
                    'journal_entry_id' => $journal->id,
                    'chart_of_account_id' => $item['chart_of_account_id'],
                    'debit' => $item['debit'],
                    'credit' => $item['credit']
                ]);
            }

            DB::commit();
            return response()->json($journal->load('items.account'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function deleteJournal($id)
    {
        $journal = JournalEntry::find($id);
        if (!$journal)
            return response()->json(['message' => 'Journal not found'], 404);

        $journal->items()->delete(); // Cascade handled by DB usually, but manual safety here
        $journal->delete();

        return response()->json(['message' => 'Journal deleted successfully']);
    }

    // --- Dashboard Stats ---
    public function getDashboardStats()
    {
        $receivables = $this->getAccountGroupBalance('asset', 'Accounts Receivable');
        $payables = $this->getAccountGroupBalance('liability', 'Accounts Payable');
        $cash = $this->getAccountGroupBalance('asset', 'Cash');

        $revenue = $this->getTypeBalance('revenue');
        $expense = $this->getTypeBalance('expense');
        $netIncome = $revenue - $expense;

        return response()->json([
            'receivables' => $receivables,
            'payables' => $payables,
            'cash' => $cash,
            'net_income' => $netIncome,
            'revenue' => $revenue,
            'expense' => $expense
        ]);
    }

    private function getAccountGroupBalance($type, $nameLike)
    {
        $accountIds = ChartOfAccount::where('type', $type)
            ->where('name', 'like', "%$nameLike%")
            ->pluck('id');

        $debits = JournalItem::whereIn('chart_of_account_id', $accountIds)->sum('debit');
        $credits = JournalItem::whereIn('chart_of_account_id', $accountIds)->sum('credit');

        return $type === 'asset' || $type === 'expense' ? ($debits - $credits) : ($credits - $debits);
    }

    private function getTypeBalance($type)
    {
        $accountIds = ChartOfAccount::where('type', $type)->pluck('id');
        $debits = JournalItem::whereIn('chart_of_account_id', $accountIds)->sum('debit');
        $credits = JournalItem::whereIn('chart_of_account_id', $accountIds)->sum('credit');

        return $type === 'asset' || $type === 'expense' ? ($debits - $credits) : ($credits - $debits);
    }

    // --- Reports ---
    public function getBalanceSheet(Request $request)
    {
        $date = $request->date ?? date('Y-m-d');

        $accounts = ChartOfAccount::whereIn('type', ['asset', 'liability', 'equity'])
            ->get();

        $report = [
            'assets' => [],
            'liabilities' => [],
            'equity' => [],
            'total_assets' => 0,
            'total_liabilities' => 0,
            'total_equity' => 0,
        ];

        // Net Income (Retained Earnings) for Equity
        $revenue = $this->getTypeBalanceUpTo('revenue', $date);
        $expense = $this->getTypeBalanceUpTo('expense', $date);
        $netIncome = $revenue - $expense;

        foreach ($accounts as $account) {
            $balance = $this->getAccountBalanceUpTo($account->id, $date);
            if ($balance == 0)
                continue;

            if ($account->type == 'asset') {
                $report['assets'][] = ['name' => $account->name, 'code' => $account->code, 'balance' => $balance];
                $report['total_assets'] += $balance;
            } elseif ($account->type == 'liability') {
                $report['liabilities'][] = ['name' => $account->name, 'code' => $account->code, 'balance' => $balance];
                $report['total_liabilities'] += $balance;
            } elseif ($account->type == 'equity') {
                $report['equity'][] = ['name' => $account->name, 'code' => $account->code, 'balance' => $balance];
                $report['total_equity'] += $balance;
            }
        }

        // Add Retained Earnings to Equity
        if ($netIncome != 0) {
            $report['equity'][] = ['name' => 'Net Income / Retained Earnings', 'code' => 'RE-001', 'balance' => $netIncome];
            $report['total_equity'] += $netIncome;
        }

        return response()->json($report);
    }

    public function getIncomeStatement(Request $request)
    {
        $startDate = $request->start_date ?? date('Y-01-01');
        $endDate = $request->end_date ?? date('Y-m-d');

        $revenueTotal = $this->getTypeBalanceRange('revenue', $startDate, $endDate);
        $expenseTotal = $this->getTypeBalanceRange('expense', $startDate, $endDate);

        // Get details
        $revenues = $this->getAccountBalancesByTypeRange('revenue', $startDate, $endDate);
        $expenses = $this->getAccountBalancesByTypeRange('expense', $startDate, $endDate);

        return response()->json([
            'revenues' => $revenues,
            'expenses' => $expenses,
            'total_revenue' => $revenueTotal,
            'total_expense' => $expenseTotal,
            'net_income' => $revenueTotal - $expenseTotal,
            'start_date' => $startDate,
            'end_date' => $endDate
        ]);
    }

    // --- Report Helpers ---

    private function getAccountBalanceUpTo($accountId, $date)
    {
        $account = ChartOfAccount::find($accountId);
        $debits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('chart_of_account_id', $accountId)
            ->where('journal_entries.date', '<=', $date)
            ->sum('journal_items.debit');
        $credits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->where('chart_of_account_id', $accountId)
            ->where('journal_entries.date', '<=', $date)
            ->sum('journal_items.credit');

        if (in_array($account->type, ['asset', 'expense'])) {
            return $debits - $credits;
        } else {
            return $credits - $debits;
        }
    }

    private function getTypeBalanceUpTo($type, $date)
    {
        $accountIds = ChartOfAccount::where('type', $type)->pluck('id');
        $debits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->whereIn('chart_of_account_id', $accountIds)
            ->where('journal_entries.date', '<=', $date)
            ->sum('journal_items.debit');
        $credits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->whereIn('chart_of_account_id', $accountIds)
            ->where('journal_entries.date', '<=', $date)
            ->sum('journal_items.credit');

        if (in_array($type, ['asset', 'expense'])) {
            return $debits - $credits;
        } else {
            return $credits - $debits;
        }
    }

    private function getTypeBalanceRange($type, $start, $end)
    {
        $accountIds = ChartOfAccount::where('type', $type)->pluck('id');
        $debits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->whereIn('chart_of_account_id', $accountIds)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->sum('journal_items.debit');
        $credits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->whereIn('chart_of_account_id', $accountIds)
            ->whereBetween('journal_entries.date', [$start, $end])
            ->sum('journal_items.credit');

        if (in_array($type, ['asset', 'expense'])) {
            return $debits - $credits;
        } else {
            return $credits - $debits;
        }
    }

    private function getAccountBalancesByTypeRange($type, $start, $end)
    {
        $accounts = ChartOfAccount::where('type', $type)->get();
        $results = [];

        foreach ($accounts as $account) {
            $debits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('chart_of_account_id', $account->id)
                ->whereBetween('journal_entries.date', [$start, $end])
                ->sum('journal_items.debit');
            $credits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('chart_of_account_id', $account->id)
                ->whereBetween('journal_entries.date', [$start, $end])
                ->sum('journal_items.credit');

            $balance = in_array($type, ['asset', 'expense']) ? ($debits - $credits) : ($credits - $debits);

            if ($balance != 0) {
                $results[] = [
                    'name' => $account->name,
                    'code' => $account->code,
                    'balance' => $balance
                ];
            }
        }
        return $results;
    }

    public function getAgedReport(Request $request)
    {
        $type = $request->type; // 'receivable' or 'payable'
        $asOfDate = $request->date ?? date('Y-m-d');

        $buckets = [
            'current' => 0,
            '0-30' => 0,
            '31-60' => 0,
            '61-90' => 0,
            '90+' => 0,
            'total' => 0
        ];

        $details = [];

        if ($type === 'receivable') {
            $invoices = Invoice::with('customer')
                ->where('balance', '>', 0)
                ->get();

            foreach ($invoices as $inv) {
                $daysOverdue = \Carbon\Carbon::parse($inv->due_date)->diffInDays(\Carbon\Carbon::parse($asOfDate), false);

                $bucket = 'current';
                if ($daysOverdue > 90)
                    $bucket = '90+';
                elseif ($daysOverdue > 60)
                    $bucket = '61-90';
                elseif ($daysOverdue > 30)
                    $bucket = '31-60';
                elseif ($daysOverdue > 0)
                    $bucket = '0-30';
                else
                    $bucket = 'current';

                $buckets[$bucket] += $inv->balance;
                $buckets['total'] += $inv->balance;

                $details[] = [
                    'id' => $inv->id,
                    'name' => $inv->customer->name ?? 'Unknown',
                    'ref' => $inv->invoice_number,
                    'date' => $inv->invoice_date->format('Y-m-d'),
                    'due_date' => $inv->due_date->format('Y-m-d'),
                    'balance' => $inv->balance,
                    'age' => $daysOverdue > 0 ? $daysOverdue : 0,
                    'bucket' => $bucket
                ];
            }
        } elseif ($type === 'payable') {
            $bills = Bill::with('vendor')
                ->where('balance', '>', 0)
                ->get();

            foreach ($bills as $bill) {
                $daysOverdue = \Carbon\Carbon::parse($bill->due_date)->diffInDays(\Carbon\Carbon::parse($asOfDate), false);
                $bucket = 'current';
                if ($daysOverdue > 90)
                    $bucket = '90+';
                elseif ($daysOverdue > 60)
                    $bucket = '61-90';
                elseif ($daysOverdue > 30)
                    $bucket = '31-60';
                elseif ($daysOverdue > 0)
                    $bucket = '0-30';
                else
                    $bucket = 'current';

                $buckets[$bucket] += $bill->balance;
                $buckets['total'] += $bill->balance;

                $details[] = [
                    'id' => $bill->id,
                    'name' => $bill->vendor->name ?? 'Unknown',
                    'ref' => $bill->bill_number,
                    'date' => $bill->bill_date->format('Y-m-d'),
                    'due_date' => $bill->due_date->format('Y-m-d'),
                    'balance' => $bill->balance,
                    'age' => $daysOverdue > 0 ? $daysOverdue : 0,
                    'bucket' => $bucket
                ];
            }
        }

        return response()->json([
            'summary' => $buckets,
            'details' => $details,
            'as_of' => $asOfDate
        ]);
    }

    public function getTrialBalance(Request $request)
    {
        $date = $request->date ?? date('Y-m-d');
        $accounts = ChartOfAccount::orderBy('code')->get();
        $trial = [];
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($accounts as $account) {
            $debits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('chart_of_account_id', $account->id)
                ->where('journal_entries.date', '<=', $date)
                ->sum('journal_items.debit');
            $credits = JournalItem::join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
                ->where('chart_of_account_id', $account->id)
                ->where('journal_entries.date', '<=', $date)
                ->sum('journal_items.credit');

            $net = $debits - $credits;

            if ($net == 0 && $debits == 0 && $credits == 0)
                continue;

            $row = [
                'code' => $account->code,
                'name' => $account->name,
                'debit' => 0,
                'credit' => 0
            ];

            if ($net > 0) {
                $row['debit'] = $net;
                $totalDebit += $net;
            } else {
                $row['credit'] = abs($net);
                $totalCredit += abs($net);
            }

            $trial[] = $row;
        }

        return response()->json([
            'accounts' => $trial,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'date' => $date
        ]);
    }

    public function getCashFlow(Request $request)
    {
        $start = $request->start_date ?? date('Y-01-01');
        $end = $request->end_date ?? date('Y-m-d');

        $revenue = $this->getTypeBalanceRange('revenue', $start, $end);
        $expense = $this->getTypeBalanceRange('expense', $start, $end);
        $netIncome = $revenue - $expense;

        return response()->json([
            'operating_activities' => [
                ['name' => 'Net Income', 'amount' => $netIncome],
            ],
            'net_cash_operating' => $netIncome,
            'investing_activities' => [],
            'net_cash_investing' => 0,
            'financing_activities' => [],
            'net_cash_financing' => 0,
            'net_change_cash' => $netIncome,
            'start_date' => $start,
            'end_date' => $end
        ]);
    }
}
