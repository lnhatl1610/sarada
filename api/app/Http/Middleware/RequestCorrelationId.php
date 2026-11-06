<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestCorrelationId
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id');
        if (! is_string($requestId) || ! Str::isUuid($requestId)) {
            $requestId = (string) Str::uuid();
        }

        $request->attributes->set('request_id', $requestId);
        $startedAt = hrtime(true);
        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);

        if ($response->getStatusCode() >= 500) {
            Log::error('api.request.failed', [
                'request_id' => $requestId,
                'method' => $request->method(),
                'route' => $request->route()?->getName(),
                'status' => $response->getStatusCode(),
                'duration_ms' => (int) round((hrtime(true) - $startedAt) / 1_000_000),
            ]);
        }

        return $response;
    }
}
