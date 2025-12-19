<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\Customer;
use App\Models\POS\CustomerGroup;

class CustomersSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $groups = CustomerGroup::pluck('id')->toArray();

        for ($i = 1; $i <= 100; $i++) {
            Customer::create([
                'name' => $faker->name(),
                'phone' => $faker->unique()->phoneNumber(),
                'email' => $faker->unique()->safeEmail(),
                'customer_group_id' => $faker->randomElement($groups),
                'loyalty_points' => $faker->numberBetween(0, 500),
            ]);
        }
    }
}
