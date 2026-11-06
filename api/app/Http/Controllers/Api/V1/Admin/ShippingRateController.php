<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListOperationsRequest;
use App\Http\Requests\Api\V1\Admin\SaveShippingRateRequest;
use App\Models\ShippingRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ShippingRateController extends Controller
{
    public function index(ListOperationsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? 'province_name';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumns = ['province_name' => 'province_name', 'province_code' => 'province_code', 'fee' => 'fee', 'free_shipping_threshold' => 'free_shipping_threshold', 'is_active' => 'is_active'];
        if (! isset($sortColumns[$field])) {
            throw ValidationException::withMessages(['sort' => 'Trường sắp xếp phí theo tỉnh/thành không hợp lệ.']);
        }

        $rows = ShippingRate::query()
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search->where('province_name', 'like', '%'.$filters['q'].'%')->orWhere('province_code', 'like', '%'.$filters['q'].'%')))
            ->when(isset($filters['status']), fn ($query) => $query->where('is_active', $filters['status'] === 'active'))
            ->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }

    public function store(SaveShippingRateRequest $request): JsonResponse
    {
        return response()->json(['data' => ShippingRate::query()->create($request->validated())], 201);
    }

    public function update(SaveShippingRateRequest $request, int $rate): JsonResponse
    {
        $item = ShippingRate::query()->findOrFail($rate);
        $item->update($request->validated());

        return response()->json(['data' => $item->refresh()]);
    }

    public function destroy(int $rate): JsonResponse
    {
        ShippingRate::query()->findOrFail($rate)->delete();

        return response()->json(['message' => 'Đã xóa mức phí tỉnh/thành.']);
    }
}
