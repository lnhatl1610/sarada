<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateInventoryAdjustmentBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'reason_category' => ['required', Rule::in(['stocktake', 'damage', 'loss', 'other'])],
            'note' => ['nullable', 'string', 'max:500'],
            'rows' => ['required', 'array', 'min:1', 'max:100'],
            'rows.*.variant_id' => ['required', 'integer', 'distinct', Rule::exists('inventories', 'variant_id')],
            'rows.*.quantity_change' => ['required', 'integer', 'between:-100000,100000', 'not_in:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason_category.required' => 'Vui lòng chọn lý do điều chỉnh.',
            'reason_category.in' => 'Lý do điều chỉnh không hợp lệ.',
            'rows.required' => 'Phiếu cần có ít nhất một biến thể.',
            'rows.min' => 'Phiếu cần có ít nhất một biến thể.',
            'rows.max' => 'Mỗi phiếu chỉ được điều chỉnh tối đa 100 biến thể.',
            'rows.*.variant_id.distinct' => 'Một biến thể chỉ được xuất hiện một lần trong phiếu.',
            'rows.*.quantity_change.not_in' => 'Số lượng điều chỉnh không được bằng 0.',
        ];
    }
}
