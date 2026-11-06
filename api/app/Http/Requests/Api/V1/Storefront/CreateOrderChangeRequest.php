<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderChangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'type' => ['required', 'in:cancellation,return'],
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ];
    }
}
