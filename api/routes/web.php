<?php

use App\Http\Controllers\Api\V1\Storefront\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', SitemapController::class)->name('storefront.sitemap');
Route::get('/robots.txt', function () {
    $sitemap = rtrim((string) config('app.frontend_url'), '/').'/sitemap.xml';

    return response("User-agent: *\nAllow: /\nSitemap: {$sitemap}\n", 200, [
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Cache-Control' => 'public, max-age=3600',
    ]);
})->name('storefront.robots');
