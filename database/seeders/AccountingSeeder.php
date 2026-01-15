<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Accounting\ChartOfAccount;

class AccountingSeeder extends Seeder
{
    public function run()
    {
        $faker = \Faker\Factory::create();

        // 1. Chart of Accounts
        $accounts = [
            // Assets
            ['code' => '1001', 'name' => 'Cash on Hand', 'type' => 'asset', 'sub_type' => 'Current Asset'],
            ['code' => '1002', 'name' => 'Bank Account', 'type' => 'asset', 'sub_type' => 'Current Asset'],
            ['code' => '1100', 'name' => 'Accounts Receivable', 'type' => 'asset', 'sub_type' => 'Current Asset'],
            ['code' => '1200', 'name' => 'Inventory', 'type' => 'asset', 'sub_type' => 'Current Asset'],
            ['code' => '1500', 'name' => 'Office Equipment', 'type' => 'asset', 'sub_type' => 'Non-Current Asset'],

            // Liabilities
            ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'liability', 'sub_type' => 'Current Liability'],
            ['code' => '2100', 'name' => 'Sales Tax Payable', 'type' => 'liability', 'sub_type' => 'Current Liability'],

            // Equity
            ['code' => '3000', 'name' => 'Owner Equity', 'type' => 'equity', 'sub_type' => 'Equity'],
            ['code' => '3100', 'name' => 'Retained Earnings', 'type' => 'equity', 'sub_type' => 'Equity'],

            // Revenue
            ['code' => '4000', 'name' => 'Sales Revenue', 'type' => 'revenue', 'sub_type' => 'Operating Revenue'],
            ['code' => '4100', 'name' => 'Service Income', 'type' => 'revenue', 'sub_type' => 'Operating Revenue'],

            // Expenses
            ['code' => '5000', 'name' => 'Cost of Goods Sold', 'type' => 'expense', 'sub_type' => 'Cost of Sales'],
            ['code' => '6000', 'name' => 'Rent Expense', 'type' => 'expense', 'sub_type' => 'Operating Expense'],
            ['code' => '6100', 'name' => 'Salaries Expense', 'type' => 'expense', 'sub_type' => 'Operating Expense'],
            ['code' => '6200', 'name' => 'Utilities Expense', 'type' => 'expense', 'sub_type' => 'Operating Expense'],
        ];

        foreach ($accounts as $acc) {
            ChartOfAccount::updateOrCreate(['code' => $acc['code']], $acc);
        }

        // Get IDs for relationships
        $accountIds = ChartOfAccount::pluck('id')->toArray();
        $vendorIds = \App\Models\Vendor::pluck('id')->toArray();
        $customerIds = \App\Models\CRM\Customer::pluck('id')->toArray();

        // 2. Budgets
        $year = date('Y');
        $budget = \App\Models\Accounting\Budget::create([
            'name' => "Annual Budget $year",
            'fiscal_year' => $year,
            'start_date' => "$year-01-01",
            'end_date' => "$year-12-31",
            'total_budgeted_amount' => 500000,
            'total_actual_amount' => 0,
            'status' => 'active'
        ]);

        foreach ($accountIds as $accId) {
            if ($faker->boolean(50)) { // Add budget items for 50% of accounts
                \App\Models\Accounting\BudgetItem::create([
                    'budget_id' => $budget->id,
                    'chart_of_account_id' => $accId,
                    'budgeted_amount' => $faker->randomFloat(2, 1000, 50000),
                    'actual_amount' => 0,
                ]);
            }
        }

        // 3. Bills (Accounts Payable)
        if (!empty($vendorIds)) {
            for ($i = 0; $i < 10; $i++) {
                $subtotal = $faker->randomFloat(2, 100, 5000);
                $tax = $subtotal * 0.10;
                $total = $subtotal + $tax;

                $bill = \App\Models\Accounting\Bill::create([
                    'bill_number' => 'BILL-' . strtoupper($faker->bothify('####')),
                    'vendor_id' => $faker->randomElement($vendorIds),
                    'bill_date' => $faker->dateTimeThisYear,
                    'due_date' => $faker->dateTimeBetween('now', '+30 days'),
                    'subtotal' => $subtotal,
                    'tax_amount' => $tax,
                    'total_amount' => $total,
                    'paid_amount' => 0,
                    'balance' => $total,
                    'status' => $faker->randomElement(['pending', 'draft', 'paid']),
                    'reference_number' => $faker->bothify('REF-###'),
                ]);

                // Bill Item
                \App\Models\Accounting\BillItem::create([
                    'bill_id' => $bill->id,
                    'description' => 'Office Supplies',
                    'quantity' => 1,
                    'unit_price' => $subtotal,
                    'line_total' => $subtotal, // Fixed field name
                    'chart_of_account_id' => $faker->randomElement($accountIds)
                ]);
            }
        }

        // 4. Invoices (Accounts Receivable)
        $productIds = \App\Models\Product::pluck('id')->toArray(); // Get products for invoices

        if (!empty($customerIds)) {
            for ($i = 0; $i < 15; $i++) {
                $subtotal = $faker->randomFloat(2, 200, 10000);
                $tax = $subtotal * 0.10;
                $total = $subtotal + $tax;

                $invoice = \App\Models\Accounting\Invoice::create([
                    'invoice_number' => 'INV-' . strtoupper($faker->bothify('####')),
                    'customer_id' => $faker->randomElement($customerIds),
                    'invoice_date' => $faker->dateTimeThisYear,
                    'due_date' => $faker->dateTimeBetween('now', '+30 days'),
                    'subtotal' => $subtotal,
                    'tax_amount' => $tax,
                    'discount_amount' => 0,
                    'total_amount' => $total,
                    'paid_amount' => 0,
                    'balance' => $total,
                    'status' => $faker->randomElement(['draft', 'sent', 'paid', 'overdue']),
                    'payment_terms' => 'Net 30',
                ]);

                // Invoice Item
                \App\Models\Accounting\InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => !empty($productIds) ? $faker->randomElement($productIds) : null, // Use product_id
                    'description' => 'Consulting Services',
                    'quantity' => 1,
                    'unit_price' => $subtotal,
                    'line_total' => $subtotal, // Fixed field name
                ]);
            }
        }

        // 5. Journal Entries
        for ($i = 0; $i < 5; $i++) {
            $journal = \App\Models\Accounting\JournalEntry::create([
                'date' => $faker->dateTimeThisMonth,
                'reference' => 'JE-' . strtoupper($faker->bothify('####')),
                'description' => 'Monthly Adjustment',
                'status' => 'draft'
            ]);

            // Simple balanced entry
            $amount = $faker->randomFloat(2, 100, 10000);
            $debitAcc = $faker->randomElement($accountIds);
            $creditAcc = $faker->randomElement(array_diff($accountIds, [$debitAcc]));

            // Debit
            \App\Models\Accounting\JournalItem::create([
                'journal_entry_id' => $journal->id,
                'chart_of_account_id' => $debitAcc,
                'debit' => $amount,
                'credit' => 0,
            ]);

            // Credit
            \App\Models\Accounting\JournalItem::create([
                'journal_entry_id' => $journal->id,
                'chart_of_account_id' => $creditAcc,
                'debit' => 0,
                'credit' => $amount,
            ]);
        }
    }
}
