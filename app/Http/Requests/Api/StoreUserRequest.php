<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Middleware handles this
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'bail|required|string|max:255',
            'email' => 'bail|required|email:rfc,strict|unique:users,email',
            'password' => 'bail|required|string|min:8|regex:/[a-z]/|regex:/[A-Z]/|regex:/[0-9]/',
            'role_id' => 'bail|nullable|exists:roles,id',
            'status' => 'boolean',
            'avatar' => 'nullable|string',
        ];
    }
}
