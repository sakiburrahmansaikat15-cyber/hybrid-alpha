<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentType;
use Faker\Factory as Faker;

class PaymentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 200; $i++) {
            PaymentType::create([
                'name'           => $faker->unique()->words(2, true), // e.g. "Bank Transfer"
                'type'           => $faker->randomElement(['Bank', 'Mobile', 'Card', 'Cash']),
                'account_number' => $faker->optional()->bankAccountNumber,
                'notes'          => $faker->optional()->sentence(),
                'image'          => "payment_types/".uniqid().".jpg", // fake image path
                'status'         => $faker->randomElement(['active', 'inactive']),
            ]);
        }
    }
}
