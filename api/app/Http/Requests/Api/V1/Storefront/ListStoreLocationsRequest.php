<?php

namespace App\Http\Requests\Api\V1\Storefront;

use App\Support\VietnamAddressCatalog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class ListStoreLocationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'province_code' => ['nullable', 'string', 'max:32'],
            'ward_code' => ['nullable', 'string', 'max:32'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $wardCode = $this->input('ward_code');
            if (! filled($wardCode)) {
                return;
            }

            $provinceCode = (string) $this->input('province_code', '');
            if (! app(VietnamAddressCatalog::class)->ward($provinceCode, (string) $wardCode)) {
                $validator->errors()->add('ward_code', 'Vui lòng chọn xã/phường thuộc tỉnh/thành phố đã chọn.');
            }
        });
    }
}
