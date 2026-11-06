<?php

namespace App\Modules\Inventory\Actions;

use App\Models\InventoryAdjustmentBatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateInventoryAdjustmentBatchAction
{
    public function __construct(private readonly AdjustInventoryAction $adjustInventory) {}

    /** @param array{reason_category: string, note?: string|null, rows: array<int, array{variant_id: int, quantity_change: int}>} $data
     * @return array{batch: InventoryAdjustmentBatch, movements: array<int, array<string, mixed>>}
     */
    public function execute(array $data, int $actorId): array
    {
        return DB::transaction(function () use ($data, $actorId): array {
            $rows = $data['rows'];
            usort($rows, static fn (array $a, array $b): int => $a['variant_id'] <=> $b['variant_id']);
            $batch = InventoryAdjustmentBatch::query()->create([
                'code' => 'PENDING-'.bin2hex(random_bytes(8)),
                'reason_category' => $data['reason_category'],
                'note' => $data['note'] ?? null,
                'created_by' => $actorId,
            ]);
            $batch->code = 'DC-'.now()->format('Ymd').'-'.str_pad((string) $batch->id, 6, '0', STR_PAD_LEFT);
            $batch->save();

            $category = ['stocktake' => 'Kiểm kê', 'damage' => 'Hàng hỏng', 'loss' => 'Thất thoát', 'other' => 'Khác'][$data['reason_category']];
            $note = (string) ($data['note'] ?? '');
            $movementNote = $category.($note !== '' ? ': '.$note : '');
            $movements = [];
            foreach ($rows as $row) {
                try {
                    $result = $this->adjustInventory->execute((int) $row['variant_id'], (int) $row['quantity_change'], $movementNote, $actorId, 'adjust', 'inventory_adjustment_batch', $batch->id);
                } catch (ValidationException $exception) {
                    throw ValidationException::withMessages(['rows' => "Không thể điều chỉnh SKU thuộc biến thể {$row['variant_id']}: ".collect($exception->errors())->flatten()->first()]);
                }
                $movements[] = [
                    'variant_id' => $result['inventory']->variant_id,
                    'sku' => $result['inventory']->variant?->sku,
                    'quantity' => $result['inventory']->quantity,
                    'quantity_change' => $result['movement']->quantity_change,
                    'stock_after' => $result['movement']->stock_after,
                ];
            }

            return ['batch' => $batch, 'movements' => $movements];
        });
    }
}
