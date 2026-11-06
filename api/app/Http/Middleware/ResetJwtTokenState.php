<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class ResetJwtTokenState
{
    public function handle(Request $request, Closure $next): Response
    {
        app('tymon.jwt')->unsetToken();
        JWTAuth::unsetToken();

        return $next($request);
    }
}
