<?php

namespace App\Http\Requests\Api\V1\Storefront;

use App\Support\StorePasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;

class ChangeAccountPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => $this->attributes->get('sudo_mode_active') === true ? ['nullable', 'string'] : ['required', 'current_password'],
            'password' => ['required', ...StorePasswordPolicy::rules(), 'confirmed'],
            'logout_other_devices' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['current_password.required' => 'Vui lòng nhập mật khẩu hiện tại.', 'current_password.current_password' => 'Mật khẩu hiện tại không chính xác.', 'password.required' => 'Vui lòng nhập mật khẩu mới.', 'password.min' => 'Mật khẩu cần ít nhất :min ký tự.', 'password.regex' => 'Mật khẩu chưa đáp ứng chính sách hiện tại.', 'password.uncompromised' => 'Mật khẩu này đã xuất hiện trong dữ liệu bị lộ. Hãy chọn mật khẩu khác.', 'password.confirmed' => 'Mật khẩu nhập lại chưa khớp.'];
    }
}
