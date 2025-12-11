<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class SubItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        $subItems = [];

        for ($i = 0; $i < 200; $i++) {
            $subItems[] = [
                'name' => ucfirst($faker->word) . ' Item',
                'image' => $faker->optional()->imageUrl(300, 300, 'products', true, 'Item'),
                'status' => $faker->randomElement(['active', 'inactive']),
                'sub_category_id' => $faker->numberBetween(1, 10), // assuming you have at least 10 sub_categories
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('sub_items')->insert($subItems);
    }
}
