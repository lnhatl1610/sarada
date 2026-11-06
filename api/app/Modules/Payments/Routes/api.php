<?php

use App\Http\Controllers\Api\V1\Admin\PaymentRefundController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin')->middleware(['auth:sanctum,api', 'audience:admin'])->group(function (): void {
    Route::post('/payments/{payment}/refund', [PaymentRefundController::class, 'store'])
        ->middleware('permission:orders.update_status');
});
