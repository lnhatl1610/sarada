<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdjustInventoryRequest;
use App\Http\Requests\Api\V1\Admin\CreateInventoryAdjustmentBatchRequest;
use App\Http\Requests\Api\V1\Admin\ImportInventoryCsvRequest;
use App\Http\Requests\Api\V1\Admin\ListInventoryMovementsRequest;
use App\Http\Requests\Api\V1\Admin\ListInventoryRequest;
use App\Http\Requests\Api\V1\Admin\UpdateInventoryThresholdRequest;
use App\Models\ImportJob;
use App\Models\InventoryAdjustmentBatch;
use App\Modules\Inventory\Actions\AdjustInventoryAction;
use App\Modules\Inventory\Actions\CreateInventoryAdjustmentBatchAction;
use App\Modules\Inventory\Actions\UpdateInventoryThresholdAction;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InventoryController extends Controller
{
    public function export(ListInventoryRequest $request): StreamedResponse
    {
        $filters = $request->validated();
        $rows = $this->orderedRows($filters)->cursor();

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, ['SKU', 'Sản phẩm', 'Tồn', 'Đang giữ', 'Khả dụng', 'Ngưỡng thấp']);
            foreach ($rows as $row) {
                fputcsv($handle, [$row->sku, $row->product_name, $row->quantity, $row->reserved, $row->quantity - $row->reserved, $row->low_stock_threshold]);
            }
            fclose($handle);
        }, 'inventory-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function importCsv(ImportInventoryCsvRequest $request, AdjustInventoryAction $action): JsonResponse
    {
        $validated = $request->validated();
        $handle = fopen($validated['file']->getRealPath(), 'rb');
        $headers = fgetcsv($handle);
        $headers = $headers ? array_map(static fn ($header) => strtolower(trim((string) $header)), $headers) : [];
        if ($headers !== ['sku', 'quantity', 'note']) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'CSV phải có đúng ba cột: sku, quantity, note.']);
        }

        $rows = [];
        $line = 1;
        while (($values = fgetcsv($handle)) !== false) {
            $line++;
            if (count($values) !== 3 || trim((string) $values[0]) === '') {
                $rows[] = ['line' => $line, 'error' => 'Thiếu SKU hoặc sai số cột.'];

                continue;
            }
            $quantity = filter_var($values[1], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 100000]]);
            if ($quantity === false) {
                $rows[] = ['line' => $line, 'error' => 'Số lượng phải là số nguyên từ 1 đến 100000.'];

                continue;
            }
            $rows[] = ['line' => $line, 'sku' => trim((string) $values[0]), 'quantity' => $quantity, 'note' => trim((string) $values[2])];
        }
        fclose($handle);
        $errors = [];
        $updated = 0;

        if ($request->boolean('preview')) {
            $validRows = [];
            foreach ($rows as $row) {
                if (isset($row['error'])) {
                    $errors[] = $row;

                    continue;
                }
                $validRows[] = $row;
            }
            $existingSkus = [];
            $skus = array_values(array_unique(array_column($validRows, 'sku')));
            foreach (array_chunk($skus, 1000) as $skuChunk) {
                $found = DB::table('inventories')
                    ->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')
                    ->whereIn('product_variants.sku', $skuChunk)
                    ->pluck('product_variants.sku');
                foreach ($found as $sku) {
                    $existingSkus[mb_strtolower((string) $sku)] = true;
                }
            }
            foreach ($validRows as $row) {
                if (! isset($existingSkus[mb_strtolower($row['sku'])])) {
                    $errors[] = ['line' => $row['line'], 'sku' => $row['sku'], 'error' => 'Không tìm thấy SKU.'];
                }
            }

            return response()->json(['data' => ['updated' => 0, 'errors' => $errors]]);
        }

        $importJob = ImportJob::query()->create([
            'user_id' => $request->user()->id,
            'type' => 'inventory_csv',
            'source_filename' => mb_substr(basename($validated['file']->getClientOriginalName()), 0, 255),
            'status' => 'processing',
            'total_rows' => count($rows),
        ]);

        try {
            DB::transaction(function () use ($rows, $request, $action, &$errors, &$updated): void {
                foreach ($rows as $row) {
                    if (isset($row['error'])) {
                        $errors[] = $row;

                        continue;
                    }
                    $inventory = DB::table('inventories')->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')->where('product_variants.sku', $row['sku'])->select('inventories.*')->lockForUpdate()->first();
                    if (! $inventory) {
                        $errors[] = ['line' => $row['line'], 'sku' => $row['sku'], 'error' => 'Không tìm thấy SKU.'];

                        continue;
                    }
                    $action->execute((int) $inventory->variant_id, (int) $row['quantity'], $row['note'] ?: 'CSV import', (int) $request->user()->id, 'import', 'csv_import');
                    $updated++;
                }
            });
        } catch (\Throwable $exception) {
            $importJob->update(['status' => 'failed', 'error_message' => 'Không thể hoàn tất nhập kho.']);
            throw $exception;
        }

        $importJob->update([
            'status' => $errors ? 'completed_with_errors' : 'completed',
            'successful_rows' => $updated,
            'failed_rows' => count($errors),
            'error_rows' => $errors ?: null,
        ]);

        return response()->json(['data' => ['updated' => $updated, 'errors' => $errors, 'import_id' => $importJob->id]], $errors ? 207 : 200);
    }

    public function index(ListInventoryRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $countFilters = $filters;
        unset($countFilters['stock_status'], $countFilters['page'], $countFilters['per_page'], $countFilters['sort']);
        $statusExpression = "CASE WHEN inventories.quantity - inventories.reserved <= 0 THEN 'out' WHEN inventories.quantity - inventories.reserved <= inventories.low_stock_threshold THEN 'low' ELSE 'available' END";
        $statusCounts = array_replace(['available' => 0, 'low' => 0, 'out' => 0], $this->queryRows($countFilters)
            ->select([])->selectRaw($statusExpression.' as status_key')->selectRaw('COUNT(*) as row_count')->groupBy('status_key')
            ->pluck('row_count', 'status_key')->map(static fn ($count): int => (int) $count)->all());
        $statusCounts['all'] = array_sum($statusCounts);
        $rows = $this->orderedRows($filters)->paginate($filters['per_page'] ?? 30);

        $categories = DB::table('categories as categories')
            ->leftJoin('categories as parents', 'parents.id', '=', 'categories.parent_id')
            ->whereNull('categories.deleted_at')
            ->orderBy('categories.sort_order')
            ->orderBy('categories.name')
            ->get(['categories.id', 'categories.name', 'parents.name as parent_name']);

        return response()->json([
            'data' => $rows->items(),
            'meta' => [
                'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total(),
            ],
            'filters' => [
                'status_counts' => $statusCounts,
                'categories' => $categories,
                'brands' => DB::table('brands')->orderBy('name')->get(['id', 'name']),
                'colors' => DB::table('attributes')->join('attribute_values', 'attribute_values.attribute_id', '=', 'attributes.id')->where('attributes.type', 'color')->orderBy('attribute_values.sort_order')->orderBy('attribute_values.value')->get(['attribute_values.id', 'attribute_values.value']),
                'sizes' => DB::table('attributes')->join('attribute_values', 'attribute_values.attribute_id', '=', 'attributes.id')->where('attributes.type', 'size')->orderBy('attributes.name')->orderBy('attribute_values.sort_order')->orderBy('attribute_values.value')->get(['attribute_values.id', 'attribute_values.value', 'attributes.name as group_name']),
            ],
        ]);
    }

    private function queryRows(array $filters): Builder
    {
        $latestMovementIds = DB::table('inventory_movements')
            ->selectRaw('variant_id, MAX(id) as movement_id')
            ->groupBy('variant_id');

        return DB::table('inventories')
            ->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoinSub($latestMovementIds, 'latest_inventory_movements', fn ($join) => $join->on('latest_inventory_movements.variant_id', '=', 'product_variants.id'))
            ->leftJoin('inventory_movements as last_movement', 'last_movement.id', '=', 'latest_inventory_movements.movement_id')
            ->leftJoin('attribute_values as color_values', 'color_values.id', '=', 'product_variants.color_value_id')
            ->leftJoin('attribute_values as size_values', 'size_values.id', '=', 'product_variants.size_value_id')
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search->where('products.name', 'like', '%'.$filters['q'].'%')->orWhere('product_variants.sku', 'like', '%'.$filters['q'].'%')->orWhere('product_variants.barcode', 'like', '%'.$filters['q'].'%')))
            ->when(($filters['low_stock'] ?? false), fn ($query) => $query->whereRaw('inventories.quantity - inventories.reserved <= inventories.low_stock_threshold'))
            ->when(isset($filters['stock_status']), function ($query) use ($filters): void {
                match ($filters['stock_status']) {
                    'available' => $query->whereRaw('inventories.quantity - inventories.reserved > inventories.low_stock_threshold'),
                    'low' => $query->whereRaw('inventories.quantity - inventories.reserved > 0 AND inventories.quantity - inventories.reserved <= inventories.low_stock_threshold'),
                    'out' => $query->whereRaw('inventories.quantity - inventories.reserved <= 0'),
                };
            })
            ->when(isset($filters['category_id']), fn ($query) => $query->where('products.category_id', $filters['category_id']))
            ->when(isset($filters['brand_id']), fn ($query) => $query->where('products.brand_id', $filters['brand_id']))
            ->when(isset($filters['color_value_id']), fn ($query) => $query->where('product_variants.color_value_id', $filters['color_value_id']))
            ->when(isset($filters['size_value_id']), fn ($query) => $query->where('product_variants.size_value_id', $filters['size_value_id']))
            ->select([
                'inventories.id', 'inventories.variant_id', 'inventories.quantity', 'inventories.reserved', 'inventories.low_stock_threshold',
                'product_variants.sku', 'product_variants.barcode', 'product_variants.price',
                'product_variants.color_value_id', 'product_variants.size_value_id',
                'color_values.value as color_name', 'size_values.value as size_name',
                'products.name as product_name', 'products.slug as product_slug', 'products.thumbnail',
                'last_movement.created_at as last_movement_at', 'last_movement.type as last_movement_type', 'last_movement.quantity_change as last_movement_change',
            ]);
    }

    private function orderedRows(array $filters): Builder
    {
        $query = $this->queryRows($filters);
        $sort = $filters['sort'] ?? 'product_name';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $direction = $descending ? 'desc' : 'asc';

        if ($field === 'available') {
            $query->orderByRaw('(inventories.quantity - inventories.reserved) '.$direction);
        } else {
            $columns = [
                'product_name' => 'products.name',
                'sku' => 'product_variants.sku',
                'quantity' => 'inventories.quantity',
                'low_stock_threshold' => 'inventories.low_stock_threshold',
            ];
            $query->orderBy($columns[$field], $direction);
        }

        return $query->orderBy('products.name')->orderBy('product_variants.sku')->orderBy('product_variants.id');
    }

    public function movements(ListInventoryMovementsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $rows = $this->movementRows($filters)->paginate($filters['per_page'] ?? 30);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(), 'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ], 'filters' => ['actors' => DB::table('users')->join('inventory_movements', 'inventory_movements.created_by', '=', 'users.id')->select('users.id', 'users.name')->distinct()->orderBy('users.name')->get()]]);
    }

    public function exportMovements(ListInventoryMovementsRequest $request): StreamedResponse
    {
        $filters = $request->validated();

        return response()->streamDownload(function () use ($filters): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, ['Thời gian', 'SKU', 'Sản phẩm', 'Loại', 'Biến động', 'Tồn sau', 'Tham chiếu', 'Mã tham chiếu', 'Ghi chú', 'Người thực hiện']);
            foreach ($this->movementRows($filters)->cursor() as $row) {
                fputcsv($handle, [$row->created_at, $row->sku, $row->product_name, $row->type, $row->quantity_change, $row->stock_after, $row->reference_type, $row->reference_id, $row->note, $row->actor_name]);
            }
            fclose($handle);
        }, 'inventory-movements-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function movementRows(array $filters): Builder
    {
        $sort = $filters['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumn = ['created_at' => 'inventory_movements.created_at', 'quantity_change' => 'inventory_movements.quantity_change', 'stock_after' => 'inventory_movements.stock_after', 'sku' => 'product_variants.sku'][$field];

        return DB::table('inventory_movements')
            ->join('product_variants', 'product_variants.id', '=', 'inventory_movements.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('users', 'users.id', '=', 'inventory_movements.created_by')
            ->when(isset($filters['variant_id']), fn ($query) => $query->where('inventory_movements.variant_id', $filters['variant_id']))
            ->when(isset($filters['type']), fn ($query) => $query->where('inventory_movements.type', $filters['type']))
            ->when(isset($filters['actor_id']), fn ($query) => $query->where('inventory_movements.created_by', $filters['actor_id']))
            ->when(isset($filters['sku']), fn ($query) => $query->where('product_variants.sku', 'like', '%'.$filters['sku'].'%'))
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search->where('product_variants.sku', 'like', '%'.$filters['q'].'%')->orWhere('products.name', 'like', '%'.$filters['q'].'%')->orWhere('inventory_movements.note', 'like', '%'.$filters['q'].'%')))
            ->when(isset($filters['date_from']), fn ($query) => $query->whereDate('inventory_movements.created_at', '>=', $filters['date_from']))
            ->when(isset($filters['date_to']), fn ($query) => $query->whereDate('inventory_movements.created_at', '<=', $filters['date_to']))
            ->select('inventory_movements.*', 'product_variants.sku', 'products.name as product_name', 'users.name as actor_name')
            ->orderBy($sortColumn, $descending ? 'desc' : 'asc')
            ->orderByDesc('inventory_movements.id');
    }

    public function adjust(AdjustInventoryRequest $request, AdjustInventoryAction $action, int $variantId): JsonResponse
    {
        $result = $action->execute(
            $variantId,
            (int) $request->validated('quantity_change'),
            $request->validated('reason'),
            (int) $request->user()->getAuthIdentifier(),
            $request->validated('type', 'adjust'),
            $request->validated('type', 'adjust') === 'import' ? 'manual_import' : 'manual_adjustment',
        );
        $inventory = $result['inventory'];
        $movement = $result['movement'];

        return response()->json(['data' => [
            'variant_id' => $inventory->variant_id,
            'quantity' => $inventory->quantity,
            'reserved' => $inventory->reserved,
            'low_stock_threshold' => $inventory->low_stock_threshold,
            'movement' => [
                'id' => $movement->id,
                'type' => $movement->type,
                'quantity_change' => $movement->quantity_change,
                'stock_after' => $movement->stock_after,
            ],
        ]]);
    }

    public function updateThreshold(UpdateInventoryThresholdRequest $request, UpdateInventoryThresholdAction $action): JsonResponse
    {
        $data = $request->validated();
        $updated = $action->execute($data['variant_ids'], (int) $data['low_stock_threshold']);

        return response()->json(['message' => "Đã cập nhật ngưỡng cảnh báo cho {$updated} biến thể.", 'data' => ['updated' => $updated, 'low_stock_threshold' => (int) $data['low_stock_threshold']]]);
    }

    public function createAdjustmentBatch(CreateInventoryAdjustmentBatchRequest $request, CreateInventoryAdjustmentBatchAction $action): JsonResponse
    {
        $result = $action->execute($request->validated(), (int) $request->user()->getAuthIdentifier());

        return response()->json(['data' => [
            'id' => $result['batch']->id,
            'code' => $result['batch']->code,
            'reason_category' => $result['batch']->reason_category,
            'note' => $result['batch']->note,
            'created_at' => $result['batch']->created_at,
            'rows' => $result['movements'],
        ]], 201);
    }

    public function showAdjustmentBatch(int $batch): JsonResponse
    {
        $record = InventoryAdjustmentBatch::query()->with('creator:id,name')->findOrFail($batch);
        $rows = DB::table('inventory_movements')
            ->join('product_variants', 'product_variants.id', '=', 'inventory_movements.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('inventory_movements.reference_type', 'inventory_adjustment_batch')
            ->where('inventory_movements.reference_id', $record->id)
            ->orderBy('product_variants.sku')
            ->get(['product_variants.sku', 'products.name as product_name', 'inventory_movements.quantity_change', 'inventory_movements.stock_after', 'inventory_movements.note']);

        return response()->json(['data' => [
            'id' => $record->id,
            'code' => $record->code,
            'reason_category' => $record->reason_category,
            'note' => $record->note,
            'created_at' => $record->created_at,
            'creator_name' => $record->creator?->name,
            'rows' => $rows,
        ]]);
    }
}
