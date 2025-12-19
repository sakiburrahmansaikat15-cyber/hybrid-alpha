<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\CustomerAddress;
use App\Models\POS\Customer;

class CustomerAddressSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $customerIds = Customer::pluck('id')->toArray();

        for ($i = 1; $i <= 150; $i++) {
            CustomerAddress::create([
                'customer_id' => $faker->randomElement($customerIds),
                'address' => $faker->address(),
                'city' => $faker->city(),
                'country' => $faker->country(),
            ]);
        }
    }
}
