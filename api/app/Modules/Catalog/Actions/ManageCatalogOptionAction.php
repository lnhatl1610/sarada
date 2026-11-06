<?php

namespace App\Modules\Catalog\Actions;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ManageCatalogOptionAction
{
    public function save(string $kind, array $data, ?int $id = null): Model
    {
        return DB::transaction(function () use ($kind, $data, $id): Model {
            $modelClass = $this->modelClass($kind);
            $record = $id === null ? new $modelClass : $modelClass::query()->findOrFail($id);
            if ($record instanceof AttributeValue) {
                $type = $kind === 'colors' ? 'color' : 'size';
                $attribute = null;
                if ($kind === 'sizes' && $id !== null && empty($data['group'])) {
                    $attribute = $record->attribute;
                }
                if ($kind === 'sizes' && ! empty($data['group'])) {
                    $attribute = Attribute::query()->where('name', $data['group'])->first();
                    if ($attribute && $attribute->type !== $type) {
                        throw ValidationException::withMessages(['group' => 'Tên nhóm này đã được dùng cho một loại thuộc tính khác.']);
                    }
                    $attribute ??= Attribute::query()->create(['name' => $data['group'], 'type' => $type]);
                    unset($data['group']);
                }
                $attribute ??= Attribute::query()->where('type', $type)->first()
                    ?? Attribute::query()->create(['type' => $type, 'name' => $type === 'color' ? 'Màu sắc' : 'Kích cỡ']);
                abort_if($id !== null && $record->attribute?->type !== $type, 404);
                $data['attribute_id'] = $attribute->id;
                if ($kind === 'sizes') {
                    unset($data['color_hex']);
                }
            } else {
                if ($id === null && empty($data['slug'])) {
                    $base = Str::slug($data['name']) ?: Str::lower(Str::random(8));
                    $slug = $base;
                    $suffix = 2;
                    while ($modelClass::query()->where('slug', $slug)->exists()) {
                        $slug = $base.'-'.$suffix++;
                    }
                    $data['slug'] = $slug;
                }
                if ($record instanceof Category && array_key_exists('parent_id', $data)) {
                    $parentId = $data['parent_id'];
                    while ($parentId !== null) {
                        if ($parentId === $id) {
                            throw ValidationException::withMessages(['parent_id' => 'Danh mục không thể là cha của chính nó hoặc tạo vòng lặp.']);
                        }
                        $parentId = Category::query()->whereKey($parentId)->value('parent_id');
                    }
                }
                if ($record instanceof Collection && ($data['is_lookbook'] ?? false)) {
                    $this->ensureCollectionCanBeFeatured($record, $data);
                    Collection::query()->orderBy('id')->lockForUpdate()->get(['id']);
                    Collection::query()->where('is_lookbook', true)->when($id !== null, fn ($query) => $query->where('id', '!=', $id))->update(['is_lookbook' => false]);
                }
            }
            $record->fill($data)->save();

            return $record;
        });
    }

    public function delete(string $kind, int $id): void
    {
        DB::transaction(function () use ($kind, $id): void {
            $modelClass = $this->modelClass($kind);
            $record = $modelClass::query()->whereKey($id)->lockForUpdate()->firstOrFail();
            if ($record instanceof AttributeValue && $record->attribute?->type !== ($kind === 'colors' ? 'color' : 'size')) {
                abort(404);
            }
            if ($record instanceof Category) {
                if ($record->products()->exists() || $record->children()->exists()) {
                    $this->inUse('Hãy chuyển sản phẩm và danh mục con sang danh mục khác trước khi xóa.');
                }
            }
            if ($record instanceof Brand && $record->products()->exists()) {
                $this->inUse();
            }
            if ($record instanceof AttributeValue && ProductVariant::query()->where('color_value_id', $id)->orWhere('size_value_id', $id)->exists()) {
                $this->inUse();
            }
            $record->delete();
        });
    }

    private function modelClass(string $kind): string
    {
        return match ($kind) {
            'categories' => Category::class,
            'brands' => Brand::class,
            'collections' => Collection::class,
            'colors', 'sizes' => AttributeValue::class,
            default => abort(404),
        };
    }

    private function inUse(?string $message = null): never
    {
        throw new HttpResponseException(response()->json(['message' => $message ?? 'Mục này đang được sử dụng và chưa thể xóa.', 'code' => 'OPTION_IN_USE'], 409));
    }

    private function ensureCollectionCanBeFeatured(Collection $collection, array $data): void
    {
        $active = (bool) ($data['is_active'] ?? $collection->is_active);
        $startsAt = array_key_exists('starts_at', $data) ? $data['starts_at'] : $collection->starts_at;
        $endsAt = array_key_exists('ends_at', $data) ? $data['ends_at'] : $collection->ends_at;
        $now = now();
        $hasStarted = $startsAt === null || Carbon::parse($startsAt)->lte($now);
        $hasNotEnded = $endsAt === null || Carbon::parse($endsAt)->gt($now);

        if (! $active || ! $hasStarted || ! $hasNotEnded) {
            throw ValidationException::withMessages(['is_lookbook' => 'Chỉ có thể chọn bộ sưu tập đang được xuất bản.']);
        }
    }
}
