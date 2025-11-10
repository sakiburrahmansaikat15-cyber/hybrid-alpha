<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Drop existing foreign key constraints
            $table->dropForeign(['category_id']);
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['sub_category_id']);
            $table->dropForeign(['sub_item_id']);
            $table->dropForeign(['unit_id']);
            $table->dropForeign(['product_type_id']);

            // Make columns nullable
            $table->unsignedBigInteger('category_id')->nullable()->change();
            $table->unsignedBigInteger('brand_id')->nullable()->change();
            $table->unsignedBigInteger('sub_category_id')->nullable()->change();
            $table->unsignedBigInteger('sub_item_id')->nullable()->change();
            $table->unsignedBigInteger('unit_id')->nullable()->change();
            $table->unsignedBigInteger('product_type_id')->nullable()->change();

            // Add foreign key constraints with nullOnDelete
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
            $table->foreign('sub_category_id')->references('id')->on('sub_categories')->nullOnDelete();
            $table->foreign('sub_item_id')->references('id')->on('sub_items')->nullOnDelete();
            $table->foreign('unit_id')->references('id')->on('units')->nullOnDelete();
            $table->foreign('product_type_id')->references('id')->on('product_types')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Reverse the changes if needed
            $table->dropForeign(['category_id']);
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['sub_category_id']);
            $table->dropForeign(['sub_item_id']);
            $table->dropForeign(['unit_id']);
            $table->dropForeign(['product_type_id']);

            $table->unsignedBigInteger('category_id')->nullable(false)->change();
            $table->unsignedBigInteger('brand_id')->nullable(false)->change();
            $table->unsignedBigInteger('sub_category_id')->nullable(false)->change();
            $table->unsignedBigInteger('sub_item_id')->nullable(false)->change();
            $table->unsignedBigInteger('unit_id')->nullable(false)->change();
            $table->unsignedBigInteger('product_type_id')->nullable(false)->change();

            // Re-add original foreign keys
            $table->foreign('category_id')->references('id')->on('categories');
            $table->foreign('brand_id')->references('id')->on('brands');
            $table->foreign('sub_category_id')->references('id')->on('sub_categories');
            $table->foreign('sub_item_id')->references('id')->on('sub_items');
            $table->foreign('unit_id')->references('id')->on('units');
            $table->foreign('product_type_id')->references('id')->on('product_types');
        });
    }
};