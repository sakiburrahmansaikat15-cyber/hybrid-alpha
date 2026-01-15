<?php

namespace App\Http\Requests\CRM;

use Illuminate\Foundation\Http\FormRequest;

class StoreOpportunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'customer_id' => 'required|exists:customers,id',
            'stage_id' => 'nullable|exists:opportunity_stages,id',
            'amount' => 'nullable|numeric|min:0',
            'probability' => 'nullable|numeric|min:0|max:100',
            'expected_close_date' => 'nullable|date',
            'description' => 'nullable|string',
        ];
    }
}
