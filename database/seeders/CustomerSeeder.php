<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\CRM\Customer;
use App\Models\CRM\Company;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $companyIds = Company::pluck('id')->toArray();

        for ($i = 1; $i <= 50; $i++) {
            Customer::create([
                'name' => $faker->name(),
                'email' => $faker->unique()->safeEmail(),
                'phone' => $faker->phoneNumber(),
                'company_id' => $faker->randomElement($companyIds),
                'type' => $faker->randomElement(['individual', 'business']),
                'status' => $faker->boolean(),
            ]);
        }
    }
}
