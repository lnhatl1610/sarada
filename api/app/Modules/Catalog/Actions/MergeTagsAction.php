<?php

namespace App\Modules\Catalog\Actions;

use App\Models\Tag;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MergeTagsAction
{
    /** @param list<int> $sourceIds */
    public function execute(int $targetId, array $sourceIds): Tag
    {
        if (in_array($targetId, $sourceIds, true)) {
            throw ValidationException::withMessages(['source_ids' => 'Không thể gộp thẻ đích vào chính nó.']);
        }

        return DB::transaction(function () use ($targetId, $sourceIds): Tag {
            $ids = [...$sourceIds, $targetId];
            $tags = Tag::query()->whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            if ($tags->count() !== count(array_unique($ids))) {
                throw ValidationException::withMessages(['source_ids' => 'Một hoặc nhiều thẻ không còn tồn tại.']);
            }

            $target = $tags->get($targetId);
            foreach ($sourceIds as $sourceId) {
                $source = $tags->get($sourceId);
                $target->products()->syncWithoutDetaching($source->products()->pluck('products.id')->all());
                $source->delete();
            }

            return $target->loadCount('products');
        });
    }
}
