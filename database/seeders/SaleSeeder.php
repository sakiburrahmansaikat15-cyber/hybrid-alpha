<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use App\Models\POS\Sale;
use App\Models\POS\SaleItem;
use App\Models\POS\Receipt;
use App\Models\Product;
use App\Models\POS\Customer;
use App\Models\POS\PosTerminal;
use App\Models\POS\ReceiptTemplate;

class SaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        $terminals = PosTerminal::pluck('id')->toArray();
        $customers = Customer::pluck('id')->toArray();
        $products = Product::pluck('id')->toArray();
        $templates = ReceiptTemplate::pluck('id')->toArray();

        // If dependencies are missing, stop
        if (empty($terminals) || empty($customers) || empty($products)) {
            return;
        }

        // Create 20 Sales
        for ($i = 0; $i < 20; $i++) {
            $subtotal = $faker->randomFloat(2, 50, 500);
            $tax = $subtotal * 0.10;
            $discount = 0;
            $total = $subtotal + $tax - $discount;

            $sale = Sale::create([
                'sale_number' => 'SALE-' . strtoupper($faker->bothify('#####')),
                'terminal_id' => $faker->randomElement($terminals),
                'customer_id' => $faker->randomElement($customers),
                'sale_date' => $faker->dateTimeThisMonth,
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'discount_amount' => $discount,
                'total_amount' => $total,
                'paid_amount' => $total,
                'change_amount' => 0,
                'payment_status' => 'paid',
                'status' => 'completed',
                'notes' => $faker->sentence,
            ]);

            // Add Items
            $numItems = $faker->numberBetween(1, 5);
            for ($j = 0; $j < $numItems; $j++) {
                $itemPrice = $subtotal / $numItems;
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $faker->randomElement($products),
                    'quantity' => 1,
                    'unit_price' => $itemPrice,
                    'subtotal' => $itemPrice,
                    'tax_amount' => $itemPrice * 0.10,
                    'discount_amount' => 0,
                    'total' => $itemPrice * 1.10,
                ]);
            }

            // Create Receipt
            if (!empty($templates)) {
                Receipt::create([
                    'sale_id' => $sale->id,
                    'receipt_number' => 'REC-' . strtoupper($faker->bothify('#####')),
                    'template_id' => $faker->randomElement($templates),
                    'printed_at' => $faker->boolean ? now() : null,
                ]);
            }
        }
    }
}
