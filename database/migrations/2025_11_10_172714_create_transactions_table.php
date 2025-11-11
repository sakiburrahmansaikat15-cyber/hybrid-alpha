<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration {
public function up() {
Schema::create('transactions', function (Blueprint $table) {
$table->id();
$table->string('type');
$table->decimal('amount', 10, 2);
$table->unsignedBigInteger('stock_id');
$table->unsignedBigInteger('payment_type_id');
$table->string('image')->nullable();
$table->boolean('status')->default(true);
$table->timestamps();


$table->foreign('stock_id')->references('id')->on('stocks')->onDelete('cascade');
$table->foreign('payment_type_id')->references('id')->on('payment_types')->onDelete('cascade');
});
}


public function down() {
Schema::dropIfExists('transactions');
}
};
