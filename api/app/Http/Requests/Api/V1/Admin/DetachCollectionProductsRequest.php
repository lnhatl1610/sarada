<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DetachCollectionProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'product_ids' => ['required', 'array', 'min:1', 'max:1000'],
            'product_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('collection_product', 'product_id')->where('collection_id', $this->route('collection')),
            ],
        ];
    }
}
