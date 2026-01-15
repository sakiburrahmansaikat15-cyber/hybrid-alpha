<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockRequest extends FormRequest
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
            'product_id' => 'required|exists:products,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            "payment_type_id" => 'nullable|exists:payment_types,id',
            'quantity' => 'required|integer|min:1',
            'buying_price' => 'required|numeric|min:0',
            'tax' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'due_amount' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'stock_date' => 'nullable|date',
            'expire_date' => 'nullable|date',
            'comission' => 'nullable|numeric|min:0',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif|max:2048',
            'status' => 'required|in:active,inactive',

            'sku' => 'nullable|string',
            'bar_code' => 'nullable|string',
            'color' => 'nullable|string',
            'note' => 'nullable|string',
        ];
    }
}
