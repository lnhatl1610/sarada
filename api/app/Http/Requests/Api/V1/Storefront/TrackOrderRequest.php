<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class TrackOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:32'],
            'phone' => ['nullable', 'required_without:email', 'prohibits:email', 'string', 'max:32'],
            'email' => ['nullable', 'required_without:phone', 'prohibits:phone', 'email', 'max:255'],
        ];
    }
}
