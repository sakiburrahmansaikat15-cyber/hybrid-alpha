<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class SerialListSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 200; $i++) {
            DB::table('serial_lists')->insert([
                'stock_id' => $faker->numberBetween(1, 50), // make sure your 'stocks' table has IDs in this range
                'sku' => strtoupper('SKU-' . $faker->unique()->bothify('??###')),
                'barcode' => $faker->unique()->ean13(),
                'color' => $faker->safeColorName(),
                'notes' => $faker->sentence(8),
                'image' => $faker->imageUrl(640, 480, 'product', true),
                'status' => $faker->randomElement(['active', 'inactive']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
