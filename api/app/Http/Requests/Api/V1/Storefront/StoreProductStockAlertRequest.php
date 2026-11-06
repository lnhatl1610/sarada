<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreProductStockAlertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower(trim($this->input('email')))]);
        }

        if (is_string($this->input('phone'))) {
            $phone = trim($this->input('phone'));
            $this->merge(['phone' => str_starts_with($phone, '0') ? '+84'.substr($phone, 1) : $phone]);
        }
    }

    public function rules(): array
    {
        return [
            'variant_id' => ['required', 'integer', 'min:1'],
            'email' => ['nullable', 'required_without:phone', 'prohibits:phone', 'string', 'email:filter', 'max:254'],
            'phone' => ['nullable', 'required_without:email', 'prohibits:email', 'string', 'regex:/^(0|\+84)\d{9}$/', 'max:16'],
        ];
    }

    public function messages(): array
    {
        return [
            'variant_id.required' => 'Vui lòng chọn biến thể cần theo dõi.',
            'email.required' => 'Vui lòng nhập địa chỉ email nhận thông báo.',
            'email.email' => 'Địa chỉ email chưa đúng định dạng.',
            'phone.required_without' => 'Vui lòng nhập số điện thoại nhận thông báo.',
            'phone.regex' => 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->filled('phone') && ! config('services.twilio.stock_alerts_enabled')) {
                $validator->errors()->add('phone', 'Thông báo SMS hiện chưa được cấu hình. Vui lòng chọn nhận email.');
            }
        });
    }
}
