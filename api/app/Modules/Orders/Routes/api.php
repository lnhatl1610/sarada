<?php

use App\Http\Controllers\Api\V1\Admin\AdminDownloadsController;
use App\Http\Controllers\Api\V1\Admin\AdminNotificationController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\OperationsController;
use App\Http\Controllers\Api\V1\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\ReportController;
use App\Http\Controllers\Api\V1\Admin\ReportScheduleController;
use App\Http\Controllers\Api\V1\Storefront\OrderController as StorefrontOrderController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/orders/track', [StorefrontOrderController::class, 'track'])->middleware('throttle:30,1');

    Route::middleware(['auth:api', 'audience:storefront'])->group(function (): void {
        Route::get('/orders', [StorefrontOrderController::class, 'index']);
        Route::get('/orders/{code}', [StorefrontOrderController::class, 'show']);
        Route::post('/orders/{code}/cancel', [StorefrontOrderController::class, 'cancel']);
        Route::post('/orders/{code}/change-requests', [StorefrontOrderController::class, 'requestChange'])->middleware('throttle:10,1');
    });

    Route::prefix('admin')->middleware(['auth:sanctum,api', 'audience:admin'])->group(function (): void {
        Route::get('/alerts', [DashboardController::class, 'alerts']);
        Route::get('/search', [DashboardController::class, 'search']);
        Route::get('/notifications', [AdminNotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [AdminNotificationController::class, 'unreadCount']);
        Route::post('/notifications/read-all', [AdminNotificationController::class, 'markAllRead']);
        Route::patch('/notifications/{notification}/archive', [AdminNotificationController::class, 'archive']);
        Route::post('/notifications/{notification}/snooze', [AdminNotificationController::class, 'snooze']);
        Route::delete('/notifications/{notification}', [AdminNotificationController::class, 'destroy']);
        Route::patch('/notifications/{notification}/read', [AdminNotificationController::class, 'markRead']);
        Route::get('/dashboard/summary', [DashboardController::class, 'summary'])->middleware('permission:orders.view');
        Route::get('/dashboard', [DashboardController::class, 'summary'])->middleware('permission:orders.view');
        Route::get('/dashboard/revenue', [DashboardController::class, 'revenue'])->middleware('permission:orders.view');
        Route::get('/dashboard/top-products', [DashboardController::class, 'topProducts'])->middleware('permission:orders.view');
        Route::get('/reports/overview', [ReportController::class, 'overview'])->middleware('permission:reports.view');
        Route::get('/downloads', [AdminDownloadsController::class, 'index']);
        Route::post('/downloads/exports', [AdminDownloadsController::class, 'createExport'])->middleware('throttle:10,1');
        Route::get('/downloads/{job}/file', [AdminDownloadsController::class, 'download'])->whereNumber('job');
        Route::delete('/downloads/{job}', [AdminDownloadsController::class, 'destroy'])->whereNumber('job');
        Route::post('/downloads/{job}/retry', [AdminDownloadsController::class, 'retry'])->whereNumber('job');
        Route::get('/reports/schedules', [ReportScheduleController::class, 'index'])->middleware(['permission:reports.view', 'permission:reports.schedule']);
        Route::post('/reports/schedules', [ReportScheduleController::class, 'store'])->middleware(['permission:reports.view', 'permission:reports.schedule']);
        Route::patch('/reports/schedules/{schedule}', [ReportScheduleController::class, 'update'])->whereNumber('schedule')->middleware(['permission:reports.view', 'permission:reports.schedule']);
        Route::delete('/reports/schedules/{schedule}', [ReportScheduleController::class, 'destroy'])->whereNumber('schedule')->middleware(['permission:reports.view', 'permission:reports.schedule']);
        foreach (['revenue', 'orders', 'products', 'customers', 'inventory', 'coupons'] as $report) {
            Route::get('/reports/'.$report, [ReportController::class, 'overview'])
                ->defaults('report', $report)
                ->middleware('permission:reports.view');
        }
        Route::get('/orders', [AdminOrderController::class, 'index'])->middleware('permission:orders.view');
        Route::get('/orders/manual-options', [AdminOrderController::class, 'manualOptions'])->middleware('permission:orders.update_status');
        Route::get('/orders/manual-customers', [AdminOrderController::class, 'manualCustomers'])->middleware('permission:orders.update_status');
        Route::post('/orders/manual', [AdminOrderController::class, 'createManual'])->middleware('permission:orders.update_status');
        Route::get('/orders/export', [AdminOrderController::class, 'export'])->middleware('permission:orders.view');
        Route::patch('/orders/bulk-status', [AdminOrderController::class, 'bulkStatus'])->middleware('permission:orders.update_status');
        Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->middleware('permission:orders.view');
        Route::patch('/orders/{order}/change-requests/{changeRequest}/review', [AdminOrderController::class, 'reviewChangeRequest'])->whereNumber('order')->whereNumber('changeRequest')->middleware('permission:orders.update_status');
        Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->middleware('permission:orders.update_status');
        Route::patch('/orders/{order}/payment-status', [AdminOrderController::class, 'updatePaymentStatus'])->middleware('permission:orders.update_status');
        Route::post('/orders/{order}/refund', [AdminOrderController::class, 'refund'])->middleware('permission:orders.update_status');
        Route::put('/orders/{order}/shipment', [AdminOrderController::class, 'updateShipment'])->middleware('permission:orders.update_status');
        Route::patch('/orders/{order}/note', [AdminOrderController::class, 'updateNote'])->middleware('permission:orders.update_status');
        Route::patch('/orders/{order}/address', [AdminOrderController::class, 'updateAddress'])->middleware('permission:orders.update_status');
        Route::get('/operations/payments', [OperationsController::class, 'index'])->defaults('section', 'payments')->middleware('permission:orders.view');
        Route::get('/payments', [OperationsController::class, 'index'])->defaults('section', 'payments')->middleware('permission:orders.view');
        Route::get('/payments/{payment}', [OperationsController::class, 'showPayment'])->middleware('permission:orders.view');
        Route::get('/operations/shipments', [OperationsController::class, 'index'])->defaults('section', 'shipments')->middleware('permission:orders.view');
        Route::get('/shipments', [OperationsController::class, 'index'])->defaults('section', 'shipments')->middleware('permission:orders.view');
        Route::get('/operations/movements', [OperationsController::class, 'index'])->defaults('section', 'movements')->middleware('permission:inventory.view');
        Route::get('/operations/customers', [OperationsController::class, 'index'])->defaults('section', 'customers')->middleware('permission:users.manage');
        Route::get('/operations/carts', [OperationsController::class, 'index'])->defaults('section', 'carts')->middleware('permission:users.manage');
        Route::get('/operations/carts/{cart}', [OperationsController::class, 'showCart'])->whereNumber('cart')->middleware('permission:users.manage');
        Route::get('/operations/wishlist', [OperationsController::class, 'index'])->defaults('section', 'wishlist')->middleware('permission:reports.view');
        Route::get('/operations/staff', [OperationsController::class, 'index'])->defaults('section', 'staff')->middleware('permission:users.manage');
    });
});
