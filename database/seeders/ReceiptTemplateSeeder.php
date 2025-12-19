<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\ReceiptTemplate;

class ReceiptTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 5; $i++) {
            ReceiptTemplate::create([
                'name' => 'Template ' . $i,
                'layout' => '<h1>' . $faker->company() . '</h1><p>Thank you for shopping!</p>',
            ]);
        }
    }
}
