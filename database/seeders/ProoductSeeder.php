<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class ProoductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Fetch real existing IDs from the database
        $catIds = DB::table('categories')->pluck('id')->toArray();
        $brandIds = DB::table('brands')->pluck('id')->toArray();
        $subCatIds = DB::table('sub_categories')->pluck('id')->toArray();
        $subItemIds = DB::table('sub_items')->pluck('id')->toArray();
        $unitIds = DB::table('units')->pluck('id')->toArray();
        $productTypeIds = DB::table('product_types')->pluck('id')->toArray();

        $products = [];

        for ($i = 0; $i < 200; $i++) {
            $products[] = [
                'name' => ucfirst($faker->word) . ' Product',
                'description' => $faker->sentence(12),
                'status' => $faker->randomElement(['active', 'inactive']),
                'image' => $faker->optional()->imageUrl(400, 400, 'products', true, 'Product'),
                'specification' => $faker->paragraph(3),

                // SAFE foreign keys — always valid
                'cat_id' => $faker->randomElement($catIds),
                'brand_id' => $faker->randomElement($brandIds),
                'sub_cat_id' => $faker->randomElement($subCatIds),
                'sub_item_id' => $faker->randomElement($subItemIds),
                'unit_id' => $faker->randomElement($unitIds),
                'product_type_id' => $faker->randomElement($productTypeIds),

                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('prooducts')->insert($products);
    }
}
