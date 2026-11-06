<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;

class AppInfoController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json(['data' => [
            'app_version' => (string) config('app.version', '0.0.0'),
            'api_version' => 'v1',
            'commit' => Str::limit((string) config('app.commit', ''), 12, ''),
            'environment' => App::environment(),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'timezone' => config('app.timezone'),
            'request_id' => $request->attributes->get('request_id'),
        ]]);
    }
}
