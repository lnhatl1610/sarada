<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListBlogPostsRequest;
use App\Http\Resources\BlogPostCardResource;
use App\Http\Resources\BlogPostResource;
use App\Http\Resources\BlogTagResource;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Modules\Marketing\Actions\RecordBlogPostViewAction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class BlogPostController extends Controller
{
    public function index(ListBlogPostsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $posts = BlogPost::query()->publiclyVisible()->with('tags')
            ->when($filters['category'] ?? null, fn (Builder $query, string $category) => $query->where('category_slug', $category))
            ->when($filters['tag'] ?? null, fn (Builder $query, string $tag) => $query->whereHas('tags', fn (Builder $tags) => $tags->where('slug', $tag)))
            ->when(isset($filters['q']), function (Builder $query) use ($filters): void {
                $term = $filters['q'];
                $pattern = '%'.$term.'%';
                $query->where(fn (Builder $search) => $search
                    ->where('title', 'like', $pattern)
                    ->orWhere('excerpt', 'like', $pattern)
                    ->orWhere('content', 'like', $pattern)
                    ->orWhere('category_name', 'like', $pattern)
                    ->orWhereHas('tags', fn (Builder $tags) => $tags->where('name', 'like', $pattern)));
            })
            ->orderByDesc('published_at')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 12);
        $categories = BlogPost::query()->publiclyVisible()->select('category_name', 'category_slug')->distinct()->orderBy('category_name')->get();
        $tags = BlogTag::query()->whereHas('posts', fn (Builder $query) => $query->publiclyVisible())->orderBy('name')->get();
        $popularPosts = BlogPost::query()->publiclyVisible()->where('view_count', '>', 0)->with('tags')
            ->orderByDesc('view_count')->orderByDesc('published_at')->orderByDesc('id')->limit(3)->get();

        return response()->json([
            'data' => BlogPostCardResource::collection($posts->items()),
            'meta' => ['current_page' => $posts->currentPage(), 'last_page' => $posts->lastPage(), 'per_page' => $posts->perPage(), 'total' => $posts->total()],
            'categories' => $categories,
            'tags' => BlogTagResource::collection($tags),
            'popular_posts' => BlogPostCardResource::collection($popularPosts),
        ]);
    }

    public function show(RecordBlogPostViewAction $recordView, string $slug): BlogPostResource
    {
        $post = BlogPost::query()->publiclyVisible()->with(['products' => fn (Builder $query) => $query->published()->with([
            'images' => fn (Builder $images) => $images->where('is_360_frame', false),
            'variants' => fn (Builder $variants) => $variants->where('is_active', true)->with(['inventory', 'color', 'size']),
        ])])->where('slug', $slug)->firstOrFail();
        $post->load('tags');
        $post->setRelation('related_posts', BlogPost::query()->publiclyVisible()->with('tags')->where('category_slug', $post->category_slug)->whereKeyNot($post->id)->orderByDesc('published_at')->limit(3)->get());
        $post->setRelation('newer_post', BlogPost::query()->publiclyVisible()->with('tags')->where(function (Builder $query) use ($post): void {
            $query->where('published_at', '>', $post->published_at)
                ->orWhere(fn (Builder $tie) => $tie->where('published_at', $post->published_at)->where('id', '>', $post->id));
        })->orderBy('published_at')->orderBy('id')->first());
        $post->setRelation('older_post', BlogPost::query()->publiclyVisible()->with('tags')->where(function (Builder $query) use ($post): void {
            $query->where('published_at', '<', $post->published_at)
                ->orWhere(fn (Builder $tie) => $tie->where('published_at', $post->published_at)->where('id', '<', $post->id));
        })->orderByDesc('published_at')->orderByDesc('id')->first());

        $recordView->execute($post);

        return new BlogPostResource($post);
    }
}
