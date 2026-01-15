<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'shop_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:vendors,email,' . $this->route('vendor'),
            'contact' => 'sometimes|string|max:20',
            'address' => 'sometimes|string',
            'status' => 'sometimes|in:active,inactive',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }
}
