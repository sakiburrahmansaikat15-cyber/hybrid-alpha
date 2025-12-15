<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\HRM\Attendance;
use App\Models\HRM\Employee;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        foreach (Employee::inRandomOrder()->limit(100)->get() as $emp) {
            Attendance::create([
                'employee_id' => $emp->id,
                'date' => $faker->dateTimeBetween('-2 months', 'now'),
                'clock_in' => '09:00:00',
                'clock_out' => '17:00:00',
                'late' => $faker->boolean(10),
                'early_leave' => $faker->boolean(10),
                'working_hours' => 8.00
            ]);
        }
    }
}
