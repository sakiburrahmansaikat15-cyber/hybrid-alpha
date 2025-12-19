<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CRM\LeadSource;

class LeadSourceSeeder extends Seeder
{
    public function run(): void
    {
        $sources = ['Website', 'Referral', 'Social Media', 'Email Campaign', 'Event', 'Cold Call'];

        foreach ($sources as $source) {
            LeadSource::create([
                'name' => $source,
                'description' => fake()->sentence(),
                'status' => true,
            ]);
        }
    }
}
