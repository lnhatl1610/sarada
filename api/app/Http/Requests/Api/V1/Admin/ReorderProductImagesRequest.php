<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReorderProductImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1'],
            'images.*.id' => ['required', 'integer'],
            'images.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'images.required' => 'Vui lòng gửi danh sách ảnh cần sắp xếp.',
            'images.min' => 'Danh sách ảnh cần có ít nhất một ảnh.',
            'images.*.id.required' => 'Mỗi ảnh cần có mã hợp lệ.',
            'images.*.sort_order.required' => 'Mỗi ảnh cần có thứ tự hiển thị.',
            'images.*.sort_order.min' => 'Thứ tự hiển thị không được âm.',
        ];
    }
}
