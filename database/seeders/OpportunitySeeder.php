<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\CRM\Opportunity;
use App\Models\CRM\Customer;
use App\Models\CRM\OpportunityStage;

class OpportunitySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $customers = Customer::pluck('id')->toArray();
        $stages = OpportunityStage::pluck('id')->toArray();

        for ($i = 1; $i <= 30; $i++) {
            Opportunity::create([
                'customer_id' => $faker->randomElement($customers),
                'stage_id' => $faker->randomElement($stages),
                'value' => $faker->randomFloat(2, 1000, 100000),
                'probability' => $faker->numberBetween(10, 100),
                'expected_close_date' => $faker->dateTimeBetween('now', '+3 months'),
            ]);
        }
    }
}
