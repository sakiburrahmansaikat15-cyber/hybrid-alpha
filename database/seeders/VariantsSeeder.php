<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class VariantsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Get product IDs
        $productIds = DB::table('products')->pluck('id')->toArray();

        // If no products, skip
        if (empty($productIds)) {
            return;
        }

        $variants = [];

        foreach ($productIds as $productId) {
            // Determine if this product should have variants (e.g., 60% chance)
            if ($faker->boolean(60)) {
                $numVariants = $faker->numberBetween(2, 5);

                for ($i = 0; $i < $numVariants; $i++) {
                    $variants[] = [
                        'product_id' => $productId,
                        'variant_name' => $faker->colorName . ' - ' . $faker->randomElement(['S', 'M', 'L', 'XL']),
                        'sku' => strtoupper($faker->bothify('SKU-####-????')),
                        'price' => $faker->randomFloat(2, 10, 1000),
                        'stock_quantity' => $faker->numberBetween(0, 100),
                        'status' => $faker->randomElement(['active', 'inactive']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        if (!empty($variants)) {
            DB::table('variants')->insert($variants);
        }
    }
}
