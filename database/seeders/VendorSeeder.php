<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 200; $i++) {
            DB::table('vendors')->insert([
                'name' => $faker->name(),
                'shop_name' => $faker->company(),
                'email' => $faker->unique()->safeEmail(),
                'contact' => $faker->phoneNumber(),
                'address' => $faker->address(),
                'image' => $faker->imageUrl(400, 400, 'business', true),
                'status' => $faker->randomElement(['active', 'inactive']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
