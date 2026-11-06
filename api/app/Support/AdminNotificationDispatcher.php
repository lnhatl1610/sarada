<?php

namespace App\Support;

use App\Models\User;
use App\Notifications\AdminPersonalNotification;
use Illuminate\Support\Facades\DB;

class AdminNotificationDispatcher
{
    public static function send(
        string $event,
        string $permission,
        string $title,
        string $detail,
        string $href,
    ): void {
        $users = User::query()
            ->where('status', 'active')
            ->where(fn ($query) => $query
                ->whereHas('roles.permissions', fn ($permissions) => $permissions->where('permissions.name', $permission))
                ->orWhereHas('roles', fn ($roles) => $roles->where('name', 'super_admin')))
            ->get(['id', 'name', 'email']);
        $preferencesByUser = DB::table('user_preferences')
            ->whereIn('user_id', $users->modelKeys())
            ->where('key', 'admin_notifications')
            ->pluck('value', 'user_id');

        foreach ($users as $user) {
            $preferences = $preferencesByUser->get($user->id);
            $preference = is_string($preferences) ? json_decode($preferences, true) : null;
            $channels = $preference[$event] ?? [];
            $inApp = (bool) ($channels['in_app'] ?? true);
            $email = (bool) ($channels['email'] ?? false);
            if (! $inApp && ! $email) {
                continue;
            }

            $priority = match ($event) {
                'delivery_failed' => 'urgent',
                'low_stock', 'staff_pending' => 'important',
                default => 'normal',
            };
            $user->notify(new AdminPersonalNotification($event, $title, $detail, $href, $priority, $inApp, $email));
        }
    }
}
