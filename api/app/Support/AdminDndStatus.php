<?php

namespace App\Support;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Throwable;

class AdminDndStatus
{
    public static function allowsUrgent(User $user): bool
    {
        $settings = self::settings($user);

        return ! is_array($settings) || (bool) ($settings['allow_urgent'] ?? true);
    }

    public static function isActive(User $user, ?CarbonImmutable $now = null): bool
    {
        $settings = self::settings($user);
        if (! is_array($settings)) {
            return false;
        }

        $now ??= CarbonImmutable::now(self::timezone($user));
        if (is_string($settings['until'] ?? null)) {
            try {
                if (CarbonImmutable::parse($settings['until'])->isAfter($now)) {
                    return true;
                }
            } catch (Throwable) {
                // Ignore an invalid or legacy expiry and continue with the weekly schedule.
            }
        }

        foreach (($settings['schedule'] ?? []) as $window) {
            if (! is_array($window) || ! is_array($window['days'] ?? null)
                || ! is_string($window['start'] ?? null) || ! is_string($window['end'] ?? null)) {
                continue;
            }

            $start = self::time($window['start']);
            $end = self::time($window['end']);
            if ($start === null || $end === null || $start === $end) {
                continue;
            }

            $days = array_map('intval', $window['days']);
            $todaySelected = in_array($now->dayOfWeekIso, $days, true);
            $yesterdaySelected = in_array($now->subDay()->dayOfWeekIso, $days, true);
            $current = $now->format('H:i');

            if ($start < $end && $todaySelected && $current >= $start && $current < $end) {
                return true;
            }
            if ($start > $end && (($todaySelected && $current >= $start) || ($yesterdaySelected && $current < $end))) {
                return true;
            }
        }

        return false;
    }

    /** @return array<string, mixed>|null */
    private static function settings(User $user): ?array
    {
        $raw = DB::table('user_preferences')->where('user_id', $user->id)->where('key', 'admin_dnd')->value('value');
        $settings = is_string($raw) ? json_decode($raw, true) : null;

        return is_array($settings) ? $settings : null;
    }

    private static function timezone(User $user): string
    {
        $timezone = (string) ($user->timezone ?: config('app.timezone', 'UTC'));

        return in_array($timezone, timezone_identifiers_list(), true) ? $timezone : 'UTC';
    }

    private static function time(string $value): ?string
    {
        return preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $value) === 1 ? $value : null;
    }
}
