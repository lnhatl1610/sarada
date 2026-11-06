<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class SyncRecentlyViewedProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'slugs' => ['present', 'array', 'max:12'],
            'slugs.*' => ['required', 'string', 'max:160', 'distinct'],
        ];
    }
}
