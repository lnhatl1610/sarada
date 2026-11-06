<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Support\StorePasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;

class ChangeAdminPasswordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'current_password' => $this->attributes->get('sudo_mode_active') === true ? ['nullable', 'string'] : ['required', 'string'],
            'password' => ['required', ...StorePasswordPolicy::rules(10), 'confirmed'],
            'logout_other_devices' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['password.uncompromised' => 'Mật khẩu này đã xuất hiện trong dữ liệu bị lộ. Hãy chọn mật khẩu khác.'];
    }
}
