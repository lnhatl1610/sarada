<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttachCollectionProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'product_ids' => ['required', 'array', 'min:1', 'max:100'],
            'product_ids.*' => ['required', 'integer', 'distinct', Rule::exists('products', 'id')->whereNull('deleted_at')],
        ];
    }

    public function messages(): array
    {
        return [
            'product_ids.required' => 'Vui lòng chọn ít nhất một sản phẩm.',
            'product_ids.min' => 'Vui lòng chọn ít nhất một sản phẩm.',
            'product_ids.max' => 'Mỗi lần chỉ có thể thêm tối đa 100 sản phẩm.',
            'product_ids.*.distinct' => 'Sản phẩm được chọn không được trùng lặp.',
            'product_ids.*.exists' => 'Sản phẩm không tồn tại hoặc đã bị xóa.',
        ];
    }
}
