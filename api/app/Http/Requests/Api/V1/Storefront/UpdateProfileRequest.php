<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
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
        $userId = $this->user()->id;

        $rules = [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'phone' => ['nullable', 'regex:/^(0|\+84)\d{9}$/', Rule::unique('users', 'phone')->ignore($userId)],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'birthday' => ['nullable', 'date', 'before:today', 'after_or_equal:'.now()->subYears(120)->toDateString()],
        ];

        if (! $this->user()->isAdmin()) {
            $rules['phone'] = ['prohibited'];
            $rules += [
                'height_cm' => ['sometimes', 'nullable', 'numeric', 'min:50', 'max:250'],
                'weight_kg' => ['sometimes', 'nullable', 'numeric', 'min:10', 'max:300'],
                'bust_cm' => ['sometimes', 'nullable', 'numeric', 'min:30', 'max:200'],
                'waist_cm' => ['sometimes', 'nullable', 'numeric', 'min:30', 'max:200'],
                'hip_cm' => ['sometimes', 'nullable', 'numeric', 'min:30', 'max:200'],
            ];
        }

        if ($this->user()->isAdmin()) {
            $rules += [
                'job_title' => ['sometimes', 'nullable', 'string', 'max:100'],
                'department' => ['sometimes', 'nullable', Rule::in(['operations', 'warehouse', 'customer_service', 'marketing', 'accounting', 'other'])],
                'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
                'signature' => ['sometimes', 'nullable', 'string', 'max:300'],
                'timezone' => ['sometimes', 'timezone'],
            ];
        }

        return $rules;
    }

    public function messages(): array
    {
        return ['name.required' => 'Vui lòng nhập họ tên.', 'name.min' => 'Họ tên cần có ít nhất 2 ký tự.', 'name.max' => 'Họ tên không được vượt quá 255 ký tự.', 'phone.regex' => 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.', 'phone.unique' => 'Số điện thoại này đã được sử dụng.', 'gender.in' => 'Giới tính không hợp lệ.', 'birthday.before' => 'Ngày sinh phải trước hôm nay.', 'birthday.after_or_equal' => 'Tuổi không được vượt quá 120.'];
    }
}
