<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListOperationsRequest;
use App\Http\Requests\Api\V1\Admin\SaveShippingMethodRequest;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ShippingMethodController extends Controller
{
    public function index(ListOperationsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? 'name';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumns = ['name' => 'name', 'fee' => 'fee', 'est_days' => 'est_days', 'orders_count' => 'orders_count', 'is_active' => 'is_active'];
        if (! isset($sortColumns[$field])) {
            throw ValidationException::withMessages(['sort' => 'Trường sắp xếp không được hỗ trợ cho phương thức vận chuyển.']);
        }
        $rows = ShippingMethod::query()
            ->when(isset($filters['q']), fn ($query) => $query->where('name', 'like', '%'.$filters['q'].'%'))
            ->withCount('orders')->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('id')->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }

    public function store(SaveShippingMethodRequest $request): JsonResponse
    {
        return response()->json(['data' => ShippingMethod::query()->create($request->validated())], 201);
    }

    public function update(SaveShippingMethodRequest $request, int $method): JsonResponse
    {
        $item = ShippingMethod::query()->findOrFail($method);
        $item->update($request->validated());

        return response()->json(['data' => $item]);
    }

    public function destroy(int $method): JsonResponse
    {
        $item = ShippingMethod::query()->findOrFail($method);
        if ($item->orders()->exists()) {
            throw ValidationException::withMessages(['method' => 'Phương thức đã có đơn sử dụng. Hãy tắt thay vì xóa.']);
        }
        $item->delete();

        return response()->json(['message' => 'Đã xóa phương thức vận chuyển.']);
    }
}
