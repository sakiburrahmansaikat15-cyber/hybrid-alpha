<?php

namespace App\Http\Requests\CRM;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'lead_source_id' => 'nullable|exists:lead_sources,id',
            'lead_status_id' => 'nullable|exists:lead_statuses,id',
            'description' => 'nullable|string',
            'value' => 'nullable|numeric|min:0',
        ];
    }
}
