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
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('payment_type_id')->nullable()->constrained('payment_types')->onDelete('set null');

            // Stock details
            $table->integer('quantity')->default(0);
            $table->decimal('buying_price', 15, 2)->nullable();
            $table->decimal('selling_price', 15, 2)->nullable();
            $table->decimal('total_amount', 15, 2)->nullable();
            $table->decimal('due_amount', 15, 2)->nullable();
            $table->decimal('tax', 15, 2)->nullable();
            $table->date('stock_date')->nullable();
            $table->date('expire_date')->nullable();
            $table->decimal('paid_amount', 15, 2)->nullable();
            $table->string('sku')->unique()->nullable(); // Added for stock tracking
            $table->decimal('comission', 10, 2)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
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
