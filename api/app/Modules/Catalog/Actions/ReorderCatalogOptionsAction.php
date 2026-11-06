<?php

namespace App\Modules\Catalog\Actions;

use App\Models\AttributeValue;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReorderCatalogOptionsAction
{
    /** @param array<int, array{id: int, sort_order: int, parent_id?: int|null}> $items */
    public function execute(string $kind, array $items): void
    {
        DB::transaction(function () use ($kind, $items): void {
            if ($kind === 'categories') {
                $this->reorderCategories($items);

                return;
            }

            $attributeType = $kind === 'colors' ? 'color' : 'size';
            $values = AttributeValue::query()->whereHas('attribute', fn ($query) => $query->where('type', $attributeType))
                ->orderBy('id')->lockForUpdate()->get()->keyBy('id');

            foreach ($items as $item) {
                if (! $values->has($item['id'])) {
                    throw ValidationException::withMessages(['items' => 'Chỉ có thể sắp xếp các kích cỡ hợp lệ.']);
                }

                $values->get($item['id'])->update(['sort_order' => $item['sort_order']]);
            }
        });
    }

    /** @param array<int, array{id: int, sort_order: int, parent_id?: int|null}> $items */
    private function reorderCategories(array $items): void
    {
        $categories = Category::query()->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        $parents = $categories->mapWithKeys(fn (Category $category): array => [(int) $category->id => $category->parent_id === null ? null : (int) $category->parent_id])->all();

        foreach ($items as $item) {
            $id = (int) $item['id'];
            if (! $categories->has($id)) {
                throw ValidationException::withMessages(['items' => 'Danh mục cần sắp xếp không còn tồn tại.']);
            }

            if (array_key_exists('parent_id', $item)) {
                $parentId = $item['parent_id'] === null ? null : (int) $item['parent_id'];
                if ($parentId !== null && ! $categories->has($parentId)) {
                    throw ValidationException::withMessages(['items' => 'Danh mục cha không hợp lệ.']);
                }
                $parents[$id] = $parentId;
            }
        }

        $this->assertAcyclic($parents);

        foreach ($items as $item) {
            $updates = ['sort_order' => $item['sort_order']];
            if (array_key_exists('parent_id', $item)) {
                $updates['parent_id'] = $item['parent_id'];
            }
            Category::query()->whereKey($item['id'])->update($updates);
        }
    }

    /** @param array<int, int|null> $parents */
    private function assertAcyclic(array $parents): void
    {
        foreach (array_keys($parents) as $startId) {
            $visited = [];
            $currentId = $startId;
            while ($currentId !== null) {
                if (isset($visited[$currentId])) {
                    throw ValidationException::withMessages(['items' => 'Không thể đổi cha vì thao tác sẽ tạo vòng lặp danh mục.']);
                }

                $visited[$currentId] = true;
                $currentId = $parents[$currentId] ?? null;
            }
        }
    }
}
