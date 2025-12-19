<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\CRM\Ticket;
use App\Models\CRM\Customer;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $customerIds = Customer::pluck('id')->toArray();

        for ($i = 1; $i <= 30; $i++) {
            Ticket::create([
                'customer_id' => $faker->randomElement($customerIds),
                'subject' => $faker->sentence(4),
                'priority' => $faker->randomElement(['low', 'medium', 'high']),
                'status' => $faker->randomElement(['open', 'in_progress', 'closed']),
            ]);
        }
    }
}
