<?php

namespace App\Http\Requests\Api\V1\Storefront;

use App\Support\VietnamAddressCatalog;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class GetShippingFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'province_code' => ['required', 'string', 'max:32'],
            'ward_code' => ['sometimes', 'nullable', 'string', 'max:32'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $catalog = app(VietnamAddressCatalog::class);
            $provinceCode = (string) $this->input('province_code', '');

            if (! $catalog->province($provinceCode)) {
                $validator->errors()->add('province_code', 'Vui lòng chọn tỉnh/thành phố hợp lệ.');

                return;
            }

            $wardCode = $this->input('ward_code');
            if (filled($wardCode) && ! $catalog->ward($provinceCode, (string) $wardCode)) {
                $validator->errors()->add('ward_code', 'Vui lòng chọn xã/phường thuộc tỉnh/thành phố đã chọn.');
            }
        });
    }
}
