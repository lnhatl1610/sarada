<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\ShippingMethod;
use App\Support\VietnamAddressCatalog;
use Illuminate\Foundation\Http\FormRequest;

class SaveShippingMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->route('method') ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:100'],
            'fee' => [$required, 'integer', 'min:0', 'max:100000000'],
            'est_days' => ['sometimes', 'nullable', 'string', 'max:30'],
            'province_code' => ['sometimes', 'nullable', 'string', 'max:32'],
            'ward_codes' => ['sometimes', 'nullable', 'array', 'max:500'],
            'ward_codes.*' => ['string', 'max:32', 'distinct'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $methodId = $this->route('method');
            $existing = $methodId ? ShippingMethod::query()->find($methodId) : null;
            $provinceCode = $this->input('province_code', $existing?->province_code);
            $wardCodes = $this->input('ward_codes', $existing?->ward_codes ?? []);

            if ($provinceCode !== null && app(VietnamAddressCatalog::class)->province((string) $provinceCode) === null) {
                $validator->errors()->add('province_code', 'Tỉnh/thành giới hạn giao hàng không hợp lệ.');

                return;
            }

            if (! $provinceCode && ! empty($wardCodes)) {
                $validator->errors()->add('ward_codes', 'Chọn tỉnh/thành trước khi giới hạn phường/xã.');

                return;
            }

            foreach ((array) $wardCodes as $wardCode) {
                if (! app(VietnamAddressCatalog::class)->ward((string) $provinceCode, (string) $wardCode)) {
                    $validator->errors()->add('ward_codes', 'Mỗi phường/xã phải thuộc tỉnh/thành đã chọn.');

                    return;
                }
            }
        });
    }
}
