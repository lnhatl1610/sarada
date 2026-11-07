<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreContactMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $values = [];
        foreach (['name', 'phone', 'email', 'order_code', 'message'] as $field) {
            if (is_string($this->input($field))) {
                $values[$field] = trim($this->input($field));
            }
        }

        if (isset($values['email'])) {
            $values['email'] = Str::lower($values['email']);
        }

        $this->merge($values);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'regex:/^(0|\+84)\d{9}$/'],
            'email' => ['required', 'string', 'email:filter', 'max:254'],
            'topic' => ['required', 'string', 'in:product,order,return,cooperation,other'],
            'order_code' => ['nullable', 'string', 'max:32'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            'attachment' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=6000,max_height=6000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập họ tên.',
            'phone.regex' => 'Nhập số điện thoại Việt Nam gồm 10 số, bắt đầu bằng 0 hoặc +84.',
            'email.required' => 'Vui lòng nhập email để cửa hàng phản hồi.',
            'topic.in' => 'Vui lòng chọn chủ đề liên hệ.',
            'message.min' => 'Nội dung cần ít nhất 10 ký tự.',
            'message.max' => 'Nội dung không được vượt quá 5.000 ký tự.',
            'attachment.image' => 'Tệp đính kèm phải là ảnh hợp lệ.',
            'attachment.mimes' => 'Chỉ nhận ảnh JPG, PNG hoặc WebP.',
            'attachment.max' => 'Ảnh đính kèm không được vượt quá 2 MB.',
            'attachment.dimensions' => 'Kích thước ảnh đính kèm không được vượt quá 6.000 × 6.000 px.',
        ];
    }
}
