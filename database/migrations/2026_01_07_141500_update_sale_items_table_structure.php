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
        Schema::table('sale_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sale_items', 'unit_price')) {
                $table->decimal('unit_price', 15, 2)->default(0)->after('quantity');
            }
            if (!Schema::hasColumn('sale_items', 'subtotal')) {
                $table->decimal('subtotal', 15, 2)->default(0)->after('unit_price');
            }
            if (!Schema::hasColumn('sale_items', 'tax_amount')) {
                $table->decimal('tax_amount', 15, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('sale_items', 'discount_amount')) {
                $table->decimal('discount_amount', 15, 2)->default(0)->after('tax_amount');
            }
            if (!Schema::hasColumn('sale_items', 'total')) {
                $table->decimal('total', 15, 2)->default(0)->after('discount_amount');
            }
            // Optional: Drop old columns if they are not used and confuse us
            // $table->dropColumn(['price', 'tax', 'discount']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['unit_price', 'subtotal', 'tax_amount', 'discount_amount', 'total']);
        });
    }
};
