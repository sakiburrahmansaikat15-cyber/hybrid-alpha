<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\HRM\EmployeeDocument;
use App\Models\HRM\Employee;

class EmployeeDocumentSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        foreach (Employee::all() as $emp) {
            EmployeeDocument::create([
                'document_type' => $faker->randomElement(['NID', 'Certificate', 'CV']),
                'document_file' => $faker->imageUrl(),
                'employee_id' => $emp->id
            ]);
        }
    }
}
