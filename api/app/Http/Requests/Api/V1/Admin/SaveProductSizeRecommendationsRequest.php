<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveProductSizeRecommendationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recommendations' => ['required', 'array', 'max:30'],
            'recommendations.*.size_value_id' => ['required', 'integer', 'distinct', Rule::exists('attribute_values', 'id')],
            'recommendations.*.height_min_cm' => ['required', 'numeric', 'min:50', 'max:250'],
            'recommendations.*.height_max_cm' => ['required', 'numeric', 'min:50', 'max:250'],
            'recommendations.*.weight_min_kg' => ['required', 'numeric', 'min:10', 'max:300'],
            'recommendations.*.weight_max_kg' => ['required', 'numeric', 'min:10', 'max:300'],
        ];
    }
}
