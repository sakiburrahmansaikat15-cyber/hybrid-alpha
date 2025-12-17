<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
      Schema::create('leads', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->nullable();
    $table->string('phone')->nullable();
    $table->string('company')->nullable();
    $table->integer('score')->default(0);
    $table->timestamps();
    $table->softDeletes();

    // Foreign keys
    $table->foreignId('lead_source_id')->constrained('lead_sources')->onDelete('cascade');
    $table->foreignId('lead_status_id')->constrained('lead_statuses')->onDelete('cascade');
});

    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
