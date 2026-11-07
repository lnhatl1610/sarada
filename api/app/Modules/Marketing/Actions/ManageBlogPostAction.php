<?php

namespace App\Modules\Marketing\Actions;

use App\Models\BlogPost;
use App\Models\BlogTag;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManageBlogPostAction
{
    public function save(array $data, ?BlogPost $post = null): BlogPost
    {
        return DB::transaction(function () use ($data, $post): BlogPost {
            $productIds = $data['product_ids'] ?? ($post?->products()->pluck('products.id')->all() ?? []);
            $tagNames = $data['tags'] ?? ($post?->tags()->pluck('name')->all() ?? []);
            unset($data['product_ids']);
            unset($data['tags']);
            $data['category_slug'] = Str::slug($data['category_name']);
            $data['published_at'] = ($data['is_published'] ?? false)
                ? ($data['published_at'] ?? $post?->published_at ?? now())
                : ($data['published_at'] ?? null);

            $record = $post ?? new BlogPost;
            $record->fill($data);
            $record->save();
            $record->products()->sync(collect($productIds)->values()->mapWithKeys(fn ($id, $index) => [$id => ['sort_order' => $index]])->all());
            $tagIds = collect($tagNames)
                ->map(fn (string $name) => preg_replace('/\s+/u', ' ', trim($name)))
                ->filter()
                ->mapWithKeys(fn (string $name) => [Str::slug($name) => $name])
                ->filter(fn (string $name, string $slug) => $slug !== '')
                ->map(fn (string $name, string $slug) => BlogTag::query()->firstOrCreate(['slug' => $slug], ['name' => $name])->id)
                ->values();
            $record->tags()->sync($tagIds);

            return $record->load(['products', 'tags']);
        });
    }
}
