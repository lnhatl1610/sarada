<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdjustStoreInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['variant_id' => ['required', 'integer', 'exists:product_variants,id'], 'quantity_change' => ['required', 'integer', 'between:-1000000,1000000', 'not_in:0'], 'reason' => ['required', 'string', 'min:3', 'max:500']];
    }
}
