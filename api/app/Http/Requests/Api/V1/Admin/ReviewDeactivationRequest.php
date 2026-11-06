<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReviewDeactivationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['decision' => ['required', 'in:approved,rejected'], 'review_note' => ['nullable', 'string', 'max:2000']];
    }
}
