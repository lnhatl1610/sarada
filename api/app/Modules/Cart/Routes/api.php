<?php

use App\Http\Controllers\Api\V1\Storefront\CartController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['throttle:public-api', 'optional.storefront.auth'])->group(function (): void {
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'add'])->middleware('throttle:60,1');
    Route::patch('/cart/items/{item}', [CartController::class, 'update']);
    Route::delete('/cart/items/{item}', [CartController::class, 'remove']);
    Route::put('/cart/recovery-contact', [CartController::class, 'saveRecoveryContact'])->middleware('throttle:5,1');
    Route::delete('/cart/recovery-contact', [CartController::class, 'removeRecoveryContact'])->middleware('throttle:5,1');
});

Route::post('v1/cart/merge', [CartController::class, 'merge'])->middleware(['auth:api', 'audience:storefront']);
