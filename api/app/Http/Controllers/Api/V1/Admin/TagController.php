<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListTagsRequest;
use App\Http\Requests\Api\V1\Admin\MergeTagsRequest;
use App\Http\Requests\Api\V1\Admin\SaveTagRequest;
use App\Models\Tag;
use App\Modules\Catalog\Actions\MergeTagsAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TagController extends Controller
{
    public function index(ListTagsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? 'name';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumn = $field === 'products_count' ? 'products_count' : $field;
        $rows = Tag::query()->withCount('products')
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search->where('name', 'like', '%'.$filters['q'].'%')->orWhere('slug', 'like', '%'.$filters['q'].'%')))
            ->orderBy($sortColumn, $descending ? 'desc' : 'asc')->orderBy('id')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }

    public function store(SaveTagRequest $request): JsonResponse
    {
        $tag = Tag::query()->create($this->payload($request));

        return response()->json(['data' => $tag->loadCount('products')], 201);
    }

    public function update(SaveTagRequest $request, int $tag): JsonResponse
    {
        $record = Tag::query()->findOrFail($tag);
        $record->update($this->payload($request, $record));

        return response()->json(['data' => $record->fresh()->loadCount('products')]);
    }

    public function merge(MergeTagsRequest $request, MergeTagsAction $action): JsonResponse
    {
        $data = $request->validated();
        $tag = $action->execute((int) $data['target_id'], array_map('intval', $data['source_ids']));

        return response()->json(['data' => $tag, 'message' => 'Đã gộp các thẻ vào thẻ đích.']);
    }

    /** @return array{name: string, slug: string} */
    private function payload(SaveTagRequest $request, ?Tag $tag = null): array
    {
        $data = $request->validated();
        $baseSlug = Str::slug(($data['slug'] ?? '') ?: $data['name']);
        if ($baseSlug === '') {
            throw ValidationException::withMessages(['slug' => 'Không thể tạo slug từ tên thẻ này.']);
        }
        $slug = $baseSlug;
        $suffix = 2;
        while (Tag::query()->where('slug', $slug)->when($tag, fn ($query) => $query->where('id', '!=', $tag->id))->exists()) {
            $slug = Str::limit($baseSlug, 76, '').'-'.$suffix++;
        }

        return ['name' => trim($data['name']), 'slug' => $slug];
    }
}
