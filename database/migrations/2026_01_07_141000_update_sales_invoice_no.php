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
            // Make invoice_no nullable so we don't have to fill it
            $table->string('invoice_no')->nullable()->change();
            // OR drop it if we rely on sale_number
            // $table->dropColumn('invoice_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('invoice_no')->nullable(false)->change();
        });
    }
};
