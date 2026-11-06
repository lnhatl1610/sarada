<?php

namespace App\Support;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;

final class ActiveCategoryTree
{
    public static function roots(): EloquentCollection
    {
        $categories = Category::query()
            ->active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
        $categoriesById = $categories->keyBy('id');

        foreach ($categories as $category) {
            $category->setRelation('children', new EloquentCollection);
        }

        $roots = new EloquentCollection;
        foreach ($categories as $category) {
            if ($category->parent_id === null) {
                $roots->push($category);

                continue;
            }

            $parent = $categoriesById->get($category->parent_id);
            $parent?->getRelation('children')->push($category);
        }

        return $roots;
    }

    public static function flatten(EloquentCollection $roots): EloquentCollection
    {
        $flattened = new EloquentCollection;
        $pending = $roots->reverse()->values()->all();

        while ($pending !== []) {
            $category = array_pop($pending);
            $flattened->push($category);

            foreach ($category->getRelation('children')->reverse() as $child) {
                $pending[] = $child;
            }
        }

        return $flattened;
    }

    /** @return list<int> */
    public static function idsForSlug(string $slug): array
    {
        $categories = self::flatten(self::roots());
        $root = $categories->firstWhere('slug', $slug);
        if (! $root) {
            return [];
        }

        $childrenByParent = $categories->groupBy('parent_id');
        $pending = [(int) $root->id];
        $visited = [];
        while ($pending !== []) {
            $id = array_pop($pending);
            if (isset($visited[$id])) {
                continue;
            }
            $visited[$id] = $id;
            foreach ($childrenByParent->get($id, new EloquentCollection) as $child) {
                $pending[] = (int) $child->id;
            }
        }

        return array_values($visited);
    }
}
