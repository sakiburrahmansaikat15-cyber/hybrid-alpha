<?php

namespace App\Http\Requests\HRM;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceRequest extends FormRequest
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
            'employee_id' => ['sometimes', 'exists:employees,id'],
            'date' => ['sometimes', 'date'],
            'clock_in' => ['nullable', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
            'clock_out' => ['nullable', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
            'late' => ['boolean'],
            'early_leave' => ['boolean'],
            'working_hours' => ['nullable', 'numeric'],
        ];
    }
}
