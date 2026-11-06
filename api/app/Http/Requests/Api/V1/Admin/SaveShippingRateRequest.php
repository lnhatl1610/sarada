<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveShippingRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rateId = $this->route('rate');
        $required = $rateId ? 'sometimes' : 'required';

        return [
            'province_code' => [$required, 'string', 'max:32', Rule::unique('shipping_rates', 'province_code')->ignore($rateId)],
            'province_name' => [$required, 'string', 'max:120'],
            'fee' => [$required, 'integer', 'min:0', 'max:100000000'],
            'free_shipping_threshold' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
