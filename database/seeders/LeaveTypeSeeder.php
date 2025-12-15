<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRM\LeaveType;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['name' => 'Casual Leave', 'max_days' => 10],
            ['name' => 'Sick Leave', 'max_days' => 15],
            ['name' => 'Maternity Leave', 'max_days' => 90],
        ];

        foreach ($types as $t) {
            LeaveType::create($t);
        }
    }
}
