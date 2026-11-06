<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StorefrontPromotionCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:1000'],
            'href' => ['required', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $href = (string) $this->input('href', '');
            if (! str_starts_with($href, '/') || str_starts_with($href, '//') || str_contains($href, '\\') || preg_match('/\s/', $href)) {
                $validator->errors()->add('href', 'Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng /.');
            }
        });
    }
}
