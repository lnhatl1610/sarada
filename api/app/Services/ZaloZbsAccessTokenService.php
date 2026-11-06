<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use RuntimeException;

final class ZaloZbsAccessTokenService
{
    private const CACHE_KEY = 'zalo_zbs_access_token';

    public function get(): string
    {
        $cached = Cache::get(self::CACHE_KEY);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        return Cache::lock(self::CACHE_KEY.'_refresh_lock', 30)->block(10, function (): string {
            $cached = Cache::get(self::CACHE_KEY);
            if (is_string($cached) && $cached !== '') {
                return $cached;
            }

            return $this->refresh();
        });
    }

    private function refresh(): string
    {
        $appId = (string) config('services.zalo_zbs.app_id');
        $secretKey = (string) config('services.zalo_zbs.secret_key');
        $refreshToken = $this->storedRefreshToken();
        if ($appId === '' || $secretKey === '' || $refreshToken === '') {
            throw new RuntimeException('Zalo ZBS credentials are not configured.');
        }

        $response = Http::asForm()
            ->withHeaders(['secret_key' => $secretKey])
            ->timeout(15)
            ->post('https://oauth.zaloapp.com/v4/oa/access_token', [
                'app_id' => $appId,
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken,
            ]);

        $data = $response->json();
        $accessToken = is_array($data) ? ($data['access_token'] ?? null) : null;
        $rotatedRefreshToken = is_array($data) ? ($data['refresh_token'] ?? null) : null;
        if (! $response->successful() || ! is_string($accessToken) || $accessToken === ''
            || ! is_string($rotatedRefreshToken) || $rotatedRefreshToken === '') {
            throw new RuntimeException('Zalo ZBS access token refresh failed (HTTP '.$response->status().').');
        }

        Setting::query()->updateOrCreate(
            ['key' => 'zalo_zbs_refresh_token'],
            ['value' => Crypt::encryptString($rotatedRefreshToken)],
        );

        $expiresIn = max(60, (int) ($data['expires_in'] ?? 86400) - 120);
        Cache::put(self::CACHE_KEY, $accessToken, now()->addSeconds($expiresIn));

        return $accessToken;
    }

    private function storedRefreshToken(): string
    {
        $stored = Setting::query()->whereKey('zalo_zbs_refresh_token')->value('value');
        if (is_string($stored) && $stored !== '') {
            try {
                return Crypt::decryptString($stored);
            } catch (\Throwable) {
                throw new RuntimeException('Stored Zalo ZBS refresh token cannot be decrypted.');
            }
        }

        return (string) config('services.zalo_zbs.refresh_token');
    }
}
