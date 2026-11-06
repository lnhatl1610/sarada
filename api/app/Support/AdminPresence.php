<?php

namespace App\Support;

use App\Models\User;

class AdminPresence
{
    public static function effectiveStatus(User $user): string
    {
        $status = $user->presence_until && $user->presence_until->isPast()
            ? 'available'
            : ($user->presence_status === 'invisible' ? 'hidden' : ($user->presence_status ?? 'available'));

        if ($status === 'available' && $user->last_seen_at && $user->last_seen_at->lessThan(now()->subMinutes(15))) {
            return 'away';
        }

        return $status;
    }
}
