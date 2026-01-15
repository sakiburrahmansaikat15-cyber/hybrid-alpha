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
        Schema::table('receipts', function (Blueprint $table) {
            if (!Schema::hasColumn('receipts', 'receipt_number')) {
                $table->string('receipt_number')->unique()->after('id');
            }
            if (!Schema::hasColumn('receipts', 'template_id')) {
                $table->foreignId('template_id')->nullable()->constrained('receipt_templates')->after('receipt_number');
            }
            if (!Schema::hasColumn('receipts', 'printed_at')) {
                $table->timestamp('printed_at')->nullable()->after('template_id');
            }
            // Make receipt_no nullable if it exists, to support using receipt_number instead
            if (Schema::hasColumn('receipts', 'receipt_no')) {
                $table->string('receipt_no')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropColumn(['receipt_number', 'template_id', 'printed_at']);
        });
    }
};
