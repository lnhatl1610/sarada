<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmAccountPhoneChangeRequest extends FormRequest
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
        return ['code' => ['required', 'digits:6']];
    }

    public function messages(): array
    {
        return ['code.required' => 'Nhập mã xác minh đã gửi đến số điện thoại mới.', 'code.digits' => 'Mã xác minh gồm 6 chữ số.'];
    }
}
