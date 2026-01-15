<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\TaxGroup;

class TaxGroupSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 10; $i++) {
            TaxGroup::firstOrCreate([
                'name' => 'Group ' . $i,
            ]);
        }
    }
}
