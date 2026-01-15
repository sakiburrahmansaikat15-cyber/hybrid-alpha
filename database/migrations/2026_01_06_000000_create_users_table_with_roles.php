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
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->foreignId('role_id')->nullable()->constrained('roles')->onDelete('set null');
                $table->boolean('status')->default(true);
                $table->string('avatar')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        } else {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'role_id')) {
                    $table->foreignId('role_id')->nullable()->constrained('roles')->onDelete('set null');
                }
                if (!Schema::hasColumn('users', 'status')) {
                    $table->boolean('status')->default(true);
                }
                if (!Schema::hasColumn('users', 'avatar')) {
                    $table->string('avatar')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
