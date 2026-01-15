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
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('fiscal_year');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_budgeted_amount', 20, 2)->default(0);
            $table->decimal('total_actual_amount', 20, 2)->default(0);
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
