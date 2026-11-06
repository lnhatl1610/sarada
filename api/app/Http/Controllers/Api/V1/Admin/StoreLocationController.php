<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListStoreLocationsRequest;
use App\Http\Requests\Api\V1\Admin\SaveStoreLocationRequest;
use App\Http\Resources\StoreLocationResource;
use App\Models\StoreLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StoreLocationController extends Controller
{
    public function index(ListStoreLocationsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $locations = StoreLocation::query()
            ->when($filters['q'] ?? null, fn ($query, $value) => $query->where(fn ($query) => $query
                ->where('name', 'like', '%'.$value.'%')
                ->orWhere('address', 'like', '%'.$value.'%')
                ->orWhere('phone', 'like', '%'.$value.'%')))
            ->when($filters['province_code'] ?? null, fn ($query, $value) => $query->where('province_code', $value))
            ->when(isset($filters['status']), fn ($query) => $query->where('is_active', $filters['status'] === 'active'))
            ->orderBy('province_name')->orderBy('sort_order')->orderBy('name')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json([
            'data' => StoreLocationResource::collection($locations->items()),
            'meta' => [
                'current_page' => $locations->currentPage(),
                'last_page' => $locations->lastPage(),
                'per_page' => $locations->perPage(),
                'total' => $locations->total(),
            ],
        ]);
    }

    public function store(SaveStoreLocationRequest $request): JsonResponse
    {
        return response()->json(['data' => new StoreLocationResource(StoreLocation::query()->create($request->validated()))], 201);
    }

    public function update(SaveStoreLocationRequest $request, StoreLocation $store): StoreLocationResource
    {
        $store->update($request->validated());

        return new StoreLocationResource($store->refresh());
    }

    public function destroy(StoreLocation $store): JsonResponse
    {
        if (DB::table('orders')->where('pickup_location_id', $store->id)->whereIn('status', ['pending', 'confirmed', 'processing', 'shipping', 'delivery_failed'])->exists()) {
            throw ValidationException::withMessages(['store' => 'Cửa hàng còn đơn nhận hàng đang xử lý. Hãy đóng các đơn này trước khi xóa.']);
        }
        if (DB::table('store_location_inventories')->where('store_location_id', $store->id)->exists() || DB::table('inventory_movements')->where('store_location_id', $store->id)->exists()) {
            throw ValidationException::withMessages(['store' => 'Cửa hàng đã có dữ liệu tồn kho hoặc lịch sử giao dịch. Hãy ngừng xuất bản thay vì xóa để giữ nhật ký.']);
        }
        $store->delete();

        return response()->json(['message' => 'Đã xóa cửa hàng.']);
    }
}
