<?php

use App\Http\Controllers\Api\V1\Storefront\CheckoutController;
use App\Http\Controllers\Api\V1\Storefront\BankTransferPaymentController;
use App\Http\Controllers\Api\V1\Storefront\LocationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['throttle:public-api', 'optional.storefront.auth'])->group(function (): void {
    Route::get('/locations/provinces', [LocationController::class, 'provinces']);
    Route::get('/locations/provinces/{provinceCode}/wards', [LocationController::class, 'wards']);
    Route::get('/shipping/fee', [CheckoutController::class, 'shippingFee']);
    Route::get('/checkout/pickup-locations', [CheckoutController::class, 'pickupAvailability'])->middleware('throttle:10,1');
    Route::get('/coupons/available', [CheckoutController::class, 'availableCoupons']);
    Route::post('/checkout/preview', [CheckoutController::class, 'preview'])->middleware('throttle:10,1');
    Route::post('/orders', [CheckoutController::class, 'placeOrder'])->middleware('throttle:10,1');
    Route::post('/orders/{code}/payment-instructions', [BankTransferPaymentController::class, 'show'])->middleware('throttle:6,1');
});
