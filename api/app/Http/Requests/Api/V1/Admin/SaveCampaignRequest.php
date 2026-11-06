<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Banner;
use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCampaignRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->route('kind') === 'coupons' && $this->has('code')) {
            $this->merge(['code' => strtoupper(trim((string) $this->input('code')))]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $kind = $this->route('kind');
        $id = $this->route('campaign');
        $required = $id === null ? 'required' : 'sometimes';
        if ($kind === 'coupons') {
            return [
                'code' => [$required, 'string', 'max:50', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($id)],
                'description' => ['sometimes', 'nullable', 'string', 'max:255'],
                'type' => [$required, Rule::in(['percent', 'fixed', 'free_ship'])],
                'value' => [$required, 'integer', 'min:'.($this->input('type') === 'free_ship' ? '0' : '1')],
                'max_discount' => ['sometimes', 'nullable', 'integer', 'min:0'],
                'min_order_value' => ['sometimes', 'integer', 'min:0'],
                'usage_limit' => ['sometimes', 'nullable', 'integer', 'min:1'],
                'usage_per_user' => ['sometimes', 'nullable', 'integer', 'min:1'],
                'starts_at' => ['sometimes', 'nullable', 'date'],
                'ends_at' => ['sometimes', 'nullable', 'date', 'after:starts_at'],
                'is_active' => ['sometimes', 'boolean'],
            ];
        }

        return [
            'title' => [$required, 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'alt' => [$required, 'required', 'string', 'max:255'],
            'image' => [$required, 'string', 'max:500'],
            'video_url' => ['sometimes', 'nullable', 'string', 'max:500', function (string $attribute, mixed $value, Closure $fail): void {
                if (! is_string($value) || trim($value) === '') {
                    return;
                }

                $value = trim($value);
                $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
                $isHttpUrl = in_array($scheme, ['http', 'https'], true)
                    && filter_var($value, FILTER_VALIDATE_URL) !== false;

                if (! $isHttpUrl) {
                    $fail('URL video phải bắt đầu bằng http:// hoặc https://.');
                }
            }],
            'link' => ['sometimes', 'nullable', 'string', 'max:500', function (string $attribute, mixed $value, Closure $fail): void {
                if (! is_string($value) || trim($value) === '') {
                    return;
                }

                $value = trim($value);
                $isInternalPath = str_starts_with($value, '/')
                    && ! str_starts_with($value, '//')
                    && ! str_contains($value, '\\')
                    && ! preg_match('/[\x00-\x20\x7f]/', $value);
                $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
                $isHttpUrl = in_array($scheme, ['http', 'https'], true)
                    && filter_var($value, FILTER_VALIDATE_URL) !== false;

                if (! $isInternalPath && ! $isHttpUrl) {
                    $fail('Đường dẫn phải là đường dẫn nội bộ hoặc URL bắt đầu bằng http:// hay https://.');
                }
            }],
            'position' => [$required, Rule::in(['home_hero', 'home_mid', 'hero', 'hero-mobile', 'campaign', 'category', 'popup'])],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date', 'after:starts_at'],
            'show_countdown' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        if ($this->route('kind') === 'coupons') {
            return;
        }

        $validator->after(function ($validator): void {
            $banner = $this->route('campaign') ? Banner::query()->find($this->route('campaign')) : null;
            $showCountdown = $this->input('show_countdown', (bool) $banner?->show_countdown);

            if (! filter_var($showCountdown, FILTER_VALIDATE_BOOLEAN)) {
                return;
            }

            $position = $this->input('position', $banner?->position);
            $endsAt = $this->exists('ends_at') ? $this->input('ends_at') : $banner?->ends_at;

            if ($position !== 'campaign') {
                $validator->errors()->add('position', 'Chá»‰ banner chiáº¿n dá»‹ch má»›i cÃ³ thá»ƒ hiá»‡n Ä‘áº¿m ngÆ°á»£c.');
            }

            if ($endsAt === null || $endsAt === '') {
                $validator->errors()->add('ends_at', 'Cáº§n cÃ i Ä‘áº·t thá»i Ä‘iá»ƒm káº¿t thÃºc Ä‘á»ƒ hiá»‡n Ä‘áº¿m ngÆ°á»£c.');
            }
        });
    }
}
