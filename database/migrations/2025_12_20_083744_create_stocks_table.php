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
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('prooducts')->onDelete('cascade');
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
           $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');

            // Stock details
            $table->integer('quantity')->default(0);
            $table->decimal('buying_price', 15, 2)->default(0.00);
            $table->decimal('selling_price', 15, 2)->default(0.00);
            $table->decimal('total_amount', 15, 2)->default(0.00);
            $table->decimal('due_amount', 15, 2);
            $table->date('stock_date')->nullable();
            $table->decimal('comission', 10, 2)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('sku')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
