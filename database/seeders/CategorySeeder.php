<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Categories;
use Faker\Factory as Faker;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 200; $i++) {
            Categories::create([
                'name'   => $faker->unique()->words(2, true), // e.g. "Electronics Tools"
                'image'  => "categories/1765279839_6f0470cc-672a-4c24-a489-60b91a463a8d.jpg", // fake image URL
                'status' => $faker->randomElement(['active', 'inactive']),
            ]);
        }
    }
}
