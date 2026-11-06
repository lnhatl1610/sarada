<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListCustomerVouchersRequest;
use App\Http\Resources\CustomerVoucherResource;
use App\Modules\Promotions\Actions\GetCustomerVoucherWalletAction;
use Illuminate\Http\JsonResponse;

class VoucherWalletController extends Controller
{
    public function index(ListCustomerVouchersRequest $request, GetCustomerVoucherWalletAction $action): JsonResponse
    {
        $data = $request->validated();
        $vouchers = $action->execute(
            (int) $request->user()->id,
            (int) ($data['page'] ?? 1),
            (int) ($data['per_page'] ?? 20),
            $data['status'] ?? null,
        );

        return response()->json([
            'data' => CustomerVoucherResource::collection($vouchers->items()),
            'meta' => [
                'current_page' => $vouchers->currentPage(),
                'last_page' => $vouchers->lastPage(),
                'per_page' => $vouchers->perPage(),
                'total' => $vouchers->total(),
            ],
        ]);
    }
}
