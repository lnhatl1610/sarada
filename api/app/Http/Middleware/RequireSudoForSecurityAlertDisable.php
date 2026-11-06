<?php

namespace App\Http\Middleware;

use App\Modules\Identity\Actions\ResolveAccessTokenSessionAction;
use App\Modules\Identity\Services\SudoModeService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireSudoForSecurityAlertDisable
{
    public function __construct(
        private readonly ResolveAccessTokenSessionAction $resolveSession,
        private readonly SudoModeService $sudoMode,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('sudo_mode_active', false);
        $value = $request->input('value', []);
        $disablesAlert = $request->input('key') === 'security_alerts'
            && is_array($value)
            && collect(['new_device', 'failed_logins'])->contains(fn (string $key): bool => array_key_exists($key, $value) && ! filter_var($value[$key], FILTER_VALIDATE_BOOLEAN));

        if (! $disablesAlert) {
            return $next($request);
        }

        $resolved = $this->resolveSession->execute($request);
        if (! $resolved || $resolved['audience'] !== 'admin' || ($resolved['api_token'] ?? false)
            || ! $this->sudoMode->expiresAt($request->user(), (int) $resolved['session']->getKey())) {
            return response()->json([
                'message' => 'Xác nhận lại mật khẩu để tắt cảnh báo bảo mật.',
                'code' => 'RECENT_AUTH_REQUIRED',
            ], 403);
        }

        $request->attributes->set('sudo_mode_active', true);

        return $next($request);
    }
}
