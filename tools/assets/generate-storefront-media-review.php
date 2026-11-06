<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

$apiDirectory = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'api';
require $apiDirectory.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php';

$app = require $apiDirectory.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'app.php';
$app->make(Kernel::class)->bootstrap();

$outputPath = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'ui-ux'.DIRECTORY_SEPARATOR.'mockups'.DIRECTORY_SEPARATOR.'storefront-assets-review.html';
$escape = static fn (mixed $value): string => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$localMedia = static function (?string $url): ?string {
    if (! $url) {
        return null;
    }

    $path = parse_url($url, PHP_URL_PATH);
    $marker = '/demo-media/';
    $position = is_string($path) ? strpos($path, $marker) : false;

    return $position === false ? null : '../../../api/public/demo-media/'.substr($path, $position + strlen($marker));
};
$imageCard = static function (string $title, ?string $url, ?string $alt, string $kind) use ($escape, $localMedia): string {
    $source = $localMedia($url);
    $preview = $source
        ? '<img src="'.$escape($source).'" alt="'.$escape($alt).'" loading="lazy">'
        : '<div class="missing">Chưa có ảnh</div>';

    return '<article class="asset-card"><div class="preview">'.$preview.'</div><div class="asset-copy"><p class="kind">'.$escape($kind).'</p><h3>'.$escape($title).'</h3><p class="alt"><b>Alt:</b> '.$escape($alt ?: 'Chưa có alt text').'</p><code>'.$escape($url ?: '—').'</code></div></article>';
};

$banners = DB::table('banners')->where('image', 'like', '%/demo-media/%')->orderBy('position')->orderBy('sort_order')->get([
    'title', 'description', 'alt', 'position', 'image', 'video_url', 'link_url', 'is_active', 'starts_at', 'ends_at',
]);
$categories = DB::table('categories')->whereNull('deleted_at')->where('image', 'like', '%/demo-media/%')->orderBy('sort_order')->orderBy('id')->get([
    'name', 'slug', 'image', 'image_alt', 'is_active',
]);
$collections = DB::table('collections')->where('banner', 'like', '%/demo-media/%')->orderBy('id')->get([
    'name', 'slug', 'description', 'banner', 'banner_alt', 'is_active',
]);
$products = DB::table('products')->where('status', 'active')->whereNull('deleted_at')->where('thumbnail', 'like', '%/demo-media/%')->orderBy('id')->get([
    'id', 'name', 'slug', 'thumbnail',
]);
$illustrations = array_values(array_filter(glob(dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'storefront'.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'illustrations'.DIRECTORY_SEPARATOR.'*.svg') ?: [], 'is_file'));
$mockupAssets = ['storefront-suite.html'];

$bannerCards = '';
foreach ($banners as $banner) {
    $bannerCards .= $imageCard($banner->title.' · '.$banner->position, $banner->image, $banner->alt, 'Banner · '.($banner->is_active ? 'Đang bật' : 'Đang tắt'));
    if ($banner->video_url && $localMedia($banner->video_url)) {
        $video = $localMedia($banner->video_url);
        $bannerCards .= '<article class="asset-card"><div class="preview video"><video controls preload="metadata" aria-label="Video chiến dịch: '.$escape($banner->title).'"><source src="'.$escape($video).'" type="video/mp4"></video></div><div class="asset-copy"><p class="kind">Video chiến dịch</p><h3>'.$escape($banner->title).'</h3><code>'.$escape($banner->video_url).'</code></div></article>';
    }
}

$categoryCards = '';
foreach ($categories as $category) {
    $categoryCards .= $imageCard($category->name.' · '.$category->slug, $category->image, $category->image_alt, 'Danh mục · '.($category->is_active ? 'Đang bật' : 'Đang tắt'));
}

$collectionCards = '';
foreach ($collections as $collection) {
    $collectionCards .= $imageCard($collection->name.' · '.$collection->slug, $collection->banner, $collection->banner_alt, 'Bộ sưu tập · '.($collection->is_active ? 'Đang bật' : 'Đang tắt'));
}

$productCards = '';
foreach ($products as $product) {
    $thumbnailAlt = DB::table('product_images')->where('product_id', $product->id)->where('url', $product->thumbnail)->value('alt');
    $productKind = str_starts_with((string) $thumbnailAlt, 'Ảnh AI demo:')
        ? 'Ảnh AI demo · ảnh flat-lay tạo mẫu, chưa xác nhận là hàng thật'
        : 'Ảnh cửa hàng cung cấp hoặc chưa có ảnh';
    $productCards .= $imageCard($product->name.' · '.$product->slug, $product->thumbnail, $thumbnailAlt, $productKind);
    $gallery = DB::table('product_images')->where('product_id', $product->id)->orderBy('sort_order')->get(['url', 'alt', 'color_value_id']);
    foreach ($gallery as $image) {
        if ($image->url === $product->thumbnail) {
            continue;
        }
        $galleryKind = str_starts_with((string) $image->alt, 'Ảnh AI demo:')
            ? 'Ảnh AI demo · ảnh flat-lay tạo mẫu, chưa xác nhận là hàng thật'
            : 'Ảnh cửa hàng cung cấp hoặc chưa có ảnh';
        $productCards .= $imageCard($product->name.' · '.($image->color_value_id ? 'ảnh theo màu' : 'ảnh dùng chung'), $image->url, $image->alt, $galleryKind);
    }
}

$mockupCards = '<article class="asset-card"><div class="preview illustration" role="img" aria-label="Ảnh sản phẩm chưa có sẵn"></div><div class="asset-copy"><p class="kind">Mockup A3 · bố cục đã duyệt</p><h3>Ảnh AI demo và nhãn công khai trong catalog/API</h3><p class="alt">Mockup A3 giữ nguyên bố cục đã duyệt. Ảnh sản phẩm AI ở dữ liệu demo được gắn nhãn, không đại diện hàng tồn thực.</p><a href="storefront-suite.html">Mở bộ mockup Storefront</a></div></article>';

$illustrationCards = '';
foreach ($illustrations as $asset) {
    $relative = '../../../storefront/public/illustrations/'.basename($asset);
    $illustrationCards .= '<article class="asset-card"><div class="preview illustration"><img src="'.$escape($relative).'" alt="Minh họa giao diện: '.$escape(pathinfo($asset, PATHINFO_FILENAME)).'" loading="lazy"></div><div class="asset-copy"><p class="kind">Minh họa trạng thái UI</p><h3>'.$escape(basename($asset)).'</h3></div></article>';
}

$generatedAt = now()->format('Y-m-d H:i:s T');
$html = '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Duyệt media demo · NÉT Studio</title><style>
:root{color-scheme:light;--ink:#27251f;--muted:#69665e;--line:#d9d4ca;--paper:#fbfaf7;--surface:#fff;--accent:#67553e}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 Inter,Segoe UI,sans-serif}header{padding:40px clamp(18px,5vw,72px) 28px;background:#f1eee8;border-bottom:1px solid var(--line)}header h1{margin:0;font:600 clamp(28px,4vw,44px)/1.1 Georgia,serif}header p{max-width:900px;color:var(--muted)}header .warning{padding:12px 14px;border-left:4px solid #9a5e2d;background:#fffaf2;color:#543c28}.summary{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.summary span{padding:6px 10px;border:1px solid var(--line);border-radius:99px;background:var(--surface);font-size:12px}main{padding:30px clamp(18px,5vw,72px) 64px}section{margin:0 0 48px}section h2{margin:0 0 8px;font:600 25px Georgia,serif}section>p{margin:0 0 16px;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,235px),1fr));gap:16px}.asset-card{overflow:hidden;border:1px solid var(--line);background:var(--surface)}.preview{display:grid;place-items:center;aspect-ratio:4/3;background:#eeeae3}.preview img{display:block;width:100%;height:100%;object-fit:cover}.preview.video{aspect-ratio:16/9;background:#181715}.preview.video video{width:100%;height:100%}.preview.illustration{padding:20px}.preview.illustration img{object-fit:contain}.missing{color:#a3312a}.asset-copy{padding:12px 14px 16px}.asset-copy h3{margin:3px 0 8px;font-size:15px;line-height:1.35}.kind{margin:0;color:var(--accent);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}.alt{margin:0 0 8px;color:var(--muted);font-size:12px}.asset-copy code{display:block;overflow-wrap:anywhere;color:#565149;font-size:10px}.empty{padding:18px;border:1px dashed var(--line);color:var(--muted)}footer{padding:20px clamp(18px,5vw,72px);border-top:1px solid var(--line);color:var(--muted);font-size:12px}@media(max-width:540px){header{padding-top:28px}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.asset-copy{padding:10px}.asset-copy h3{font-size:13px}}
</style></head><body><header><h1>Duyệt media demo · NÉT Studio</h1><p>Danh mục, bộ sưu tập, banner, video, ảnh AI demo sản phẩm và minh họa giao diện được lấy từ cơ sở dữ liệu local hiện tại cùng tài sản trong repo.</p><p class="warning"><b>Lưu ý:</b> Ảnh sản phẩm là ảnh AI demo dạng flat-lay, không có người mặc và chưa được cửa hàng xác nhận là ảnh chụp hàng thật. Giao diện có nhãn công khai; cần thay bằng ảnh cửa hàng cung cấp trước khi dùng làm ảnh sản phẩm thực tế.</p><div class="summary"><span>'.count($banners).' banner</span><span>'.count($categories).' danh mục</span><span>'.count($collections).' bộ sưu tập</span><span>'.count($products).' sản phẩm demo</span><span>1 bộ mockup A3</span><span>'.count($illustrations).' minh họa UI</span><span>Tạo lúc '.$escape($generatedAt).'</span></div></header><main>
<section><h2>Banner và video</h2><p>Ảnh desktop/mobile và video chiến dịch đang được seed vào bảng banner.</p><div class="grid">'.($bannerCards ?: '<p class="empty">Chưa có banner media demo.</p>').'</div></section>
<section><h2>Ảnh bìa danh mục</h2><p>Ảnh và alt text lấy từ các danh mục active có media demo.</p><div class="grid">'.($categoryCards ?: '<p class="empty">Chưa có ảnh danh mục demo.</p>').'</div></section>
<section><h2>Ảnh bìa bộ sưu tập</h2><p>Ảnh AI demo dạng flat-lay từ sản phẩm mẫu local/UAT; các alt text mô tả hình, không xác nhận hàng thật.</p><div class="grid">'.($collectionCards ?: '<p class="empty">Chưa có ảnh bộ sưu tập demo.</p>').'</div></section>
<section><h2>Ảnh sản phẩm</h2><p>Ảnh flat-lay AI chỉ dùng trong demo/UAT và có nhãn công khai. Ảnh do cửa hàng tải lên được ưu tiên; sản phẩm chưa có ảnh dùng khung trung tính.</p><div class="grid">'.($productCards ?: '<p class="empty">Chưa có sản phẩm demo.</p>').'</div></section>
<section><h2>Mockup A3 · bố cục đã duyệt</h2><p>Mockup giữ bố cục đã duyệt; catalog demo dùng ảnh AI flat-lay đã gắn nhãn.</p><div class="grid">'.$mockupCards.'</div></section>
<section><h2>Minh họa giao diện</h2><p>Minh họa trạng thái rỗng, lỗi, thành công và xác minh email.</p><div class="grid">'.($illustrationCards ?: '<p class="empty">Chưa có minh họa giao diện.</p>').'</div></section>
</main><footer>Nguồn dữ liệu: API demo local và assets trong repo. Trang này không tải media lên Admin hoặc sửa dữ liệu.</footer></body></html>';

file_put_contents($outputPath, $html);
fwrite(STDOUT, 'Generated '.$outputPath.PHP_EOL);
fwrite(STDOUT, 'Banners: '.count($banners).'; categories: '.count($categories).'; collections: '.count($collections).'; products: '.count($products).'; mockup suite: 1; UI illustrations: '.count($illustrations).PHP_EOL);
