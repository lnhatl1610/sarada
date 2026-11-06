<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\StoreAccountProductStockAlertRequest;
use App\Models\Product;
use App\Modules\Catalog\Actions\SubscribeToProductStockAlertAction;
use Illuminate\Http\JsonResponse;

class AccountProductStockAlertController extends Controller
{
    public function store(StoreAccountProductStockAlertRequest $request, int $product, SubscribeToProductStockAlertAction $action): JsonResponse
    {
        $productRecord = Product::query()->published()->findOrFail($product);
        $action->execute($productRecord->slug, (int) $request->validated('variant_id'), $request->user()->email, null, (int) $request->user()->id);

        return response()->json(['message' => 'Đã đăng ký. Cửa hàng sẽ gửi email khi sản phẩm có hàng trở lại.'], 202);
    }
}
