<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', ['call', 'meeting', 'task', 'note']);
            $table->uuid('related_id'); // can reference leads.id or customers.id
            $table->text('description')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamps();

            // Optional: you can add index for faster lookup
            $table->index('related_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
