<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'group_by' => ['sometimes', Rule::in(['day', 'week', 'month'])],
            'payment_method' => ['sometimes', 'string', 'max:32'],
            'status' => ['sometimes', 'string', 'max:32'],
            'province' => ['sometimes', 'string', 'max:120'],
            'category_id' => ['sometimes', 'integer', 'min:1', 'exists:categories,id'],
            'brand_id' => ['sometimes', 'integer', 'min:1', 'exists:brands,id'],
            'customer_group' => ['sometimes', Rule::in(['new', 'returning'])],
            'threshold' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'coupon_code' => ['sometimes', 'string', 'max:50'],
        ];
    }
}
