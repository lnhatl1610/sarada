<?php

use App\Http\Controllers\Api\V1\Admin\ShippingMethodController;
use App\Http\Controllers\Api\V1\Admin\ShippingRateController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin/shipping-methods')->middleware(['auth:sanctum,api', 'audience:admin'])->group(function (): void {
    Route::get('/', [ShippingMethodController::class, 'index'])->middleware('permission:settings.manage');
    Route::post('/', [ShippingMethodController::class, 'store'])->middleware('permission:settings.manage');
    Route::patch('/{method}', [ShippingMethodController::class, 'update'])->middleware('permission:settings.manage');
    Route::delete('/{method}', [ShippingMethodController::class, 'destroy'])->middleware('permission:settings.manage');
});

Route::prefix('v1/admin/shipping-rates')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:settings.manage'])->group(function (): void {
    Route::get('/', [ShippingRateController::class, 'index']);
    Route::post('/', [ShippingRateController::class, 'store']);
    Route::patch('/{rate}', [ShippingRateController::class, 'update']);
    Route::delete('/{rate}', [ShippingRateController::class, 'destroy']);
});
