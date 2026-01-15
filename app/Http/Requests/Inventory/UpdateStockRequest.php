<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStockRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_id' => 'nullable|exists:products,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            "payment_type_id" => 'nullable|exists:payment_types,id',
            'quantity' => 'nullable|integer|min:1',
            'buying_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'stock_date' => 'nullable|date',
            'expire_date' => 'nullable|date',
            'comission' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:1000',
            'color' => 'nullable|string|max:1000',
            'bar_code' => 'nullable|string|max:1000',
            'note' => 'nullable|string|max:1000',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048',
            'status' => 'sometimes|in:active,inactive',
            'tax' => 'nullable|numeric|min:0'
        ];
    }
}
