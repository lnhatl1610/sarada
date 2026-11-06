<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInventoryThresholdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'variant_ids' => ['required', 'array', 'min:1', 'max:100'],
            'variant_ids.*' => ['required', 'integer', 'distinct', Rule::exists('inventories', 'variant_id')],
            'low_stock_threshold' => ['required', 'integer', 'min:0', 'max:1000000'],
        ];
    }
}
