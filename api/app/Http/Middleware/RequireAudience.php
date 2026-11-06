<?php

namespace App\Http\Middleware;

use App\Modules\Identity\Actions\ResolveAccessTokenSessionAction;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAudience
{
    public function __construct(private readonly ResolveAccessTokenSessionAction $resolveSession) {}

    public function handle(Request $request, Closure $next, string $audience): Response
    {
        $resolved = $this->resolveSession->execute($request);

        if (! $resolved || $resolved['audience'] !== $audience || ! $resolved['session']->can('audience:'.$audience)
            || (($resolved['api_token'] ?? false) && $audience !== 'admin')) {
            return response()->json(['message' => 'Không có quyền truy cập ứng dụng này.'], 403);
        }

        if ($resolved['api_token'] ?? false) {
            $hasPermissionGate = collect($request->route()?->gatherMiddleware() ?? [])
                ->contains(fn (string $middleware): bool => str_starts_with($middleware, 'permission:'));
            if (! $hasPermissionGate) {
                return response()->json(['message' => 'API token chỉ truy cập route có khai báo quyền cụ thể.'], 403);
            }
            $resolved['session']->forceFill(['last_used_ip' => $request->ip()])->save();
        }

        if ($request->user()->status !== 'active') {
            return response()->json(['message' => 'Tài khoản đã bị khóa.'], 403);
        }

        if ($audience === 'admin' && $request->user()->must_change_password) {
            $uri = '/'.ltrim($request->path(), '/');
            $allowed = ($request->isMethod('GET') && in_array($uri, ['/api/v1/admin/auth/me', '/api/v1/account', '/api/v1/account/sessions', '/api/v1/account/sudo'], true))
                || ($request->isMethod('POST') && in_array($uri, ['/api/v1/admin/auth/logout', '/api/v1/admin/auth/logout-all', '/api/v1/admin/auth/password', '/api/v1/account/sudo'], true))
                || ($request->isMethod('PUT') && $uri === '/api/v1/account/password');
            if (! $allowed) {
                return response()->json(['message' => 'Bạn cần đổi mật khẩu trước khi tiếp tục.', 'code' => 'ADMIN_PASSWORD_CHANGE_REQUIRED'], 423);
            }
        }

        return $next($request);
    }
}
