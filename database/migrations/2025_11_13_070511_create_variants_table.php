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
        Schema::create('variants', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Variant name
            $table->string('description')->nullable(); // Optional description
            $table->string('value'); // Variant value
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->foreignId('product_id')->constrained('prooducts')->onDelete('cascade'); // Foreign key to products
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variants');
    }
};
