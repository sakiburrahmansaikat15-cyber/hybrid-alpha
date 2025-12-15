<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class StockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 200; $i++) {
            $buying_price = $faker->randomFloat(2, 100, 10000);
            $selling_price = $buying_price + $faker->randomFloat(2, 50, 2000);
            $quantity = $faker->numberBetween(1, 100);
            $total_amount = $buying_price * $quantity;
            $due_amount = $faker->boolean(30) ? $faker->randomFloat(2, 0, $total_amount / 2) : 0;

            DB::table('stocks')->insert([
                'product_id' => $faker->numberBetween(1, 50), // make sure you have products with IDs in this range
                'vendor_id' => $faker->numberBetween(1, 20),  // make sure you have vendors with IDs in this range
                'quantity' => $quantity,
                'buying_price' => $buying_price,
                'selling_price' => $selling_price,
                'total_amount' => $total_amount,
                'due_amount' => $due_amount,
                'stock_date' => $faker->date(),
                'comission' => $faker->randomFloat(2, 0, 100),
                'status' => $faker->randomElement(['active', 'inactive']),
                'sku' => strtoupper('STK-' . $faker->unique()->bothify('??###')),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
