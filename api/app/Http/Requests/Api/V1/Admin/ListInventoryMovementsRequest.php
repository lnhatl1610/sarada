<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListInventoryMovementsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'variant_id' => ['sometimes', 'integer', 'exists:product_variants,id'],
            'q' => ['sometimes', 'string', 'max:120'],
            'sku' => ['sometimes', 'string', 'max:80'],
            'type' => ['sometimes', 'in:import,adjust,reserve,release,sale,return'],
            'actor_id' => ['sometimes', 'integer', 'exists:users,id'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date', 'after_or_equal:date_from'],
            'sort' => ['sometimes', 'in:created_at,-created_at,quantity_change,-quantity_change,stock_after,-stock_after,sku,-sku'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'variant_id.integer' => 'Biến thể không hợp lệ.',
            'variant_id.exists' => 'Biến thể không còn tồn tại.',
            'per_page.integer' => 'Số dòng mỗi trang phải là số nguyên.',
            'per_page.min' => 'Số dòng mỗi trang tối thiểu là 1.',
            'per_page.max' => 'Số dòng mỗi trang tối đa là 100.',
        ];
    }
}
