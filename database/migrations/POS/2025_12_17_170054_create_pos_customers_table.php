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
        Schema::create('pos_customers', function (Blueprint $table) {
            $table->id();
             $table->string('name');
            $table->string('phone')->unique();
            $table->string('email')->nullable();

            $table->foreignId('customer_group_id')
                  ->nullable()
                  ->constrained('customer_groups')
                  ->nullOnDelete();

            $table->integer('loyalty_points')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_customers');
    }
};
