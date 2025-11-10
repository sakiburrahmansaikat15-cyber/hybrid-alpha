<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('serial_lists', function (Blueprint $table) {
            $table->id();

            $table->string('name');

            // Foreign Keys
            $table->foreignId('stocks_id')->constrained('stocks')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();

            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->string('color')->nullable();
            $table->text('notes')->nullable();

            $table->string('image')->nullable();  // save in public/serial-list/

            $table->boolean('status')->default(1); // active/inactive

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('serial_lists');
    }
};
