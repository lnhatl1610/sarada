<?php

namespace App\Actions\Catalog;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SyncProductTags
{
    /** @param array<int, string> $names */
    public function handle(Product $product, array $names): void
    {
        $tagIds = [];

        foreach ($names as $rawName) {
            $name = trim($rawName);
            $slug = Str::slug($name);
            if ($name === '' || $slug === '') {
                continue;
            }

            DB::table('tags')->insertOrIgnore([
                'name' => mb_substr($name, 0, 50),
                'slug' => mb_substr($slug, 0, 80),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $tagId = DB::table('tags')->where('slug', mb_substr($slug, 0, 80))->value('id');
            if ($tagId !== null) {
                $tagIds[] = (int) $tagId;
            }
        }

        $product->tags()->sync(array_values(array_unique($tagIds)));
    }
}
