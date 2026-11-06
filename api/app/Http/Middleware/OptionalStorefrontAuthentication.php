<?php

namespace App\Http\Middleware;

use App\Modules\Identity\Actions\ResolveAccessTokenSessionAction;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Symfony\Component\HttpFoundation\Response;

class OptionalStorefrontAuthentication
{
    public function __construct(private readonly ResolveAccessTokenSessionAction $resolveSession) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->bearerToken()) {
            return $next($request);
        }

        $guard = Auth::guard('api');
        $guard->setRequest($request);
        $guard->forgetUser();
        try {
            $user = $guard->user();
        } catch (AuthenticationException|JWTException) {
            $user = null;
        }

        if (! $user) {
            return response()->json(['message' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'], 401);
        }

        $request->setUserResolver(fn (?string $guard = null) => $guard ? Auth::guard($guard)->user() : $user);
        $resolved = $this->resolveSession->execute($request);
        if (! $resolved) {
            return response()->json(['message' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'], 401);
        }
        if ($resolved['audience'] !== 'storefront' || ! $resolved['session']->can('audience:storefront') || ($resolved['api_token'] ?? false)) {
            return response()->json(['message' => 'Không có quyền truy cập ứng dụng này.'], 403);
        }
        if ($user->status !== 'active') {
            return response()->json(['message' => 'Tài khoản đã bị khóa.'], 403);
        }

        return $next($request);
    }
}
