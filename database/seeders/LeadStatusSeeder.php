<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CRM\LeadStatus;

class LeadStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['name' => 'New', 'color_code' => '#3498db', 'order' => 1],
            ['name' => 'Contacted', 'color_code' => '#f1c40f', 'order' => 2],
            ['name' => 'Qualified', 'color_code' => '#2ecc71', 'order' => 3],
            ['name' => 'Lost', 'color_code' => '#e74c3c', 'order' => 4],
        ];

        foreach ($statuses as $status) {
            LeadStatus::create($status);
        }
    }
}
