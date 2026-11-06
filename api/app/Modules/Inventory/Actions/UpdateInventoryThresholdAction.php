<?php

namespace App\Modules\Inventory\Actions;

use App\Models\Inventory;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateInventoryThresholdAction
{
    /** @param array<int, int> $variantIds */
    public function execute(array $variantIds, int $threshold): int
    {
        return DB::transaction(function () use ($variantIds, $threshold): int {
            $rows = Inventory::query()->whereIn('variant_id', $variantIds)->lockForUpdate()->get();
            if ($rows->count() !== count($variantIds)) {
                throw ValidationException::withMessages(['variant_ids' => 'Một hoặc nhiều biến thể không còn tồn tại trong kho.']);
            }

            foreach ($rows as $row) {
                $row->low_stock_threshold = $threshold;
                $row->save();
            }

            return $rows->count();
        });
    }
}
