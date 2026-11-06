<?php

namespace App\Modules\Catalog\Actions;

use App\Models\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ManageCollectionProductsAction
{
    /** @param array<int, int> $productIds */
    public function attach(int $collectionId, array $productIds): void
    {
        DB::transaction(function () use ($collectionId, $productIds): void {
            $collection = Collection::query()->lockForUpdate()->findOrFail($collectionId);
            $maxOrder = DB::table('collection_product')->where('collection_id', $collection->id)->max('sort_order');
            $nextOrder = $maxOrder === null ? 0 : (int) $maxOrder + 1;

            foreach ($productIds as $productId) {
                DB::table('collection_product')->insertOrIgnore([
                    'collection_id' => $collection->id,
                    'product_id' => $productId,
                    'sort_order' => $nextOrder++,
                ]);
            }
        });
    }

    public function detach(int $collectionId, int $productId): void
    {
        DB::transaction(function () use ($collectionId, $productId): void {
            Collection::query()->lockForUpdate()->findOrFail($collectionId);
            $removed = DB::table('collection_product')->where('collection_id', $collectionId)->where('product_id', $productId)->delete();
            abort_if($removed === 0, 404, 'Sản phẩm không thuộc bộ sưu tập này.');
            $this->normalizeOrder($collectionId);
        });
    }

    /** @param array<int, int> $productIds */
    public function detachMany(int $collectionId, array $productIds): int
    {
        return DB::transaction(function () use ($collectionId, $productIds): int {
            Collection::query()->lockForUpdate()->findOrFail($collectionId);
            $removed = DB::table('collection_product')->where('collection_id', $collectionId)->whereIn('product_id', $productIds)->delete();
            if ($removed !== count($productIds)) {
                throw ValidationException::withMessages(['product_ids' => 'Một hoặc nhiều sản phẩm không còn thuộc bộ sưu tập này.']);
            }
            $this->normalizeOrder($collectionId);

            return $removed;
        });
    }

    private function normalizeOrder(int $collectionId): void
    {
        $rows = DB::table('collection_product')->where('collection_id', $collectionId)->orderBy('sort_order')->orderBy('product_id')->get(['product_id']);
        foreach ($rows as $index => $row) {
            DB::table('collection_product')->where('collection_id', $collectionId)->where('product_id', $row->product_id)->update(['sort_order' => $index]);
        }
    }
}
