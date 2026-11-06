<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class StoreAccountProductStockAlertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['variant_id' => ['required', 'integer', 'min:1']];
    }

    public function messages(): array
    {
        return ['variant_id.required' => 'Vui lòng chọn biến thể cần theo dõi.'];
    }
}
