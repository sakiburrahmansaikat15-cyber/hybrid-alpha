<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\PosSession;
use App\Models\POS\PosTerminal;

class PosSessionSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $terminals = PosTerminal::pluck('id')->toArray();

        for ($i = 1; $i <= 30; $i++) {
            PosSession::create([
                'terminal_id' => $faker->randomElement($terminals),
                'opened_at' => $faker->dateTimeBetween('-10 days', 'now'),
                'closed_at' => $faker->optional()->dateTimeBetween('-5 days', 'now'),
                'opening_cash' => $faker->randomFloat(2, 1000, 5000),
                'closing_cash' => $faker->randomFloat(2, 1000, 7000),
            ]);
        }
    }
}
