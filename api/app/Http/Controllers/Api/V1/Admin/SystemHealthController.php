<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Support\AdminSystemHealth;
use Illuminate\Http\JsonResponse;

class SystemHealthController extends Controller
{
    public function __invoke(AdminSystemHealth $health): JsonResponse
    {
        return response()->json(['data' => $health->report()]);
    }
}
