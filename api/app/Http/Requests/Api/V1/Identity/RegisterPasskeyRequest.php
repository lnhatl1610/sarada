<?php

namespace App\Http\Requests\Api\V1\Identity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterPasskeyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'challenge_id' => ['required', 'uuid'],
            'name' => ['required', 'string', 'min:1', 'max:80'],
            'credential' => ['required', 'array', 'required_array_keys:id,rawId,type,response'],
            'credential.id' => ['required', 'string', 'max:2048'],
            'credential.rawId' => ['required', 'string', 'max:2048'],
            'credential.type' => ['required', Rule::in(['public-key'])],
            'credential.response' => ['required', 'array', 'required_array_keys:clientDataJSON,attestationObject'],
            'credential.response.clientDataJSON' => ['required', 'string', 'max:8192'],
            'credential.response.attestationObject' => ['required', 'string', 'max:32768'],
            'credential.response.transports' => ['sometimes', 'array', 'max:8'],
            'credential.response.transports.*' => ['string', Rule::in(['usb', 'nfc', 'ble', 'internal', 'hybrid', 'smart-card'])],
        ];
    }
}
