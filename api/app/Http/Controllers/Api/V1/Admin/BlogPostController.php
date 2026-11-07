<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListBlogPostsRequest;
use App\Http\Requests\Api\V1\Admin\SaveBlogPostRequest;
use App\Http\Resources\AdminBlogPostSummaryResource;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use App\Modules\Marketing\Actions\ManageBlogPostAction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class BlogPostController extends Controller
{
    public function index(ListBlogPostsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $posts = BlogPost::query()
            ->with('tags')
            ->when($filters['q'] ?? null, fn (Builder $query, string $term) => $query->where(fn (Builder $where) => $where->where('title', 'like', '%'.$term.'%')->orWhere('slug', 'like', '%'.$term.'%')))
            ->when(($filters['status'] ?? null) === 'published', fn (Builder $query) => $query->where('is_published', true))
            ->when(($filters['status'] ?? null) === 'draft', fn (Builder $query) => $query->where('is_published', false))
            ->orderByDesc('updated_at')->orderByDesc('id')->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => AdminBlogPostSummaryResource::collection($posts->items()), 'meta' => [
            'current_page' => $posts->currentPage(), 'last_page' => $posts->lastPage(), 'per_page' => $posts->perPage(), 'total' => $posts->total(),
        ]]);
    }

    public function show(int $post): BlogPostResource
    {
        return new BlogPostResource(BlogPost::query()->with(['products', 'tags'])->findOrFail($post));
    }

    public function store(SaveBlogPostRequest $request, ManageBlogPostAction $action): JsonResponse
    {
        return response()->json(['data' => new BlogPostResource($action->save($request->validated()))], 201);
    }

    public function update(SaveBlogPostRequest $request, int $post, ManageBlogPostAction $action): BlogPostResource
    {
        return new BlogPostResource($action->save($request->validated(), BlogPost::query()->findOrFail($post)));
    }

    public function destroy(int $post): JsonResponse
    {
        BlogPost::query()->findOrFail($post)->delete();

        return response()->json(['message' => 'Đã xóa bài viết.']);
    }
}
