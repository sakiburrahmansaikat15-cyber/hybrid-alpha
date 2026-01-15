<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\PaymentGateway;

class PaymentGatewaySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 10; $i++) {
            PaymentGateway::firstOrCreate(
                ['name' => 'Gateway ' . $i],
                [
                    'config' => json_encode(['api_key' => $faker->uuid()]),
                    'status' => $faker->randomElement(['active', 'inactive']),
                ]
            );
        }
    }
}
