<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Validation\Rules\Password;

class StorePasswordPolicy
{
    /** @return list<string|Password> */
    public static function rules(int $minimumFloor = 8): array
    {
        $settings = self::configuration();
        $minimum = max($minimumFloor, $settings['min_length']);
        $rules = [Password::min($minimum)->uncompromised()];
        foreach ([
            'require_letter' => '/[A-Za-z]/',
            'require_number' => '/[0-9]/',
            'require_special' => '/[^A-Za-z0-9]/',
        ] as $key => $pattern) {
            if ($settings[$key]) {
                $rules[] = 'regex:'.$pattern;
            }
        }

        return $rules;
    }

    /** @return array{min_length: int, require_letter: bool, require_number: bool, require_special: bool} */
    public static function configuration(): array
    {
        $settings = Setting::query()->whereIn('key', ['password_min_length', 'password_require_letter', 'password_require_number', 'password_require_special'])->pluck('value', 'key');

        return [
            'min_length' => max(8, min(64, (int) ($settings['password_min_length'] ?? 10))),
            'require_letter' => filter_var($settings['password_require_letter'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
            'require_number' => filter_var($settings['password_require_number'] ?? 'true', FILTER_VALIDATE_BOOLEAN),
            'require_special' => filter_var($settings['password_require_special'] ?? 'false', FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
