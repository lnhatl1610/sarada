<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$required, 'string', 'max:120'],
            'report' => [$required, Rule::in(['revenue', 'orders', 'products', 'customers', 'inventory', 'coupons'])],
            'frequency' => [$required, Rule::in(['daily', 'weekly', 'monthly'])],
            'format' => [$required, Rule::in(['csv', 'pdf'])],
            'send_time' => [$required, 'date_format:H:i'],
            'timezone' => [$required, 'string', 'timezone'],
            'weekday' => ['required_if:frequency,weekly', 'nullable', 'integer', 'between:1,7'],
            'month_day' => ['required_if:frequency,monthly', 'nullable', 'integer', 'between:1,28'],
            'recipients' => [$required, 'array', 'min:1', 'max:10'],
            'recipients.*' => ['required', 'email:rfc', 'max:255', 'distinct:ignore_case'],
            'params' => ['sometimes', 'array:group_by,payment_method,status,province,category_id,brand_id,customer_group,threshold,coupon_code'],
            'params.group_by' => ['sometimes', Rule::in(['day', 'week', 'month'])],
            'params.payment_method' => ['sometimes', 'string', 'max:32'],
            'params.status' => ['sometimes', 'string', 'max:32'],
            'params.province' => ['sometimes', 'string', 'max:120'],
            'params.category_id' => ['sometimes', 'integer', 'min:1', 'exists:categories,id'],
            'params.brand_id' => ['sometimes', 'integer', 'min:1', 'exists:brands,id'],
            'params.customer_group' => ['sometimes', Rule::in(['new', 'returning'])],
            'params.threshold' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'params.coupon_code' => ['sometimes', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
