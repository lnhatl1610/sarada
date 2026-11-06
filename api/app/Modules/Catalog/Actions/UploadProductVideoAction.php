<?php

namespace App\Modules\Catalog\Actions;

use App\Models\Product;
use App\Models\ProductVideo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UploadProductVideoAction
{
    public function execute(Product $product, UploadedFile $file, ?string $caption, ?int $colorValueId): ProductVideo
    {
        $path = $file->storePublicly("products/{$product->id}/videos", 'public');

        try {
            return DB::transaction(fn (): ProductVideo => $product->videos()->create([
                'url' => Storage::disk('public')->url($path),
                'caption' => $caption,
                'color_value_id' => $colorValueId,
                'sort_order' => (int) $product->videos()->max('sort_order') + 1,
            ]));
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($path);
            throw $exception;
        }
    }
}
