<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListPagesRequest;
use App\Http\Requests\Api\V1\Admin\SavePageRequest;
use App\Http\Resources\PageResource;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function index(ListPagesRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? 'title';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $rows = Page::query()
            ->when($filters['q'] ?? null, fn ($query, $q) => $query->where(fn ($query) => $query->where('title', 'like', '%'.$q.'%')->orWhere('slug', 'like', '%'.$q.'%')))
            ->when(($filters['status'] ?? null) === 'published', fn ($query) => $query->where('is_published', true))
            ->when(($filters['status'] ?? null) === 'draft', fn ($query) => $query->where('is_published', false))
            ->orderBy($field, $descending ? 'desc' : 'asc')->orderBy('id')->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => PageResource::collection($rows->items()), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }

    public function show(int $page): PageResource
    {
        return new PageResource(Page::query()->findOrFail($page));
    }

    public function store(SavePageRequest $request): JsonResponse
    {
        return response()->json(['data' => new PageResource(Page::query()->create($request->validated()))], 201);
    }

    public function update(SavePageRequest $request, int $page): PageResource
    {
        $record = Page::query()->findOrFail($page);
        $record->update($request->validated());

        return new PageResource($record->refresh());
    }

    public function destroy(int $page): JsonResponse
    {
        Page::query()->findOrFail($page)->delete();

        return response()->json(['message' => 'Đã xóa trang nội dung.']);
    }
}
