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
        Schema::create('payment_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();               // searchable
            $table->string('type')->index();               // for quick filtering
            $table->string('account_number')->nullable()->index();
            $table->text('notes')->nullable();
            $table->json('images')->nullable();            // store array of filenames (relative)
            $table->tinyInteger('status')->default(1)->index(); // 0 = inactive, 1 = active (allows more states later)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_types');
    }
};
