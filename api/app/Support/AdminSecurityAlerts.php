<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\AdminPersonalNotification;
use Illuminate\Support\Facades\DB;

class AdminSecurityAlerts
{
    public static function send(User $user, string $event, string $title, string $detail, bool $mandatory = false, bool $email = true): void
    {
        if (! $user->isAdmin()) {
            return;
        }

        if (! $mandatory) {
            $preferences = DB::table('user_preferences')->where('user_id', $user->id)->where('key', 'security_alerts')->value('value');
            $enabled = json_decode((string) $preferences, true);
            if (is_array($enabled) && ($enabled[$event] ?? true) !== true) {
                return;
            }
        }

        $user->notify(new AdminPersonalNotification(
            'security_'.$event,
            $title,
            $detail,
            '/settings/account/security',
            'urgent',
            true,
            $email,
        ));
    }
}
