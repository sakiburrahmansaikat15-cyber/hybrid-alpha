<?php

namespace App\Http\Requests\Api;

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
            'invoice_no' => 'required|string|max:255|unique:sales,invoice_no',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'required|in:pending,completed,cancelled',
        ];
    }
}
