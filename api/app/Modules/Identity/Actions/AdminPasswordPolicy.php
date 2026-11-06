<?php

namespace App\Modules\Identity\Actions;

use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;

class AdminPasswordPolicy
{
    public function expiresAt(User $user): ?CarbonImmutable
    {
        $maxAgeDays = max(0, (int) Setting::query()->where('key', 'security.password_max_age_days')->value('value'));
        if ($maxAgeDays === 0) {
            return null;
        }

        $passwordSetAt = $user->password_changed_at ?? $user->created_at;
        if ($passwordSetAt === null) {
            return CarbonImmutable::now()->subSecond();
        }

        return CarbonImmutable::parse($passwordSetAt)->addDays($maxAgeDays);
    }

    public function requireChangeIfExpired(User $user): void
    {
        $expiresAt = $this->expiresAt($user);
        if ($expiresAt?->isPast() && ! $user->must_change_password) {
            $user->forceFill(['must_change_password' => true])->save();
        }
    }
}
