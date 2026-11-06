<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AttachCollectionProductsRequest;
use App\Http\Requests\Api\V1\Admin\DetachCollectionProductsRequest;
use App\Http\Requests\Api\V1\Admin\ListCatalogOptionRequest;
use App\Http\Requests\Api\V1\Admin\ReorderCatalogOptionsRequest;
use App\Http\Requests\Api\V1\Admin\ReorderCollectionProductsRequest;
use App\Http\Requests\Api\V1\Admin\SaveCatalogOptionRequest;
use App\Http\Resources\CatalogOptionResource;
use App\Models\AttributeValue;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use App\Modules\Catalog\Actions\ManageCatalogOptionAction;
use App\Modules\Catalog\Actions\ManageCollectionProductsAction;
use App\Modules\Catalog\Actions\ReorderCatalogOptionsAction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CatalogOptionController extends Controller
{
    public function collectionProducts(int $collection): JsonResponse
    {
        Collection::query()->findOrFail($collection);

        $record = Collection::query()->findOrFail($collection);

        return response()->json(['collection' => ['id' => $record->id, 'name' => $record->name, 'banner' => $record->banner, 'banner_alt' => $record->banner_alt, 'is_lookbook' => (bool) $record->is_lookbook], 'data' => DB::table('collection_product')->join('products', 'products.id', '=', 'collection_product.product_id')->where('collection_id', $collection)->orderBy('sort_order')->get(['products.id', 'products.name', 'products.slug', 'products.sku', 'collection_product.sort_order', 'collection_product.lookbook_x', 'collection_product.lookbook_y'])]);
    }

    public function attachCollectionProducts(AttachCollectionProductsRequest $request, int $collection, ManageCollectionProductsAction $action): JsonResponse
    {
        $action->attach($collection, $request->validated('product_ids'));

        return $this->collectionProducts($collection);
    }

    public function detachCollectionProduct(int $collection, int $product, ManageCollectionProductsAction $action): JsonResponse
    {
        $action->detach($collection, $product);

        return $this->collectionProducts($collection);
    }

    public function detachCollectionProducts(DetachCollectionProductsRequest $request, int $collection, ManageCollectionProductsAction $action): JsonResponse
    {
        $removed = $action->detachMany($collection, $request->validated('product_ids'));

        return response()->json(['message' => "Đã gỡ {$removed} sản phẩm khỏi bộ sưu tập."]);
    }

    public function reorderCollectionProducts(ReorderCollectionProductsRequest $request, int $collection): JsonResponse
    {
        $data = $request->validated();
        DB::transaction(function () use ($collection, $data): void {
            $collectionRecord = Collection::query()->lockForUpdate()->findOrFail($collection);
            $hasLookbookPositions = collect($data['products'])->contains(fn (array $product): bool => array_key_exists('lookbook_x', $product) || array_key_exists('lookbook_y', $product));
            if ($hasLookbookPositions && ! $collectionRecord->is_lookbook) {
                abort(422, 'Chỉ bộ sưu tập Lookbook mới nhận vị trí điểm sản phẩm.');
            }
            foreach ($data['products'] as $product) {
                abort_unless(DB::table('collection_product')->where('collection_id', $collection)->where('product_id', $product['id'])->exists(), 404, 'Sản phẩm không thuộc bộ sưu tập này.');
                $changes = ['sort_order' => $product['sort_order']];
                if (array_key_exists('lookbook_x', $product) || array_key_exists('lookbook_y', $product)) {
                    $changes['lookbook_x'] = $product['lookbook_x'] ?? null;
                    $changes['lookbook_y'] = $product['lookbook_y'] ?? null;
                }
                DB::table('collection_product')->where('collection_id', $collection)->where('product_id', $product['id'])->update($changes);
            }
        });

        return $this->collectionProducts($collection);
    }

    public function index(ListCatalogOptionRequest $request, string $kind): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $query = $this->query($kind);
        $searchColumn = in_array($kind, ['colors', 'sizes'], true) ? 'value' : 'name';
        $query->when(isset($filters['q']), fn (Builder $q) => $q->where($searchColumn, 'like', '%'.$filters['q'].'%'));
        if (! in_array($kind, ['colors', 'sizes'], true)) {
            $query->when(isset($filters['active']), fn (Builder $q) => $q->where('is_active', $filters['active']));
        }
        if ($kind === 'categories') {
            $query->when(($filters['root_only'] ?? false), fn (Builder $q) => $q->whereNull('parent_id'));
            $query->when(isset($filters['parent_id']), fn (Builder $q) => $q->where('parent_id', $filters['parent_id']));
            $query->when(isset($filters['has_products']), fn (Builder $q) => $filters['has_products']
                ? $q->whereHas('products')
                : $q->whereDoesntHave('products'));
        }
        if ($kind === 'collections') {
            $now = now();
            $query->when(isset($filters['status']), function (Builder $q) use ($filters, $now): void {
                match ($filters['status']) {
                    'disabled' => $q->where('is_active', false),
                    'upcoming' => $q->where('is_active', true)->where('starts_at', '>', $now),
                    'expired' => $q->where('is_active', true)->whereNotNull('ends_at')->where('ends_at', '<', $now),
                    'running' => $q->where('is_active', true)->where(fn (Builder $window) => $window->whereNull('starts_at')->orWhere('starts_at', '<=', $now))->where(fn (Builder $window) => $window->whereNull('ends_at')->orWhere('ends_at', '>=', $now)),
                };
            });
            $query->when(isset($filters['date_from']), fn (Builder $q) => $q->where(fn (Builder $window) => $window->whereNull('ends_at')->orWhere('ends_at', '>=', Carbon::parse($filters['date_from'])->startOfDay())));
            $query->when(isset($filters['date_to']), fn (Builder $q) => $q->where(fn (Builder $window) => $window->whereNull('starts_at')->orWhere('starts_at', '<=', Carbon::parse($filters['date_to'])->endOfDay())));
        }
        if ($kind === 'categories' && isset($filters['sort'])) {
            $sort = $filters['sort'];
            $descending = str_starts_with($sort, '-');
            $field = ltrim($sort, '-');
            $sortColumn = match ($field) {
                'name' => 'name',
                'product_count' => 'products_count',
                'is_active' => 'is_active',
                default => abort(422, 'Unsupported category sort field.'),
            };
            $query->orderBy($sortColumn, $descending ? 'desc' : 'asc');
        } elseif (in_array($kind, ['categories', 'sizes'], true)) {
            $query->orderBy('sort_order');
        } else {
            $sort = $filters['sort'] ?? ($kind === 'colors' ? 'sort_order' : 'name');
            $descending = str_starts_with($sort, '-');
            $field = ltrim($sort, '-');
            $sortColumns = match ($kind) {
                'brands' => ['name' => 'name', 'slug' => 'slug', 'product_count' => 'products_count', 'is_active' => 'is_active'],
                'colors' => ['value' => 'value', 'sort_order' => 'sort_order', 'usage_count' => 'usage_count'],
                'collections' => ['name' => 'name', 'slug' => 'slug', 'product_count' => 'products_count', 'starts_at' => 'starts_at', 'ends_at' => 'ends_at', 'is_active' => 'is_active'],
                default => [],
            };
            abort_unless(isset($sortColumns[$field]), 422, 'Trường sắp xếp không được hỗ trợ.');
            $query->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc');
        }
        $rows = $query->orderBy($searchColumn)->orderBy('id')->paginate($filters['per_page'] ?? 20);

        return CatalogOptionResource::collection($rows);
    }

    public function show(string $kind, int $option): CatalogOptionResource
    {
        return new CatalogOptionResource($this->query($kind)->findOrFail($option));
    }

    public function store(SaveCatalogOptionRequest $request, string $kind, ManageCatalogOptionAction $action): JsonResponse
    {
        $record = $action->save($kind, $request->validated());

        return (new CatalogOptionResource($this->query($kind)->findOrFail($record->getKey())))->response()->setStatusCode(201);
    }

    public function update(SaveCatalogOptionRequest $request, string $kind, int $option, ManageCatalogOptionAction $action): CatalogOptionResource
    {
        $action->save($kind, $request->validated(), $option);

        return new CatalogOptionResource($this->query($kind)->findOrFail($option));
    }

    public function updateAlias(SaveCatalogOptionRequest $request, int $option, ManageCatalogOptionAction $action): CatalogOptionResource
    {
        return $this->update($request, (string) $request->route('kind'), (int) $request->route('option'), $action);
    }

    public function destroy(string $kind, int $option, ManageCatalogOptionAction $action): JsonResponse
    {
        $action->delete($kind, $option);

        return response()->json(['message' => 'Đã xóa mục dữ liệu.']);
    }

    public function destroyAlias(Request $request, int $option, ManageCatalogOptionAction $action): JsonResponse
    {
        return $this->destroy((string) $request->route('kind'), (int) $request->route('option'), $action);
    }

    public function reorder(ReorderCatalogOptionsRequest $request, string $kind, ReorderCatalogOptionsAction $action): JsonResponse
    {
        abort_unless(in_array($kind, ['categories', 'sizes', 'colors'], true), 404);
        $data = $request->validated();
        $action->execute($kind, $data['items']);

        return response()->json(['message' => 'Đã lưu thứ tự.']);
    }

    private function query(string $kind): Builder
    {
        return match ($kind) {
            'categories' => Category::query()->with('parent:id,name')->withCount('products'),
            'brands' => Brand::query()->withCount('products'),
            'collections' => Collection::query()->withCount('products'),
            'colors', 'sizes' => AttributeValue::query()
                ->whereHas('attribute', fn (Builder $query) => $query->where('type', $kind === 'colors' ? 'color' : 'size'))
                ->with('attribute:id,name')
                ->select('attribute_values.*')
                ->selectSub(function ($query) use ($kind): void {
                    $query->from('product_variants')->selectRaw('COUNT(*)')
                        ->whereColumn($kind === 'colors' ? 'color_value_id' : 'size_value_id', 'attribute_values.id');
                }, 'usage_count'),
            default => abort(404),
        };
    }
}
