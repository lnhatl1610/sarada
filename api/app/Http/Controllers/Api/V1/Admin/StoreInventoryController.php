<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdjustStoreInventoryRequest;
use App\Models\StoreLocation;
use App\Modules\Inventory\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreInventoryController extends Controller
{
    public function index(StoreLocation $store): JsonResponse
    {
        $rows = DB::table('product_variants')->join('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('attribute_values as color_values', 'color_values.id', '=', 'product_variants.color_value_id')
            ->leftJoin('attribute_values as size_values', 'size_values.id', '=', 'product_variants.size_value_id')
            ->leftJoin('store_location_inventories as stock', function ($join) use ($store): void {
                $join->on('stock.variant_id', '=', 'product_variants.id')->where('stock.store_location_id', '=', $store->id);
            })
            ->whereNull('products.deleted_at')->orderBy('products.name')->orderBy('product_variants.sku')
            ->get(['product_variants.id as variant_id', 'product_variants.sku', 'products.name as product_name', 'color_values.value as color', 'size_values.value as size', DB::raw('COALESCE(stock.quantity, 0) as quantity'), DB::raw('COALESCE(stock.reserved, 0) as reserved'), DB::raw('COALESCE(stock.quantity, 0) - COALESCE(stock.reserved, 0) as available')]);

        return response()->json(['data' => $rows, 'store' => ['id' => $store->id, 'name' => $store->name]]);
    }

    public function movements(Request $request, StoreLocation $store): JsonResponse
    {
        $rows = DB::table('inventory_movements')->join('product_variants', 'product_variants.id', '=', 'inventory_movements.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')->leftJoin('users', 'users.id', '=', 'inventory_movements.created_by')
            ->where('inventory_movements.store_location_id', $store->id)->orderByDesc('inventory_movements.id')
            ->select(['inventory_movements.id', 'inventory_movements.variant_id', 'product_variants.sku', 'products.name as product_name', 'inventory_movements.type', 'inventory_movements.quantity_change', 'inventory_movements.stock_after', 'inventory_movements.note', 'users.name as actor_name', 'inventory_movements.created_at'])
            ->paginate(min(100, max(1, (int) $request->query('per_page', 25))))
            ->through(fn (object $row): array => ['id' => $row->id, 'variant_id' => $row->variant_id, 'sku' => $row->sku, 'product_name' => $row->product_name, 'type' => $row->type, 'quantity_change' => $row->quantity_change, 'stock_after' => $row->stock_after, 'note' => $row->note, 'actor_name' => $row->actor_name, 'created_at' => $row->created_at]);

        return response()->json($rows);
    }

    public function adjust(AdjustStoreInventoryRequest $request, StoreLocation $store, InventoryService $inventory): JsonResponse
    {
        $data = $request->validated();
        $stock = $inventory->adjustAtStore((int) $store->id, (int) $data['variant_id'], (int) $data['quantity_change'], $data['reason'], (int) $request->user()->id);

        return response()->json(['data' => ['store_location_id' => (int) $stock->store_location_id, 'variant_id' => (int) $stock->variant_id, 'quantity' => (int) $stock->quantity, 'reserved' => (int) $stock->reserved, 'available' => (int) ($stock->quantity - $stock->reserved)]]);
    }
}
