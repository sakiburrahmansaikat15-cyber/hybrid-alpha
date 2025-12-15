<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\HRM\Salary;
use App\Models\HRM\Employee;

class SalarySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        foreach (Employee::all() as $emp) {
            Salary::create([
                'employee_id' => $emp->id,
                'basic_salary' => $faker->numberBetween(15000, 80000),
                'allowances' => json_encode(['House' => 2000, 'Medical' => 1000]),
                'deductions' => json_encode(['Tax' => 500]),
                'effective_from' => $faker->dateTimeBetween('-1 year', 'now'),
            ]);
        }
    }
}
