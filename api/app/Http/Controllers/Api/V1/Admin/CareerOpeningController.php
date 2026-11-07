<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListCareerOpeningsRequest;
use App\Http\Requests\Api\V1\Admin\SaveCareerOpeningRequest;
use App\Http\Resources\CareerOpeningResource;
use App\Models\CareerOpening;
use Illuminate\Http\JsonResponse;

class CareerOpeningController extends Controller
{
    public function index(ListCareerOpeningsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $rows = CareerOpening::query()
            ->when($filters['q'] ?? null, fn ($query, $value) => $query->where(fn ($query) => $query
                ->where('title', 'like', '%'.$value.'%')
                ->orWhere('department', 'like', '%'.$value.'%')
                ->orWhere('location', 'like', '%'.$value.'%')))
            ->when(($filters['status'] ?? null) === 'published', fn ($query) => $query->where('is_active', true))
            ->when(($filters['status'] ?? null) === 'draft', fn ($query) => $query->where('is_active', false))
            ->orderBy('sort_order')->orderBy('title')->orderBy('id')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => CareerOpeningResource::collection($rows->items()), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }

    public function store(SaveCareerOpeningRequest $request): JsonResponse
    {
        return response()->json(['data' => new CareerOpeningResource(CareerOpening::query()->create($request->validated()))], 201);
    }

    public function update(SaveCareerOpeningRequest $request, int $opening): CareerOpeningResource
    {
        $record = CareerOpening::query()->findOrFail($opening);
        $record->update($request->validated());

        return new CareerOpeningResource($record->refresh());
    }

    public function destroy(int $opening): JsonResponse
    {
        CareerOpening::query()->findOrFail($opening)->delete();

        return response()->json(['message' => 'Đã xóa vị trí tuyển dụng.']);
    }
}
