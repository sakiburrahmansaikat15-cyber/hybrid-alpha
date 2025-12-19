<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\PosTerminal;

class PosTerminalSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 10; $i++) {
            PosTerminal::create([
                'name' => 'Terminal ' . $i,
                'location' => $faker->city(),
                'status' => $faker->randomElement(['active', 'inactive']),
                'last_sync_at' => $faker->dateTimeBetween('-1 week', 'now'),
            ]);
        }
    }
}
