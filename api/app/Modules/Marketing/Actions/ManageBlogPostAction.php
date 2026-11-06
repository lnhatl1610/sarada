<?php

namespace App\Modules\Marketing\Actions;

use App\Models\BlogPost;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManageBlogPostAction
{
    public function save(array $data, ?BlogPost $post = null): BlogPost
    {
        return DB::transaction(function () use ($data, $post): BlogPost {
            $productIds = $data['product_ids'] ?? ($post?->products()->pluck('products.id')->all() ?? []);
            unset($data['product_ids']);
            $data['category_slug'] = Str::slug($data['category_name']);
            $data['published_at'] = ($data['is_published'] ?? false)
                ? ($data['published_at'] ?? $post?->published_at ?? now())
                : ($data['published_at'] ?? null);

            $record = $post ?? new BlogPost;
            $record->fill($data);
            $record->save();
            $record->products()->sync(collect($productIds)->values()->mapWithKeys(fn ($id, $index) => [$id => ['sort_order' => $index]])->all());

            return $record->load('products');
        });
    }
}
