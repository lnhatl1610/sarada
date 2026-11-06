<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();
        $allowed = $user && collect($permissions)->contains(fn (string $permission): bool => $user->hasAdminPermission($permission));
        $token = $user?->currentAccessToken();
        if ($allowed && $token instanceof PersonalAccessToken && $token->token_type === 'api') {
            $allowed = collect($permissions)->contains(fn (string $permission): bool => $token->can($permission));
        }

        if (! $allowed) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện thao tác này.'], 403);
        }

        return $next($request);
    }
}
