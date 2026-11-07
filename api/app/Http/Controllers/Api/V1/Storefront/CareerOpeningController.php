<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListCareerOpeningsRequest;
use App\Http\Resources\CareerOpeningResource;
use App\Models\CareerOpening;
use Illuminate\Http\JsonResponse;

class CareerOpeningController extends Controller
{
    public function index(ListCareerOpeningsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $active = CareerOpening::query()->where('is_active', true);
        $departments = (clone $active)->select('department')->distinct()->orderBy('department')->pluck('department')->values();
        $locations = (clone $active)->select('location')->distinct()->orderBy('location')->pluck('location')->values();
        $rows = $active
            ->when($filters['department'] ?? null, fn ($query, $value) => $query->where('department', $value))
            ->when($filters['location'] ?? null, fn ($query, $value) => $query->where('location', $value))
            ->orderBy('sort_order')->orderBy('title')->orderBy('id')
            ->paginate($filters['per_page'] ?? 24);

        return response()->json([
            'data' => CareerOpeningResource::collection($rows->items()),
            'filter_options' => ['departments' => $departments, 'locations' => $locations],
            'meta' => ['current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total()],
        ]);
    }
}
