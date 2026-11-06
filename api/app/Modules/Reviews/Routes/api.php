<?php

use App\Http\Controllers\Api\V1\Admin\ProductQuestionController as AdminProductQuestionController;
use App\Http\Controllers\Api\V1\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Api\V1\Storefront\ProductQuestionController as StorefrontProductQuestionController;
use App\Http\Controllers\Api\V1\Storefront\ReviewController as StorefrontReviewController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/products/{slug}/reviews', [StorefrontReviewController::class, 'index'])->middleware('throttle:public-api');
    Route::get('/products/{slug}/questions', [StorefrontProductQuestionController::class, 'index'])->middleware('throttle:public-api');
    Route::post('/products/{slug}/questions', [StorefrontProductQuestionController::class, 'store'])->middleware(['auth:api', 'audience:storefront', 'throttle:5,1']);
    Route::post('/reviews/{review}/helpful-votes', [StorefrontReviewController::class, 'helpful'])->middleware('throttle:10,1');
    Route::post('/reviews', [StorefrontReviewController::class, 'store'])
        ->middleware(['auth:api', 'audience:storefront', 'throttle:uploads']);
});

Route::prefix('v1/admin')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:reviews.moderate'])->group(function (): void {
    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::get('/product-questions', [AdminProductQuestionController::class, 'index']);
    Route::patch('/product-questions/{question}', [AdminProductQuestionController::class, 'update'])->whereNumber('question');
    Route::get('/reviews/{review}', [AdminReviewController::class, 'show']);
    Route::patch('/reviews/{review}/response', [AdminReviewController::class, 'saveResponse']);
    Route::patch('/reviews/bulk-status', [AdminReviewController::class, 'bulkModerate']);
    Route::patch('/reviews/{review}/status', [AdminReviewController::class, 'moderate']);
    Route::patch('/reviews/{review}', [AdminReviewController::class, 'moderate']);
    Route::delete('/reviews/{review}', [AdminReviewController::class, 'destroy']);
});
