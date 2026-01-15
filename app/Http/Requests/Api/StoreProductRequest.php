<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'specification' => 'nullable|string',
            'cat_id' => 'nullable|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'sub_cat_id' => 'nullable|exists:sub_categories,id',
            'sub_item_id' => 'nullable|exists:sub_items,id',
            'unit_id' => 'nullable|exists:units,id',
            'product_type_id' => 'nullable|exists:product_types,id',
        ];
    }
}
