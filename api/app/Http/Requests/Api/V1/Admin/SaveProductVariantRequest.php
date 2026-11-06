<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Attribute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveProductVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('variant');
        $required = $id ? 'sometimes' : 'required';

        return [
            'sku' => [$required, 'string', 'max:100', Rule::unique('product_variants', 'sku')->ignore($id)],
            'barcode' => ['sometimes', 'nullable', 'string', 'max:100'],
            'price' => [$required, 'integer', 'min:0'],
            'compare_at_price' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'color_value_id' => ['sometimes', 'nullable', 'integer', Rule::exists('attribute_values', 'id')->where('attribute_id', Attribute::query()->where('type', 'color')->value('id'))],
            'size_value_id' => ['sometimes', 'nullable', 'integer', Rule::exists('attribute_values', 'id')->where('attribute_id', Attribute::query()->where('type', 'size')->value('id'))],
            'weight_gram' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'initial_quantity' => [$id ? 'prohibited' : 'required', 'integer', 'min:0'],
        ];
    }
}
