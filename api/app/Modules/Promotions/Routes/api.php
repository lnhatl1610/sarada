<?php

use App\Http\Controllers\Api\V1\Admin\BlogPostController as AdminBlogPostController;
use App\Http\Controllers\Api\V1\Admin\CampaignController;
use App\Http\Controllers\Api\V1\Admin\CareerOpeningController as AdminCareerOpeningController;
use App\Http\Controllers\Api\V1\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Api\V1\Admin\PageController;
use App\Http\Controllers\Api\V1\Admin\StorefrontPromotionCampaignController;
use App\Http\Controllers\Api\V1\Admin\StoreLocationController as AdminStoreLocationController;
use App\Http\Controllers\Api\V1\PageController as PublicPageController;
use App\Http\Controllers\Api\V1\Storefront\BlogPostController as StorefrontBlogPostController;
use App\Http\Controllers\Api\V1\Storefront\CareerOpeningController as StorefrontCareerOpeningController;
use App\Http\Controllers\Api\V1\Storefront\FaqController as StorefrontFaqController;
use App\Http\Controllers\Api\V1\Storefront\StoreLocationController as StorefrontStoreLocationController;
use Illuminate\Support\Facades\Route;

Route::get('v1/pages', [PublicPageController::class, 'index'])->middleware('throttle:public-api');
Route::get('v1/pages/{slug}', [PublicPageController::class, 'show'])->where('slug', '[A-Za-z0-9_-]+')->middleware('throttle:public-api');
Route::get('v1/stores', [StorefrontStoreLocationController::class, 'index'])->middleware('throttle:public-api');
Route::get('v1/faqs', [StorefrontFaqController::class, 'index'])->middleware('throttle:public-api');
Route::post('v1/faqs/{faq}/helpful-votes', [StorefrontFaqController::class, 'helpful'])->whereNumber('faq')->middleware('throttle:10,1');
Route::get('v1/blog/posts', [StorefrontBlogPostController::class, 'index'])->middleware('throttle:public-api');
Route::get('v1/blog/posts/{slug}', [StorefrontBlogPostController::class, 'show'])->where('slug', '[A-Za-z0-9_-]+')->middleware('throttle:public-api');
Route::get('v1/careers', [StorefrontCareerOpeningController::class, 'index'])->middleware('throttle:public-api');

Route::prefix('v1/admin/campaigns')->middleware(['auth:sanctum,api', 'audience:admin'])->group(function (): void {
    Route::get('/coupons/{campaign}/usages', [CampaignController::class, 'usages'])->middleware('permission:coupons.view');
    foreach (['coupons' => ['view' => 'coupons.view', 'manage' => 'coupons.manage'], 'banners' => ['view' => 'content.manage', 'manage' => 'content.manage']] as $kind => $permissions) {
        Route::get('/'.$kind, [CampaignController::class, 'index'])->defaults('kind', $kind)->middleware('permission:'.$permissions['view']);
        Route::get('/'.$kind.'/{campaign}', [CampaignController::class, 'show'])->defaults('kind', $kind)->middleware('permission:'.$permissions['view']);
        Route::post('/'.$kind, [CampaignController::class, 'store'])->defaults('kind', $kind)->middleware('permission:'.$permissions['manage']);
        Route::patch('/'.$kind.'/{campaign}', [CampaignController::class, 'update'])->defaults('kind', $kind)->middleware('permission:'.$permissions['manage']);
        Route::delete('/'.$kind.'/{campaign}', [CampaignController::class, 'destroy'])->defaults('kind', $kind)->middleware('permission:'.$permissions['manage']);
    }
});

Route::prefix('v1/admin/storefront-promotion-campaigns')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:coupons.manage'])->group(function (): void {
    Route::get('/', [StorefrontPromotionCampaignController::class, 'index']);
    Route::post('/', [StorefrontPromotionCampaignController::class, 'store']);
});

Route::prefix('v1/admin')->middleware(['auth:sanctum,api', 'audience:admin'])->group(function (): void {
    Route::get('/blog/posts', [AdminBlogPostController::class, 'index'])->middleware('permission:content.manage');
    Route::get('/blog/posts/{post}', [AdminBlogPostController::class, 'show'])->whereNumber('post')->middleware('permission:content.manage');
    Route::post('/blog/posts', [AdminBlogPostController::class, 'store'])->middleware('permission:content.manage');
    Route::patch('/blog/posts/{post}', [AdminBlogPostController::class, 'update'])->whereNumber('post')->middleware('permission:content.manage');
    Route::delete('/blog/posts/{post}', [AdminBlogPostController::class, 'destroy'])->whereNumber('post')->middleware('permission:content.manage');
    Route::get('/stores', [AdminStoreLocationController::class, 'index'])->middleware('permission:content.manage');
    Route::post('/stores', [AdminStoreLocationController::class, 'store'])->middleware('permission:content.manage');
    Route::patch('/stores/{store}', [AdminStoreLocationController::class, 'update'])->whereNumber('store')->middleware('permission:content.manage');
    Route::delete('/stores/{store}', [AdminStoreLocationController::class, 'destroy'])->whereNumber('store')->middleware('permission:content.manage');
    Route::get('/faqs', [AdminFaqController::class, 'index'])->middleware('permission:content.manage');
    Route::post('/faqs', [AdminFaqController::class, 'store'])->middleware('permission:content.manage');
    Route::patch('/faqs/{faq}', [AdminFaqController::class, 'update'])->whereNumber('faq')->middleware('permission:content.manage');
    Route::delete('/faqs/{faq}', [AdminFaqController::class, 'destroy'])->whereNumber('faq')->middleware('permission:content.manage');
    Route::get('/pages', [PageController::class, 'index'])->middleware('permission:content.manage');
    Route::get('/pages/{page}', [PageController::class, 'show'])->whereNumber('page')->middleware('permission:content.manage');
    Route::post('/pages', [PageController::class, 'store'])->middleware('permission:content.manage');
    Route::patch('/pages/{page}', [PageController::class, 'update'])->whereNumber('page')->middleware('permission:content.manage');
    Route::delete('/pages/{page}', [PageController::class, 'destroy'])->whereNumber('page')->middleware('permission:content.manage');
    Route::get('/career-openings', [AdminCareerOpeningController::class, 'index'])->middleware('permission:content.manage');
    Route::post('/career-openings', [AdminCareerOpeningController::class, 'store'])->middleware('permission:content.manage');
    Route::patch('/career-openings/{opening}', [AdminCareerOpeningController::class, 'update'])->whereNumber('opening')->middleware('permission:content.manage');
    Route::delete('/career-openings/{opening}', [AdminCareerOpeningController::class, 'destroy'])->whereNumber('opening')->middleware('permission:content.manage');
    Route::patch('/banners/reorder', [CampaignController::class, 'reorder'])->defaults('kind', 'banners')->middleware('permission:content.manage');
    Route::get('/coupons/{campaign}/usages', [CampaignController::class, 'usages'])->defaults('kind', 'coupons')->middleware('permission:coupons.view');
    Route::get('/coupons', [CampaignController::class, 'index'])->defaults('kind', 'coupons')->middleware('permission:coupons.view');
    Route::get('/coupons/{campaign}', [CampaignController::class, 'show'])->defaults('kind', 'coupons')->middleware('permission:coupons.view');
    Route::post('/coupons', [CampaignController::class, 'store'])->defaults('kind', 'coupons')->middleware('permission:coupons.manage');
    Route::patch('/coupons/{campaign}', [CampaignController::class, 'update'])->defaults('kind', 'coupons')->middleware('permission:coupons.manage');
    Route::delete('/coupons/{campaign}', [CampaignController::class, 'destroy'])->defaults('kind', 'coupons')->middleware('permission:coupons.manage');
    Route::get('/banners', [CampaignController::class, 'index'])->defaults('kind', 'banners')->middleware('permission:content.manage');
    Route::get('/banners/{campaign}', [CampaignController::class, 'show'])->defaults('kind', 'banners')->middleware('permission:content.manage');
    Route::post('/banners', [CampaignController::class, 'store'])->defaults('kind', 'banners')->middleware('permission:content.manage');
    Route::patch('/banners/{campaign}', [CampaignController::class, 'update'])->defaults('kind', 'banners')->middleware('permission:content.manage');
    Route::delete('/banners/{campaign}', [CampaignController::class, 'destroy'])->defaults('kind', 'banners')->middleware('permission:content.manage');
});
