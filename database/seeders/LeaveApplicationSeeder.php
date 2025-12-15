<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\HRM\LeaveApplication;
use App\Models\HRM\Employee;
use App\Models\HRM\LeaveType;

class LeaveApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        foreach (Employee::inRandomOrder()->limit(50)->get() as $emp) {
            LeaveApplication::create([
                'start_date' => $faker->dateTimeBetween('-1 month', 'now'),
                'end_date' => $faker->dateTimeBetween('now', '+1 week'),
                'reason' => $faker->sentence(),
                'status' => $faker->randomElement(['pending', 'approved', 'rejected']),
                'employee_id' => $emp->id,
                'leave_type_id' => LeaveType::inRandomOrder()->first()->id,
            ]);
        }
    }
}
