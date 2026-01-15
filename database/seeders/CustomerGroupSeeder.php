<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\CustomerGroup;

class CustomerGroupSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 10; $i++) {
            $name = $faker->unique()->word(); // Unique generator might still collide if exhausted, but acceptable for faker
            // Better to use a static list to guarantee uniqueness or just create if not exists
            // Let's use firstOrCreate with a generated name, but if it exists, it's fine.
            CustomerGroup::firstOrCreate(
                ['name' => ucfirst($faker->word) . ' Group'], // Use word + Group to mitigate collisions
                [
                    'pricing_type' => $faker->randomElement(['fixed', 'percentage', 'none']),
                    'discount_rate' => $faker->randomFloat(2, 0, 50),
                ]
            );
        }
    }
}
