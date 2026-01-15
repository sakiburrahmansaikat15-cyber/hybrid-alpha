<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWarehouseRequest extends FormRequest
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
        $id = $this->route('id');
        return [
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50|unique:warehouses,code,' . $id,
            'type' => 'sometimes|string|max:50',
            'contact_person' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'email' => 'sometimes|email|max:255',
            'address' => 'sometimes|string',
            'country' => 'sometimes|string|max:100',
            'state' => 'sometimes|string|max:100',
            'city' => 'sometimes|string|max:100',
            'capacity' => 'sometimes|integer|min:0',
            'is_default' => 'sometimes|boolean',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}
