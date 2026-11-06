<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Catalog\SyncProductSalePrice;
use App\Actions\Catalog\SyncProductTags;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\BulkProductActionRequest;
use App\Http\Requests\Api\V1\Admin\CreateProductRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminProductsRequest;
use App\Http\Requests\Api\V1\Admin\UpdateProductRequest;
use App\Models\Product;
use App\Modules\Catalog\Actions\BulkManageProductsAction;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    public function show(int $product): JsonResponse
    {
        return response()->json(['data' => Product::query()->with(['category', 'brand', 'variants.inventory', 'images', 'collections', 'tags'])->findOrFail($product)]);
    }

    public function index(ListAdminProductsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $countFilters = $filters;
        unset($countFilters['status'], $countFilters['stock_status'], $countFilters['sort'], $countFilters['per_page']);
        $visibleStatusCounts = $this->productQuery($countFilters)
            ->reorder()->select('products.status')->selectRaw('COUNT(*) as product_count')
            ->groupBy('products.status')->pluck('product_count', 'status')
            ->map(fn ($count): int => (int) $count)->all();
        $statusCounts = [
            'all' => array_sum($visibleStatusCounts),
            'active' => $visibleStatusCounts['active'] ?? 0,
            'draft' => $visibleStatusCounts['draft'] ?? 0,
            'hidden' => $visibleStatusCounts['hidden'] ?? 0,
            'archived' => $this->productQuery([...$countFilters, 'status' => 'archived'])->reorder()->count(),
            'out_of_stock' => $this->productQuery([...$countFilters, 'stock_status' => 'out_of_stock'])->reorder()->count(),
        ];
        $products = $this->productQuery($filters)->paginate($filters['per_page'] ?? 25);

        $data = collect($products->items())->map(function (Product $product): array {
            $data = $product->toArray();
            $data['compare_at_price'] = $product->active_sale_compare_at_price ?? $product->compare_at_price;
            $data['sale_price'] = $product->saleWindowIsActive() ? $product->sale_price : null;
            unset($data['active_sale_compare_at_price']);

            return array_merge($data, [
                'status' => $product->trashed() ? 'archived' : $product->status,
                'price' => (int) ($product->variants_min_price ?? $product->base_price),
                'stock_quantity' => (int) ($product->stock_quantity ?? 0),
                'available_stock' => (int) ($product->available_stock ?? 0),
            ]);
        });

        return response()->json(['data' => $data, 'filters' => ['status_counts' => $statusCounts], 'meta' => [
            'current_page' => $products->currentPage(), 'last_page' => $products->lastPage(), 'per_page' => $products->perPage(), 'total' => $products->total(),
        ]]);
    }

    public function export(ListAdminProductsRequest $request): StreamedResponse
    {
        $products = $this->productQuery($request->validated());

        return response()->streamDownload(function () use ($products): void {
            $handle = fopen('php://output', 'wb');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['ID', 'Tên sản phẩm', 'SKU', 'Danh mục', 'Thương hiệu', 'Giá từ (VND)', 'Giá so sánh (VND)', 'Giá khuyến mãi (VND)', 'Tồn', 'Khả dụng', 'Đã bán', 'Đánh giá', 'Trạng thái', 'Ngày tạo']);
            $products->chunk(500, function ($rows) use ($handle): void {
                foreach ($rows as $product) {
                    $values = [
                        $product->id, $product->name, $product->sku, $product->category?->name, $product->brand?->name,
                        (int) ($product->variants_min_price ?? $product->base_price), (int) ($product->active_sale_compare_at_price ?? $product->compare_at_price ?? $product->base_price),
                        ! $product->saleWindowIsActive() || $product->sale_price === null ? '' : (int) $product->sale_price,
                        (int) ($product->stock_quantity ?? 0), (int) ($product->available_stock ?? 0),
                        (int) $product->sold_count, $product->rating_avg, $product->trashed() ? 'archived' : $product->status, $product->created_at,
                    ];
                    fputcsv($handle, array_map(static function ($value) {
                        $value = (string) ($value ?? '');

                        return preg_match('/^[=+\\-@\\t\\r]/u', $value) === 1 ? "'".$value : $value;
                    }, $values));
                }
            });
            fclose($handle);
        }, 'products-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function productQuery(array $filters): Builder
    {
        $now = now()->toDateTimeString();
        $saleWindow = '(products.sale_starts_at IS NULL OR products.sale_starts_at <= ?) AND (products.sale_ends_at IS NULL OR products.sale_ends_at >= ?)';
        $effectivePrice = 'CASE WHEN product_variants.compare_at_price IS NOT NULL AND product_variants.compare_at_price > product_variants.price AND '.$saleWindow
            .' THEN product_variants.price WHEN product_variants.compare_at_price IS NOT NULL AND product_variants.compare_at_price > product_variants.price THEN product_variants.compare_at_price ELSE product_variants.price END';
        $query = Product::query()
            ->with(['category', 'brand', 'images'])
            ->withCount(['variants', 'variants as active_variants_count' => fn ($variants) => $variants->where('is_active', true)])
            ->addSelect([
                'variants_min_price' => DB::table('product_variants as priced_variants')
                    ->selectRaw('MIN('.str_replace('product_variants.', 'priced_variants.', $effectivePrice).')', [$now, $now])
                    ->whereColumn('priced_variants.product_id', 'products.id')
                    ->where('priced_variants.is_active', true),
                'active_sale_compare_at_price' => DB::table('product_variants as sale_variants')
                    ->selectRaw('MIN(sale_variants.compare_at_price)')
                    ->whereColumn('sale_variants.product_id', 'products.id')
                    ->where('sale_variants.is_active', true)
                    ->whereNotNull('sale_variants.compare_at_price')
                    ->whereColumn('sale_variants.compare_at_price', '>', 'sale_variants.price')
                    ->whereRaw($saleWindow, [$now, $now]),
            ])
            ->addSelect([
                'stock_quantity' => DB::table('product_variants as stock_variants')
                    ->join('inventories as stock_rows', 'stock_rows.variant_id', '=', 'stock_variants.id')
                    ->selectRaw('COALESCE(SUM(stock_rows.quantity), 0)')
                    ->whereColumn('stock_variants.product_id', 'products.id'),
                'available_stock' => DB::table('product_variants as available_variants')
                    ->join('inventories as available_rows', 'available_rows.variant_id', '=', 'available_variants.id')
                    ->selectRaw('COALESCE(SUM(CASE WHEN available_rows.quantity > available_rows.reserved THEN available_rows.quantity - available_rows.reserved ELSE 0 END), 0)')
                    ->whereColumn('available_variants.product_id', 'products.id'),
            ])
            ->when(($filters['status'] ?? null) === 'archived', fn ($query) => $query->withTrashed()->whereNotNull('products.deleted_at'))
            ->when(isset($filters['status']) && $filters['status'] !== 'archived', fn ($query) => $query->where('status', $filters['status']))
            ->when(isset($filters['category_id']), fn ($query) => $query->where('category_id', $filters['category_id']))
            ->when(isset($filters['category_ids']), fn ($query) => $query->whereIn('category_id', $filters['category_ids']))
            ->when(isset($filters['brand_id']), fn ($query) => $query->where('brand_id', $filters['brand_id']))
            ->when(isset($filters['brand_ids']), fn ($query) => $query->whereIn('brand_id', $filters['brand_ids']))
            ->when(isset($filters['collection_ids']), fn ($query) => $query->whereHas('collections', fn ($collections) => $collections->whereIn('collections.id', $filters['collection_ids'])))
            ->when(isset($filters['exclude_collection_id']), fn ($query) => $query->whereDoesntHave('collections', fn ($collections) => $collections->whereKey($filters['exclude_collection_id'])))
            ->when(isset($filters['target_gender']), fn ($query) => $query->where('target_gender', $filters['target_gender']))
            ->when(isset($filters['is_featured']), fn ($query) => $query->where('is_featured', $filters['is_featured']))
            ->when(isset($filters['is_new']), fn ($query) => $query->where('is_new', $filters['is_new']))
            ->when(isset($filters['in_stock']), fn ($query) => $query->whereHas('variants.inventory', fn ($inventory) => $filters['in_stock'] ? $inventory->whereColumn('quantity', '>', 'reserved') : $inventory->whereColumn('quantity', '<=', 'reserved')))
            ->when(isset($filters['stock_status']), function ($query) use ($filters): void {
                match ($filters['stock_status']) {
                    'in_stock' => $query->whereRaw('COALESCE((SELECT SUM(inventories.quantity - inventories.reserved) FROM product_variants AS stock_variants JOIN inventories ON inventories.variant_id = stock_variants.id WHERE stock_variants.product_id = products.id), 0) > 0'),
                    'out_of_stock' => $query->whereRaw('COALESCE((SELECT SUM(GREATEST(inventories.quantity - inventories.reserved, 0)) FROM product_variants AS stock_variants JOIN inventories ON inventories.variant_id = stock_variants.id WHERE stock_variants.product_id = products.id), 0) = 0'),
                    'low_stock' => $query->whereHas('variants.inventory', fn ($inventory) => $inventory->whereRaw('inventories.quantity - inventories.reserved > 0 AND inventories.quantity - inventories.reserved <= inventories.low_stock_threshold')),
                };
            })
            ->when(isset($filters['has_sale']), function ($query) use ($filters, $saleWindow, $now): void {
                $saleVariant = fn ($variants) => $variants->where('product_variants.is_active', true)
                    ->whereNotNull('product_variants.compare_at_price')
                    ->whereColumn('product_variants.compare_at_price', '>', 'product_variants.price')
                    ->whereRaw($saleWindow, [$now, $now]);
                $filters['has_sale'] ? $query->whereHas('variants', $saleVariant) : $query->whereDoesntHave('variants', $saleVariant);
            })
            ->when(isset($filters['has_image']), fn ($query) => $filters['has_image'] ? $query->where(fn ($image) => $image->whereNotNull('thumbnail')->orWhereHas('images')) : $query->whereNull('thumbnail')->whereDoesntHave('images'))
            ->when(isset($filters['created_from']), fn ($query) => $query->whereDate('created_at', '>=', $filters['created_from']))
            ->when(isset($filters['created_to']), fn ($query) => $query->whereDate('created_at', '<=', $filters['created_to']))
            ->when(isset($filters['min_price']) || isset($filters['max_price']), fn ($query) => $query->whereHas('variants', fn ($variant) => $variant
                ->where('product_variants.is_active', true)
                ->when(isset($filters['min_price']), fn ($price) => $price->whereRaw($effectivePrice.' >= ?', [$now, $now, $filters['min_price']]))
                ->when(isset($filters['max_price']), fn ($price) => $price->whereRaw($effectivePrice.' <= ?', [$now, $now, $filters['max_price']]))))
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search
                ->where('name', 'like', '%'.$filters['q'].'%')
                ->orWhere('slug', 'like', '%'.$filters['q'].'%')
                ->orWhere('sku', 'like', '%'.$filters['q'].'%')
                ->orWhereHas('variants', fn ($variants) => $variants->where('sku', 'like', '%'.$filters['q'].'%'))))
            ->when(isset($filters['sort']) && in_array($filters['sort'], ['name', '-name', 'created_at', '-created_at', 'updated_at', '-updated_at'], true), function ($query) use ($filters): void {
                $sort = $filters['sort'];
                $query->orderBy(ltrim($sort, '-'), str_starts_with($sort, '-') ? 'desc' : 'asc');
            })
            ->when(isset($filters['sort']) && in_array($filters['sort'], ['price', '-price'], true), fn ($query) => $query->orderBy('variants_min_price', $filters['sort'] === '-price' ? 'desc' : 'asc'))
            ->when(! isset($filters['sort']), fn ($query) => $query->orderByDesc('updated_at'))
            ->orderByDesc('id');

        return $query;
    }

    public function store(CreateProductRequest $request, SyncProductSalePrice $syncSalePrice, SyncProductTags $syncProductTags, InventoryService $inventoryService): JsonResponse
    {
        $data = $request->validated();
        $tagNames = $data['tags'] ?? [];
        $collectionIds = $data['collection_ids'] ?? [];
        unset($data['tags'], $data['collection_ids']);
        $combinations = [];
        foreach ($data['variants'] as $index => $variant) {
            if (($variant['color_value_id'] ?? null) !== null && ($variant['size_value_id'] ?? null) !== null) {
                $key = $variant['color_value_id'].'-'.$variant['size_value_id'];
                if (isset($combinations[$key])) {
                    throw ValidationException::withMessages(["variants.{$index}.color_value_id" => 'Tổ hợp màu và size bị trùng.']);
                }
                $combinations[$key] = true;
            }
        }

        $product = DB::transaction(function () use ($data, $tagNames, $collectionIds, $request, $syncSalePrice, $syncProductTags, $inventoryService): Product {
            $baseSlug = $data['slug'] ?? Str::slug($data['name']);
            $slug = $baseSlug;
            $suffix = 2;
            while (Product::query()->where('slug', $slug)->exists()) {
                $slug = $baseSlug.'-'.$suffix++;
            }
            $product = Product::query()->create([
                ...collect($data)->except(['slug', 'variants'])->all(),
                'slug' => $slug,
                'is_featured' => $data['is_featured'] ?? false,
                'is_new' => $data['is_new'] ?? false,
            ]);
            foreach ($data['variants'] as $variantData) {
                $variant = $product->variants()->create(collect($variantData)->except(['initial_quantity'])->all() + ['is_active' => true]);
                $inventoryService->initializeVariant((int) $variant->id, (int) $variantData['initial_quantity'], (int) (DB::table('settings')->where('key', 'low_stock_threshold')->value('value') ?? 5), $request->user()?->id);
            }

            $syncSalePrice->handle($product);
            $syncProductTags->handle($product, $tagNames);
            $product->collections()->sync($collectionIds);

            return $product->load(['variants.inventory', 'collections', 'tags']);
        });

        return response()->json(['data' => array_merge($product->toArray(), ['price' => $product->base_price])], 201);
    }

    public function update(UpdateProductRequest $request, int $product): JsonResponse
    {
        $record = Product::query()->findOrFail($product);
        $data = $request->validated();
        $record->update($data);

        return response()->json(['data' => $record->fresh(['category', 'variants.inventory', 'images'])]);
    }

    public function duplicate(Request $request, int $product, InventoryService $inventoryService): JsonResponse
    {
        $copy = DB::transaction(function () use ($request, $product, $inventoryService): Product {
            $source = Product::query()->with(['variants', 'images', 'collections', 'tags'])->findOrFail($product);
            $baseSlug = $source->slug.'-copy';
            $slug = $baseSlug;
            $suffix = 2;
            while (Product::query()->where('slug', $slug)->exists()) {
                $slug = $baseSlug.'-'.($suffix++);
            }
            $copy = $source->replicate(['slug', 'thumbnail', 'view_count', 'sold_count', 'rating_avg', 'rating_count']);
            $copy->slug = $slug;
            $copy->name = $source->name.' (copy)';
            $copy->status = 'draft';
            $copy->save();
            foreach ($source->variants as $variant) {
                $newVariant = $variant->replicate();
                $newVariant->product_id = $copy->id;
                $newVariant->sku = $variant->sku.'-COPY-'.$copy->id;
                $newVariant->save();
                $inventoryService->initializeVariant((int) $newVariant->id, 0, (int) (DB::table('settings')->where('key', 'low_stock_threshold')->value('value') ?? 5), $request->user()?->id);
            }
            $copy->collections()->sync($source->collections->pluck('id')->all());
            $copy->tags()->sync($source->tags->pluck('id')->all());
            foreach ($source->images as $image) {
                $copy->images()->create($image->only(['url', 'alt', 'sort_order', 'is_primary']));
            }

            return $copy->load(['variants.inventory', 'images', 'collections', 'tags']);
        });

        return response()->json(['data' => $copy], 201);
    }

    public function destroy(int $product): JsonResponse
    {
        Product::query()->findOrFail($product)->delete();

        return response()->json(['message' => 'Đã đưa sản phẩm vào lưu trữ.']);
    }

    public function bulk(BulkProductActionRequest $request, BulkManageProductsAction $action): JsonResponse
    {
        $data = $request->validated();
        $count = $action->execute($data, $request->user());

        return response()->json(['data' => ['count' => $count], 'message' => 'Đã cập nhật '.$count.' sản phẩm.']);
    }
}
