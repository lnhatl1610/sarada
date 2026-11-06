<?php

namespace App\Modules\Identity\Actions;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class ResolveAccessTokenSessionAction
{
    /** @return array{audience: string, session: PersonalAccessToken, api_token?: bool}|null */
    public function execute(Request $request): ?array
    {
        $user = $request->user();
        if (! $user instanceof User) {
            return null;
        }

        $currentToken = $user->currentAccessToken();
        if ($currentToken instanceof PersonalAccessToken
            && $currentToken->token_type === 'api'
            && $currentToken->tokenable_type === $user->getMorphClass()
            && (int) $currentToken->tokenable_id === (int) $user->getKey()
            && ($currentToken->expires_at === null || $currentToken->expires_at->isFuture())) {
            return ['audience' => 'admin', 'session' => $currentToken, 'api_token' => true];
        }

        $bearerToken = $request->bearerToken();
        if (! $bearerToken) {
            return null;
        }

        try {
            $payload = JWTAuth::setToken($bearerToken)->getPayload();
        } catch (JWTException) {
            JWTAuth::unsetToken();

            return null;
        }
        JWTAuth::unsetToken();

        $audienceClaim = $payload->get('aud');
        $audience = is_array($audienceClaim) && count($audienceClaim) === 1 ? $audienceClaim[0] : $audienceClaim;
        $sessionId = $payload->get('sid');
        if (! in_array($audience, ['admin', 'storefront'], true) || ! is_numeric($sessionId)) {
            return null;
        }

        $session = PersonalAccessToken::query()
            ->whereKey((int) $sessionId)
            ->where('tokenable_type', $user->getMorphClass())
            ->where('tokenable_id', $user->getKey())
            ->where('token_type', 'session')
            ->whereNotNull('expires_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $session) {
            return null;
        }

        $user->withAccessToken($session);

        return ['audience' => $audience, 'session' => $session];
    }
}
