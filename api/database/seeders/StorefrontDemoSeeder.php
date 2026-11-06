<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Coupon;
use App\Models\NewsletterSubscription;
use App\Models\Page;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Setting;
use App\Models\ShippingMethod;
use App\Models\ShippingRate;
use App\Support\VietnamAddressCatalog;
use Illuminate\Database\Seeder;

class StorefrontDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $mediaUrl = rtrim((string) config('app.url'), '/').'/demo-media';

        $this->seedPublicStorefrontSettings($mediaUrl);
        $this->seedShippingRates();
        ShippingMethod::query()->firstOrCreate(
            ['name' => 'Giao hàng tiêu chuẩn'],
            [
                'fee' => (int) (Setting::query()->whereKey('default_shipping_fee')->value('value') ?? config('store.default_shipping_fee', 30000)),
                'est_days' => null,
                'is_active' => true,
            ],
        );

        foreach ([
            'trang-phuc' => ['category-trang-phuc-photo-v2.webp', 'Trang phục'],
            'hang-moi' => ['category-hang-moi-photo-v1.webp', 'Hàng mới'],
            'ao' => ['category-ao-photo-v1.webp', 'Áo'],
            'quan' => ['category-quan-photo-v1.webp', 'Quần'],
            'vay' => ['category-vay-photo-v1.webp', 'Váy'],
            'ao-khoac' => ['category-ao-khoac-photo-v1.webp', 'Áo khoác'],
            'phu-kien' => ['category-phu-kien-photo-v1.webp', 'Phụ kiện'],
        ] as $slug => [$image, $alt]) {
            $category = Category::query()->where('slug', $slug)->first();
            if (! $category) {
                continue;
            }

            $previousAlt = $category->image_alt;
            $alt = $slug === 'trang-phuc'
                ? 'Ảnh AI demo: Sơ mi linen màu kem, cardigan dệt kim olive và quần tây xanh navy xếp flat-lay cho danh mục Trang phục; không xác nhận hàng thật.'
                : 'Ảnh AI demo: Ảnh flat-lay minh họa danh mục '.$category->name.'; không xác nhận hàng thật.';

            $demoImage = blank($category->image)
                || str_starts_with((string) $category->image, $mediaUrl.'/');
            $updates = [];
            if ($demoImage) {
                $updates['image'] = $mediaUrl.'/covers/'.$image;
            }
            if ($demoImage && (blank($category->image_alt)
                || $category->image_alt === 'Ảnh danh mục '.$category->name
                || $category->image_alt === $previousAlt
                || str_starts_with((string) $category->image_alt, 'Ảnh đồ họa:')
                || str_starts_with((string) $category->image_alt, 'Ảnh concept demo: '))) {
                $updates['image_alt'] = $alt;
            }
            if ($updates !== []) {
                $category->update($updates);
            }
        }

        $demoProductDetails = [
            'ao-so-mi-linen' => ['Vải linen pha cotton (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ với nước mát, phơi nơi thoáng; làm theo nhãn sản phẩm thực tế.'],
            'quan-suong-cotton' => ['Vải cotton (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ, tránh chất tẩy mạnh; làm theo nhãn sản phẩm thực tế.'],
            'vay-midi-co-vuong' => ['Vải dệt mềm (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ và phơi trong bóng râm; làm theo nhãn sản phẩm thực tế.'],
            'ao-khoac-blazer' => ['Vải pha (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Ưu tiên giặt hấp; làm theo nhãn sản phẩm thực tế.'],
            'ao-khoac-blazer-copy' => ['Vải pha (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Ưu tiên giặt hấp; làm theo nhãn sản phẩm thực tế.'],
            'ao-thun-cotton-co-tron' => ['Vải cotton (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt mặt trái với nước mát; làm theo nhãn sản phẩm thực tế.'],
            'ao-kieu-tay-phong' => ['Vải dệt nhẹ (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ và là ở nhiệt độ thấp; làm theo nhãn sản phẩm thực tế.'],
            'quan-ong-dung-linen' => ['Vải linen (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ, phơi tự nhiên; làm theo nhãn sản phẩm thực tế.'],
            'chan-vay-chu-a-midi' => ['Vải dệt pha (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ và phơi trong bóng râm; làm theo nhãn sản phẩm thực tế.'],
            'ao-cardigan-det-kim' => ['Sợi dệt kim pha (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt tay nhẹ, phơi phẳng; làm theo nhãn sản phẩm thực tế.'],
            'tui-tote-canvas' => ['Vải canvas (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Lau sạch hoặc giặt nhẹ; làm theo nhãn sản phẩm thực tế.'],
            'ao-polo-cotton-pique' => ['Vải cotton pique (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt mặt trái, tránh chất tẩy mạnh; làm theo nhãn sản phẩm thực tế.'],
            'ao-gile-linen' => ['Vải linen pha (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ, phơi nơi thoáng; làm theo nhãn sản phẩm thực tế.'],
            'quan-short-linen' => ['Vải linen (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ, phơi tự nhiên; làm theo nhãn sản phẩm thực tế.'],
            'vay-quan-midi' => ['Vải dệt nhẹ (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ và là ở nhiệt độ thấp; làm theo nhãn sản phẩm thực tế.'],
            'vay-so-mi-linen' => ['Vải linen pha (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt nhẹ, phơi nơi thoáng; làm theo nhãn sản phẩm thực tế.'],
            'ao-khoac-trench-ngan' => ['Vải pha (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Ưu tiên giặt hấp; làm theo nhãn sản phẩm thực tế.'],
            'ao-khoac-denim-ngan' => ['Vải denim cotton (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt mặt trái với nước mát, giặt riêng lần đầu; làm theo nhãn sản phẩm thực tế.'],
            'khan-lua-vuong' => ['Vải lụa (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Giặt tay với chất giặt dịu nhẹ; làm theo nhãn sản phẩm thực tế.'],
            'vi-mini-da-mem' => ['Vật liệu giả da (dữ liệu demo; cần xác nhận theo sản phẩm thực tế).', 'Lau bằng khăn mềm, tránh ngâm nước và nguồn nhiệt.'],
        ];

        foreach (Product::query()->whereIn('slug', array_keys($demoProductDetails))->get() as $product) {
            [$material, $careInstruction] = $demoProductDetails[$product->slug];
            $updates = [];
            if (blank($product->material)) {
                $updates['material'] = $material;
            }
            if (blank($product->care_instruction)) {
                $updates['care_instruction'] = $careInstruction;
            }
            if ($updates !== []) {
                $product->forceFill($updates)->save();
            }
        }

        $products = Product::query()->whereIn('slug', array_keys($demoProductDetails))->get();
        $productPhotoSlugOverrides = [
            'ao-so-mi-linen' => 'ao-so-mi-linen-generated-v5',
            'quan-suong-cotton' => 'quan-suong-cotton-generated-v5',
            'vay-midi-co-vuong' => 'vay-midi-co-vuong-generated-v5',
            'ao-khoac-blazer' => 'ao-khoac-blazer-generated-v5',
            'ao-khoac-blazer-copy' => 'ao-khoac-blazer-generated-v5',
            'ao-thun-cotton-co-tron' => 'ao-thun-cotton-co-tron-generated-v5',
            'ao-kieu-tay-phong' => 'ao-kieu-tay-phong-generated-v5',
            'quan-ong-dung-linen' => 'quan-ong-dung-linen-generated-v5',
            'chan-vay-chu-a-midi' => 'chan-vay-chu-a-midi-generated-v5',
            'ao-cardigan-det-kim' => 'ao-cardigan-det-kim-generated-v5',
            'tui-tote-canvas' => 'tui-tote-canvas-flatlay-v1',
            'ao-polo-cotton-pique' => 'ao-polo-cotton-pique-generated-v5',
            'ao-gile-linen' => 'ao-gile-linen-generated-v5',
            'quan-short-linen' => 'quan-short-linen-generated-v5',
            'vay-quan-midi' => 'vay-quan-midi-generated-v5',
            'vay-so-mi-linen' => 'vay-so-mi-linen-generated-v5',
            'ao-khoac-trench-ngan' => 'ao-khoac-trench-ngan-generated-v5',
            'ao-khoac-denim-ngan' => 'ao-khoac-denim-ngan-generated-v5',
            'khan-lua-vuong' => 'khan-lua-vuong-flatlay-v1',
            'vi-mini-da-mem' => 'vi-mini-da-mem-flatlay-v1',
        ];
        foreach ($products as $product) {
            ProductImage::query()
                ->where('product_id', $product->id)
                ->where('url', 'like', $mediaUrl.'/%')
                ->delete();

            $realGalleryImage = ProductImage::query()
                ->where('product_id', $product->id)
                ->where('url', 'not like', $mediaUrl.'/%')
                ->orderByDesc('is_primary')
                ->orderBy('sort_order')
                ->first();
            $photoSlug = $productPhotoSlugOverrides[$product->slug] ?? $product->slug;
            $demoPhotoUrl = $mediaUrl.'/products/'.$photoSlug.'-photo.webp';
            $demoPhotoExists = is_file(public_path('demo-media/products/'.$photoSlug.'-photo.webp'));
            $usesDemoThumbnail = blank($product->thumbnail) || str_starts_with($product->thumbnail, $mediaUrl.'/');
            $thumbnailUrl = $usesDemoThumbnail
                ? ($realGalleryImage?->url ?? ($demoPhotoExists ? $demoPhotoUrl : null))
                : $product->thumbnail;

            if ($product->thumbnail !== $thumbnailUrl) {
                $product->forceFill(['thumbnail' => $thumbnailUrl])->save();
            }

            if ($thumbnailUrl === null) {
                continue;
            }

            $thumbnailGalleryImage = ProductImage::query()
                ->where('product_id', $product->id)
                ->where('url', $thumbnailUrl)
                ->first();
            $imageAlt = str_starts_with($thumbnailUrl, $mediaUrl.'/products/')
                ? 'Ảnh AI demo: '.$product->name.'; hình tạo mẫu, không phải ảnh chụp đã xác nhận của sản phẩm thật.'
                : ($thumbnailGalleryImage?->alt ?: $realGalleryImage?->alt ?: $product->name);
            ProductImage::query()->firstOrCreate(
                ['product_id' => $product->id, 'url' => $thumbnailUrl],
                [
                    'alt' => $imageAlt,
                    'sort_order' => 1,
                    'is_primary' => true,
                ],
            );
        }

        $collections = [
            [
                'name' => 'Hàng mới',
                'slug' => 'hang-moi',
                'description' => 'Những thiết kế mới nhất từ Sarada. Ảnh sản phẩm trong bản demo được gắn nhãn Ảnh AI demo và chưa xác nhận là ảnh hàng thật.',
                'banner' => $mediaUrl.'/covers/collection-hang-moi-photo-v1.webp',
                'banner_alt' => 'Ảnh AI demo: Áo sơ mi màu kem tay phồng xếp flat-lay cho bộ sưu tập Hàng mới; không xác nhận hàng thật.',
                'meta_title' => 'Hàng mới | Sarada',
                'meta_description' => 'Khám phá các thiết kế mới từ Sarada.',
            ],
            [
                'name' => 'Thu đông 2026',
                'slug' => 'thu-dong-2026',
                'description' => 'Bảng màu trầm ấm và phom dáng tối giản cho mùa thu đông.',
                'banner' => $mediaUrl.'/covers/collection-thu-dong-2026-photo-v1.webp',
                'banner_alt' => 'Ảnh AI demo: Áo cardigan dệt kim màu kem chụp flat-lay cho bộ sưu tập Thu đông 2026; không xác nhận là hàng thật.',
                'meta_title' => 'Thu đông 2026 | Sarada',
                'meta_description' => 'Bộ sưu tập biên tập Thu đông 2026 của Sarada.',
            ],
        ];
        $collectionProductSlugs = CatalogSeeder::COLLECTION_PRODUCT_SLUGS;

        foreach ($collections as $data) {
            $collection = Collection::query()->firstOrCreate(
                ['slug' => $data['slug']],
                [...$data, 'is_active' => true, 'starts_at' => null, 'ends_at' => null],
            );

            if (! $collection->wasRecentlyCreated) {
                $updates = [];
                if (in_array($collection->description, [
                    'Những thiết kế mới nhất từ Sarada. Hình sản phẩm trong dữ liệu demo là minh họa tham khảo.',
                    'Những thiết kế mới nhất từ Sarada. Ảnh chụp thật của sản phẩm đang được cửa hàng cập nhật.',
                ], true)) {
                    $updates['description'] = $data['description'];
                }
                $demoBanner = blank($collection->banner) || str_contains((string) $collection->banner, '/demo-media/covers/');
                if ($demoBanner) {
                    $updates['banner'] = $data['banner'];
                }
                $previousDemoAltTexts = [
                    'hang-moi' => [
                        'Hai người mẫu mặc áo sơ mi cotton xanh nhạt và váy sơ mi trắng trong không gian sáng.',
                        'Ảnh concept demo: Hai người mẫu mặc áo sơ mi cotton xanh nhạt và váy sơ mi trắng trong không gian sáng.',
                        'Ảnh đồ họa minh họa bộ sưu tập Hàng mới; không hiển thị sản phẩm thật.',
                    ],
                    'thu-dong-2026' => [
                        'Hai người mẫu mặc áo linen đỏ rượu vang, quần ống rộng màu be và blazer tối màu.',
                        'Ảnh concept demo: Hai người mẫu mặc áo linen đỏ rượu vang, quần ống rộng màu be và blazer tối màu.',
                        'Ảnh đồ họa minh họa bộ sưu tập Thu đông 2026; không hiển thị sản phẩm thật.',
                    ],
                ];
                if ($demoBanner && (blank($collection->banner_alt)
                    || $collection->banner_alt === 'Bìa bộ sưu tập '.$collection->name
                    || in_array($collection->banner_alt, $previousDemoAltTexts[$data['slug']] ?? [], true)
                    || str_starts_with((string) $collection->banner_alt, 'Ảnh đồ họa:')
                    || str_starts_with((string) $collection->banner_alt, 'Ảnh concept demo:'))) {
                    $updates['banner_alt'] = $data['banner_alt'];
                }
                if ($updates !== []) {
                    $collection->update($updates);
                }
            }

            $productSlugs = $collectionProductSlugs[$data['slug']] ?? [];
            $productsBySlug = Product::query()->whereIn('slug', $productSlugs)->get()->keyBy('slug');
            $collectionProducts = [];
            foreach ($productSlugs as $sortOrder => $productSlug) {
                $product = $productsBySlug->get($productSlug);
                if ($product !== null) {
                    $collectionProducts[$product->id] = ['sort_order' => $sortOrder];
                }
            }

            // These demo collections have curated memberships; detach stale products on reruns.
            $collection->products()->sync($collectionProducts);
        }

        $banners = [
            ['title' => 'Mặc điều bạn tin — chiến dịch thu đông', 'description' => 'Ảnh AI demo minh họa áo quần cho bản local/UAT; cửa hàng cần xác nhận nội dung và sản phẩm.', 'alt' => 'Ảnh AI demo: Áo len màu olive, sơ mi linen màu kem và quần xanh navy xếp phẳng; không phải ảnh chụp hàng thật.', 'position' => 'hero', 'image' => $mediaUrl.'/banners/hero-editorial-desktop-photo-v1.webp', 'link_url' => '/collections/thu-dong-2026', 'sort_order' => 1],
            ['title' => 'Mặc điều bạn tin — bản dọc cho điện thoại', 'description' => 'Ảnh AI demo minh họa áo quần cho bản local/UAT; cửa hàng cần xác nhận nội dung và sản phẩm.', 'alt' => 'Ảnh AI demo: Áo len màu olive, sơ mi linen màu kem và quần xanh navy xếp phẳng; không phải ảnh chụp hàng thật.', 'position' => 'hero-mobile', 'image' => $mediaUrl.'/banners/hero-editorial-mobile-photo-v1.webp', 'link_url' => '/collections/thu-dong-2026', 'sort_order' => 1],
            ['title' => 'Những chất liệu ở lại lâu dài', 'description' => 'Video 5 giây không có âm thanh: cardigan len màu kem ở bên trái, áo thun trắng ở giữa và áo polo xanh đậm bên phải được xếp phẳng trên nền vải màu be; khung hình giữ bố cục với ánh sáng thay đổi nhẹ. Đây là ảnh AI demo, không xác nhận hàng hóa thực tế.', 'alt' => 'Ảnh AI demo: Cardigan dệt kim màu kem, áo thun trắng và áo polo xanh đậm xếp flat-lay trên nền vải màu be; không xác nhận hàng thật.', 'position' => 'campaign', 'image' => $mediaUrl.'/banners/campaign-editorial-photo-v1.webp', 'video_url' => $mediaUrl.'/video/brand-editorial-photo-v1.mp4', 'link_url' => '/collections/hang-moi', 'sort_order' => 1],
        ];

        foreach ($banners as $data) {
            $banner = Banner::query()->firstOrCreate(
                ['title' => $data['title'], 'position' => $data['position']],
                [...$data, 'link' => $data['link_url'], 'is_active' => true, 'starts_at' => null, 'ends_at' => null],
            );

            if (! $banner->wasRecentlyCreated) {
                $updates = [];
                $demoBannerImage = blank($banner->image) || str_contains((string) $banner->image, '/demo-media/banners/');
                if ($demoBannerImage) {
                    $updates['image'] = $data['image'];
                }
                $previousDemoAltTexts = [
                    $banner->title,
                    'Ảnh AI demo: flat-lay áo quần trong video chiến dịch; không phải ảnh chụp hàng thật.',
                    'Ảnh AI demo: cardigan len màu kem, áo thun trắng và áo polo xanh đậm xếp phẳng trên nền vải màu be; không phải ảnh hàng thật.',
                    'Ảnh đồ họa minh họa thương hiệu; không hiển thị quần áo hay sản phẩm.',
                    'Ảnh đồ họa minh họa thương hiệu; không hiển thị quần áo hay sản phẩm.',
                    'Ảnh đồ họa minh họa thương hiệu; không hiển thị người mẫu hay sản phẩm.',
                    'Ảnh đồ họa dọc minh họa thương hiệu; không hiển thị người mẫu hay sản phẩm.',
                    'Vải linen màu be và đỏ rượu vang buông trên bệ đá, cành khô đổ bóng.',
                    'Vải linen màu be và đỏ rượu vang xếp trên bệ đá dưới ánh nắng.',
                    'Người mẫu mặc áo linen đỏ rượu vang và quần ống rộng màu be trong không gian ngập nắng.',
                    'Người mẫu mặc áo linen đỏ rượu vang cùng quần ống rộng màu be.',
                    'Vải linen màu be và đỏ rượu vang phủ trên bệ đá cạnh bình gốm và cành cây khô.',
                    'Ảnh concept demo: Người mẫu mặc áo linen đỏ rượu vang và quần ống rộng màu be trong không gian ngập nắng.',
                    'Ảnh concept demo: Người mẫu mặc áo linen đỏ rượu vang cùng quần ống rộng màu be.',
                    'Ảnh concept demo: Vải linen màu be và đỏ rượu vang phủ trên bệ đá cạnh bình gốm và cành cây khô.',
                ];
                $previousDemoDescriptions = [
                    'Ảnh và video AI demo giới thiệu trang phục mẫu; không xác nhận hàng hóa thực tế.',
                    'Khám phá không gian đồ họa Thu Đông 2026 của Sarada.',
                    'Chuyển động đồ họa giới thiệu nhận diện Sarada.',
                    'Video giới thiệu các chất liệu và thiết kế trong bộ sưu tập mới.',
                ];
                if (blank($banner->description) || in_array($banner->description, $previousDemoDescriptions, true)) {
                    $updates['description'] = $data['description'];
                }
                if ((blank($banner->alt)
                    || in_array($banner->alt, $previousDemoAltTexts, true)
                    || str_starts_with((string) $banner->alt, 'Ảnh đồ họa:')
                    || str_starts_with((string) $banner->alt, 'Ảnh concept demo:'))
                    && $demoBannerImage) {
                    $updates['alt'] = $data['alt'];
                }
                if (isset($data['video_url']) && (blank($banner->video_url) || str_contains((string) $banner->video_url, '/demo-media/video/'))) {
                    $updates['video_url'] = $data['video_url'];
                }
                if (blank($banner->link_url) || str_starts_with($banner->link_url, '/collections/')) {
                    $updates['link_url'] = $data['link_url'];
                    $updates['link'] = $data['link_url'];
                }
                if ($updates !== []) {
                    $banner->update($updates);
                }
            }
        }

        Coupon::query()->firstOrCreate(
            ['code' => 'NETWELCOME15'],
            [
                'description' => 'Mã chào mừng khách mới trên cửa hàng demo.',
                'type' => 'percent',
                'value' => 15,
                'max_discount' => 150000,
                'min_order_value' => 500000,
                'usage_limit' => 500,
                'usage_per_user' => 1,
                'used_count' => 0,
                'starts_at' => null,
                'ends_at' => null,
                'is_active' => true,
            ],
        );

        NewsletterSubscription::query()->firstOrCreate(
            ['email' => 'demo-subscriber@example.test'],
            ['consented_at' => now()],
        );

        $pages = [
            ['slug' => 'about', 'title' => 'Câu chuyện Sarada', 'content' => '<p>Sarada là không gian giới thiệu các thiết kế tối giản, hướng đến chất liệu và phom dáng dễ ứng dụng.</p><p>Đây là nội dung mẫu của cửa hàng phát triển; thông tin thương hiệu chính thức có thể được cập nhật trong trang quản trị.</p>'],
            ['slug' => 'shipping', 'title' => 'Giao hàng và đổi trả', 'content' => '<p>Phí giao hàng được tính theo địa chỉ và hiển thị trước khi bạn đặt hàng.</p><p>Khách hàng có thể gửi yêu cầu trả hàng trong vòng 7 ngày kể từ khi đơn được giao thành công tại mục Tài khoản &gt; Đơn hàng. Nhân viên sẽ xem xét yêu cầu; việc tiếp nhận hàng trả và hoàn tiền được xử lý riêng.</p>'],
            ['slug' => 'size-guide', 'title' => 'Hướng dẫn chọn kích cỡ', 'content' => '<p><strong>Bảng số đo cơ thể tham khảo (cm) — dữ liệu demo, không phải số đo của sản phẩm đang bán.</strong></p><p>Cửa hàng cần thay bảng này bằng hướng dẫn đã xác nhận cho từng dòng sản phẩm trước khi dùng thực tế.</p><ul><li>S: vòng ngực 80–84 cm, vòng eo 62–66 cm.</li><li>M: vòng ngực 85–89 cm, vòng eo 67–71 cm.</li><li>L: vòng ngực 90–95 cm, vòng eo 72–77 cm.</li><li>XL: vòng ngực 96–102 cm, vòng eo 78–84 cm.</li></ul><p>Nếu số đo nằm giữa hai cỡ, hãy liên hệ cửa hàng để được tư vấn theo phom của sản phẩm cụ thể.</p>'],
            ['slug' => 'contact', 'title' => 'Liên hệ', 'content' => '<p>Gửi yêu cầu hỗ trợ qua kênh liên hệ chính thức được cửa hàng cấu hình trong trang quản trị.</p>'],
            ['slug' => 'privacy', 'title' => 'Quyền riêng tư', 'content' => '<p>Cửa hàng sử dụng thông tin tài khoản và đơn hàng để xử lý giao dịch, hỗ trợ khách hàng và bảo vệ tài khoản.</p><p>Khách hàng có thể quản lý thông tin cá nhân trong phần tài khoản hoặc gửi yêu cầu đến cửa hàng.</p>'],
            ['slug' => 'terms', 'title' => 'Điều khoản sử dụng', 'content' => '<p>Thông tin giá, tình trạng còn hàng, phí giao hàng và tổng tiền cuối cùng được xác nhận từ hệ thống tại thời điểm đặt hàng.</p><p>Nội dung này là bản mẫu; cửa hàng cần cập nhật điều khoản chính thức trước khi đưa website vào sử dụng thực tế.</p>'],
        ];

        $legacyShippingContent = '<p>Phí giao hàng và thời gian dự kiến được hiển thị theo địa chỉ trong bước thanh toán.</p><p>Vui lòng liên hệ cửa hàng qua thông tin hỗ trợ được cấu hình trong trang quản trị để được hướng dẫn đổi hoặc trả sản phẩm.</p>';
        $previousDemoShippingContent = '<p>Phí giao hàng và thời gian dự kiến được hiển thị theo địa chỉ trong bước thanh toán.</p><p>Khách hàng có thể gửi yêu cầu trả hàng trong vòng 7 ngày kể từ khi đơn được giao thành công tại mục Tài khoản &gt; Đơn hàng. Nhân viên sẽ xem xét yêu cầu; việc tiếp nhận hàng trả và hoàn tiền được xử lý riêng.</p>';
        foreach ($pages as $data) {
            $page = Page::query()->firstOrCreate(
                ['slug' => $data['slug']],
                [...$data, 'meta_title' => $data['title'].' | Sarada', 'meta_description' => $data['title'].' — thông tin cửa hàng Sarada.', 'is_published' => true],
            );

            if ($data['slug'] === 'shipping' && ! $page->wasRecentlyCreated
                && in_array($page->content, [$legacyShippingContent, $previousDemoShippingContent], true)) {
                $page->update(['content' => $data['content']]);
            }
        }
    }

    private function seedPublicStorefrontSettings(string $mediaUrl): void
    {
        $settings = [
            'store_name' => 'Sarada',
            'store_logo' => $mediaUrl.'/brands/net-studio-mark.png',
            'store_favicon' => $mediaUrl.'/brands/net-studio-mark.png',
            'seo_title' => 'Sarada — Mặc chậm. Ở lại lâu.',
            'seo_description' => 'Thời trang tối giản từ Sarada — thiết kế tinh giản, chất liệu tự nhiên, dành cho phong cách mỗi ngày.',
            'seo_og_image' => $mediaUrl.'/brands/sarada-og.svg',
        ];

        foreach ($settings as $key => $value) {
            $setting = Setting::query()->firstOrNew(['key' => $key]);
            $isPreviousDemoBrand = $key === 'store_name' && in_array($setting->value, ['NÉT Studio', 'Morrow'], true);
            $isPreviousDemoSeo = $key === 'seo_title' && in_array($setting->value, ['NÉT Studio — Mặc chậm. Ở lại lâu.', 'Morrow — Mặc chậm. Ở lại lâu.'], true)
                || $key === 'seo_description' && (str_starts_with((string) $setting->value, 'Thời trang tối giản từ NÉT Studio') || str_starts_with((string) $setting->value, 'Thời trang tối giản từ Morrow'));
            $isPreviousDemoLogo = in_array($key, ['store_logo', 'store_favicon'], true)
                && (str_ends_with((string) $setting->value, '/brands/net-studio.svg') || str_ends_with((string) $setting->value, '/brands/net-studio-mark.png'));
            $isPreviousDemoOgImage = $key === 'seo_og_image' && (str_ends_with((string) $setting->value, '/brands/net-studio-og.jpg') || str_ends_with((string) $setting->value, '/brands/morrow-og.svg'));

            if (blank($setting->value) || $isPreviousDemoBrand || $isPreviousDemoSeo || $isPreviousDemoLogo || $isPreviousDemoOgImage) {
                $setting->value = $value;
                $setting->save();
            }
        }
    }

    private function seedShippingRates(): void
    {
        $catalog = app(VietnamAddressCatalog::class);
        $fee = (int) (Setting::query()->whereKey('default_shipping_fee')->value('value') ?? config('store.default_shipping_fee', 30000));
        $threshold = (int) (Setting::query()->whereKey('free_shipping_threshold')->value('value') ?? config('store.free_shipping_threshold', 1500000));

        foreach (['01', '48', '79'] as $provinceCode) {
            $province = $catalog->province($provinceCode);
            if ($province === null) {
                continue;
            }

            ShippingRate::query()->firstOrCreate(
                ['province_code' => $provinceCode],
                [
                    'province_name' => $province['name'],
                    'fee' => $fee,
                    'free_shipping_threshold' => $threshold,
                    'is_active' => true,
                ],
            );
        }
    }
}
