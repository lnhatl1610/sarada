<?php

namespace App\Http\Middleware;

use App\Modules\Identity\Actions\ResolveAccessTokenSessionAction;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAccountAudience
{
    public function __construct(private readonly ResolveAccessTokenSessionAction $resolveSession) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $resolved = $this->resolveSession->execute($request);
        if (! $resolved || ! $resolved['session']->can('audience:'.$resolved['audience'])) {
            return response()->json(['message' => 'Không có quyền truy cập tài khoản này.'], 403);
        }
        if ($user->status !== 'active') {
            return response()->json(['message' => 'Tài khoản đã bị khóa.'], 403);
        }

        if ($resolved['audience'] === 'admin' && $user->must_change_password) {
            $uri = '/'.ltrim($request->path(), '/');
            $allowed = ($request->isMethod('GET') && in_array($uri, ['/api/v1/account', '/api/v1/account/sessions', '/api/v1/account/sudo'], true))
                || ($request->isMethod('POST') && in_array($uri, ['/api/v1/account/sudo'], true))
                || ($request->isMethod('PUT') && $uri === '/api/v1/account/password');
            if (! $allowed) {
                return response()->json(['message' => 'Bạn cần đổi mật khẩu trước khi tiếp tục.', 'code' => 'ADMIN_PASSWORD_CHANGE_REQUIRED'], 423);
            }
        }

        return $next($request);
    }
}
