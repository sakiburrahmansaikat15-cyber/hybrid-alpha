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
        Schema::create('hold_carts', function (Blueprint $table) {
            $table->id();
             // Foreign key to POS terminals
            $table->foreignId('terminal_id')
                  ->constrained('pos_terminals')
                  ->onDelete('cascade');

            $table->json('cart_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hold_carts');
    }
};
