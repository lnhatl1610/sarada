<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Catalog\SyncProductSalePrice;
use App\Actions\Catalog\SyncProductSizeRecommendations;
use App\Actions\Catalog\SyncProductTags;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ReorderProductImagesRequest;
use App\Http\Requests\Api\V1\Admin\SaveProductDetailsRequest;
use App\Http\Requests\Api\V1\Admin\SaveProductImageRequest;
use App\Http\Requests\Api\V1\Admin\SaveProductSizeRecommendationsRequest;
use App\Http\Requests\Api\V1\Admin\SaveProductVariantRequest;
use App\Http\Requests\Api\V1\Admin\UpdateProductImageRequest;
use App\Http\Requests\Api\V1\Admin\UploadProductImageRequest;
use App\Http\Requests\Api\V1\Admin\UploadProductVideoRequest;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\ProductVideo;
use App\Modules\Catalog\Actions\DeleteProductVideoAction;
use App\Modules\Catalog\Actions\UploadProductVideoAction;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class ProductDetailsController extends Controller
{
    public function show(int $product): JsonResponse
    {
        $record = Product::query()->with(['category', 'brand', 'variants.inventory', 'variants.color', 'variants.size', 'images', 'videos', 'collections', 'tags', 'sizeRecommendations.size'])->findOrFail($product);

        return response()->json(['data' => $record]);
    }

    public function saveSizeRecommendations(SaveProductSizeRecommendationsRequest $request, int $product, SyncProductSizeRecommendations $sync): JsonResponse
    {
        $record = Product::query()->findOrFail($product);
        $sync->handle($record, $request->validated('recommendations'));

        return $this->show($product);
    }

    public function update(SaveProductDetailsRequest $request, int $product, SyncProductSalePrice $syncSalePrice, SyncProductTags $syncProductTags, InventoryService $inventoryService): JsonResponse
    {
        $data = $request->validated();
        $collections = $data['collection_ids'] ?? null;
        $variants = $data['variants'] ?? null;
        $tagNames = $data['tags'] ?? null;
        $images = $data['images'] ?? null;
        $deleteImageIds = $data['delete_image_ids'] ?? null;
        unset($data['collection_ids'], $data['variants'], $data['tags'], $data['images'], $data['delete_image_ids']);
        DB::transaction(function () use ($request, $product, $data, $collections, $variants, $tagNames, $images, $deleteImageIds, $syncSalePrice, $syncProductTags, $inventoryService): void {
            $record = Product::query()->whereKey($product)->lockForUpdate()->firstOrFail();
            $record->update($data);
            if ($collections !== null) {
                $record->collections()->sync($collections);
            }
            if ($tagNames !== null) {
                $syncProductTags->handle($record, $tagNames);
            }
            if ($images !== null || $deleteImageIds !== null) {
                $existingImages = $record->images()->lockForUpdate()->get();
                $existingIds = $existingImages->modelKeys();
                $updatedIds = array_map('intval', array_column($images ?? [], 'id'));
                $deletedIds = array_map('intval', $deleteImageIds ?? []);
                $allSubmittedIds = array_merge($updatedIds, $deletedIds);

                if (count($allSubmittedIds) !== count(array_unique($allSubmittedIds))
                    || array_diff($existingIds, $allSubmittedIds) !== []
                    || array_diff($allSubmittedIds, $existingIds) !== []) {
                    throw ValidationException::withMessages(['images' => 'Danh sách ảnh đã thay đổi. Vui lòng tải lại sản phẩm rồi thử lại.']);
                }

                $primaryImages = array_filter($images ?? [], fn (array $image): bool => (bool) ($image['is_primary'] ?? false));
                if (count($primaryImages) > 1) {
                    throw ValidationException::withMessages(['images' => 'Chỉ được chọn một ảnh chính cho sản phẩm.']);
                }

                if ($deletedIds !== []) {
                    ProductImage::query()->where('product_id', $product)->whereIn('id', $deletedIds)->delete();
                }
                $record->images()->update(['is_primary' => false]);
                foreach ($images ?? [] as $imageData) {
                    ProductImage::query()->where('product_id', $product)->whereKey($imageData['id'])->update([
                        'alt' => $imageData['alt'] ?? null,
                        'sort_order' => $imageData['sort_order'],
                        'is_primary' => (bool) $imageData['is_primary'],
                        'color_value_id' => $imageData['color_value_id'] ?? null,
                        'is_360_frame' => (bool) ($imageData['is_360_frame'] ?? false),
                    ]);
                }
                $primaryImage = $record->images()->where('is_primary', true)->first();
                if ($primaryImage === null) {
                    $primaryImage = $record->images()->orderBy('sort_order')->orderBy('id')->first();
                    $primaryImage?->update(['is_primary' => true]);
                }
                $record->update(['thumbnail' => $primaryImage?->url]);
            }
            if ($variants !== null) {
                foreach ($variants as $index => $variantData) {
                    $variantId = $variantData['id'] ?? null;
                    if ($variantId === null && ! array_key_exists('initial_quantity', $variantData)) {
                        throw ValidationException::withMessages(["variants.{$index}.initial_quantity" => 'Cần nhập tồn khởi tạo cho biến thể mới.']);
                    }
                    if ($variantId !== null && array_key_exists('initial_quantity', $variantData)) {
                        throw ValidationException::withMessages(["variants.{$index}.initial_quantity" => 'Tồn kho của biến thể hiện có cần được điều chỉnh tại trang kho.']);
                    }
                    $initialQuantity = (int) ($variantData['initial_quantity'] ?? 0);
                    unset($variantData['id'], $variantData['initial_quantity']);

                    $variant = $variantId === null
                        ? null
                        : ProductVariant::query()->where('product_id', $product)->whereKey($variantId)->lockForUpdate()->first();
                    if ($variantId !== null && $variant === null) {
                        throw ValidationException::withMessages(["variants.{$index}.id" => 'Biến thể không thuộc sản phẩm này.']);
                    }

                    $duplicateSku = ProductVariant::query()->where('sku', $variantData['sku'])
                        ->when($variantId !== null, fn ($query) => $query->where('id', '!=', $variantId))->exists();
                    if ($duplicateSku) {
                        throw ValidationException::withMessages(["variants.{$index}.sku" => 'SKU biến thể đã được sử dụng.']);
                    }

                    $this->uniqueCombination($product, $variantData['color_value_id'] ?? null, $variantData['size_value_id'] ?? null, $variantId, "variants.{$index}.color_value_id");
                    if ($variant) {
                        $variant->update($variantData);
                    } else {
                        $variant = $record->variants()->create($variantData);
                        $threshold = (int) (DB::table('settings')->where('key', 'low_stock_threshold')->value('value') ?? 5);
                        $inventoryService->initializeVariant((int) $variant->id, $initialQuantity, $threshold, $request->user()?->id);
                    }
                }
                $syncSalePrice->handle($record);
            }
        });

        return $this->show($product);
    }

    public function storeVariant(SaveProductVariantRequest $request, int $product, SyncProductSalePrice $syncSalePrice, InventoryService $inventoryService): JsonResponse
    {
        $data = $request->validated();
        $quantity = $data['initial_quantity'];
        unset($data['initial_quantity']);
        $variant = DB::transaction(function () use ($request, $product, $data, $quantity, $syncSalePrice, $inventoryService): ProductVariant {
            $record = Product::query()->whereKey($product)->lockForUpdate()->firstOrFail();
            $this->uniqueCombination($product, $data['color_value_id'] ?? null, $data['size_value_id'] ?? null);
            $variant = $record->variants()->create($data);
            $inventoryService->initializeVariant((int) $variant->id, $quantity, (int) (DB::table('settings')->where('key', 'low_stock_threshold')->value('value') ?? 5), $request->user()?->id);
            $syncSalePrice->handle($record);

            return $variant;
        });

        return response()->json(['data' => $variant->load(['inventory', 'color', 'size'])], 201);
    }

    public function updateVariant(SaveProductVariantRequest $request, int $product, int $variant, SyncProductSalePrice $syncSalePrice): JsonResponse
    {
        $data = $request->validated();
        $record = DB::transaction(function () use ($product, $variant, $data, $syncSalePrice): ProductVariant {
            $productRecord = Product::query()->whereKey($product)->lockForUpdate()->firstOrFail();
            $record = ProductVariant::query()->where('product_id', $product)->findOrFail($variant);
            if (array_key_exists('color_value_id', $data) || array_key_exists('size_value_id', $data)) {
                $this->uniqueCombination($product, $data['color_value_id'] ?? $record->color_value_id, $data['size_value_id'] ?? $record->size_value_id, $variant);
            }
            $record->update($data);
            $syncSalePrice->handle($productRecord);

            return $record;
        });

        return response()->json(['data' => $record->fresh(['inventory', 'color', 'size'])]);
    }

    public function storeImage(SaveProductImageRequest $request, int $product): JsonResponse
    {
        $data = $request->validated();
        $image = DB::transaction(function () use ($product, $data): ProductImage {
            $record = Product::query()->whereKey($product)->lockForUpdate()->firstOrFail();
            if ($data['is_primary'] ?? false) {
                $record->images()->update(['is_primary' => false]);
                $record->update(['thumbnail' => $data['url']]);
            }

            return $record->images()->create($data);
        });

        return response()->json(['data' => $image], 201);
    }

    public function uploadImage(UploadProductImageRequest $request, int $product): JsonResponse
    {
        $data = $request->validated();
        $path = $data['file']->store('products/'.$product, 'public');
        try {
            $image = DB::transaction(function () use ($product, $data, $path): ProductImage {
                $record = Product::query()->whereKey($product)->lockForUpdate()->firstOrFail();
                if ($data['is_primary'] ?? false) {
                    $record->images()->update(['is_primary' => false]);
                }
                $image = $record->images()->create([
                    'url' => asset('storage/'.$path),
                    'alt' => $data['alt'] ?? null,
                    'sort_order' => $data['sort_order'] ?? 0,
                    'is_primary' => $data['is_primary'] ?? false,
                    'color_value_id' => $data['color_value_id'] ?? null,
                ]);
                if ($image->is_primary) {
                    $record->update(['thumbnail' => $image->url]);
                }

                return $image;
            });
        } catch (Throwable $exception) {
            try {
                if (! Storage::disk('public')->delete($path)) {
                    report(new RuntimeException("Failed to clean up product image upload [{$path}] after database failure."));
                }
            } catch (Throwable $cleanupException) {
                report($cleanupException);
            }

            throw $exception;
        }

        return response()->json(['data' => $image], 201);
    }

    public function updateImage(UpdateProductImageRequest $request, int $product, int $image): JsonResponse
    {
        Product::query()->whereKey($product)->firstOrFail();
        $record = ProductImage::query()->where('product_id', $product)->findOrFail($image);
        $record->update($request->validated());

        return response()->json(['data' => $record->fresh()]);
    }

    public function destroyImage(int $product, int $image): JsonResponse
    {
        $record = ProductImage::query()->where('product_id', $product)->findOrFail($image);
        DB::transaction(function () use ($product, $record): void {
            $wasPrimary = $record->is_primary;
            $record->delete();
            if ($wasPrimary) {
                $next = ProductImage::query()->where('product_id', $product)->orderBy('sort_order')->first();
                $next?->update(['is_primary' => true]);
                Product::query()->whereKey($product)->update(['thumbnail' => $next?->url]);
            }
        });

        return response()->json(['message' => 'Đã xóa ảnh.']);
    }

    public function uploadVideo(UploadProductVideoRequest $request, int $product, UploadProductVideoAction $upload): JsonResponse
    {
        $record = Product::query()->findOrFail($product);
        $data = $request->validated();
        $video = $upload->execute($record, $data['file'], $data['caption'] ?? null, isset($data['color_value_id']) ? (int) $data['color_value_id'] : null);

        return response()->json(['data' => $video], 201);
    }

    public function destroyVideo(int $product, int $video, DeleteProductVideoAction $delete): JsonResponse
    {
        $record = ProductVideo::query()->where('product_id', $product)->findOrFail($video);
        $delete->execute($record);

        return response()->json(['data' => ['id' => $video, 'deleted' => true]]);
    }

    public function setPrimaryImage(int $product, int $image): JsonResponse
    {
        DB::transaction(function () use ($product, $image): void {
            $record = Product::query()->whereKey($product)->lockForUpdate()->firstOrFail();
            $selected = ProductImage::query()->where('product_id', $product)->findOrFail($image);
            $record->images()->update(['is_primary' => false]);
            $selected->update(['is_primary' => true]);
            $record->update(['thumbnail' => $selected->url]);
        });

        return response()->json(['data' => Product::query()->with('images')->findOrFail($product)->images]);
    }

    public function reorderImages(ReorderProductImagesRequest $request, int $product): JsonResponse
    {
        $data = $request->validated();
        DB::transaction(function () use ($product, $data): void {
            Product::query()->whereKey($product)->lockForUpdate()->firstOrFail();
            $ids = ProductImage::query()->where('product_id', $product)->pluck('id')->all();
            foreach ($data['images'] as $image) {
                if (in_array($image['id'], $ids, true)) {
                    ProductImage::query()->where('product_id', $product)->whereKey($image['id'])->update(['sort_order' => $image['sort_order']]);
                }
            }
        });

        return response()->json(['data' => Product::query()->with('images')->findOrFail($product)->images]);
    }

    private function uniqueCombination(int $product, ?int $color, ?int $size, ?int $ignore = null, string $errorField = 'color_value_id'): void
    {
        $duplicate = ProductVariant::query()->where('product_id', $product)
            ->where('color_value_id', $color)->where('size_value_id', $size)
            ->when($ignore !== null, fn ($query) => $query->where('id', '!=', $ignore))->exists();
        if ($duplicate) {
            throw ValidationException::withMessages([$errorField => 'Biến thể màu và kích cỡ này đã tồn tại.']);
        }
    }
}
