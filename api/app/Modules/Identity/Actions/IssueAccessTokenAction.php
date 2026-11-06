<?php

namespace App\Modules\Identity\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use InvalidArgumentException;
use Laravel\Sanctum\NewAccessToken;
use Laravel\Sanctum\PersonalAccessToken;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class IssueAccessTokenAction
{
    public function __construct(private readonly AdminPasswordPolicy $passwordPolicy) {}

    public function execute(User $user, string $audience, ?string $sessionName = null): NewAccessToken
    {
        if (! in_array($audience, ['admin', 'storefront'], true)) {
            throw new InvalidArgumentException('Unsupported token audience.');
        }

        if ($audience === 'admin') {
            $this->passwordPolicy->requireChangeIfExpired($user);
        }

        $expiresAt = now()->addMinutes((int) Config::get('jwt.ttl', 15));
        $session = $user->createToken($sessionName ?? $audience, ['audience:'.$audience], $expiresAt);
        // The database default is not hydrated into the newly created Sanctum model.
        $session->accessToken->forceFill(['token_type' => 'session'])->save();
        $jwt = $this->issueForSession($user, $session->accessToken, $audience);

        return new NewAccessToken($session->accessToken, $jwt);
    }

    public function issueForSession(User $user, PersonalAccessToken $session, string $audience): string
    {
        if (! in_array($audience, ['admin', 'storefront'], true)
            || $session->token_type !== 'session'
            || ! $session->can('audience:'.$audience)
            || $session->tokenable_type !== $user->getMorphClass()
            || (int) $session->tokenable_id !== (int) $user->getKey()
            || ! $session->expires_at?->isFuture()) {
            throw new InvalidArgumentException('The access session is not valid for this user and audience.');
        }

        return JWTAuth::claims(['aud' => $audience, 'sid' => $session->getKey()])->fromUser($user);
    }
}
