<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // Chart of Accounts
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
            $table->string('sub_type')->nullable(); // e.g., Current Asset, Long Term Liability
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->timestamps();
        });

        // Journal Entries
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('reference')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'posted'])->default('draft');
            $table->timestamps();
        });

        // Journal Items
        Schema::create('journal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->onDelete('cascade');
            $table->foreignId('chart_of_account_id')->constrained('chart_of_accounts')->onDelete('restrict');
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);

            // For sub-ledger tracking (Aged Payables/Receivables)
            // Example: entity_type = 'App\Models\Vendor', entity_id = 1
            $table->nullableMorphs('entity');

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('journal_items');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('chart_of_accounts');
    }
};
