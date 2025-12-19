<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\CRM\Lead;
use App\Models\CRM\LeadSource;
use App\Models\CRM\LeadStatus;

class LeadSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $sources = LeadSource::pluck('id')->toArray();
        $statuses = LeadStatus::pluck('id')->toArray();

        for ($i = 1; $i <= 40; $i++) {
            Lead::create([
                'name' => $faker->name(),
                'email' => $faker->safeEmail(),
                'phone' => $faker->phoneNumber(),
                'company' => $faker->company(),
                'score' => $faker->numberBetween(0, 100),
                'lead_source_id' => $faker->randomElement($sources),
                'lead_status_id' => $faker->randomElement($statuses),
            ]);
        }
    }
}
