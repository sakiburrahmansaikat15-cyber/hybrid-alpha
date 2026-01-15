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
        Schema::table('sales', function (Blueprint $table) {
            // Rename invoice_no if possible, else just drop and add
            // $table->renameColumn('invoice_no', 'sale_number'); 
            // Since we can't be sure of DBAL presence, let's just add sale_number and drop invoice_no if it exists?
            // Safer: Add sale_number, we can ignore invoice_no or use it. But Seeder uses sale_number.
        });

        // Doing it in separate blocks to be safe if column exists
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'sale_number')) {
                $table->string('sale_number')->unique()->after('id');
            }
            if (!Schema::hasColumn('sales', 'sale_date')) {
                $table->timestamp('sale_date')->nullable()->after('customer_id');
            }
            if (!Schema::hasColumn('sales', 'subtotal')) {
                $table->decimal('subtotal', 15, 2)->default(0)->after('sale_date');
            }
            if (!Schema::hasColumn('sales', 'tax_amount')) {
                $table->decimal('tax_amount', 15, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('sales', 'discount_amount')) {
                $table->decimal('discount_amount', 15, 2)->default(0)->after('tax_amount');
            }
            if (!Schema::hasColumn('sales', 'paid_amount')) {
                $table->decimal('paid_amount', 15, 2)->default(0)->after('total_amount');
            }
            if (!Schema::hasColumn('sales', 'change_amount')) {
                $table->decimal('change_amount', 15, 2)->default(0)->after('paid_amount');
            }
            if (!Schema::hasColumn('sales', 'payment_status')) {
                $table->string('payment_status')->default('pending')->after('change_amount');
            }
            if (!Schema::hasColumn('sales', 'notes')) {
                $table->text('notes')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'sale_number',
                'sale_date',
                'subtotal',
                'tax_amount',
                'discount_amount',
                'paid_amount',
                'change_amount',
                'payment_status',
                'notes'
            ]);
        });
    }
};
