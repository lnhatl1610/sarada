<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderShipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'carrier' => ['nullable', 'string', 'max:50'],
            'tracking_code' => ['nullable', 'string', 'max:100'],
            'status' => ['required', 'in:pending,picked_up,in_transit,delivered,failed,returned'],
        ];
    }

    public function messages(): array
    {
        return [
            'carrier.max' => 'Tên đơn vị vận chuyển không được vượt quá 50 ký tự.',
            'tracking_code.max' => 'Mã vận đơn không được vượt quá 100 ký tự.',
            'status.required' => 'Vui lòng chọn trạng thái vận chuyển.',
            'status.in' => 'Trạng thái vận chuyển không hợp lệ.',
        ];
    }
}
