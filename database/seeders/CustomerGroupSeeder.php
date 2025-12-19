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
            CustomerGroup::create([
                'name' => $faker->unique()->word(),
                'pricing_type' => $faker->randomElement(['fixed', 'percentage', 'none']),
                'discount_rate' => $faker->randomFloat(2, 0, 50),
            ]);
        }
    }
}
