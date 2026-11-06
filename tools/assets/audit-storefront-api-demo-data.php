<?php

declare(strict_types=1);

use App\Models\User;
use App\Support\ActiveCategoryTree;
use App\Support\VietnamAddressCatalog;
use Database\Seeders\CatalogSeeder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$apiDirectory = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'api';
require $apiDirectory.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php';

$app = require $apiDirectory.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'app.php';
$app->make(Kernel::class)->bootstrap();

$activeProducts = DB::table('products')->where('status', 'active')->whereNull('deleted_at');
$activeProductCount = (clone $activeProducts)->count();
$activeProductsWithVariants = (clone $activeProducts)
    ->whereExists(function ($query): void {
        $query->selectRaw('1')->from('product_variants as variant')
            ->whereColumn('variant.product_id', 'products.id')
            ->where('variant.is_active', true);
    })
    ->count();
$activeProductsWithImages = (clone $activeProducts)
    ->whereNotNull('thumbnail')
    ->whereExists(function ($query): void {
        $query->selectRaw('1')->from('product_images as image')
            ->whereColumn('image.product_id', 'products.id');
    })
    ->count();
$activeProductsWithGeneratedPhotoReferences = (clone $activeProducts)
    ->where(function ($query): void {
        $query->where('thumbnail', 'like', '%-photo.webp')
            ->orWhereExists(function ($imageQuery): void {
                $imageQuery->selectRaw('1')->from('product_images as image')
                    ->whereColumn('image.product_id', 'products.id')
                    ->where(function ($mediaQuery): void {
                        $mediaQuery->where('image.url', 'like', '%-photo.webp')
                            ->orWhere('image.alt', 'like', 'Ảnh concept demo:%');
                    });
            });
    })
    ->count();
$activeProductsWithAiDemoDisclosure = (clone $activeProducts)
    ->whereExists(function ($query): void {
        $query->selectRaw('1')->from('product_images as image')
            ->whereColumn('image.product_id', 'products.id')
            ->whereColumn('image.url', 'products.thumbnail')
            ->where('image.alt', 'like', 'Ảnh AI demo:%');
    })
    ->count();
$activeVariantsWithNonAsciiSku = DB::table('product_variants as variant')
    ->join('products', 'products.id', '=', 'variant.product_id')
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->where('variant.is_active', true)
    ->pluck('variant.sku')
    ->filter(static fn (string $sku): bool => preg_match('/[^\x20-\x7E]/', $sku) === 1)
    ->count();
$productsWithFilterableVariants = (int) DB::table('product_variants as variant')
    ->join('products', 'products.id', '=', 'variant.product_id')
    ->join('attribute_values as size', 'size.id', '=', 'variant.size_value_id')
    ->join('attributes as size_attribute', 'size_attribute.id', '=', 'size.attribute_id')
    ->join('attribute_values as color', 'color.id', '=', 'variant.color_value_id')
    ->join('attributes as color_attribute', 'color_attribute.id', '=', 'color.attribute_id')
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->where('variant.is_active', true)
    ->where('size_attribute.name', 'Kích cỡ')
    ->where('color_attribute.name', 'Màu sắc')
    ->distinct()
    ->count('products.id');
$activeColorVariantPairs = DB::table('product_variants as variant')
    ->join('products', 'products.id', '=', 'variant.product_id')
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->where('variant.is_active', true)
    ->whereNotNull('variant.color_value_id')
    ->select('variant.product_id', 'variant.color_value_id')
    ->distinct()
    ->get();
$activeColorImagePairs = DB::table('product_variants as variant')
    ->join('products', 'products.id', '=', 'variant.product_id')
    ->join('product_images as image', function ($join): void {
        $join->on('image.product_id', '=', 'variant.product_id')
            ->on('image.color_value_id', '=', 'variant.color_value_id')
            ->where('image.url', 'not like', '%/demo-media/%');
    })
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->where('variant.is_active', true)
    ->whereNotNull('variant.color_value_id')
    ->select('variant.product_id', 'variant.color_value_id')
    ->distinct()
    ->get();
$activeDemoColorImagePairs = DB::table('product_variants as variant')
    ->join('products', 'products.id', '=', 'variant.product_id')
    ->join('product_images as image', function ($join): void {
        $join->on('image.product_id', '=', 'variant.product_id')
            ->on('image.color_value_id', '=', 'variant.color_value_id');
    })
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->where('variant.is_active', true)
    ->whereNotNull('variant.color_value_id')
    ->where('image.url', 'like', '%/demo-media/%')
    ->select('variant.product_id', 'variant.color_value_id')
    ->distinct()
    ->get();
$now = now();
$activeCollectionsWithProducts = DB::table('collections as collection')
    ->join('collection_product', 'collection_product.collection_id', '=', 'collection.id')
    ->join('products', 'products.id', '=', 'collection_product.product_id')
    ->where('collection.is_active', true)
    ->where(fn ($query) => $query->whereNull('collection.starts_at')->orWhere('collection.starts_at', '<=', $now))
    ->where(fn ($query) => $query->whereNull('collection.ends_at')->orWhere('collection.ends_at', '>', $now))
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->distinct()
    ->count('collection.id');
$demoCollectionProductSlugs = DB::table('collections as collection')
    ->join('collection_product', 'collection_product.collection_id', '=', 'collection.id')
    ->join('products', 'products.id', '=', 'collection_product.product_id')
    ->whereIn('collection.slug', array_keys(CatalogSeeder::COLLECTION_PRODUCT_SLUGS))
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->orderBy('collection.slug')
    ->orderBy('products.slug')
    ->get(['collection.slug as collection_slug', 'products.slug as product_slug'])
    ->groupBy('collection_slug')
    ->map(fn ($products) => $products->pluck('product_slug')->values()->all())
    ->all();
$demoCollectionsMatchCuratedProducts = true;
foreach (CatalogSeeder::COLLECTION_PRODUCT_SLUGS as $collectionSlug => $expectedProductSlugs) {
    $actualProductSlugs = $demoCollectionProductSlugs[$collectionSlug] ?? [];
    sort($expectedProductSlugs);
    sort($actualProductSlugs);
    if ($actualProductSlugs !== $expectedProductSlugs) {
        $demoCollectionsMatchCuratedProducts = false;
    }
}
$legacyIllustrativeCollectionDescriptions = DB::table('collections')
    ->whereIn('slug', ['hang-moi', 'thu-dong-2026'])
    ->where('description', 'Những thiết kế mới nhất từ NÉT Studio. Hình sản phẩm trong dữ liệu demo là minh họa tham khảo.')
    ->count();
$legacyRealPhotoCollectionDescriptions = DB::table('collections')
    ->where('slug', 'hang-moi')
    ->where('description', 'Những thiết kế mới nhất từ NÉT Studio. Ảnh chụp thật của sản phẩm đang được cửa hàng cập nhật.')
    ->count();
$activeBanners = DB::table('banners')
    ->where('is_active', true)
    ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
    ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $now))
    ->count();
$legacyIllustrativeCampaignDescriptions = DB::table('banners')
    ->where('title', 'Những chất liệu ở lại lâu dài')
    ->where('description', 'Video giới thiệu các chất liệu và thiết kế trong bộ sưu tập mới.')
    ->count();
$publishedPages = DB::table('pages')->where('is_published', true)->count();
$requiredPublishedPageSlugs = ['about', 'shipping', 'size-guide', 'contact', 'privacy', 'terms'];
$publishedDemoPageSlugs = DB::table('pages')
    ->whereIn('slug', $requiredPublishedPageSlugs)
    ->where('is_published', true)
    ->orderBy('slug')
    ->pluck('slug')
    ->all();
$shippingPolicyContent = (string) DB::table('pages')->where('slug', 'shipping')->where('is_published', true)->value('content');
$activeBrands = DB::table('brands as brand')
    ->whereExists(function ($query): void {
        $query->selectRaw('1')->from('products')
            ->whereColumn('products.brand_id', 'brand.id')
            ->where('products.status', 'active')
            ->whereNull('products.deleted_at');
    })
    ->count();
$activeCategories = ActiveCategoryTree::flatten(ActiveCategoryTree::roots())->count();
$newArrivalsCategory = DB::table('categories')->where('slug', 'hang-moi')->where('is_active', true)->whereNull('deleted_at')->exists();
$activeNewProducts = (clone $activeProducts)->where('is_new', true)->count();
$activeBestSellers = (clone $activeProducts)->where('sold_count', '>', 0)->count();
$activeCoupon = DB::table('coupons')
    ->where('code', 'NETWELCOME15')
    ->where('is_active', true)
    ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
    ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>', $now))
    ->exists();
$activeShippingRates = DB::table('shipping_rates')->where('is_active', true)->count();
$newsletterSubscription = DB::table('newsletter_subscriptions')
    ->where('email', 'demo-subscriber@example.test')
    ->first(['email', 'consented_at']);
$newsletterFixtureHasConsent = $newsletterSubscription !== null
    && $newsletterSubscription->email === strtolower(trim((string) $newsletterSubscription->email))
    && $newsletterSubscription->consented_at !== null;
$publicStoreName = trim((string) DB::table('settings')->where('key', 'store_name')->value('value'));
$reviewStatuses = DB::table('reviews')->whereIn('status', ['pending', 'approved'])->distinct()->count('status');
$pendingChangeTypes = DB::table('order_change_requests')->where('status', 'pending')->whereIn('type', ['cancellation', 'return'])->distinct()->count('type');
$deliveredOrders = DB::table('orders')->whereIn('status', ['delivered', 'completed'])->count();
$returnWindowEligibleOrders = DB::table('orders')
    ->whereIn('status', ['delivered', 'completed'])
    ->whereNotNull('delivered_at')
    ->where('delivered_at', '>=', $now->copy()->subDays(7))
    ->where('delivered_at', '<=', $now)
    ->count();
$expiredReturnWindowOrders = DB::table('orders')
    ->whereIn('status', ['delivered', 'completed'])
    ->whereNotNull('delivered_at')
    ->where('delivered_at', '<', $now->copy()->subDays(7))
    ->count();
$eligibleReturnFixture = DB::table('orders as demo_order')
    ->join('order_change_requests as demo_request', 'demo_request.order_id', '=', 'demo_order.id')
    ->where('demo_order.idempotency_key', 'seed:storefront-customer-cod-order-v1')
    ->where('demo_request.type', 'return')
    ->where('demo_request.status', 'pending')
    ->whereColumn('demo_request.created_at', '>=', 'demo_order.delivered_at')
    ->where('demo_order.delivered_at', '>=', $now->copy()->subDays(7))
    ->where('demo_order.delivered_at', '<=', $now)
    ->exists();
$expiredReturnFixture = DB::table('orders as demo_order')
    ->where('demo_order.idempotency_key', 'seed:storefront-customer-approved-review-order-v1')
    ->whereIn('demo_order.status', ['delivered', 'completed'])
    ->where('demo_order.delivered_at', '<', $now->copy()->subDays(7))
    ->whereNotExists(function ($query): void {
        $query->selectRaw('1')
            ->from('order_change_requests as demo_request')
            ->whereColumn('demo_request.order_id', 'demo_order.id')
            ->where('demo_request.type', 'return')
            ->where('demo_request.status', 'pending');
    })
    ->exists();
$demoDeliveryTimestampsMatch = DB::table('orders as demo_order')
    ->join('shipments as demo_shipment', 'demo_shipment.order_id', '=', 'demo_order.id')
    ->whereIn('demo_order.idempotency_key', [
        'seed:storefront-customer-cod-order-v1',
        'seed:storefront-customer-approved-review-order-v1',
    ])
    ->whereColumn('demo_shipment.delivered_at', 'demo_order.delivered_at')
    ->distinct()
    ->count('demo_order.id') === 2;
$pendingOrders = DB::table('orders')->whereIn('status', ['pending', 'confirmed', 'processing'])->count();
$customerEmail = (string) config('store.demo_customer_email', 'demo.customer@example.test');
$demoCustomerPassword = (string) config('store.demo_customer_password', '');
if ($demoCustomerPassword === '' && app()->environment(['local', 'testing'])) {
    $demoCustomerPassword = 'StoreDemo123!';
}
$demoCustomer = DB::table('users')->where('email', $customerEmail)->first(['id', 'status', 'email_verified_at', 'password']);
$demoCustomerHasRole = $demoCustomer !== null && User::query()->whereKey($demoCustomer->id)
    ->whereHas('roles', static fn ($query) => $query->where('name', 'customer'))
    ->exists();
$demoCustomerLoginReady = $demoCustomer !== null
    && $demoCustomer->status === 'active'
    && $demoCustomer->email_verified_at !== null
    && $demoCustomerHasRole
    && $demoCustomerPassword !== ''
    && Hash::check($demoCustomerPassword, $demoCustomer->password);
$demoCustomerAddress = $demoCustomer !== null && DB::table('addresses')->where('user_id', $demoCustomer->id)->exists();
$demoCustomerWishlist = $demoCustomer !== null && DB::table('wishlists')->where('user_id', $demoCustomer->id)->exists();
$demoCustomerOrders = $demoCustomer !== null && DB::table('orders')->where('user_id', $demoCustomer->id)->exists();
$catalog = app(VietnamAddressCatalog::class);
$provinces = $catalog->provinces();
$hanoiWards = $catalog->wards('01') ?? [];
$provincesWithWards = 0;
$totalWards = 0;
$provincesWithoutWards = [];
foreach ($provinces as $province) {
    $wards = $catalog->wards((string) $province['code']) ?? [];
    if ($wards === []) {
        $provincesWithoutWards[] = $province['code'];

        continue;
    }

    $provincesWithWards++;
    $totalWards += count($wards);
}
$addressCatalogReady = $catalog->province('01') !== null && $catalog->ward('01', '00004') !== null;

$checks = [
    'GET /categories has active category data' => $activeCategories > 0,
    'GET /catalog/filter-options has a brand backed by published products' => $activeBrands > 0,
    'GET /products has active product data' => $activeProductCount > 0,
    'Product detail/checkout has active variants for every active product' => $activeProductsWithVariants === $activeProductCount,
    'Product cards/detail have thumbnails and gallery images for every active product' => $activeProductsWithImages === $activeProductCount,
    'AI demo product photos are available for all active catalog items' => $activeProductsWithGeneratedPhotoReferences === $activeProductCount,
    'Every AI demo product photo has an explicit disclosure in its alt text' => $activeProductsWithAiDemoDisclosure === $activeProductCount,
    'Active demo variant SKUs use ASCII characters' => $activeVariantsWithNonAsciiSku === 0,
    'Catalog color/size filters have matching active variants' => $productsWithFilterableVariants > 0,
    'Color-specific demo gallery media contains no synthetic garment images' => $activeDemoColorImagePairs->isEmpty(),
    'Home newest rail and bestseller rail have active products' => $activeProductCount > 0 && $activeBestSellers > 0,
    'GET /products?new=true has active demo products' => $activeNewProducts > 0,
    'The Hàng mới category has active products through the new-arrival filter' => $newArrivalsCategory && $activeNewProducts > 0,
    'GET /collections has active collections with active products' => $activeCollectionsWithProducts > 0,
    'Demo collections contain only their curated active product slugs' => $demoCollectionsMatchCuratedProducts,
    'Seeded collection copy does not claim product photos are illustrations' => $legacyIllustrativeCollectionDescriptions === 0,
    'Seeded collection copy does not misrepresent AI demo photos as real photos' => $legacyRealPhotoCollectionDescriptions === 0,
    'GET /banners has active banner data' => $activeBanners > 0,
    'Seeded campaign copy matches its neutral brand video' => $legacyIllustrativeCampaignDescriptions === 0,
    'GET /pages has published CMS pages' => $publishedPages > 0,
    'GET /auth/registration-status has a configured public store name' => $publicStoreName !== '',
    'Storefront home/footer/product detail CMS pages are published' => count($publishedDemoPageSlugs) === count($requiredPublishedPageSlugs),
    'Published shipping policy explains the seven-day return-request window' => str_contains($shippingPolicyContent, '7 ngày kể từ khi đơn được giao thành công'),
    'GET /coupons has an active demo coupon' => $activeCoupon,
    'Checkout has active province shipping rates' => $activeShippingRates > 0,
    'POST /newsletter/subscriptions has a normalized demo subscription with recorded explicit consent' => $newsletterFixtureHasConsent,
    'Product reviews have pending and approved moderation states' => $reviewStatuses === 2,
    'Order account and Admin queues have pending and delivered orders' => $pendingOrders > 0 && $deliveredOrders > 0,
    'A delivered demo order is inside the seven-day return-request window' => $returnWindowEligibleOrders > 0,
    'A delivered demo order is past the seven-day return-request window' => $expiredReturnWindowOrders > 0,
    'The in-window demo order has a pending return request created after delivery' => $eligibleReturnFixture,
    'The expired demo order has no pending return request' => $expiredReturnFixture,
    'Both demo shipment delivery timestamps match their order timestamps' => $demoDeliveryTimestampsMatch,
    'Order change queue has pending cancellation and return examples' => $pendingChangeTypes === 2,
    'Account APIs have a demo customer with an address, wishlist, and order' => $demoCustomerAddress && $demoCustomerWishlist && $demoCustomerOrders,
    'The seeded demo customer can authenticate in this environment' => $demoCustomerLoginReady,
    'GET /locations/provinces and ward lookup have demo-address catalog entries' => $addressCatalogReady && count($hanoiWards) > 0,
    'Every available province has ward data for the dependent address selector' => count($provincesWithoutWards) === 0,
];

$counts = [
    'active_categories' => $activeCategories,
    'active_brands' => $activeBrands,
    'active_products' => $activeProductCount,
    'active_products_with_variants' => $activeProductsWithVariants,
    'active_products_with_thumbnail_and_gallery' => $activeProductsWithImages,
    'active_products_with_generated_photo_references' => $activeProductsWithGeneratedPhotoReferences,
    'active_products_with_ai_demo_photo_disclosure' => $activeProductsWithAiDemoDisclosure,
    'active_variants_with_non_ascii_sku' => $activeVariantsWithNonAsciiSku,
    'products_with_color_and_size_filter_variants' => $productsWithFilterableVariants,
    'active_product_color_pairs' => $activeColorVariantPairs->count(),
    'active_product_color_pairs_with_owner_provided_photos' => $activeColorImagePairs->count(),
    'active_collections_with_products' => $activeCollectionsWithProducts,
    'hang_moi_collection_products' => count($demoCollectionProductSlugs['hang-moi'] ?? []),
    'thu_dong_2026_collection_products' => count($demoCollectionProductSlugs['thu-dong-2026'] ?? []),
    'collections_with_legacy_fake-photo_copy' => $legacyIllustrativeCollectionDescriptions,
    'collections_with_legacy_real-photo_claims' => $legacyRealPhotoCollectionDescriptions,
    'active_banners' => $activeBanners,
    'banners_with_legacy_product-video_copy' => $legacyIllustrativeCampaignDescriptions,
    'published_pages' => $publishedPages,
    'active_shipping_rates' => $activeShippingRates,
    'new_products' => $activeNewProducts,
    'best_sellers' => $activeBestSellers,
    'pending_and_approved_review_states' => $reviewStatuses,
    'pending_cancellation_and_return_types' => $pendingChangeTypes,
    'pending_orders' => $pendingOrders,
    'delivered_or_completed_orders' => $deliveredOrders,
    'orders_inside_return_request_window' => $returnWindowEligibleOrders,
    'orders_past_return_request_window' => $expiredReturnWindowOrders,
    'newsletter_fixtures_with_recorded_consent' => $newsletterFixtureHasConsent ? 1 : 0,
    'available_provinces' => count($provinces),
    'provinces_with_wards' => $provincesWithWards,
    'available_wards' => $totalWards,
    'available_hanoi_wards' => count($hanoiWards),
];

echo "Storefront API demo data coverage:\n";
foreach ($counts as $name => $count) {
    echo "- {$name}: {$count}\n";
}
echo '- active_demo_coupon: '.($activeCoupon ? 'yes' : 'no')."\n";
echo '- newsletter_normalized_consent_fixture: '.($newsletterFixtureHasConsent ? 'yes' : 'no')."\n";
echo '- public_store_name_configured: '.($publicStoreName !== '' ? 'yes' : 'no')."\n";
echo '- demo_customer_address_wishlist_order: '.(($demoCustomerAddress && $demoCustomerWishlist && $demoCustomerOrders) ? 'yes' : 'no')."\n";
echo '- demo_customer_login_ready: '.($demoCustomerLoginReady ? 'yes' : 'no')."\n";
echo '- required_published_pages: '.implode(', ', $publishedDemoPageSlugs)."\n";

$failures = array_keys(array_filter($checks, static fn (bool $passed): bool => ! $passed));
echo '- failed coverage checks: '.count($failures)."\n";
foreach ($failures as $failure) {
    echo "  - {$failure}\n";
}

exit($failures === [] ? 0 : 1);
