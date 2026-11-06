<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReviewOrderChangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'decision' => ['required', 'in:approved,rejected'],
            'resolution_note' => ['nullable', 'string', 'min:3', 'max:1000', 'required_if:decision,rejected'],
        ];
    }
}
