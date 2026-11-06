<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    public const NEW_ARRIVAL_PRODUCT_SLUGS = [
        'ao-polo-cotton-pique',
        'ao-gile-linen',
        'quan-short-linen',
        'vay-quan-midi',
        'vay-so-mi-linen',
        'ao-khoac-trench-ngan',
        'ao-khoac-denim-ngan',
    ];

    public const COLLECTION_PRODUCT_SLUGS = [
        'hang-moi' => self::NEW_ARRIVAL_PRODUCT_SLUGS,
        'thu-dong-2026' => [
            'ao-khoac-blazer',
            'ao-cardigan-det-kim',
            'ao-khoac-trench-ngan',
            'ao-khoac-denim-ngan',
        ],
    ];

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $newArrivalSlugs = self::NEW_ARRIVAL_PRODUCT_SLUGS;

        $clothing = Category::query()->firstOrCreate(
            ['slug' => 'trang-phuc'],
            ['name' => 'Trang phục', 'sort_order' => 1, 'is_active' => true],
        );
        Category::query()->firstOrCreate(
            ['slug' => 'hang-moi'],
            ['name' => 'Hàng mới', 'parent_id' => $clothing->id, 'sort_order' => 1, 'is_active' => true],
        );
        $categories = [];
        foreach ([
            'ao' => ['name' => 'Áo', 'sort' => 2],
            'quan' => ['name' => 'Quần', 'sort' => 3],
            'vay' => ['name' => 'Váy', 'sort' => 4],
            'ao-khoac' => ['name' => 'Áo khoác', 'sort' => 5],
            'phu-kien' => ['name' => 'Phụ kiện', 'sort' => 6],
        ] as $slug => $categoryData) {
            $categories[$slug] = Category::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $categoryData['name'], 'parent_id' => $clothing->id, 'sort_order' => $categoryData['sort'], 'is_active' => true],
            );
        }
        $brand = Brand::query()->firstOrCreate(
            ['slug' => 'net-studio'],
            ['name' => 'Sarada', 'is_active' => true],
        );
        if (in_array($brand->name, ['NÉT Studio', 'Morrow'], true)) {
            $brand->update(['name' => 'Sarada']);
        }
        if (! $brand->logo || str_ends_with($brand->logo, '/demo-media/brands/net-studio.svg')) {
            $brand->update(['logo' => rtrim((string) config('app.url'), '/').'/demo-media/brands/net-studio-mark.png']);
        }

        $sizeAttribute = Attribute::query()->firstOrCreate(['name' => 'Kích cỡ'], ['type' => 'size']);
        $colorAttribute = Attribute::query()->firstOrCreate(['name' => 'Màu sắc'], ['type' => 'color']);

        foreach (['S', 'M', 'L', 'XL'] as $index => $size) {
            AttributeValue::query()->firstOrCreate(
                ['attribute_id' => $sizeAttribute->id, 'value' => $size],
                ['sort_order' => $index + 1],
            );
        }
        AttributeValue::query()->firstOrCreate(
            ['attribute_id' => $sizeAttribute->id, 'value' => 'One size'],
            ['sort_order' => 5],
        );
        $natural = AttributeValue::query()->firstOrCreate(
            ['attribute_id' => $colorAttribute->id, 'value' => 'Natural'],
            ['color_hex' => '#d8c9b2', 'sort_order' => 1],
        );
        $black = AttributeValue::query()->firstOrCreate(
            ['attribute_id' => $colorAttribute->id, 'value' => 'Đen'],
            ['color_hex' => '#292a27', 'sort_order' => 2],
        );
        $colors = ['Natural' => $natural, 'Đen' => $black];
        foreach ([
            'Trắng ngà' => ['#f1eee5', 3],
            'Nâu' => ['#795b49', 4],
            'Xanh rêu' => ['#66705c', 5],
            'Xanh navy' => ['#343c52', 6],
            'Hồng đất' => ['#c58a8d', 7],
        ] as $name => [$hex, $sort]) {
            $colors[$name] = AttributeValue::query()->firstOrCreate(
                ['attribute_id' => $colorAttribute->id, 'value' => $name],
                ['color_hex' => $hex, 'sort_order' => $sort],
            );
        }

        $products = [
            ['name' => 'Áo sơ mi linen dáng rộng', 'slug' => 'ao-so-mi-linen', 'price' => 690000, 'compare' => 850000, 'colors' => ['Natural'], 'category' => 'ao', 'sold' => 42],
            ['name' => 'Quần suông cotton premium', 'slug' => 'quan-suong-cotton', 'price' => 890000, 'compare' => null, 'colors' => ['Đen'], 'category' => 'quan', 'sold' => 30],
            ['name' => 'Váy midi cổ vuông', 'slug' => 'vay-midi-co-vuong', 'price' => 1190000, 'compare' => null, 'colors' => ['Natural'], 'category' => 'vay', 'sold' => 22],
            ['name' => 'Áo khoác blazer nhẹ', 'slug' => 'ao-khoac-blazer', 'price' => 1590000, 'compare' => 1790000, 'colors' => ['Đen'], 'category' => 'ao-khoac', 'sold' => 18],
            ['name' => 'Áo thun cotton cổ tròn', 'slug' => 'ao-thun-cotton-co-tron', 'price' => 390000, 'compare' => null, 'colors' => ['Trắng ngà', 'Xanh navy'], 'category' => 'ao', 'sold' => 16],
            ['name' => 'Áo kiểu tay phồng', 'slug' => 'ao-kieu-tay-phong', 'price' => 590000, 'compare' => 690000, 'colors' => ['Hồng đất', 'Trắng ngà'], 'category' => 'ao', 'sold' => 11],
            ['name' => 'Quần ống đứng linen', 'slug' => 'quan-ong-dung-linen', 'price' => 790000, 'compare' => null, 'colors' => ['Natural', 'Xanh rêu'], 'category' => 'quan', 'sold' => 14],
            ['name' => 'Chân váy chữ A midi', 'slug' => 'chan-vay-chu-a-midi', 'price' => 720000, 'compare' => null, 'colors' => ['Nâu', 'Đen'], 'category' => 'vay', 'sold' => 9],
            ['name' => 'Áo cardigan dệt kim', 'slug' => 'ao-cardigan-det-kim', 'price' => 980000, 'compare' => 1150000, 'colors' => ['Nâu', 'Xanh rêu'], 'category' => 'ao-khoac', 'sold' => 7],
            ['name' => 'Túi tote canvas', 'slug' => 'tui-tote-canvas', 'price' => 320000, 'compare' => null, 'colors' => ['Natural'], 'category' => 'phu-kien', 'sold' => 25],
            ['name' => 'Áo polo cotton pique', 'slug' => 'ao-polo-cotton-pique', 'price' => 490000, 'compare' => null, 'colors' => ['Trắng ngà', 'Xanh navy'], 'category' => 'ao', 'sold' => 13],
            ['name' => 'Áo gile linen', 'slug' => 'ao-gile-linen', 'price' => 680000, 'compare' => null, 'colors' => ['Natural', 'Nâu'], 'category' => 'ao', 'sold' => 8],
            ['name' => 'Quần short linen', 'slug' => 'quan-short-linen', 'price' => 540000, 'compare' => 620000, 'colors' => ['Natural', 'Xanh rêu'], 'category' => 'quan', 'sold' => 6],
            ['name' => 'Váy quấn midi', 'slug' => 'vay-quan-midi', 'price' => 1090000, 'compare' => null, 'colors' => ['Hồng đất', 'Đen'], 'category' => 'vay', 'sold' => 5],
            ['name' => 'Váy sơ mi linen', 'slug' => 'vay-so-mi-linen', 'price' => 1250000, 'compare' => null, 'colors' => ['Trắng ngà'], 'category' => 'vay', 'sold' => 4],
            ['name' => 'Áo khoác trench ngắn', 'slug' => 'ao-khoac-trench-ngan', 'price' => 1850000, 'compare' => 2050000, 'colors' => ['Nâu'], 'category' => 'ao-khoac', 'sold' => 3],
            ['name' => 'Áo khoác denim ngắn', 'slug' => 'ao-khoac-denim-ngan', 'price' => 1290000, 'compare' => null, 'colors' => ['Xanh navy'], 'category' => 'ao-khoac', 'sold' => 2],
            ['name' => 'Khăn lụa vuông', 'slug' => 'khan-lua-vuong', 'price' => 350000, 'compare' => null, 'colors' => ['Hồng đất', 'Xanh navy'], 'category' => 'phu-kien', 'sizes' => ['One size'], 'sold' => 19],
            ['name' => 'Ví mini da mềm', 'slug' => 'vi-mini-da-mem', 'price' => 490000, 'compare' => null, 'colors' => ['Nâu', 'Đen'], 'category' => 'phu-kien', 'sizes' => ['One size'], 'sold' => 12],
        ];

        foreach ($products as $index => $data) {
            $product = Product::query()->firstOrCreate(
                ['slug' => $data['slug']],
                [
                    'category_id' => $categories[$data['category']]->id,
                    'brand_id' => $brand->id,
                    'name' => $data['name'],
                    'short_description' => 'Thiết kế tối giản với chất liệu được chọn cho tủ đồ hằng ngày.',
                    'description' => 'Một thiết kế thuộc bộ sưu tập Sarada. Phom dáng thoải mái, dễ phối và được tạo nên để mặc nhiều mùa.',
                    'base_price' => $data['price'],
                    'compare_at_price' => $data['compare'],
                    'status' => 'active',
                    'is_featured' => $index < 3,
                    'is_new' => in_array($data['slug'], $newArrivalSlugs, true),
                    'meta_title' => $data['name'].' | Sarada',
                ],
            );
            if ((int) $product->sold_count === 0 && $data['sold'] > 0) {
                $product->forceFill(['sold_count' => $data['sold']])->save();
            }

            foreach ($data['colors'] as $colorName) {
                foreach ($data['sizes'] ?? ['S', 'M', 'L', 'XL'] as $size) {
                    $sizeValue = AttributeValue::query()->where('attribute_id', $sizeAttribute->id)->where('value', $size)->firstOrFail();
                    $skuParts = [strtoupper(str_replace('-', '', $data['slug']))];
                    if (count($data['colors']) > 1) {
                        $skuParts[] = Str::upper(Str::ascii(str_replace(' ', '', $colorName)));
                    }
                    $skuParts[] = Str::upper(Str::ascii(str_replace(' ', '', $size)));

                    $variant = ProductVariant::query()->firstOrNew([
                        'product_id' => $product->id,
                        'color_value_id' => $colors[$colorName]->id,
                        'size_value_id' => $sizeValue->id,
                    ]);
                    $variant->sku = implode('-', $skuParts);
                    if (! $variant->exists) {
                        $variant->price = $data['price'];
                        $variant->compare_at_price = $data['compare'];
                        $variant->is_active = true;
                    }
                    $variant->save();

                    Inventory::query()->firstOrCreate(
                        ['variant_id' => $variant->id],
                        ['quantity' => 12, 'reserved' => 0, 'low_stock_threshold' => 3],
                    );
                }
            }
        }

        $tagProducts = [
            'hang-moi' => ['ao-polo-cotton-pique', 'ao-gile-linen', 'quan-short-linen', 'vay-quan-midi', 'vay-so-mi-linen', 'ao-khoac-trench-ngan', 'ao-khoac-denim-ngan'],
            'ban-chay' => ['ao-so-mi-linen', 'quan-suong-cotton', 'vay-midi-co-vuong', 'tui-tote-canvas', 'ao-thun-cotton-co-tron'],
            'chat-lieu-linen' => ['ao-so-mi-linen', 'quan-ong-dung-linen', 'ao-gile-linen', 'quan-short-linen', 'vay-so-mi-linen'],
            'chat-lieu-cotton' => ['quan-suong-cotton', 'ao-thun-cotton-co-tron', 'ao-polo-cotton-pique'],
            'cong-so' => ['ao-so-mi-linen', 'quan-ong-dung-linen', 'vay-midi-co-vuong', 'ao-khoac-blazer'],
            'phong-cach-toi-gian' => ['ao-so-mi-linen', 'ao-thun-cotton-co-tron', 'chan-vay-chu-a-midi', 'ao-cardigan-det-kim'],
        ];
        $tagNames = [
            'hang-moi' => 'Hàng mới',
            'ban-chay' => 'Bán chạy',
            'chat-lieu-linen' => 'Chất liệu linen',
            'chat-lieu-cotton' => 'Chất liệu cotton',
            'cong-so' => 'Công sở',
            'phong-cach-toi-gian' => 'Phong cách tối giản',
        ];
        foreach ($tagProducts as $slug => $productSlugs) {
            $tag = Tag::query()->firstOrCreate(['slug' => $slug], ['name' => $tagNames[$slug]]);
            $productIds = Product::query()->whereIn('slug', $productSlugs)->pluck('id');
            $tag->products()->syncWithoutDetaching($productIds);
        }

        if (! Product::query()->where('status', 'active')->where('is_new', true)->exists()) {
            Product::query()->whereIn('slug', $newArrivalSlugs)->update(['is_new' => true]);
        }
    }
}
