<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRM\Designation;
use App\Models\HRM\Department;

class DesignationSeeder extends Seeder
{
    public function run(): void
    {
        $designations = ['Manager', 'Executive', 'Officer', 'Intern', 'Developer', 'Analyst'];
        foreach (Department::all() as $dept) {
            foreach ($designations as $name) {
                Designation::create([
                    'name' => $name,
                    'department_id' => $dept->id
                ]);
            }
        }
    }
}
