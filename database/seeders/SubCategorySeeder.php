<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class SubCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        $subCategories = [];

        for ($i = 0; $i < 200; $i++) {
            $subCategories[] = [
                'name' => ucfirst($faker->word) . ' SubCategory',
                'image' => $faker->optional()->imageUrl(300, 300, 'category', true, 'SubCategory'),
                'status' => $faker->randomElement(['active', 'inactive']),
                'category_id' => $faker->numberBetween(1, 10),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('sub_categories')->insert($subCategories);
    }
}
