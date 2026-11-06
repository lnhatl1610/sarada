<?php

namespace App\Http\Requests\Api\V1\Storefront;

use App\Models\User;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStorefrontNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && ! $this->user()->isAdmin();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var User $user */
            $user = $this->user();
            $channels = StorefrontNotificationPreferences::channelAvailability($user);
            $previous = StorefrontNotificationPreferences::forUser($user);
            foreach ((array) $this->input('preferences', []) as $event => $preferences) {
                if (! is_array($preferences)) {
                    continue;
                }
                foreach ($channels as $channel => $availability) {
                    if (($preferences[$channel] ?? false) === true && ! $availability['available'] && ! ($previous[$event][$channel] ?? false)) {
                        $validator->errors()->add("preferences.{$event}.{$channel}", $availability['reason'] ?? 'Kênh nhận tin hiện không khả dụng.');
                    }
                }
            }
        });
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $events = ['orders', 'promotions', 'price_drops'];
        $channels = ['in_app', 'email', 'sms', 'zalo', 'push'];
        $rules = [
            'preferences' => ['required', 'array:'.implode(',', $events)],
        ];
        foreach ($events as $event) {
            $rules["preferences.{$event}"] = ['required', 'array:'.implode(',', $channels)];
            foreach ($channels as $channel) {
                $rules["preferences.{$event}.{$channel}"] = ['required', 'boolean'];
            }
        }

        return $rules;
    }
}
