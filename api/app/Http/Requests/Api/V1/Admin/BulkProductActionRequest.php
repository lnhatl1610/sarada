<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkProductActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['integer', 'distinct', 'exists:products,id'],
            'action' => ['required', 'in:activate,hide,archive,feature,unfeature,assign_category,assign_collections,assign_tags'],
            'category_id' => ['required_if:action,assign_category', 'integer', 'exists:categories,id'],
            'collection_ids' => ['required_if:action,assign_collections', 'array', 'min:1', 'max:50'],
            'collection_ids.*' => ['integer', 'distinct', 'exists:collections,id'],
            'tag_ids' => ['required_if:action,assign_tags', 'array', 'min:1', 'max:50'],
            'tag_ids.*' => ['integer', 'distinct', 'exists:tags,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Vui lòng chọn ít nhất một sản phẩm.',
            'ids.min' => 'Vui lòng chọn ít nhất một sản phẩm.',
            'ids.max' => 'Chỉ có thể cập nhật tối đa 100 sản phẩm cùng lúc.',
            'ids.*.distinct' => 'Danh sách có sản phẩm bị lặp.',
            'ids.*.exists' => 'Một hoặc nhiều sản phẩm không còn tồn tại.',
            'action.required' => 'Vui lòng chọn thao tác.',
            'action.in' => 'Thao tác sản phẩm không hợp lệ.',
            'category_id.required_if' => 'Vui lòng chọn danh mục cần gán.',
            'collection_ids.required_if' => 'Vui lòng chọn ít nhất một bộ sưu tập.',
            'collection_ids.min' => 'Vui lòng chọn ít nhất một bộ sưu tập.',
            'tag_ids.required_if' => 'Vui lòng chọn ít nhất một thẻ.',
            'tag_ids.min' => 'Vui lòng chọn ít nhất một thẻ.',
        ];
    }
}
