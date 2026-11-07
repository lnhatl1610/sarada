<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreNewsletterUnsubscribeRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email:filter', 'max:254'],
            'reason' => ['required', 'string', Rule::in(['too_many_emails', 'not_relevant', 'signed_up_by_mistake', 'other'])],
        ];
    }
}
