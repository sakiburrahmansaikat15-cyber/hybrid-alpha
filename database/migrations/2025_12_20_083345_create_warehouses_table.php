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
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
             $table->string('name');
            $table->string('code')->unique(); // WH-DHK-01
            $table->string('type')->nullable(); // main, branch, virtual, drop-ship

            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();

            $table->text('address')->nullable();

            // Geo / logistics
            $table->string('country')->nullable();
            $table->string('state')->nullable();
            $table->string('city')->nullable();

            // Capacity & automation
            $table->integer('capacity')->nullable();
            $table->boolean('is_default')->default(false);

            // Status
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
