<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RequestAccountPhoneChangeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $phone = (string) $this->input('phone', '');
        if (preg_match('/^\+84(\d{9})$/', $phone, $matches)) {
            $this->merge(['phone' => '0'.$matches[1]]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'regex:/^0\d{9}$/', Rule::unique('users', 'phone')->ignore($this->user()->id)],
            'current_password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return ['phone.regex' => 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.', 'phone.unique' => 'Số điện thoại này đã được sử dụng.'];
    }
}
