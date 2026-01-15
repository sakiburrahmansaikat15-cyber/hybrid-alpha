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
        // Wrapper function to safely add index
        $safeIndex = function ($table, $columns, $name = null) {
            $tableName = DB::getTablePrefix() . $table;
            $indexName = $name ?: (is_array($columns) ? $table . '_' . implode('_', $columns) . '_index' : $table . '_' . $columns . '_index');

            $existingIndexes = DB::select("SHOW INDEX FROM {$tableName}");
            $exists = false;
            foreach ($existingIndexes as $index) {
                if ($index->Key_name === $indexName) {
                    $exists = true;
                    break;
                }
            }

            if (!$exists) {
                Schema::table($table, function (Blueprint $table) use ($columns) {
                    $table->index($columns);
                });
            }
        };

        // 1. Products Optimization
        $safeIndex('products', ['status', 'created_at']);

        // 2. Stocks Optimization
        $safeIndex('stocks', ['product_id', 'warehouse_id', 'status']);
        $safeIndex('stocks', 'created_at');

        // 3. HRM Optimization
        $safeIndex('employees', ['status', 'department_id', 'job_type']);
        $safeIndex('employees', 'join_date');

        // 4. POS Optimization
        $safeIndex('sales', ['terminal_id', 'customer_id', 'status']);
        $safeIndex('sales', 'created_at');

        // 5. Audit Logs Optimization
        $safeIndex('audit_logs', ['module', 'target_id']);
        $safeIndex('audit_logs', 'action');
        $safeIndex('audit_logs', 'created_at');

        // 6. CRM Optimization
        $safeIndex('leads', 'lead_status_id');
        $safeIndex('leads', 'created_at');

        $safeIndex('opportunities', 'stage_id');
        $safeIndex('opportunities', 'probability');
        $safeIndex('opportunities', 'created_at');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not strictly necessary for this one-off fix, but good practice
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
        });
        // ... rest removed for brevity as this is just a recovery script
    }
};
