<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\CRM\Campaign;

class CampaignSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 20; $i++) {
            Campaign::create([
                'name' => $faker->catchPhrase(),
                'type' => $faker->randomElement(['email', 'sms', 'social']),
                'start_date' => $faker->date(),
                'end_date' => $faker->date(),
                'budget' => $faker->randomFloat(2, 1000, 50000),
            ]);
        }
    }
}
