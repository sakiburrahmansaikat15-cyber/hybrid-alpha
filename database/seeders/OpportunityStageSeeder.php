<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CRM\OpportunityStage;

class OpportunityStageSeeder extends Seeder
{
    public function run(): void
    {
        $stages = [
            ['name' => 'Prospecting', 'probability' => 10, 'order' => 1],
            ['name' => 'Proposal', 'probability' => 40, 'order' => 2],
            ['name' => 'Negotiation', 'probability' => 70, 'order' => 3],
            ['name' => 'Closed Won', 'probability' => 100, 'order' => 4],
        ];

        foreach ($stages as $stage) {
            OpportunityStage::create($stage);
        }
    }
}
