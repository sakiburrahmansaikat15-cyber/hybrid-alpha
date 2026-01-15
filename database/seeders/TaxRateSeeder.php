<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\TaxRate;

class TaxRateSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 10; $i++) {
            TaxRate::firstOrCreate(
                ['name' => 'VAT ' . $i],
                [
                    'rate' => $faker->randomFloat(2, 1, 20),
                ]
            );
        }
    }
}
