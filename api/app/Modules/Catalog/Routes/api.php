<?php

use App\Http\Controllers\Api\V1\Admin\CatalogOptionController;
use App\Http\Controllers\Api\V1\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\V1\Admin\ProductDetailsController;
use App\Http\Controllers\Api\V1\Admin\TagController;
use App\Http\Controllers\Api\V1\Storefront\CatalogController;
use App\Http\Controllers\Api\V1\Storefront\ProductStockAlertController;
use App\Http\Controllers\Api\V1\Storefront\SearchController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:public-api')->group(function (): void {
    Route::get('/banners', [CatalogController::class, 'banners'])->name('banners.index');
    Route::get('/collections', [CatalogController::class, 'collections'])->name('collections.index');
    Route::get('/collections/{slug}', [CatalogController::class, 'collection'])->name('collections.show');
    Route::get('/categories', [CatalogController::class, 'categories'])->name('categories.index');
    Route::get('/catalog/filter-options', [CatalogController::class, 'filterOptions'])->name('catalog.filter-options');
    Route::get('/search/content-suggestions', [SearchController::class, 'contentSuggestions'])->name('search.content-suggestions');
    Route::get('/search/pages', [SearchController::class, 'searchPages'])->name('search.pages');
    Route::get('/search/trending', [SearchController::class, 'trending'])->name('search.trending');
    Route::post('/search/terms', [SearchController::class, 'trackTerm'])->middleware('throttle:10,1')->name('search.terms.track');
    Route::get('/products', [CatalogController::class, 'products'])->name('products.index');
    Route::post('/products/{slug}/stock-alerts', [ProductStockAlertController::class, 'store'])->middleware('throttle:5,1')->name('products.stock-alerts.store');
    Route::get('/products/{slug}/related', [CatalogController::class, 'related'])->name('products.related');
    Route::get('/products/{slug}', [CatalogController::class, 'product'])->name('products.show');
});

Route::prefix('v1/admin')->middleware(['auth:sanctum,api', 'audience:admin'])->group(function (): void {
    Route::get('/tags', [TagController::class, 'index'])->middleware('permission:products.view');
    Route::post('/tags', [TagController::class, 'store'])->middleware('permission:products.create');
    Route::put('/tags/{tag}', [TagController::class, 'update'])->whereNumber('tag')->middleware('permission:products.update');
    Route::patch('/tags/{tag}', [TagController::class, 'update'])->whereNumber('tag')->middleware('permission:products.update');
    Route::post('/tags/merge', [TagController::class, 'merge'])->middleware('permission:products.update');
    Route::get('/catalog-options/{kind}', [CatalogOptionController::class, 'index'])->whereIn('kind', ['categories', 'brands', 'colors', 'sizes', 'collections'])->middleware('permission:products.view');
    Route::get('/catalog-options/{kind}/{option}', [CatalogOptionController::class, 'show'])->whereIn('kind', ['categories', 'brands', 'colors', 'sizes', 'collections'])->middleware('permission:products.view');
    Route::post('/catalog-options/{kind}', [CatalogOptionController::class, 'store'])->whereIn('kind', ['categories', 'brands', 'colors', 'sizes', 'collections'])->middleware('permission:products.create');
    Route::patch('/catalog-options/{kind}/{option}', [CatalogOptionController::class, 'update'])->whereIn('kind', ['categories', 'brands', 'colors', 'sizes', 'collections'])->middleware('permission:products.update');
    Route::delete('/catalog-options/{kind}/{option}', [CatalogOptionController::class, 'destroy'])->whereIn('kind', ['categories', 'brands', 'colors', 'sizes', 'collections'])->middleware('permission:products.delete');
    Route::patch('/categories/reorder', [CatalogOptionController::class, 'reorder'])->defaults('kind', 'categories')->middleware('permission:products.update');
    Route::patch('/sizes/reorder', [CatalogOptionController::class, 'reorder'])->defaults('kind', 'sizes')->middleware('permission:products.update');
    Route::patch('/colors/reorder', [CatalogOptionController::class, 'reorder'])->defaults('kind', 'colors')->middleware('permission:products.update');
    foreach (['categories', 'brands', 'colors', 'sizes', 'collections'] as $kind) {
        Route::get('/'.$kind, [CatalogOptionController::class, 'index'])->defaults('kind', $kind)->middleware('permission:products.view');
        Route::get('/'.$kind.'/{option}', [CatalogOptionController::class, 'show'])->defaults('kind', $kind)->middleware('permission:products.view');
        Route::post('/'.$kind, [CatalogOptionController::class, 'store'])->defaults('kind', $kind)->middleware('permission:products.create');
        Route::patch('/'.$kind.'/{option}', [CatalogOptionController::class, 'updateAlias'])->defaults('kind', $kind)->middleware('permission:products.update');
        Route::delete('/'.$kind.'/{option}', [CatalogOptionController::class, 'destroyAlias'])->defaults('kind', $kind)->middleware('permission:products.delete');
    }
    Route::get('/collections/{collection}/products', [CatalogOptionController::class, 'collectionProducts'])->middleware('permission:products.view');
    Route::post('/collections/{collection}/products', [CatalogOptionController::class, 'attachCollectionProducts'])->middleware('permission:products.update');
    Route::delete('/collections/{collection}/products', [CatalogOptionController::class, 'detachCollectionProducts'])->middleware('permission:products.update');
    Route::delete('/collections/{collection}/products/{product}', [CatalogOptionController::class, 'detachCollectionProduct'])->middleware('permission:products.update');
    Route::patch('/collections/{collection}/products/reorder', [CatalogOptionController::class, 'reorderCollectionProducts'])->middleware('permission:products.update');
    Route::get('/products', [AdminProductController::class, 'index'])->middleware('permission:products.view');
    Route::get('/products/export', [AdminProductController::class, 'export'])->middleware('permission:products.view');
    Route::post('/products', [AdminProductController::class, 'store'])->middleware('permission:products.create');
    Route::patch('/products/bulk', [AdminProductController::class, 'bulk'])->middleware('permission:products.update');
    Route::patch('/products/{product}', [AdminProductController::class, 'update'])->middleware('permission:products.update');
    Route::delete('/products/{product}', [AdminProductController::class, 'destroy'])->middleware('permission:products.delete');
    Route::get('/products/{product}/details', [ProductDetailsController::class, 'show'])->middleware('permission:products.view');
    Route::patch('/products/{product}/details', [ProductDetailsController::class, 'update'])->middleware('permission:products.update');
    Route::put('/products/{product}/size-recommendations', [ProductDetailsController::class, 'saveSizeRecommendations'])->middleware('permission:products.update');
    Route::post('/products/{product}/variants', [ProductDetailsController::class, 'storeVariant'])->middleware('permission:products.create');
    Route::patch('/products/{product}/variants/{variant}', [ProductDetailsController::class, 'updateVariant'])->middleware('permission:products.update');
    Route::post('/products/{product}/images', [ProductDetailsController::class, 'storeImage'])->middleware('permission:products.update');
    Route::post('/products/{product}/images/upload', [ProductDetailsController::class, 'uploadImage'])->middleware(['permission:products.update', 'throttle:uploads']);
    Route::post('/products/{product}/videos/upload', [ProductDetailsController::class, 'uploadVideo'])->middleware(['permission:products.update', 'throttle:uploads']);
    Route::delete('/products/{product}/videos/{video}', [ProductDetailsController::class, 'destroyVideo'])->whereNumber('video')->middleware('permission:products.update');
    Route::patch('/products/{product}/images/reorder', [ProductDetailsController::class, 'reorderImages'])->middleware('permission:products.update');
    Route::patch('/products/{product}/images/{image}', [ProductDetailsController::class, 'updateImage'])->middleware('permission:products.update');
    Route::delete('/products/{product}/images/{image}', [ProductDetailsController::class, 'destroyImage'])->middleware('permission:products.update');
    Route::patch('/products/{product}/images/{image}/primary', [ProductDetailsController::class, 'setPrimaryImage'])->middleware('permission:products.update');
    Route::get('/products/{product}', [AdminProductController::class, 'show'])->middleware('permission:products.view');
    Route::put('/products/{product}', [AdminProductController::class, 'update'])->middleware('permission:products.update');
    Route::post('/products/{product}/duplicate', [AdminProductController::class, 'duplicate'])->middleware('permission:products.create');
});
