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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
              $table->string('employee_code')->unique();
            $table->string('first_name');
            $table->string('last_name')->nullable();

            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->date('date_of_birth')->nullable();

            $table->string('phone')->nullable();
            $table->string('email')->nullable();

            // Foreign key relations
            $table->foreignId('department_id')->nullable()
                  ->constrained('departments')
                  ->onDelete('cascade');

            $table->foreignId('designation_id')->nullable()
                  ->constrained('designations')
                  ->onDelete('cascade');

            $table->date('join_date')->nullable();

            $table->enum('job_type', ['permanent', 'contract', 'intern'])->nullable();
            $table->enum('salary_type', ['monthly', 'hourly'])->nullable();

            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
