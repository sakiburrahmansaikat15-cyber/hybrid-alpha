<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();

            $table->string('name');

            // Foreign keys
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();

            $table->integer('quantity')->default(0);
            $table->decimal('buying_price', 10, 2);
            $table->decimal('selling_price', 10, 2);

            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('due_amount', 12, 2)->default(0);

            $table->date('stock_date');

            $table->decimal('commission', 10, 2)->nullable();

            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();

            $table->boolean('status')->default(1); // 1=active,0=inactive

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
