<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\GetStorefrontCollectionRequest;
use App\Http\Requests\Api\V1\Storefront\ListStorefrontBannersRequest;
use App\Http\Requests\Api\V1\Storefront\ListStorefrontCollectionsRequest;
use App\Http\Requests\Api\V1\Storefront\ListStorefrontProductsRequest;
use App\Http\Resources\ProductResource;
use App\Http\Resources\StorefrontBannerResource;
use App\Http\Resources\StorefrontCategoryResource;
use App\Http\Resources\StorefrontCollectionResource;
use App\Models\AttributeValue;
use App\Models\Banner;
use App\Models\Brand;
use App\Models\Collection;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Modules\Identity\Actions\GetPersonalizedProductRecommendationsAction;
use App\Support\ActiveCategoryTree;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    public function banners(ListStorefrontBannersRequest $request): AnonymousResourceCollection
    {
        $now = now();
        $banners = Banner::query()
            ->where('is_active', true)
            ->where(fn (Builder $query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn (Builder $query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $now))
            ->when($request->validated('placement'), fn (Builder $query, string $placement) => $query->where('position', $placement))
            ->orderBy('position')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return StorefrontBannerResource::collection($banners);
    }

    public function collections(ListStorefrontCollectionsRequest $request): AnonymousResourceCollection
    {
        $now = now();
        $collections = Collection::query()
            ->where('is_active', true)
            ->where(fn (Builder $query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn (Builder $query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $now))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($request->integer('per_page', 12));

        return StorefrontCollectionResource::collection($collections);
    }

    public function collection(GetStorefrontCollectionRequest $request, string $slug): StorefrontCollectionResource
    {
        $now = now();
        $query = Collection::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->where(fn (Builder $query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn (Builder $query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $now));

        if ($request->boolean('include_products', true)) {
            $query->with(['products' => function ($products) use ($request): void {
                $products->where('status', 'active')->with([
                    'category', 'brand', 'images',
                    'variants' => fn ($variants) => $variants->where('is_active', true)->with(['color', 'size', 'inventory']),
                ]);
                if ($request->boolean('include_lookbook_products')) {
                    $products->whereNotNull('collection_product.lookbook_x')->whereNotNull('collection_product.lookbook_y');
                }
            }]);
        }

        $collection = $query->firstOrFail();

        return new StorefrontCollectionResource($collection);
    }

    public function categories(): AnonymousResourceCollection
    {
        $roots = ActiveCategoryTree::roots();
        $productCounts = DB::table('products')->where('status', 'active')->whereNull('deleted_at')
            ->select('category_id')->selectRaw('COUNT(*) as product_count')->groupBy('category_id')->pluck('product_count', 'category_id');
        $assignCount = function ($category) use (&$assignCount, $productCounts): int {
            $count = (int) $productCounts->get($category->id, 0);
            foreach ($category->children as $child) {
                $count += $assignCount($child);
            }
            $category->setAttribute('product_count', $count);

            return $count;
        };
        foreach ($roots as $root) {
            $assignCount($root);
        }

        return StorefrontCategoryResource::collection($roots);
    }

    public function filterOptions(): JsonResponse
    {
        $brands = Brand::query()
            ->whereHas('products', fn (Builder $query) => $query->published())
            ->orderBy('name')
            ->orderBy('id')
            ->get(['name', 'slug', 'logo', 'banner', 'banner_alt', 'description', 'meta_title', 'meta_description']);

        $sizeValueIds = ProductVariant::query()
            ->where('is_active', true)
            ->whereNotNull('size_value_id')
            ->whereHas('product', fn (Builder $query) => $query->published())
            ->select('size_value_id')
            ->distinct();
        $colorValueIds = ProductVariant::query()
            ->where('is_active', true)
            ->whereNotNull('color_value_id')
            ->whereHas('product', fn (Builder $query) => $query->published())
            ->select('color_value_id')
            ->distinct();

        $sizes = AttributeValue::query()
            ->whereIn('id', $sizeValueIds)
            ->whereHas('attribute', fn (Builder $query) => $query->where('type', 'size'))
            ->orderBy('sort_order')
            ->orderBy('value')
            ->pluck('value')
            ->values();
        $colors = AttributeValue::query()
            ->whereIn('id', $colorValueIds)
            ->whereHas('attribute', fn (Builder $query) => $query->where('type', 'color'))
            ->orderBy('sort_order')
            ->orderBy('value')
            ->get(['value', 'color_hex'])
            ->values();

        $materials = Product::query()
            ->published()
            ->whereNotNull('material')
            ->whereRaw("TRIM(material) <> ''")
            ->selectRaw('DISTINCT TRIM(material) AS material')
            ->orderBy('material')
            ->pluck('material')
            ->values();

        $fits = Product::query()
            ->published()
            ->whereNotNull('fit')
            ->whereRaw("TRIM(fit) <> ''")
            ->selectRaw('DISTINCT TRIM(fit) AS fit')
            ->orderBy('fit')
            ->pluck('fit')
            ->values();

        $brandCounts = DB::table('brands')->join('products', 'products.brand_id', '=', 'brands.id')
            ->where('products.status', 'active')->whereNull('products.deleted_at')
            ->groupBy('brands.slug')->select('brands.slug')->selectRaw('COUNT(DISTINCT products.id) as product_count')
            ->pluck('product_count', 'slug')->map(fn ($count): int => (int) $count);
        $sizeCounts = DB::table('attribute_values')->join('attributes', 'attributes.id', '=', 'attribute_values.attribute_id')
            ->join('product_variants', 'product_variants.size_value_id', '=', 'attribute_values.id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('attributes.type', 'size')->where('product_variants.is_active', true)
            ->where('products.status', 'active')->whereNull('products.deleted_at')
            ->groupBy('attribute_values.value')->select('attribute_values.value')
            ->selectRaw('COUNT(DISTINCT products.id) as product_count')->pluck('product_count', 'value')->map(fn ($count): int => (int) $count);
        $colorCounts = DB::table('attribute_values')->join('attributes', 'attributes.id', '=', 'attribute_values.attribute_id')
            ->join('product_variants', 'product_variants.color_value_id', '=', 'attribute_values.id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('attributes.type', 'color')->where('product_variants.is_active', true)
            ->where('products.status', 'active')->whereNull('products.deleted_at')
            ->groupBy('attribute_values.value')->select('attribute_values.value')
            ->selectRaw('COUNT(DISTINCT products.id) as product_count')->pluck('product_count', 'value')->map(fn ($count): int => (int) $count);
        $materialCounts = Product::query()->published()->whereNotNull('material')->whereRaw("TRIM(material) <> ''")
            ->selectRaw('TRIM(material) as material')->selectRaw('COUNT(*) as product_count')->groupByRaw('TRIM(material)')
            ->pluck('product_count', 'material')->map(fn ($count): int => (int) $count);
        $fitCounts = Product::query()->published()->whereNotNull('fit')->whereRaw("TRIM(fit) <> ''")
            ->selectRaw('TRIM(fit) as fit')->selectRaw('COUNT(*) as product_count')->groupByRaw('TRIM(fit)')
            ->pluck('product_count', 'fit')->map(fn ($count): int => (int) $count);

        $effectivePriceExpression = 'CASE WHEN product_variants.compare_at_price IS NOT NULL AND product_variants.compare_at_price > product_variants.price THEN CASE WHEN (products.sale_starts_at IS NULL OR products.sale_starts_at <= ?) AND (products.sale_ends_at IS NULL OR products.sale_ends_at >= ?) THEN product_variants.price ELSE product_variants.compare_at_price END ELSE product_variants.price END';
        $pricingAt = now()->toDateTimeString();
        $priceRange = DB::table('product_variants')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('products.status', 'active')
            ->whereNull('products.deleted_at')
            ->where('product_variants.is_active', true)
            ->selectRaw("MIN({$effectivePriceExpression}) AS minimum_price, MAX({$effectivePriceExpression}) AS maximum_price", [$pricingAt, $pricingAt, $pricingAt, $pricingAt])
            ->first();

        return response()->json(['data' => [
            'brands' => $brands->map(fn (Brand $brand): array => [
                'name' => $brand->name,
                'slug' => $brand->slug,
                'logo' => $brand->logo,
                'banner' => $brand->banner,
                'banner_alt' => $brand->banner_alt ?: 'Bìa thương hiệu '.$brand->name,
                'description' => $brand->description,
                'meta_title' => $brand->meta_title,
                'meta_description' => $brand->meta_description,
                'product_count' => (int) $brandCounts->get($brand->slug, 0),
            ])->values(),
            'sizes' => $sizes,
            'colors' => $colors->pluck('value')->values(),
            'color_swatches' => $colors->map(fn (AttributeValue $color): array => [
                'value' => $color->value,
                'color_hex' => $color->color_hex,
            ])->values(),
            'materials' => $materials,
            'fits' => $fits,
            'facet_counts' => [
                'brands' => $brandCounts,
                'sizes' => $sizeCounts,
                'colors' => $colorCounts,
                'materials' => $materialCounts,
                'fits' => $fitCounts,
            ],
            'price_range' => [
                'min' => $priceRange?->minimum_price === null ? null : (int) $priceRange->minimum_price,
                'max' => $priceRange?->maximum_price === null ? null : (int) $priceRange->maximum_price,
            ],
        ]])->header('Cache-Control', 'public, max-age=300');
    }

    public function products(ListStorefrontProductsRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $fuzzyMatches = [];

        $query = Product::query()
            ->published()
            ->with(['category', 'brand', 'images', 'variants' => fn ($variants) => $variants->where('is_active', true)->with(['color', 'size', 'inventory'])]);
        $this->withEffectiveVariantPrices($query);
        $query
            ->when(isset($filters['category']), function (Builder $builder) use ($filters): void {
                if ($filters['category'] === 'hang-moi') {
                    $builder->where('is_new', true);

                    return;
                }

                $categoryIds = ActiveCategoryTree::idsForSlug($filters['category']);
                $builder->whereHas('category', fn (Builder $category) => $category->whereIn('categories.id', $categoryIds));
            })
            ->when(isset($filters['target_gender']), fn (Builder $builder) => $builder->where('target_gender', $filters['target_gender']))
            ->when(isset($filters['brand']), fn (Builder $builder) => $builder->whereHas('brand', fn (Builder $brand) => $brand->where('slug', $filters['brand'])))
            ->when(isset($filters['collection']), fn (Builder $builder) => $builder->whereHas('collections', fn (Builder $collection) => $collection
                ->where('slug', $filters['collection'])
                ->where('is_active', true)
                ->where(fn (Builder $active) => $active->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn (Builder $active) => $active->whereNull('ends_at')->orWhere('ends_at', '>', now()))))
            ->when($request->boolean('new'), fn (Builder $builder) => $builder->where('is_new', true))
            ->when($request->boolean('best_seller'), fn (Builder $builder) => $builder->where('sold_count', '>', 0))
            ->when($request->boolean('sale'), function (Builder $builder): void {
                $now = now();
                $builder->whereHas('variants', function (Builder $variants) use ($now): void {
                    $variants->where('is_active', true)
                        ->whereNotNull('compare_at_price')
                        ->whereColumn('product_variants.compare_at_price', '>', 'product_variants.price')
                        ->where(function (Builder $window) use ($now): void {
                            $window->whereNull('products.sale_starts_at')->orWhere('products.sale_starts_at', '<=', $now);
                        })
                        ->where(function (Builder $window) use ($now): void {
                            $window->whereNull('products.sale_ends_at')->orWhere('products.sale_ends_at', '>=', $now);
                        });
                });
            })
            ->when(isset($filters['price_min']) || isset($filters['price_max']), function (Builder $builder) use ($filters): void {
                $expression = $this->effectiveVariantPriceExpression();
                $builder->whereHas('variants', function (Builder $variants) use ($filters, $expression): void {
                    $variants->where('is_active', true)
                        ->when(isset($filters['price_min']), fn (Builder $query) => $query->whereRaw($expression.' >= ?', [now()->toDateTimeString(), now()->toDateTimeString(), $filters['price_min']]))
                        ->when(isset($filters['price_max']), fn (Builder $query) => $query->whereRaw($expression.' <= ?', [now()->toDateTimeString(), now()->toDateTimeString(), $filters['price_max']]));
                });
            })
            ->when(isset($filters['size']), fn (Builder $builder) => $builder->whereHas('variants.size', fn (Builder $size) => $size->where('value', $filters['size'])))
            ->when(isset($filters['color']), fn (Builder $builder) => $builder->whereHas('variants.color', fn (Builder $color) => $color->where('value', $filters['color'])))
            ->when(isset($filters['material']), fn (Builder $builder) => $builder->whereRaw('TRIM(products.material) = ?', [$filters['material']]))
            ->when(isset($filters['fit']), fn (Builder $builder) => $builder->whereRaw('TRIM(products.fit) = ?', [$filters['fit']]))
            ->when(array_key_exists('in_stock', $filters), function (Builder $builder) use ($request): void {
                $availableVariant = fn (Builder $variant): Builder => $variant
                    ->where('is_active', true)
                    ->whereHas('inventory', fn (Builder $inventory) => $inventory->whereColumn('quantity', '>', 'reserved'));

                if ($request->boolean('in_stock')) {
                    $builder->whereHas('variants', $availableVariant);
                } else {
                    $builder->whereDoesntHave('variants', $availableVariant);
                }
            })
            ->when(isset($filters['rating_min']), fn (Builder $builder) => $builder
                ->where('products.rating_count', '>', 0)
                ->where('products.rating_avg', '>=', $filters['rating_min']))
            ->when(isset($filters['discount_min']), function (Builder $builder) use ($filters): void {
                $now = now();
                $builder->whereHas('variants', function (Builder $variants) use ($filters, $now): void {
                    $variants->where('is_active', true)
                        ->whereNotNull('compare_at_price')
                        ->whereColumn('product_variants.compare_at_price', '>', 'product_variants.price')
                        ->whereRaw('(product_variants.compare_at_price - product_variants.price) * 100 >= product_variants.compare_at_price * ?', [$filters['discount_min']])
                        ->where(function (Builder $window) use ($now): void {
                            $window->whereNull('products.sale_starts_at')->orWhere('products.sale_starts_at', '<=', $now);
                        })
                        ->where(function (Builder $window) use ($now): void {
                            $window->whereNull('products.sale_ends_at')->orWhere('products.sale_ends_at', '>=', $now);
                        });
                });
            });

        if (isset($filters['q'])) {
            $exactQuery = clone $query;
            $this->applyProductSearch($exactQuery, $filters['q']);
            if (! $exactQuery->exists()) {
                $fuzzyMatches = $this->fuzzyProductMatches($filters['q']);
            }
            $query->where(function (Builder $search) use ($filters, $fuzzyMatches): void {
                $this->applyProductSearch($search, $filters['q']);
                if ($fuzzyMatches !== []) {
                    $search->orWhereIn('products.id', array_keys($fuzzyMatches));
                }
            });
        }

        if (($filters['sort'] ?? null) === 'relevance' && isset($filters['q'])) {
            $query->orderByRaw('CASE WHEN products.name LIKE ? THEN 0 ELSE 1 END', ['%'.$filters['q'].'%'])
                ->when($fuzzyMatches !== [], function (Builder $builder) use ($fuzzyMatches): void {
                    $case = 'CASE products.id';
                    $bindings = [];
                    foreach ($fuzzyMatches as $id => $score) {
                        $case .= ' WHEN ? THEN ?';
                        $bindings[] = $id;
                        $bindings[] = $score;
                    }
                    $builder->orderByRaw($case.' ELSE 999 END', $bindings);
                })
                ->orderByDesc('sold_count')
                ->orderByDesc('id');
        } else {
            match ($filters['sort'] ?? 'newest') {
                'price_asc' => $query->orderBy('variants_min_price')->orderBy('id'),
                'price_desc' => $query->orderByDesc('variants_min_price')->orderByDesc('id'),
                'bestseller' => $query->orderByDesc('sold_count')->orderByDesc('id'),
                'rating_desc' => $query->orderByRaw('CASE WHEN products.rating_count > 0 THEN 0 ELSE 1 END')->orderByDesc('rating_avg')->orderByDesc('rating_count')->orderByDesc('sold_count')->orderByDesc('id'),
                'discount_desc' => $query->orderByDesc($this->effectiveVariantDiscountExpression())->orderByDesc('sold_count')->orderByDesc('id'),
                default => $query->orderByDesc('created_at')->orderByDesc('id'),
            };
        }

        return ProductResource::collection($query->paginate($filters['per_page'] ?? 16));
    }

    public function product(string $slug): ProductResource
    {
        $query = Product::query()
            ->published()
            ->where('slug', $slug)
            ->with(['category', 'brand', 'images', 'videos', 'approvedReviewSamples.user:id,name', 'sizeRecommendations.size', 'variants' => fn ($variants) => $variants->where('is_active', true)->with(['color', 'size', 'inventory'])]);
        $this->withEffectiveVariantPrices($query);
        $product = $query->firstOrFail();
        $ratingCounts = $product->reviews()
            ->where('status', 'approved')
            ->selectRaw('rating, COUNT(*) as review_count')
            ->groupBy('rating')
            ->pluck('review_count', 'rating');
        $product->setAttribute('rating_distribution', collect(range(1, 5))
            ->mapWithKeys(fn (int $stars): array => [$stars => (int) $ratingCounts->get($stars, 0)])
            ->all());

        return new ProductResource($product);
    }

    public function related(string $slug): AnonymousResourceCollection
    {
        $product = Product::query()->published()->where('slug', $slug)->firstOrFail();
        $query = Product::query()
            ->published()
            ->where('id', '!=', $product->id)
            ->when($product->category_id, fn (Builder $query) => $query->where('category_id', $product->category_id))
            ->with([
                'category', 'brand', 'images',
                'variants' => fn ($variants) => $variants->where('is_active', true)->with(['color', 'size', 'inventory']),
            ])
            ->orderByDesc('sold_count')
            ->orderByDesc('id')
            ->limit(8);
        $this->withEffectiveVariantPrices($query);
        $related = $query->get();

        return ProductResource::collection($related);
    }

    public function personalized(Request $request, GetPersonalizedProductRecommendationsAction $action): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();
        $ids = $action->execute($user);
        if ($ids === []) {
            return ProductResource::collection(collect());
        }

        $query = Product::query()
            ->published()
            ->whereIn('products.id', $ids)
            ->with(['category', 'brand', 'images']);
        $this->withEffectiveVariantPrices($query);
        $query->orderByRaw('FIELD(products.id, '.implode(', ', array_fill(0, count($ids), '?')).')', $ids);

        return ProductResource::collection($query->get());
    }

    private function withEffectiveVariantPrices(Builder $query): void
    {
        $now = now()->toDateTimeString();
        $priceExpression = $this->effectiveVariantPriceExpression();
        $saleWindow = '(products.sale_starts_at IS NULL OR products.sale_starts_at <= ?) AND (products.sale_ends_at IS NULL OR products.sale_ends_at >= ?)';
        $minimumPriceExpression = str_replace(
            ['product_variants.', 'products.'],
            ['priced_variants.', 'priced_products.'],
            $priceExpression,
        );
        $minimumEffectiveVariantPrice = '(SELECT MIN('.$minimumPriceExpression.') FROM product_variants as priced_variants'
            .' JOIN products as priced_products ON priced_products.id = priced_variants.product_id'
            .' WHERE priced_variants.product_id = sale_variants.product_id AND priced_variants.is_active = true)';

        $query->addSelect([
            'variants_min_price' => DB::table('product_variants as priced_variants')
                ->selectRaw('MIN('.str_replace('product_variants.', 'priced_variants.', $priceExpression).')', [$now, $now])
                ->whereColumn('priced_variants.product_id', 'products.id')
                ->where('priced_variants.is_active', true),
            'active_sale_compare_at_price' => DB::table('product_variants as sale_variants')
                ->selectRaw('MIN(sale_variants.compare_at_price)')
                ->whereColumn('sale_variants.product_id', 'products.id')
                ->where('sale_variants.is_active', true)
                ->whereNotNull('sale_variants.compare_at_price')
                ->whereColumn('sale_variants.compare_at_price', '>', 'sale_variants.price')
                ->whereRaw($saleWindow, [$now, $now])
                ->whereRaw('sale_variants.price = '.$minimumEffectiveVariantPrice, [$now, $now]),
        ]);
    }

    private function applyProductSearch(Builder $query, string $value): void
    {
        $term = '%'.$value.'%';
        $query->where(function (Builder $search) use ($term): void {
            $search->where('name', 'like', $term)
                ->orWhere('sku', 'like', $term)
                ->orWhere('short_description', 'like', $term)
                ->orWhereHas('brand', fn (Builder $brand) => $brand->where('name', 'like', $term)->orWhere('slug', 'like', $term))
                ->orWhereHas('category', fn (Builder $category) => $category->where('name', 'like', $term)->orWhere('slug', 'like', $term))
                ->orWhereHas('variants', function (Builder $variant) use ($term): void {
                    $variant->where('is_active', true)
                        ->where(function (Builder $variantSearch) use ($term): void {
                            $variantSearch->where('sku', 'like', $term)
                                ->orWhereHas('color', fn (Builder $color) => $color->where('value', 'like', $term));
                        });
                });
        });
    }

    /** @return array<int, int> Product ids mapped to edit-distance scores */
    private function fuzzyProductMatches(string $query): array
    {
        $normalized = Str::ascii(mb_strtolower($query, 'UTF-8'));
        $tokens = array_values(array_unique(array_filter(
            preg_split('/[^a-z0-9]+/', $normalized, -1, PREG_SPLIT_NO_EMPTY) ?: [],
            fn (string $token): bool => strlen($token) >= 3 && strlen($token) <= 24,
        )));
        $tokens = array_slice($tokens, 0, 4);
        if ($tokens === []) {
            return [];
        }

        $grams = [];
        foreach ($tokens as $token) {
            $lastOffset = max(0, strlen($token) - 2);
            foreach (array_unique([0, intdiv($lastOffset, 2), $lastOffset]) as $offset) {
                $grams[] = substr($token, $offset, 2);
            }
        }
        $grams = array_slice(array_values(array_unique($grams)), 0, 12);

        $candidates = Product::query()
            ->published()
            ->with([
                'brand:id,name',
                'category:id,name',
                'variants' => fn ($variants) => $variants->where('is_active', true)
                    ->select(['id', 'product_id', 'sku', 'color_value_id'])
                    ->with('color:id,value'),
            ])
            ->where(function (Builder $search) use ($grams): void {
                foreach ($grams as $gram) {
                    $pattern = '%'.$gram.'%';
                    $search->orWhere('name', 'like', $pattern)
                        ->orWhere('sku', 'like', $pattern)
                        ->orWhere('short_description', 'like', $pattern)
                        ->orWhereHas('brand', fn (Builder $brand) => $brand->where('name', 'like', $pattern))
                        ->orWhereHas('category', fn (Builder $category) => $category->where('name', 'like', $pattern))
                        ->orWhereHas('variants', fn (Builder $variant) => $variant->where('is_active', true)->where(function (Builder $variantSearch) use ($pattern): void {
                            $variantSearch->where('sku', 'like', $pattern)->orWhereHas('color', fn (Builder $color) => $color->where('value', 'like', $pattern));
                        }));
                }
            })
            ->orderByDesc('sold_count')
            ->limit(400)
            ->get(['products.id', 'products.name', 'products.sku', 'products.short_description', 'products.brand_id', 'products.category_id', 'products.sold_count']);

        $matches = [];
        foreach ($candidates as $product) {
            $searchable = implode(' ', array_filter([
                $product->name,
                $product->sku,
                $product->short_description,
                $product->brand?->name,
                $product->category?->name,
                ...$product->variants->flatMap(fn (ProductVariant $variant) => [$variant->sku, $variant->color?->value])->all(),
            ]));
            $words = array_slice(array_values(array_unique(preg_split('/[^a-z0-9]+/', Str::ascii(mb_strtolower($searchable, 'UTF-8')), -1, PREG_SPLIT_NO_EMPTY) ?: [])), 0, 120);
            $score = 0;
            $matchesEveryToken = true;

            foreach ($tokens as $token) {
                $threshold = strlen($token) >= 7 ? 2 : 1;
                $bestDistance = $threshold + 1;
                foreach ($words as $word) {
                    if (abs(strlen($word) - strlen($token)) > $threshold) {
                        continue;
                    }
                    $bestDistance = min($bestDistance, levenshtein($token, $word));
                    if ($bestDistance === 0) {
                        break;
                    }
                }
                if ($bestDistance > $threshold) {
                    $matchesEveryToken = false;
                    break;
                }
                $score += $bestDistance;
            }

            if ($matchesEveryToken) {
                $matches[(int) $product->id] = $score;
            }
        }

        asort($matches);

        return array_slice($matches, 0, 100, true);
    }

    private function effectiveVariantPriceExpression(): string
    {
        $saleWindow = '(products.sale_starts_at IS NULL OR products.sale_starts_at <= ?) AND (products.sale_ends_at IS NULL OR products.sale_ends_at >= ?)';

        return 'CASE WHEN product_variants.compare_at_price IS NOT NULL AND product_variants.compare_at_price > product_variants.price AND '.$saleWindow
            .' THEN product_variants.price WHEN product_variants.compare_at_price IS NOT NULL AND product_variants.compare_at_price > product_variants.price THEN product_variants.compare_at_price ELSE product_variants.price END';
    }

    private function effectiveVariantDiscountExpression(): \Illuminate\Database\Query\Builder
    {
        $now = now()->toDateTimeString();

        return DB::table('product_variants')
            ->selectRaw('MAX(product_variants.compare_at_price - product_variants.price)')
            ->whereColumn('product_variants.product_id', 'products.id')
            ->where('product_variants.is_active', true)
            ->whereNotNull('product_variants.compare_at_price')
            ->whereColumn('product_variants.compare_at_price', '>', 'product_variants.price')
            ->where(function ($window) use ($now): void {
                $window->whereNull('products.sale_starts_at')->orWhere('products.sale_starts_at', '<=', $now);
            })
            ->where(function ($window) use ($now): void {
                $window->whereNull('products.sale_ends_at')->orWhere('products.sale_ends_at', '>=', $now);
            });
    }
}
