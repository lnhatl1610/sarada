<?php

namespace App\Modules\Identity\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class SudoModeService
{
    public function expiresAt(User $user, int $sessionId): ?Carbon
    {
        $timestamp = Cache::get($this->key($user, $sessionId));
        if (! is_numeric($timestamp) || (int) $timestamp <= now()->timestamp) {
            return null;
        }

        return Carbon::createFromTimestamp((int) $timestamp);
    }

    public function activate(User $user, int $sessionId): Carbon
    {
        $expiresAt = now()->addMinutes(10);
        Cache::put($this->key($user, $sessionId), $expiresAt->timestamp, $expiresAt);

        return $expiresAt;
    }

    private function key(User $user, int $sessionId): string
    {
        return 'admin-sudo:'.$user->getKey().':'.$sessionId;
    }
}
