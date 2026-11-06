<?php

namespace App\Http\Requests\Api\V1\Identity;

use App\Support\StorePasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;

class AcceptStaffInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'password' => ['required', ...StorePasswordPolicy::rules(10), 'confirmed'],
            'terms' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return ['password.uncompromised' => 'Mật khẩu này đã xuất hiện trong dữ liệu bị lộ. Hãy chọn mật khẩu khác.'];
    }
}
