<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\PaymentMethod;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $methods = ['Cash', 'Card', 'Voucher', 'Wallet'];

        foreach ($methods as $method) {
            PaymentMethod::create([
                'name' => $method,
                'type' => strtolower($method),
                'status' => 'active',
            ]);
        }
    }
}
