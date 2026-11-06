<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ChangeAccountEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => Str::lower(trim((string) $this->input('email')))]);
    }

    public function rules(): array
    {
        return ['email' => ['required', 'email', 'max:255', Rule::notIn([Str::lower((string) $this->user()->email)]), Rule::unique('users', 'email')->ignore($this->user()->id), Rule::unique('pending_email_changes', 'email')->where(fn ($query) => $query->where('expires_at', '>', now())->where('user_id', '<>', $this->user()->id))], 'current_password' => $this->attributes->get('sudo_mode_active') === true ? ['nullable', 'string'] : ['required', 'current_password']];
    }

    public function messages(): array
    {
        return ['email.required' => 'Vui lòng nhập email.', 'email.email' => 'Email chưa đúng định dạng.', 'email.unique' => 'Email này đã được sử dụng hoặc đang chờ xác minh.', 'email.not_in' => 'Email mới phải khác email hiện tại.', 'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại.', 'current_password.current_password' => 'Mật khẩu hiện tại không chính xác.'];
    }
}
