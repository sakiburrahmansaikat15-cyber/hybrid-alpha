<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\HRM\Payroll;
use App\Models\HRM\Employee;

class PayrollSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        foreach (Employee::inRandomOrder()->limit(100)->get() as $emp) {
            Payroll::create([
                'employee_id' => $emp->id,
                'month' => $faker->numberBetween(1, 12),
                'year' => 2025,
                'basic_salary' => $faker->numberBetween(15000, 80000),
                'total_allowance' => $faker->numberBetween(1000, 5000),
                'total_deduction' => $faker->numberBetween(200, 1000),
                'net_salary' => $faker->numberBetween(14000, 79000),
                'status' => $faker->randomElement(['pending', 'paid', 'rejected']),
            ]);
        }
    }
}
