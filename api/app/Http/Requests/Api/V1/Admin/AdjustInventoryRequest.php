<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AdjustInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity_change' => ['required', 'integer', 'between:-100000,100000', 'not_in:0'],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'type' => ['sometimes', 'in:import,adjust'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->input('type') === 'import' && (int) $this->input('quantity_change', 0) <= 0) {
                $validator->errors()->add('quantity_change', 'Nhập kho phải có số lượng lớn hơn 0.');
            }
        }];
    }
}
