<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderCatalogOptionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $kind = (string) $this->route('kind');
        $parentRules = $kind === 'categories'
            ? ['sometimes', 'nullable', 'integer', Rule::exists('categories', 'id')]
            : ['prohibited'];

        return [
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.id' => ['required', 'integer', 'distinct', Rule::exists(in_array($kind, ['sizes', 'colors'], true) ? 'attribute_values' : 'categories', 'id')],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
            'items.*.parent_id' => $parentRules,
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Vui lòng gửi danh sách cần sắp xếp.',
            'items.min' => 'Danh sách cần có ít nhất một mục.',
            'items.max' => 'Mỗi lần chỉ được sắp xếp tối đa 100 mục.',
            'items.*.id.required' => 'Mỗi mục cần có mã hợp lệ.',
            'items.*.id.distinct' => 'Danh sách sắp xếp không được lặp mục.',
            'items.*.sort_order.required' => 'Mỗi mục cần có thứ tự hiển thị.',
            'items.*.sort_order.min' => 'Thứ tự hiển thị không được âm.',
            'items.*.parent_id.integer' => 'Danh mục cha không hợp lệ.',
        ];
    }
}
