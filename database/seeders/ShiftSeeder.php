<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRM\Shift;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        $shifts = [
            ['name' => 'Morning', 'start_time' => '08:00:00', 'end_time' => '16:00:00', 'grace_time' => 10],
            ['name' => 'Evening', 'start_time' => '16:00:00', 'end_time' => '00:00:00', 'grace_time' => 5],
        ];

        foreach ($shifts as $shift) {
            Shift::create($shift);
        }
    }
}
