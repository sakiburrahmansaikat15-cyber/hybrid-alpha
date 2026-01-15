<?php

namespace App\Http\Requests\HRM;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'salary' => 'nullable|numeric|min:0',
            'join_date' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'job_type' => 'nullable|in:full_time,part_time,contract',
        ];
    }
}
