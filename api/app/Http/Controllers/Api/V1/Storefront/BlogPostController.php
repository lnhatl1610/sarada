<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListBlogPostsRequest;
use App\Http\Resources\BlogPostCardResource;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class BlogPostController extends Controller
{
    public function index(ListBlogPostsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $posts = BlogPost::query()->publiclyVisible()
            ->when($filters['category'] ?? null, fn (Builder $query, string $category) => $query->where('category_slug', $category))
            ->orderByDesc('published_at')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 12);
        $categories = BlogPost::query()->publiclyVisible()->select('category_name', 'category_slug')->distinct()->orderBy('category_name')->get();

        return response()->json([
            'data' => BlogPostCardResource::collection($posts->items()),
            'meta' => ['current_page' => $posts->currentPage(), 'last_page' => $posts->lastPage(), 'per_page' => $posts->perPage(), 'total' => $posts->total()],
            'categories' => $categories,
        ]);
    }

    public function show(string $slug): BlogPostResource
    {
        $post = BlogPost::query()->publiclyVisible()->with(['products' => fn (Builder $query) => $query->published()->with('images')])->where('slug', $slug)->firstOrFail();
        $post->setRelation('related_posts', BlogPost::query()->publiclyVisible()->where('category_slug', $post->category_slug)->whereKeyNot($post->id)->orderByDesc('published_at')->limit(3)->get());

        return new BlogPostResource($post);
    }
}
