<?php

namespace App\Http\Requests\Api\V1\Identity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PasskeyLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'challenge_id' => ['required', 'uuid'],
            'credential' => ['required', 'array', 'required_array_keys:id,rawId,type,response'],
            'credential.id' => ['required', 'string', 'max:2048'],
            'credential.rawId' => ['required', 'string', 'max:2048'],
            'credential.type' => ['required', Rule::in(['public-key'])],
            'credential.response' => ['required', 'array', 'required_array_keys:clientDataJSON,authenticatorData,signature'],
            'credential.response.clientDataJSON' => ['required', 'string', 'max:8192'],
            'credential.response.authenticatorData' => ['required', 'string', 'max:8192'],
            'credential.response.signature' => ['required', 'string', 'max:8192'],
            'credential.response.userHandle' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
