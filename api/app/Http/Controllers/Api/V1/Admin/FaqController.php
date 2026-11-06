<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListFaqsRequest;
use App\Http\Requests\Api\V1\Admin\SaveFaqRequest;
use App\Http\Resources\FaqResource;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;

class FaqController extends Controller
{
    public function index(ListFaqsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? 'category_order';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $rows = Faq::query()
            ->when($filters['q'] ?? null, fn ($query, $q) => $query->where(fn ($query) => $query->where('category', 'like', '%'.$q.'%')->orWhere('question', 'like', '%'.$q.'%')->orWhere('answer', 'like', '%'.$q.'%')))
            ->when($filters['category'] ?? null, fn ($query, $category) => $query->where('category', $category))
            ->when(($filters['status'] ?? null) === 'published', fn ($query) => $query->where('is_active', true))
            ->when(($filters['status'] ?? null) === 'draft', fn ($query) => $query->where('is_active', false))
            ->orderBy($field, $descending ? 'desc' : 'asc')->orderBy('category')->orderBy('sort_order')->orderBy('id')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => FaqResource::collection($rows->items()), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }

    public function store(SaveFaqRequest $request): JsonResponse
    {
        return response()->json(['data' => new FaqResource(Faq::query()->create($request->validated()))], 201);
    }

    public function update(SaveFaqRequest $request, int $faq): FaqResource
    {
        $record = Faq::query()->findOrFail($faq);
        $record->update($request->validated());

        return new FaqResource($record->refresh());
    }

    public function destroy(int $faq): JsonResponse
    {
        Faq::query()->findOrFail($faq)->delete();

        return response()->json(['message' => 'Đã xóa câu hỏi thường gặp.']);
    }
}
