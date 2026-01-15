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
        Schema::table('variants', function (Blueprint $table) {
            // Add new columns
            $table->string('variant_name')->after('product_id');
            $table->string('sku')->after('variant_name');
            $table->decimal('price', 10, 2)->default(0)->after('sku');
            $table->integer('stock_quantity')->default(0)->after('price');

            // Allow null for columns we are about to drop (to prevent errors if data exists during transition)
            $table->string('name')->nullable()->change();
            $table->string('value')->nullable()->change();
            $table->string('description')->nullable()->change();
        });

        // Drop old columns
        Schema::table('variants', function (Blueprint $table) {
            $table->dropColumn(['name', 'value', 'description']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('variants', function (Blueprint $table) {
            $table->string('name');
            $table->string('value');
            $table->string('description')->nullable();

            $table->dropColumn(['variant_name', 'sku', 'price', 'stock_quantity']);
        });
    }
};
