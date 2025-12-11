<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        $units = [];

        for ($i = 0; $i < 200; $i++) {
            $units[] = [
                'name' => ucfirst($faker->word) . ' Unit',
                'status' => $faker->randomElement(['active', 'inactive']),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('units')->insert($units);
    }
}
