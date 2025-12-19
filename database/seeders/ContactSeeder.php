<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\CRM\Contact;
use App\Models\CRM\Customer;

class ContactSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $customerIds = Customer::pluck('id')->toArray();

        for ($i = 1; $i <= 80; $i++) {
            Contact::create([
                'customer_id' => $faker->randomElement($customerIds),
                'name' => $faker->name(),
                'email' => $faker->safeEmail(),
                'phone' => $faker->phoneNumber(),
                'designation' => $faker->jobTitle(),
            ]);
        }
    }
}
