<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\CRM\Company;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 30; $i++) {
            Company::create([
                'name' => $faker->company(),
                'industry' => $faker->word(),
                'website' => $faker->url(),
                'address' => $faker->address(),
            ]);
        }
    }
}
