<?php

namespace App\Modules\Identity\Actions;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Cookie;

class IssueStorefrontPasskeySessionAction
{
    public function __construct(private readonly IssueAccessTokenAction $issueAccessToken) {}

    /** @return array{access_token:string,cookie:Cookie} */
    public function execute(User $user, Request $request): array
    {
        $access = $this->issueAccessToken->execute($user, 'storefront', 'storefront-passkey');
        $refresh = bin2hex(random_bytes(64));
        $durationDays = max(1, min(90, (int) (Setting::query()->where('key', 'session_duration_days')->value('value') ?? 14)));
        DB::table('refresh_tokens')->insert([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $refresh),
            'audience' => 'storefront',
            'access_token_id' => $access->accessToken->id,
            'device_info' => substr((string) $request->userAgent(), 0, 1000),
            'ip' => $request->ip(),
            'expires_at' => now()->addDays($durationDays),
            'remember_me' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $cookie = cookie(
            'storefront_refresh_token',
            $refresh,
            0,
            '/api/v1/auth',
            Config::get('session.domain'),
            app()->isProduction(),
            true,
            false,
            'lax',
        );
        $user->forceFill(['last_login_at' => now()])->save();

        return ['access_token' => $access->plainTextToken, 'cookie' => $cookie];
    }
}
