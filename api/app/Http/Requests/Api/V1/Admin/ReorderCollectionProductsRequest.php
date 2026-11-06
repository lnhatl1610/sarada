<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReorderCollectionProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'products' => ['required', 'array', 'min:1'],
            'products.*.id' => ['required', 'integer'],
            'products.*.sort_order' => ['required', 'integer', 'min:0'],
            'products.*.lookbook_x' => ['sometimes', 'nullable', 'numeric', 'between:0,100', 'required_with:products.*.lookbook_y'],
            'products.*.lookbook_y' => ['sometimes', 'nullable', 'numeric', 'between:0,100', 'required_with:products.*.lookbook_x'],
        ];
    }

    public function messages(): array
    {
        return [
            'products.required' => 'Vui lòng gửi danh sách sản phẩm.',
            'products.min' => 'Cần ít nhất một sản phẩm để sắp xếp.',
            'products.*.id.required' => 'Mỗi sản phẩm cần có mã hợp lệ.',
            'products.*.sort_order.required' => 'Mỗi sản phẩm cần có thứ tự hiển thị.',
            'products.*.sort_order.min' => 'Thứ tự hiển thị không được âm.',
        ];
    }
}
