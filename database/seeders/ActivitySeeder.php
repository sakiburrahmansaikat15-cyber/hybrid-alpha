<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\CRM\Activity;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $types = ['call', 'meeting', 'task', 'note'];

        for ($i = 1; $i <= 40; $i++) {
            Activity::create([
                'type' => $faker->randomElement($types),
                'description' => $faker->sentence(),
                'scheduled_at' => $faker->dateTimeBetween('-1 month', '+1 month'),
            ]);
        }
    }
}
