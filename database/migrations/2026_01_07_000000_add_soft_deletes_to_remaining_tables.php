<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            // Core Tables
            'variants',
            'transactions',
            'sub_categories',
            'sub_items',
            'serial_lists',
            'product_types',
            'payment_types',
            'brands',

            // HRM Tables  
            'departments',
            'designations',
            'attendances',
            'shifts',
            'leave_types',
            'leave_applications',
            'salaries',
            'payroll',
            'employee_documents',

            // CRM Tables
            'lead_sources',
            'lead_statuses',
            'opportunity_stages',
            'campaigns',
            'activities',
            'contacts',
            'companies',
            'tickets',

            // POS Tables
            'pos_terminals',
            'pos_sessions',
            'customer_groups',
            'customer_addresses',
            'payment_methods',
            'payment_gateways',
            'receipt_templates',
            'tax_groups',
            'tax_rates',
            'gift_cards',
            'vouchers',
            'hold_carts',
            'receipts',
            'sale_items',
            'sale_discounts',
            'sale_payments',
            'sale_taxes',

            // Accounting Tables
            'accounts',
            'account_types',
            'journal_entries',
            'journal_entry_lines'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->softDeletes();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'variants',
            'transactions',
            'sub_categories',
            'sub_items',
            'serial_lists',
            'product_types',
            'payment_types',
            'brands',
            'departments',
            'designations',
            'attendances',
            'shifts',
            'leave_types',
            'leave_applications',
            'salaries',
            'payroll',
            'employee_documents',
            'lead_sources',
            'lead_statuses',
            'opportunity_stages',
            'campaigns',
            'activities',
            'contacts',
            'companies',
            'tickets',
            'pos_terminals',
            'pos_sessions',
            'customer_groups',
            'customer_addresses',
            'payment_methods',
            'payment_gateways',
            'receipt_templates',
            'tax_groups',
            'tax_rates',
            'gift_cards',
            'vouchers',
            'hold_carts',
            'receipts',
            'sale_items',
            'sale_discounts',
            'sale_payments',
            'sale_taxes',
            'accounts',
            'account_types',
            'journal_entries',
            'journal_entry_lines'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropSoftDeletes();
                });
            }
        }
    }
};
