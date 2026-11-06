<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ListOperationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'string', 'max:120'],
            'status' => ['sometimes', 'string', 'max:32'],
            'user_id' => ['sometimes', 'integer', 'min:1'],
            'module' => ['sometimes', 'string', 'max:80'],
            'ip' => ['sometimes', 'string', 'max:45'],
            'export' => ['sometimes', 'boolean'],
            'method' => ['sometimes', 'string', 'max:32'],
            'carrier' => ['sometimes', 'string', 'max:120'],
            'sort' => ['sometimes', 'string', 'max:64'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date', 'after_or_equal:from'],
            'min_amount' => ['sometimes', 'integer', 'min:0', 'max:999999999999'],
            'max_amount' => ['sometimes', 'integer', 'min:0', 'max:999999999999', 'gte:min_amount'],
            'inactive_hours' => ['sometimes', 'integer', 'min:1', 'max:8760'],
            'min_value' => ['sometimes', 'integer', 'min:0', 'max:999999999999'],
            'max_value' => ['sometimes', 'integer', 'min:0', 'max:999999999999', 'gte:min_value'],
            'customer_type' => ['sometimes', 'in:registered,guest'],
            'view' => ['sometimes', 'in:products,customers'],
            'category_id' => ['sometimes', 'integer', 'min:1'],
            'campaign_status' => ['sometimes', 'in:running,upcoming,expired,disabled,expiring,active,inactive'],
            'campaign_type' => ['sometimes', 'in:percent,fixed,free_ship'],
            'campaign_position' => ['sometimes', 'in:home_hero,home_mid,hero,hero-mobile,campaign,category,popup'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'sort.string' => 'Thứ tự sắp xếp không hợp lệ.',
            'sort.max' => 'Thứ tự sắp xếp không hợp lệ.',
        ];
    }
}
