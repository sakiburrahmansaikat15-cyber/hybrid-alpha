<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRM\Department;  

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = ['HR', 'IT', 'Finance', 'Sales', 'Marketing', 'Support'];

        foreach ($departments as $name) {
            Department::create([
                'name' => $name,
                'status' => 'active',
            ]);
        }
    }
}