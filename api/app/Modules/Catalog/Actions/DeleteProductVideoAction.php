<?php

namespace App\Modules\Catalog\Actions;

use App\Models\ProductVideo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DeleteProductVideoAction
{
    public function execute(ProductVideo $video): void
    {
        $path = parse_url($video->url, PHP_URL_PATH);
        $storagePath = is_string($path) ? preg_replace('#^/storage/#', '', $path) : null;

        DB::transaction(fn () => $video->delete());

        $expectedPrefix = "products/{$video->product_id}/videos/";
        if (is_string($storagePath) && str_starts_with($storagePath, $expectedPrefix)) {
            Storage::disk('public')->delete($storagePath);
        }
    }
}
