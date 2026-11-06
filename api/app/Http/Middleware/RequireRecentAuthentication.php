<?php

namespace App\Http\Middleware;

use App\Modules\Identity\Actions\ResolveAccessTokenSessionAction;
use App\Modules\Identity\Services\SudoModeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRecentAuthentication
{
    public function __construct(
        private readonly ResolveAccessTokenSessionAction $resolveSession,
        private readonly SudoModeService $sudoMode,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $resolved = $this->resolveSession->execute($request);
        if ($resolved && $resolved['audience'] === 'storefront') {
            $request->attributes->set('sudo_mode_active', false);

            return $next($request);
        }

        if (! $resolved || $resolved['audience'] !== 'admin' || ($resolved['api_token'] ?? false)
            || ! $this->sudoMode->expiresAt($request->user(), (int) $resolved['session']->getKey())) {
            return response()->json([
                'message' => 'Xác nhận lại mật khẩu để tiếp tục.',
                'code' => 'RECENT_AUTH_REQUIRED',
            ], 403);
        }

        $request->attributes->set('sudo_mode_active', true);

        return $next($request);
    }
}
