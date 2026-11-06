<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\SyncRecentlyViewedProductsRequest;
use App\Http\Resources\RecentlyViewedProductsResource;
use App\Models\Product;
use App\Modules\Identity\Actions\SyncRecentlyViewedProductsAction;
use Illuminate\Http\Request;

class RecentlyViewedProductController extends Controller
{
    public function index(Request $request): RecentlyViewedProductsResource
    {
        $slugs = Product::query()
            ->published()
            ->join('recently_viewed_products', 'recently_viewed_products.product_id', '=', 'products.id')
            ->where('recently_viewed_products.user_id', $request->user()->id)
            ->orderByDesc('recently_viewed_products.viewed_at')
            ->limit(12)
            ->pluck('products.slug')
            ->all();

        return RecentlyViewedProductsResource::make($slugs);
    }

    public function sync(SyncRecentlyViewedProductsRequest $request, SyncRecentlyViewedProductsAction $action): RecentlyViewedProductsResource
    {
        $slugs = $action->execute($request->user(), $request->validated('slugs'));

        return RecentlyViewedProductsResource::make($slugs);
    }
}
