<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

$apiDirectory = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'api';
require $apiDirectory.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php';

$app = require $apiDirectory.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'app.php';
$app->make(Kernel::class)->bootstrap();

$references = [
    'banners' => ['image', 'video_url'],
    'categories' => ['image'],
    'collections' => ['banner'],
    'products' => ['thumbnail'],
    'product_images' => ['url'],
];

$counts = [];
$missingFiles = [];
$invalidMedia = [];
$imageLimits = [
    'banners.image' => 150 * 1024,
    'categories.image' => 80 * 1024,
    'collections.banner' => 80 * 1024,
];
$videoLimit = 5 * 1024 * 1024;
$storefrontSourceDirectory = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'storefront'.DIRECTORY_SEPARATOR.'src';
$storefrontIllustrationDirectory = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'storefront'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'illustrations';
$requiredIllustrations = [
    'order-success.svg',
    'not-found.svg',
    'no-results.svg',
    'empty-wishlist.svg',
    'empty-orders.svg',
    'empty-cart.svg',
    'empty-addresses.svg',
    'email-notice.svg',
    'connection-error.svg',
    'access-denied.svg',
];
$illustrationReferences = [];
$sourceFiles = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($storefrontSourceDirectory, FilesystemIterator::SKIP_DOTS));
foreach ($sourceFiles as $sourceFile) {
    if (! $sourceFile->isFile() || ! in_array($sourceFile->getExtension(), ['css', 'ts', 'tsx'], true)) {
        continue;
    }

    preg_match_all('~/illustrations/([a-z0-9-]+\.svg)~i', (string) file_get_contents($sourceFile->getPathname()), $matches);
    foreach ($matches[1] as $illustration) {
        $illustrationReferences[$illustration] = ($illustrationReferences[$illustration] ?? 0) + 1;
    }
}
$missingRequiredIllustrations = [];
foreach ($requiredIllustrations as $illustration) {
    $illustrationPath = $storefrontIllustrationDirectory.DIRECTORY_SEPARATOR.$illustration;
    if (! is_file($illustrationPath) || ! str_contains((string) file_get_contents($illustrationPath), '<svg')) {
        $missingRequiredIllustrations[] = $illustration.' is missing or is not a readable SVG';

        continue;
    }
    if (! isset($illustrationReferences[$illustration])) {
        $missingRequiredIllustrations[] = $illustration.' is not referenced by Storefront source';
    }
}
$generatedProductMediaReferences = (int) DB::table('products as product')
    ->leftJoin('product_images as image', 'image.product_id', '=', 'product.id')
    ->where('product.status', 'active')
    ->whereNull('product.deleted_at')
    ->where(function ($query): void {
        $query->where('product.thumbnail', 'like', '%-photo.webp')
            ->orWhere('image.url', 'like', '%-photo.webp');
    })
    ->distinct()
    ->count('product.id');
$activeProductsWithAiDemoDisclosure = (int) DB::table('products as product')
    ->join('product_images as image', function ($join): void {
        $join->on('image.product_id', '=', 'product.id')
            ->on('image.url', '=', 'product.thumbnail')
            ->where('image.alt', 'like', 'Ảnh AI demo:%');
    })
    ->where('product.status', 'active')
    ->whereNull('product.deleted_at')
    ->distinct()
    ->count('product.id');
$missingAlt = (int) DB::table('product_images')
    ->whereNull('alt')
    ->orWhereRaw("TRIM(alt) = ''")
    ->count();
$missingProductThumbnailAlt = (int) DB::table('products as product')
    ->whereNotNull('product.thumbnail')
    ->whereNull('product.deleted_at')
    ->whereNotExists(function ($query): void {
        $query->selectRaw('1')
            ->from('product_images as image')
            ->whereColumn('image.product_id', 'product.id')
            ->whereColumn('image.url', 'product.thumbnail')
            ->whereNotNull('image.alt')
            ->whereRaw("TRIM(image.alt) <> ''");
    })
    ->count();
$missingBannerAlt = (int) DB::table('banners')
    ->whereNotNull('image')
    ->where(fn ($query) => $query->whereNull('alt')->orWhereRaw("TRIM(alt) = ''"))
    ->count();
$missingCollectionBannerAlt = (int) DB::table('collections')
    ->whereNotNull('banner')
    ->where(fn ($query) => $query->whereNull('banner_alt')->orWhereRaw("TRIM(banner_alt) = ''"))
    ->count();
$missingCategoryImageAlt = (int) DB::table('categories')
    ->whereNotNull('image')
    ->whereNull('deleted_at')
    ->where(fn ($query) => $query->whereNull('image_alt')->orWhereRaw("TRIM(image_alt) = ''"))
    ->count();
$photoMediaMissingAiDisclosure = (int) DB::table('categories')
    ->where('image', 'like', '%-photo-v%.webp')
    ->whereNull('deleted_at')
    ->where(fn ($query) => $query->whereNull('image_alt')->orWhere('image_alt', 'not like', 'Ảnh AI demo:%'))
    ->count()
    + (int) DB::table('collections')
        ->where('banner', 'like', '%-photo-v%.webp')
        ->where(fn ($query) => $query->whereNull('banner_alt')->orWhere('banner_alt', 'not like', 'Ảnh AI demo:%'))
        ->count()
    + (int) DB::table('banners')
        ->where('image', 'like', '%-photo-v%.webp')
        ->where(fn ($query) => $query->whereNull('alt')->orWhere('alt', 'not like', 'Ảnh AI demo:%'))
        ->count();
$legacyConceptAltReferences = (int) DB::table('categories')
    ->where('image', 'like', '%/demo-media/%')
    ->where('image_alt', 'like', 'Ảnh concept demo:%')
    ->count()
    + (int) DB::table('collections')
        ->where('banner', 'like', '%/demo-media/%')
        ->where('banner_alt', 'like', 'Ảnh concept demo:%')
        ->count()
    + (int) DB::table('banners')
        ->where('image', 'like', '%/demo-media/%')
        ->where('alt', 'like', 'Ảnh concept demo:%')
        ->count()
    + (int) DB::table('product_images')
        ->where('url', 'like', '%/demo-media/%')
        ->where('alt', 'like', 'Ảnh concept demo:%')
        ->count();
$reviewImageUrls = DB::table('review_images')->pluck('url');
$demoReviewImagePattern = '%/reviews/demo-ai-review-photo.webp';
$pendingDemoReviewImages = (int) DB::table('review_images as image')
    ->join('reviews as review', 'review.id', '=', 'image.review_id')
    ->where('image.url', 'like', $demoReviewImagePattern)
    ->where('review.status', 'pending')
    ->count();
$allDemoReviewImages = (int) DB::table('review_images')
    ->where('url', 'like', $demoReviewImagePattern)
    ->count();
$approvedDemoReviewImages = (int) DB::table('review_images as image')
    ->join('reviews as review', 'review.id', '=', 'image.review_id')
    ->where('image.url', 'like', $demoReviewImagePattern)
    ->where('review.status', 'approved')
    ->count();
$missingExpectedDemoReviewImage = app()->environment(['local', 'testing'])
    && $allDemoReviewImages !== 1;
$missingReviewImageFiles = [];
$invalidReviewImageUrls = [];
$publicDiskDriver = (string) config('filesystems.disks.public.driver');
$publicDiskBasePath = rtrim((string) parse_url(Storage::disk('public')->url(''), PHP_URL_PATH), '/');

foreach ($reviewImageUrls as $reviewImageUrl) {
    if (! is_string($reviewImageUrl) || filter_var($reviewImageUrl, FILTER_VALIDATE_URL) === false) {
        $invalidReviewImageUrls[] = (string) $reviewImageUrl;

        continue;
    }

    if ($publicDiskDriver !== 'local') {
        continue;
    }

    $imagePath = (string) parse_url($reviewImageUrl, PHP_URL_PATH);
    if ($publicDiskBasePath === '' || ! str_starts_with($imagePath, $publicDiskBasePath.'/')) {
        $invalidReviewImageUrls[] = $reviewImageUrl;

        continue;
    }

    $relativeImagePath = substr($imagePath, strlen($publicDiskBasePath) + 1);
    if (! Storage::disk('public')->exists($relativeImagePath)) {
        $missingReviewImageFiles[] = $reviewImageUrl;
    }
}
$expectedCategories = ['trang-phuc', 'hang-moi', 'ao', 'quan', 'vay', 'ao-khoac', 'phu-kien'];
$expectedProducts = [
    'ao-so-mi-linen', 'quan-suong-cotton', 'vay-midi-co-vuong', 'ao-khoac-blazer',
    'ao-thun-cotton-co-tron', 'ao-kieu-tay-phong', 'quan-ong-dung-linen', 'chan-vay-chu-a-midi',
    'ao-cardigan-det-kim', 'tui-tote-canvas', 'ao-polo-cotton-pique', 'ao-gile-linen',
    'quan-short-linen', 'vay-quan-midi', 'vay-so-mi-linen', 'ao-khoac-trench-ngan',
    'khan-lua-vuong', 'vi-mini-da-mem',
];
$expectedCollections = ['hang-moi', 'thu-dong-2026'];
$missingExpectedMedia = [];
$duplicateCategoryCovers = [];
$categoryCoverOwnersByHash = [];

foreach ($expectedCategories as $slug) {
    $category = DB::table('categories')->where('slug', $slug)->whereNull('deleted_at')->first(['image']);
    if ($category === null || ! is_string($category->image) || ! str_contains($category->image, '/demo-media/')) {
        continue;
    }

    $relativePath = substr($category->image, strpos($category->image, '/demo-media/') + strlen('/demo-media/'));
    $filePath = $apiDirectory.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'demo-media'.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    if (! is_file($filePath)) {
        continue;
    }

    $hash = hash_file('sha256', $filePath);
    if (! is_string($hash)) {
        continue;
    }

    if (isset($categoryCoverOwnersByHash[$hash])) {
        $duplicateCategoryCovers[] = $categoryCoverOwnersByHash[$hash].' and '.$slug.' reference identical image bytes';
    } else {
        $categoryCoverOwnersByHash[$hash] = $slug;
    }
}

foreach ($expectedCategories as $slug) {
    $category = DB::table('categories')->where('slug', $slug)->whereNull('deleted_at')->first(['image']);
    if ($category === null || blank($category->image)) {
        $missingExpectedMedia[] = "category {$slug} has no demo cover";
    }
}

foreach ($expectedProducts as $slug) {
    $product = DB::table('products')->where('slug', $slug)->where('status', 'active')->whereNull('deleted_at')->first(['id', 'thumbnail']);
    if ($product === null) {
        $missingExpectedMedia[] = "active demo product {$slug} is missing";

        continue;
    }

    $hasGalleryImage = DB::table('product_images')->where('product_id', $product->id)->exists();
    if (blank($product->thumbnail) || ! $hasGalleryImage) {
        $missingExpectedMedia[] = "active demo product {$slug} is missing a thumbnail or gallery image";
    }
}

foreach ($expectedCollections as $slug) {
    $collection = DB::table('collections')->where('slug', $slug)->where('is_active', true)->first(['banner']);
    if ($collection === null || blank($collection->banner)) {
        $missingExpectedMedia[] = "active demo collection {$slug} has no cover";
    }
}

foreach (['hero', 'hero-mobile', 'campaign'] as $position) {
    $banner = DB::table('banners')->where('position', $position)->where('is_active', true)->first(['image', 'video_url']);
    if ($banner === null || blank($banner->image)) {
        $missingExpectedMedia[] = "active demo banner position {$position} has no image";
    }
    if ($position === 'campaign' && ($banner === null || blank($banner->video_url))) {
        $missingExpectedMedia[] = 'active campaign banner has no demo video';
    }
}

$publicBrandSettings = DB::table('settings')
    ->whereIn('key', ['store_logo', 'store_favicon', 'seo_og_image'])
    ->pluck('value', 'key');
foreach (['store_logo', 'store_favicon', 'seo_og_image'] as $settingKey) {
    $key = 'settings.'.$settingKey;
    $counts[$key] = 0;
    $url = $publicBrandSettings->get($settingKey);
    if (! is_string($url) || ! str_contains($url, '/demo-media/')) {
        continue;
    }

    $counts[$key]++;
    $relativePath = substr($url, strpos($url, '/demo-media/') + strlen('/demo-media/'));
    $filePath = $apiDirectory.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'demo-media'.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    if (! is_file($filePath)) {
        $missingFiles[] = $key.' -> '.$url;

        continue;
    }

    if ($settingKey === 'seo_og_image') {
        $image = getimagesize($filePath);
        if (filesize($filePath) > 150 * 1024 || $image === false || ($image['mime'] ?? null) !== 'image/jpeg' || $image[0] !== 1200 || $image[1] !== 630) {
            $invalidMedia[] = $key.' must be a JPEG, exactly 1200×630, and below 150 KiB -> '.$url;
        }
    } elseif (strtolower(pathinfo($filePath, PATHINFO_EXTENSION)) !== 'svg' || ! str_contains((string) file_get_contents($filePath), '<svg')) {
        $invalidMedia[] = $key.' must reference a readable SVG -> '.$url;
    }
}

foreach ($references as $table => $columns) {
    foreach ($columns as $column) {
        $key = $table.'.'.$column;
        $counts[$key] = 0;

        $selectedColumns = [$column];
        if ($table === 'banners' && $column === 'image') {
            $selectedColumns[] = 'position';
        }

        foreach (DB::table($table)->whereNotNull($column)->get($selectedColumns) as $record) {
            $url = $record->{$column};
            if (! is_string($url) || ! str_contains($url, '/demo-media/')) {
                continue;
            }

            $counts[$key]++;
            $relativePath = substr($url, strpos($url, '/demo-media/') + strlen('/demo-media/'));
            $filePath = $apiDirectory.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'demo-media'.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relativePath);

            if (! is_file($filePath)) {
                $missingFiles[] = $key.' -> '.$url;

                continue;
            }

            if ($key === 'product_images.url' && str_ends_with((string) parse_url($url, PHP_URL_PATH), '-photo.webp')) {
                $image = getimagesize($filePath);
                if ($image === false || ($image['mime'] ?? null) !== 'image/webp' || $image[0] !== 600 || $image[1] !== 800 || filesize($filePath) > 80_000) {
                    $invalidMedia[] = 'product demo image must be 600×800 WebP, below 80 KiB -> '.$url;
                }
            }

            if ($key === 'banners.video_url') {
                $fileSize = filesize($filePath);
                $handle = fopen($filePath, 'rb');
                $header = $handle === false ? false : fread($handle, 12);
                if (is_resource($handle)) {
                    fclose($handle);
                }
                $extension = strtolower(pathinfo((string) parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));

                if ($fileSize === false || $fileSize > $videoLimit) {
                    $invalidMedia[] = $key.' exceeds 5 MiB -> '.$url;
                }
                if ($extension !== 'mp4' || ! is_string($header) || strlen($header) < 12 || substr($header, 4, 4) !== 'ftyp') {
                    $invalidMedia[] = $key.' must be an MP4 file -> '.$url;
                }

                continue;
            }

            if (isset($imageLimits[$key])) {
                $fileSize = filesize($filePath);
                $image = getimagesize($filePath);
                if ($fileSize === false || $fileSize > $imageLimits[$key]) {
                    $invalidMedia[] = $key.' exceeds '.number_format($imageLimits[$key] / 1024, 0).' KiB -> '.$url;
                }
                if ($image === false || ($image['mime'] ?? null) !== 'image/webp') {
                    $invalidMedia[] = $key.' must be a readable WebP image -> '.$url;

                    continue;
                }

                [$width, $height] = $image;
                if ($table === 'banners' && $record->position === 'hero-mobile' && ($width < 720 || $height < 900)) {
                    $invalidMedia[] = $key.' at hero-mobile position must be at least 720×900 -> '.$url;
                } elseif ($table === 'banners' && $record->position !== 'hero-mobile' && ($width < 1200 || $height < 675)) {
                    $invalidMedia[] = $key.' must be at least 1200×675 -> '.$url;
                }
                if (in_array($table, ['categories', 'collections'], true) && ($width < 600 || $height < 600)) {
                    $invalidMedia[] = $key.' must be at least 600×600 -> '.$url;
                }

                if ($table === 'banners' && $record->position === 'hero' && abs(($width / $height) - (16 / 9)) > 0.02) {
                    $invalidMedia[] = 'banners.image at hero position must use 16:9 -> '.$url;
                }
                if ($table === 'banners' && $record->position === 'hero-mobile' && abs(($width / $height) - (4 / 5)) > 0.02) {
                    $invalidMedia[] = 'banners.image at hero-mobile position must use 4:5 -> '.$url;
                }
            }
        }
    }
}

echo "Storefront demo media references:\n";
echo '- required static UI illustrations: '.count($requiredIllustrations)."\n";
echo '- missing or unreferenced static UI illustrations: '.count($missingRequiredIllustrations)."\n";
foreach ($counts as $key => $count) {
    echo "- {$key}: {$count}\n";
}
echo '- product_images missing alt: '.$missingAlt."\n";
echo '- active products using AI demo product photos: '.$generatedProductMediaReferences."\n";
echo '- active products with matching AI photo disclosure in alt text: '.$activeProductsWithAiDemoDisclosure."\n";
echo '- product thumbnails without matching gallery alt: '.$missingProductThumbnailAlt."\n";
echo '- banners missing alt: '.$missingBannerAlt."\n";
echo '- collections missing banner alt: '.$missingCollectionBannerAlt."\n";
echo '- categories missing image alt: '.$missingCategoryImageAlt."\n";
echo '- photo-based category, collection, and banner media missing AI-demo disclosure: '.$photoMediaMissingAiDisclosure."\n";
echo '- generated demo media with legacy concept alt text: '.$legacyConceptAltReferences."\n";
echo '- review images: '.$reviewImageUrls->count()."\n";
echo '- total disclosed AI-demo review-image fixtures: '.$allDemoReviewImages."\n";
echo '- pending AI-demo review-image fixtures: '.$pendingDemoReviewImages."\n";
echo '- approved reviews carrying the disclosed AI-demo image: '.$approvedDemoReviewImages."\n";
echo '- review image files missing on local public disk: '.count($missingReviewImageFiles)."\n";
echo '- review image URLs invalid: '.count($invalidReviewImageUrls)."\n";
if ($publicDiskDriver !== 'local') {
    echo '- review image storage check: skipped for non-local public disk ('.$publicDiskDriver.")\n";
}
echo '- missing required demo-media records: '.count($missingExpectedMedia)."\n";
echo '- duplicate demo category cover contents: '.count($duplicateCategoryCovers)."\n";
echo '- missing files: '.count($missingFiles)."\n";
echo '- invalid media size, format, or dimensions: '.count($invalidMedia)."\n";

$missingFiles = [...$missingFiles, ...array_map(static fn (string $url): string => 'review image -> '.$url, $missingReviewImageFiles)];
$invalidMedia = [...$invalidMedia, ...array_map(static fn (string $url): string => 'invalid review image URL -> '.$url, $invalidReviewImageUrls)];

if ($missingFiles !== []) {
    foreach ($missingFiles as $reference) {
        echo "  - {$reference}\n";
    }

    exit(1);
}

if ($duplicateCategoryCovers !== []) {
    foreach ($duplicateCategoryCovers as $duplicate) {
        echo "  - {$duplicate}\n";
    }

    exit(1);
}

if ($invalidMedia !== []) {
    foreach ($invalidMedia as $reference) {
        echo "  - {$reference}\n";
    }

    exit(1);
}

if ($missingExpectedMedia !== []) {
    foreach ($missingExpectedMedia as $reference) {
        echo "  - {$reference}\n";
    }

    exit(1);
}

if ($missingExpectedDemoReviewImage) {
    echo "  - expected one local review-image fixture with AI-demo disclosure\n";

    exit(1);
}

if ($missingRequiredIllustrations !== []) {
    foreach ($missingRequiredIllustrations as $reference) {
        echo "  - {$reference}\n";
    }

    exit(1);
}

if ($activeProductsWithAiDemoDisclosure !== $generatedProductMediaReferences || $photoMediaMissingAiDisclosure > 0 || $legacyConceptAltReferences > 0 || $missingAlt > 0 || $missingProductThumbnailAlt > 0 || $missingBannerAlt > 0 || $missingCollectionBannerAlt > 0 || $missingCategoryImageAlt > 0) {
    exit(1);
}

exit(0);
