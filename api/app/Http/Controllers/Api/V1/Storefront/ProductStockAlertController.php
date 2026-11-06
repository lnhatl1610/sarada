<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\StoreProductStockAlertRequest;
use App\Modules\Catalog\Actions\SubscribeToProductStockAlertAction;
use Illuminate\Http\JsonResponse;

class ProductStockAlertController extends Controller
{
    public function store(StoreProductStockAlertRequest $request, string $slug, SubscribeToProductStockAlertAction $action): JsonResponse
    {
        $data = $request->validated();
        $action->execute($slug, (int) $data['variant_id'], $data['email'] ?? null, $data['phone'] ?? null);

        return response()->json([
            'data' => ['message' => isset($data['phone'])
                ? 'Đã đăng ký. Cửa hàng sẽ gửi tin nhắn khi sản phẩm có hàng trở lại.'
                : 'Đã đăng ký. Cửa hàng sẽ gửi email khi sản phẩm có hàng trở lại.'],
        ], 202);
    }
}
