<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user') ?: $this->route('id');
        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $userId,
            'password' => 'nullable|min:8|regex:/[a-z]/|regex:/[A-Z]/|regex:/[0-9]/',
            'role_id' => 'nullable|exists:roles,id',
            'status' => 'boolean',
            'avatar' => 'nullable|string',
        ];
    }
}
