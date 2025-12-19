<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\GiftCard;

class GiftCardSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 50; $i++) {
            GiftCard::create([
                'code' => strtoupper($faker->bothify('GC###??')),
                'balance' => $faker->randomFloat(2, 100, 5000),
                'expiry_date' => $faker->optional()->dateTimeBetween('now', '+1 year'),
                'status' => $faker->randomElement(['active', 'inactive', 'expired']),
            ]);
        }
    }
}
