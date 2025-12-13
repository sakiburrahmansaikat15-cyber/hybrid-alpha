<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
             $table->date('date');

            $table->time('clock_in')->nullable();
            $table->time('clock_out')->nullable();

            $table->boolean('late')->default(false);
            $table->boolean('early_leave')->default(false);

            $table->decimal('working_hours', 5, 2)->nullable();
              $table->foreignId('employee_id')
                  ->constrained('employees')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};
