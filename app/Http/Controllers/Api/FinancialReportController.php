<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accounting\ChartOfAccount;
use App\Models\Accounting\JournalItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinancialReportController extends Controller
{
    public function balanceSheet(Request $request)
    {
        $date = $request->input('date', date('Y-m-d'));

        // Assets
        $assets = $this->getAccountsWithBalance(['asset'], $date);
        // Liabilities
        $liabilities = $this->getAccountsWithBalance(['liability'], $date);
        // Equity
        $equity = $this->getAccountsWithBalance(['equity'], $date);

        // Calculate Retained Earnings (Revenue - Expense)
        $revenue = $this->getTypeTotal('revenue', $date);
        $expense = $this->getTypeTotal('expense', $date);
        $netIncome = $revenue - $expense;

        return response()->json([
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'net_income' => $netIncome,
            'total_assets' => $assets->sum('balance'),
            'total_liabilities' => $liabilities->sum('balance'),
            'total_equity' => $equity->sum('balance') + $netIncome
        ]);
    }

    public function incomeStatement(Request $request)
    {
        $startDate = $request->input('start_date', date('Y-01-01'));
        $endDate = $request->input('end_date', date('Y-m-d'));

        $revenues = $this->getAccountsWithBalanceRange('revenue', $startDate, $endDate);
        $expenses = $this->getAccountsWithBalanceRange('expense', $startDate, $endDate);

        return response()->json([
            'revenues' => $revenues,
            'expenses' => $expenses,
            'total_revenue' => $revenues->sum('balance'),
            'total_expense' => $expenses->sum('balance'),
            'net_income' => $revenues->sum('balance') - $expenses->sum('balance')
        ]);
    }

    public function trialBalance(Request $request)
    {
        $accounts = ChartOfAccount::orderBy('code')->get();
        $trial = $accounts->map(function ($acc) {
            $debit = $acc->journalItems()->sum('debit');
            $credit = $acc->journalItems()->sum('credit');
            return [
                'code' => $acc->code,
                'name' => $acc->name,
                'debit' => $debit,
                'credit' => $credit
            ];
        });

        return response()->json([
            'items' => $trial,
            'total_debit' => $trial->sum('debit'),
            'total_credit' => $trial->sum('credit')
        ]);
    }

    private function getAccountsWithBalance($types, $date)
    {
        return ChartOfAccount::whereIn('type', $types)
            ->get()
            ->map(function ($account) use ($date) {
                // Sum debits and credits up to date
                $debits = $account->journalItems()
                    ->whereHas('journalEntry', fn($q) => $q->where('date', '<=', $date))
                    ->sum('debit');

                $credits = $account->journalItems()
                    ->whereHas('journalEntry', fn($q) => $q->where('date', '<=', $date))
                    ->sum('credit');

                $balance = ($account->type === 'asset' || $account->type === 'expense')
                    ? ($debits - $credits)
                    : ($credits - $debits);

                $account->balance = $balance;
                return $account;
            })->filter(fn($acc) => $acc->balance != 0)->values();
    }

    private function getAccountsWithBalanceRange($type, $start, $end)
    {
        return ChartOfAccount::where('type', $type)
            ->get()
            ->map(function ($account) use ($start, $end, $type) {
                $debits = $account->journalItems()
                    ->whereHas('journalEntry', fn($q) => $q->whereBetween('date', [$start, $end]))
                    ->sum('debit');

                $credits = $account->journalItems()
                    ->whereHas('journalEntry', fn($q) => $q->whereBetween('date', [$start, $end]))
                    ->sum('credit');

                // For P&L, usually just look at net movement in period
                // Revenue: Credit normal. Expense: Debit normal.
                $balance = ($type === 'expense') ? ($debits - $credits) : ($credits - $debits);

                $account->balance = $balance;
                return $account;
            })->filter(fn($acc) => $acc->balance != 0)->values();
    }

    private function getTypeTotal($type, $date)
    {
        $accountIds = ChartOfAccount::where('type', $type)->pluck('id');

        $debits = JournalItem::whereIn('chart_of_account_id', $accountIds)
            ->whereHas('journalEntry', fn($q) => $q->where('date', '<=', $date))
            ->sum('debit');

        $credits = JournalItem::whereIn('chart_of_account_id', $accountIds)
            ->whereHas('journalEntry', fn($q) => $q->where('date', '<=', $date))
            ->sum('credit');

        return ($type === 'asset' || $type === 'expense') ? ($debits - $credits) : ($credits - $debits);
    }
    public function cashFlowStatement(Request $request)
    {
        $startDate = $request->input('start_date', date('Y-01-01'));
        $endDate = $request->input('end_date', date('Y-m-d'));

        // Define Cash/Bank accounts (usually assets with specific names or subtypes)
        $cashAccounts = ChartOfAccount::where('type', 'asset')
            ->where(function ($q) {
                $q->where('name', 'like', '%Cash%')
                    ->orWhere('name', 'like', '%Bank%')
                    ->orWhere('sub_type', 'cash');
            })->get();

        $inflows = [];
        $outflows = [];

        foreach ($cashAccounts as $account) {
            $items = $account->journalItems()
                ->with(['journalEntry.items.account'])
                ->whereHas('journalEntry', fn($q) => $q->whereBetween('date', [$startDate, $endDate]))
                ->get();

            foreach ($items as $item) {
                if ($item->debit > 0) {
                    // Inflow: Find the balancing credit account
                    $balancing = $item->journalEntry->items->where('credit', '>', 0)->first();
                    $category = $balancing->account->name ?? 'Other Receipt';
                    $inflows[$category] = ($inflows[$category] ?? 0) + $item->debit;
                } else {
                    // Outflow: Find the balancing debit account
                    $balancing = $item->journalEntry->items->where('debit', '>', 0)->first();
                    $category = $balancing->account->name ?? 'Other Payment';
                    $outflows[$category] = ($outflows[$category] ?? 0) + $item->credit;
                }
            }
        }

        return response()->json([
            'operating_inflows' => $inflows,
            'operating_outflows' => $outflows,
            'net_cash_flow' => array_sum($inflows) - array_sum($outflows),
            'start_period_balance' => $this->getCashBalanceAt($startDate),
            'end_period_balance' => $this->getCashBalanceAt($endDate)
        ]);
    }

    private function getCashBalanceAt($date)
    {
        $cashAccountIds = ChartOfAccount::where('type', 'asset')
            ->where(function ($q) {
                $q->where('name', 'like', '%Cash%')
                    ->orWhere('name', 'like', '%Bank%')
                    ->orWhere('sub_type', 'cash');
            })->pluck('id');

        $debits = JournalItem::whereIn('chart_of_account_id', $cashAccountIds)
            ->whereHas('journalEntry', fn($q) => $q->where('date', '<=', $date))
            ->sum('debit');

        $credits = JournalItem::whereIn('chart_of_account_id', $cashAccountIds)
            ->whereHas('journalEntry', fn($q) => $q->where('date', '<=', $date))
            ->sum('credit');

        return $debits - $credits;
    }
}
