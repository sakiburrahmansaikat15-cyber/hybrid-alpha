<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
              $table->id();
            $table->enum('type', ['call', 'meeting', 'task', 'note']);
            $table->text('description')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamps();

        
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
