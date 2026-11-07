<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmNewsletterUnsubscribeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['token' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]{64}$/']];
    }
}
