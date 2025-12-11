<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use Faker\Factory as Faker;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 200; $i++) {
            Brand::create([
                'name'   => $faker->unique()->company(), // e.g. "Acme Corp"
                'image'  => "brands/1765279839_6f0470cc-672a-4c24-a489-60b91a463a8d.jpg", // fake image URL
                'status' => $faker->randomElement(['active', 'inactive']),
            ]);
        }
    }
}
