<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListSearchContentSuggestionsRequest;
use App\Http\Requests\Api\V1\Storefront\ListStorefrontPageSearchRequest;
use App\Http\Requests\Api\V1\Storefront\TrackStorefrontSearchTermRequest;
use App\Http\Resources\SearchContentSuggestionResource;
use App\Http\Resources\TrendingSearchTermResource;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    public function contentSuggestions(ListSearchContentSuggestionsRequest $request): AnonymousResourceCollection
    {
        $query = trim($request->validated('q'));
        $like = '%'.$query.'%';

        return SearchContentSuggestionResource::collection($this->matchingContent($like)->limit(5)->get());
    }

    public function searchPages(ListStorefrontPageSearchRequest $request): AnonymousResourceCollection
    {
        $data = $request->validated();
        $query = trim($data['q']);
        $like = '%'.$query.'%';

        $results = $this->matchingContent($like)->paginate(min(20, max(1, (int) ($data['per_page'] ?? 20))))->withQueryString();

        return SearchContentSuggestionResource::collection($results);
    }

    private function matchingContent(string $like): QueryBuilder
    {
        $pages = DB::table('pages')
            ->selectRaw("id, title, slug, meta_description, content, updated_at as sort_at, 'page' as type, CONCAT('/pages/', slug) as href")
            ->where('is_published', true)
            ->where(fn ($search) => $search->where('title', 'like', $like)->orWhere('slug', 'like', $like)->orWhere('meta_description', 'like', $like)->orWhere('content', 'like', $like));
        $articles = DB::table('blog_posts')
            ->selectRaw("id, title, slug, meta_description, excerpt as content, published_at as sort_at, 'article' as type, CONCAT('/blog/', slug) as href")
            ->where('is_published', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(fn ($search) => $search->where('title', 'like', $like)->orWhere('slug', 'like', $like)->orWhere('meta_description', 'like', $like)->orWhere('excerpt', 'like', $like)->orWhere('content', 'like', $like));

        return DB::query()->fromSub($pages->unionAll($articles), 'content_results')
            ->orderByRaw('CASE WHEN title LIKE ? THEN 0 ELSE 1 END', [$like])
            ->orderByDesc('sort_at')
            ->orderBy('type')
            ->orderBy('id');
    }

    public function trending(): AnonymousResourceCollection
    {
        $from = now()->subDays(6)->toDateString();
        $terms = DB::table('storefront_search_terms')
            ->select('term_hash', 'term')
            ->selectRaw('SUM(search_count) as search_count')
            ->where('search_date', '>=', $from)
            ->groupBy('term_hash', 'term')
            ->havingRaw('SUM(search_count) >= ?', [3])
            ->orderByDesc('search_count')
            ->orderBy('term')
            ->limit(8)
            ->get();

        return TrendingSearchTermResource::collection($terms);
    }

    public function trackTerm(TrackStorefrontSearchTermRequest $request): JsonResponse
    {
        $term = mb_strtolower($request->validated('q'), 'UTF-8');
        $tracked = false;

        if ($this->isTrackable($term) && $this->matchesPublishedProduct($term)) {
            $now = now();
            $searchDate = $now->toDateString();
            $termHash = hash('sha256', $term);

            DB::table('storefront_search_terms')->insertOrIgnore([
                'search_date' => $searchDate,
                'term_hash' => $termHash,
                'term' => $term,
                'search_count' => 0,
                'last_searched_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            DB::table('storefront_search_terms')
                ->where('search_date', $searchDate)
                ->where('term_hash', $termHash)
                ->increment('search_count', 1, ['last_searched_at' => $now, 'updated_at' => $now]);
            $tracked = true;
        }

        return response()->json(['data' => ['tracked' => $tracked]], 202);
    }

    private function isTrackable(string $term): bool
    {
        if (! preg_match('/\p{L}/u', $term) || strpbrk($term, '%_') !== false) {
            return false;
        }

        if (filter_var($term, FILTER_VALIDATE_EMAIL) !== false
            || preg_match('/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i', $term)
            || preg_match('/(?:https?:\/\/|www\.)/i', $term)) {
            return false;
        }

        $digits = preg_replace('/\D/', '', $term) ?? '';

        return strlen($digits) < 7 && ! preg_match('/(?:^|\s)\+?\d[\d\s().-]{6,}\d(?:$|\s)/u', $term);
    }

    private function matchesPublishedProduct(string $term): bool
    {
        $like = '%'.$term.'%';

        return Product::query()->published()->where(function (Builder $search) use ($like): void {
            $search->where('name', 'like', $like)
                ->orWhere('sku', 'like', $like)
                ->orWhereHas('brand', fn (Builder $brand) => $brand->where('name', 'like', $like)->orWhere('slug', 'like', $like))
                ->orWhereHas('category', fn (Builder $category) => $category->where('name', 'like', $like)->orWhere('slug', 'like', $like))
                ->orWhereHas('variants', fn (Builder $variant) => $variant->where('is_active', true)->where(fn (Builder $variantSearch) => $variantSearch
                    ->where('sku', 'like', $like)
                    ->orWhereHas('color', fn (Builder $color) => $color->where('value', 'like', $like))));
        })->exists();
    }
}
