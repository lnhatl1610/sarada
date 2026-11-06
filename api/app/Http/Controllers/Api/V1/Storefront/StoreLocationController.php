<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListStoreLocationsRequest;
use App\Http\Resources\StoreLocationResource;
use App\Models\StoreLocation;
use Illuminate\Http\JsonResponse;

class StoreLocationController extends Controller
{
    public function index(ListStoreLocationsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $locations = StoreLocation::query()
            ->where('is_active', true)
            ->when($filters['province_code'] ?? null, fn ($query, $value) => $query->where('province_code', $value))
            ->orderBy('province_name')->orderBy('sort_order')->orderBy('name')
            ->paginate($filters['per_page'] ?? 30);

        return response()->json([
            'data' => StoreLocationResource::collection($locations->items()),
            'meta' => [
                'current_page' => $locations->currentPage(),
                'last_page' => $locations->lastPage(),
                'per_page' => $locations->perPage(),
                'total' => $locations->total(),
            ],
        ]);
    }
}
