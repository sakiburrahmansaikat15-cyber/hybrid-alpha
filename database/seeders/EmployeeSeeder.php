<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\HRM\Employee;
use App\Models\HRM\Department;
use App\Models\HRM\Designation;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 200; $i++) {
            Employee::create([
                'employee_code' => 'EMP' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'first_name' => $faker->firstName,
                'last_name' => $faker->lastName,
                'gender' => $faker->randomElement(['male', 'female', 'other']),
                'date_of_birth' => $faker->date('Y-m-d', '2000-01-01'),
                'phone' => $faker->phoneNumber,
                'email' => $faker->unique()->safeEmail,
                'department_id' => Department::inRandomOrder()->first()->id,
                'designation_id' => Designation::inRandomOrder()->first()->id,
                'join_date' => $faker->dateTimeBetween('-5 years', 'now'),
                'job_type' => $faker->randomElement(['permanent', 'contract', 'intern']),
                'salary_type' => $faker->randomElement(['monthly', 'hourly']),
                'status' => $faker->randomElement(['active', 'inactive']),
            ]);
        }
    }
}
