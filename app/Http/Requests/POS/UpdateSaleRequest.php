<?php

namespace App\Http\Requests\POS;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'terminal_id' => 'sometimes|exists:pos_terminals,id',
            'customer_id' => 'nullable|exists:pos_customers,id',
            'invoice_no' => 'sometimes|string|max:255|unique:sales,invoice_no,' . $this->route('sale'),
            'total_amount' => 'sometimes|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'payment_status' => 'sometimes|in:pending,partial,paid',
            'order_type' => 'sometimes|in:dine_in,take_away,delivery',
            'status' => 'sometimes|in:pending,completed,cancelled',
        ];
    }
}
