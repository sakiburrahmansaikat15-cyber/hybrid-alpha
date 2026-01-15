<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $safeIndex = function ($table, $columns) {
            if (!Schema::hasTable($table))
                return;

            $tableName = DB::getTablePrefix() . $table;
            $indexName = $table . '_' . (is_array($columns) ? implode('_', $columns) : $columns) . '_index';

            $existingIndexes = DB::select("SHOW INDEX FROM {$tableName}");
            foreach ($existingIndexes as $index) {
                if ($index->Key_name === $indexName)
                    return;
            }

            Schema::table($table, function (Blueprint $table) use ($columns) {
                $table->index($columns);
            });
        };

        $safeIndex('users', 'role_id');
        $safeIndex('products', 'cat_id');
        $safeIndex('products', 'brand_id');
        $safeIndex('products', 'sub_cat_id');
        $safeIndex('products', 'product_type_id');
        $safeIndex('stocks', 'product_id');
        $safeIndex('stocks', 'vendor_id');
        $safeIndex('stocks', 'warehouse_id');
        $safeIndex('sales', 'terminal_id');
        $safeIndex('sales', 'customer_id');
        $safeIndex('employees', 'department_id');
        $safeIndex('employees', 'designation_id');
        $safeIndex('leads', 'lead_source_id');
        $safeIndex('leads', 'lead_status_id');
        $safeIndex('opportunities', 'customer_id');
        $safeIndex('opportunities', 'stage_id');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes if they exist
    }
};
