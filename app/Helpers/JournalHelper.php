<?php

namespace App\Helpers;

use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalItem;
use App\Models\Accounting\ChartOfAccount;
use Illuminate\Support\Facades\DB;

class JournalHelper
{
    public static function createInvoiceJournal($invoice)
    {
        DB::beginTransaction();
        try {
            // Find account IDs
            $arAccount = ChartOfAccount::where('code', '1100')->first(); // Accounts Receivable
            $salesAccount = ChartOfAccount::where('code', '4000')->first(); // Sales Revenue
            $taxAccount = ChartOfAccount::where('code', '2100')->first(); // Sales Tax Payable

            if (!$arAccount || !$salesAccount) {
                throw new \Exception("Required accounting codes (1100 or 4000) not found.");
            }

            $journalEntry = JournalEntry::create([
                'date' => $invoice->invoice_date,
                'reference' => 'INV-' . $invoice->invoice_number,
                'description' => 'Automatic journal entry for invoice ' . $invoice->invoice_number,
                'status' => 'posted'
            ]);

            // Debit AR
            JournalItem::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $arAccount->id,
                'debit' => $invoice->total_amount,
                'credit' => 0
            ]);

            // Credit Sales
            JournalItem::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $salesAccount->id,
                'debit' => 0,
                'credit' => $invoice->subtotal
            ]);

            // Credit Tax if any
            if ($invoice->tax_amount > 0 && $taxAccount) {
                JournalItem::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $taxAccount->id,
                    'debit' => 0,
                    'credit' => $invoice->tax_amount
                ]);
            }

            DB::commit();
            return $journalEntry;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public static function createBillJournal($bill)
    {
        DB::beginTransaction();
        try {
            // Find account IDs
            $apAccount = ChartOfAccount::where('code', '2000')->first(); // Accounts Payable

            $journalEntry = JournalEntry::create([
                'date' => $bill->bill_date,
                'reference' => 'BILL-' . $bill->bill_number,
                'description' => 'Automatic journal entry for bill ' . $bill->bill_number,
                'status' => 'posted'
            ]);

            // Credit AP
            JournalItem::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $apAccount->id,
                'debit' => 0,
                'credit' => $bill->total_amount
            ]);

            // Debit Expense accounts from items
            foreach ($bill->items as $item) {
                if ($item->chart_of_account_id) {
                    JournalItem::create([
                        'journal_entry_id' => $journalEntry->id,
                        'chart_of_account_id' => $item->chart_of_account_id,
                        'debit' => $item->line_total,
                        'credit' => 0
                    ]);
                }
            }

            DB::commit();
            return $journalEntry;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public static function createSaleJournal($sale)
    {
        DB::beginTransaction();
        try {
            $cashAccount = ChartOfAccount::where('code', '1010')->first(); // Cash on Hand
            $salesAccount = ChartOfAccount::where('code', '4000')->first(); // Sales Revenue
            $taxAccount = ChartOfAccount::where('code', '2100')->first(); // Sales Tax Payable

            $journalEntry = JournalEntry::create([
                'date' => $sale->created_at->format('Y-m-d'),
                'reference' => 'SALE-' . $sale->invoice_no,
                'description' => 'POS Sale checkout ' . $sale->invoice_no,
                'status' => 'posted'
            ]);

            // Debit Cash (assuming full cash payment for now, or sum of payments)
            JournalItem::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $cashAccount->id ?? 1,
                'debit' => $sale->total_amount,
                'credit' => 0
            ]);

            // Credit Sales
            JournalItem::create([
                'journal_entry_id' => $journalEntry->id,
                'chart_of_account_id' => $salesAccount->id ?? 2,
                'debit' => 0,
                'credit' => $sale->total_amount
            ]);

            // Credit Tax
            if ($sale->tax_amount > 0 && $taxAccount) {
                JournalItem::create([
                    'journal_entry_id' => $journalEntry->id,
                    'chart_of_account_id' => $taxAccount->id,
                    'debit' => 0,
                    'credit' => $sale->tax_amount
                ]);
            }

            DB::commit();
            return $journalEntry;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public static function deleteRelatedJournal($reference)
    {
        $journalEntry = JournalEntry::where('reference', 'LIKE', $reference . '%')->first();
        if ($journalEntry) {
            JournalItem::where('journal_entry_id', $journalEntry->id)->delete();
            $journalEntry->delete();
        }
    }
}
