<?php

namespace App\Http\Requests\POS;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'terminal_id' => 'required|exists:pos_terminals,id',
            'customer_id' => 'nullable|exists:pos_customers,id',
            'session_id' => 'nullable|exists:pos_sessions,id',
            'total_amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'payable_amount' => 'required|numeric|min:0',
            'payment_status' => 'required|in:pending,partial,paid',
            'status' => 'required|in:pending,completed,cancelled',

            // Items
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.subtotal' => 'required|numeric|min:0',

            // Payments
            'payments' => 'nullable|array',
            'payments.*.payment_method_id' => 'required|exists:payment_methods,id',
            'payments.*.amount' => 'required|numeric|min:0',
            'payments.*.reference' => 'nullable|string',
        ];
    }
}
