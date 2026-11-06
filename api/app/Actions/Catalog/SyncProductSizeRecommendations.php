<?php

namespace App\Actions\Catalog;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SyncProductSizeRecommendations
{
    /** @param array<int, array{size_value_id:int, height_min_cm:numeric, height_max_cm:numeric, weight_min_kg:numeric, weight_max_kg:numeric}> $recommendations */
    public function handle(Product $product, array $recommendations): void
    {
        foreach ($recommendations as $index => $recommendation) {
            if ((float) $recommendation['height_max_cm'] <= (float) $recommendation['height_min_cm']) {
                throw ValidationException::withMessages(["recommendations.{$index}.height_max_cm" => 'Chiều cao tối đa phải lớn hơn chiều cao tối thiểu.']);
            }
            if ((float) $recommendation['weight_max_kg'] <= (float) $recommendation['weight_min_kg']) {
                throw ValidationException::withMessages(["recommendations.{$index}.weight_max_kg" => 'Cân nặng tối đa phải lớn hơn cân nặng tối thiểu.']);
            }
        }

        $sizeIds = array_column($recommendations, 'size_value_id');
        $productSizeIds = $product->variants()->whereNotNull('size_value_id')->distinct()->pluck('size_value_id')->all();
        if (array_diff($sizeIds, $productSizeIds) !== []) {
            throw ValidationException::withMessages(['recommendations' => 'Chỉ được cấu hình size đang có trong biến thể sản phẩm.']);
        }

        DB::transaction(function () use ($product, $recommendations): void {
            $product->sizeRecommendations()->delete();
            if ($recommendations !== []) {
                $product->sizeRecommendations()->createMany($recommendations);
            }
        });
    }
}
