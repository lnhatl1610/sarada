<?php

namespace App\Modules\Catalog\Actions;

use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class BulkManageProductsAction
{
    /** @param array{ids: list<int>, action: string, category_id?: int, collection_ids?: list<int>, tag_ids?: list<int>} $data */
    public function execute(array $data, User $actor): int
    {
        if ($data['action'] === 'archive' && ! $this->canDeleteProducts($actor)) {
            throw new AccessDeniedHttpException('Bạn không có quyền lưu trữ sản phẩm.');
        }

        return DB::transaction(function () use ($data): int {
            $products = Product::query()->whereIn('id', $data['ids'])->orderBy('id')->lockForUpdate()->get();

            foreach ($products as $product) {
                match ($data['action']) {
                    'activate' => $product->update(['status' => 'active']),
                    'hide' => $product->update(['status' => 'hidden']),
                    'archive' => $product->delete(),
                    'feature' => $product->update(['is_featured' => true]),
                    'unfeature' => $product->update(['is_featured' => false]),
                    'assign_category' => $product->update(['category_id' => $data['category_id']]),
                    'assign_collections' => $product->collections()->syncWithoutDetaching($data['collection_ids']),
                    'assign_tags' => $product->tags()->syncWithoutDetaching($data['tag_ids']),
                };
            }

            return $products->count();
        });
    }

    private function canDeleteProducts(User $actor): bool
    {
        return $actor->hasAdminPermission('products.delete');
    }
}
