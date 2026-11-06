<?php

use App\Http\Controllers\Api\V1\Admin\ImportHistoryController;
use App\Http\Controllers\Api\V1\Admin\InventoryController;
use App\Http\Controllers\Api\V1\Admin\StoreInventoryController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin')->middleware(['auth:sanctum,api', 'audience:admin'])->group(function (): void {
    Route::get('/inventory', [InventoryController::class, 'index'])->middleware('permission:inventory.view');
    Route::get('/stores/{store}/inventory', [StoreInventoryController::class, 'index'])->middleware('permission:inventory.view');
    Route::get('/stores/{store}/inventory/movements', [StoreInventoryController::class, 'movements'])->middleware('permission:inventory.view');
    Route::post('/stores/{store}/inventory/adjust', [StoreInventoryController::class, 'adjust'])->middleware('permission:inventory.adjust');
    Route::get('/inventory/export', [InventoryController::class, 'export'])->middleware('permission:inventory.view');
    Route::get('/inventory/movements', [InventoryController::class, 'movements'])->middleware('permission:inventory.view');
    Route::get('/inventory/movements/export', [InventoryController::class, 'exportMovements'])->middleware('permission:inventory.view');
    Route::post('/inventory/{variantId}/adjust', [InventoryController::class, 'adjust'])->middleware('permission:inventory.adjust');
    Route::post('/inventory/import-csv', [InventoryController::class, 'importCsv'])->middleware('permission:inventory.adjust');
    Route::get('/imports', [ImportHistoryController::class, 'index'])->middleware('permission:inventory.view');
    Route::get('/imports/{importJob}', [ImportHistoryController::class, 'show'])->whereNumber('importJob')->middleware('permission:inventory.view');
    Route::get('/imports/{importJob}/errors', [ImportHistoryController::class, 'errors'])->whereNumber('importJob')->middleware('permission:inventory.view');
    Route::patch('/inventory/threshold', [InventoryController::class, 'updateThreshold'])->middleware('permission:inventory.adjust');
    Route::post('/inventory/adjustments', [InventoryController::class, 'createAdjustmentBatch'])->middleware('permission:inventory.adjust');
    Route::get('/inventory/adjustments/{batch}', [InventoryController::class, 'showAdjustmentBatch'])->middleware('permission:inventory.view');
});
