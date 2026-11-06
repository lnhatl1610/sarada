<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Models\ProductPriceAlert;
use App\Modules\Catalog\Actions\SubscribeToProductPriceAlertAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductPriceAlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $productIds = ProductPriceAlert::query()->where('user_id', $request->user()->id)
            ->where('is_active', true)->orderBy('product_id')->pluck('product_id')->all();

        return response()->json(['data' => ['product_ids' => $productIds]]);
    }

    public function store(Request $request, int $product, SubscribeToProductPriceAlertAction $action): JsonResponse
    {
        $alert = $action->execute((int) $request->user()->id, $product);

        return response()->json(['data' => [
            'enabled' => true,
            'reference_price' => $alert->reference_price,
            'message' => 'Đã đăng ký nhận email khi giá sản phẩm giảm.',
        ]]);
    }

    public function destroy(Request $request, int $product): JsonResponse
    {
        ProductPriceAlert::query()->where('user_id', $request->user()->id)->where('product_id', $product)->delete();

        return response()->json(['message' => 'Đã tắt thông báo giảm giá cho sản phẩm.']);
    }
}
