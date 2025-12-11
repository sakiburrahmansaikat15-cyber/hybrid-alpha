<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Using a loop to create 200 dummy product types
        for ($i = 1; $i <= 200; $i++) {
            DB::table('product_types')->insert([
                'name' => 'Product Type ' . $i,
                'status' => ['active', 'inactive'][rand(0, 1)],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
