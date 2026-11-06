<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Attribute;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'alt' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_360_frame' => ['sometimes', 'boolean'],
            'color_value_id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('attribute_values', 'id')->whereIn(
                    'attribute_id',
                    Attribute::query()->where('type', 'color')->pluck('id'),
                ),
            ],
        ];
    }
}
