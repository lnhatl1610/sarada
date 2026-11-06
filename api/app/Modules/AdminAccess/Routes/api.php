<?php

use App\Http\Controllers\Api\V1\Admin\ActivityLogController;
use App\Http\Controllers\Api\V1\Admin\AppInfoController;
use App\Http\Controllers\Api\V1\Admin\CustomerController;
use App\Http\Controllers\Api\V1\Admin\FailedJobController;
use App\Http\Controllers\Api\V1\Admin\StaffController;
use App\Http\Controllers\Api\V1\Admin\StoreSettingsController;
use App\Http\Controllers\Api\V1\Admin\SystemBackupController;
use App\Http\Controllers\Api\V1\Admin\SystemHealthController;
use App\Http\Controllers\Api\V1\Admin\UploadController;
use App\Http\Controllers\Api\V1\Identity\StaffInvitationController;
use App\Http\Middleware\AuditAccountWrite;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin/settings')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:settings.manage'])->group(function (): void {
    Route::get('/', [StoreSettingsController::class, 'show']);
    Route::patch('/', [StoreSettingsController::class, 'update']);
    Route::put('/', [StoreSettingsController::class, 'update']);
    Route::post('/test-email', [StoreSettingsController::class, 'sendTestEmail'])->middleware('throttle:6,1');
});

Route::get('v1/admin/activity-logs', [ActivityLogController::class, 'index'])
    ->middleware(['auth:sanctum,api', 'audience:admin', 'permission:settings.manage']);

Route::get('v1/admin/app-info', AppInfoController::class)
    ->middleware(['auth:sanctum,api', 'audience:admin']);

Route::get('v1/admin/system/health', SystemHealthController::class)
    ->middleware(['auth:sanctum,api', 'audience:admin', 'permission:system.health']);

Route::prefix('v1/admin/system/backups')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:system.backup'])->group(function (): void {
    Route::get('/', [SystemBackupController::class, 'index']);
    Route::post('/', [SystemBackupController::class, 'store'])->middleware(['throttle:2,60', AuditAccountWrite::class]);
    Route::get('/{file}', [SystemBackupController::class, 'download'])->where('file', '[A-Za-z0-9._-]+\\.zip')->name('admin.system.backups.download');
});

Route::prefix('v1/admin/system/failed-jobs')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:system.health'])->group(function (): void {
    Route::get('/', [FailedJobController::class, 'index']);
    Route::post('/{job}/retry', [FailedJobController::class, 'retry'])->middleware(['throttle:10,1', AuditAccountWrite::class]);
    Route::delete('/{job}', [FailedJobController::class, 'delete'])->middleware(['throttle:10,1', AuditAccountWrite::class]);
});

Route::post('v1/admin/uploads', [UploadController::class, 'store'])
    ->middleware(['auth:sanctum,api', 'audience:admin', 'permission:products.create,products.update,content.manage,settings.manage', 'throttle:uploads']);

Route::prefix('v1/admin/staff')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:users.manage'])->group(function (): void {
    Route::get('/', [StaffController::class, 'index']);
    Route::get('/roles', [StaffController::class, 'roles']);
    Route::get('/pending-approvals', [StaffController::class, 'pendingApprovals']);
    Route::post('/pending-approvals/{user}/approve', [StaffController::class, 'approveRegistration']);
    Route::post('/pending-approvals/{user}/reject', [StaffController::class, 'rejectRegistration']);
    Route::get('/invitations', [StaffController::class, 'invitations']);
    Route::post('/invitations', [StaffController::class, 'invite']);
    Route::post('/invitations/{invitation}/resend', [StaffController::class, 'resendInvitation']);
    Route::delete('/invitations/{invitation}', [StaffController::class, 'revokeInvitation']);
    Route::patch('/roles/{role}', [StaffController::class, 'updateRolePermissions']);
    Route::post('/', [StaffController::class, 'store']);
    Route::patch('/{staff}', [StaffController::class, 'update']);
    Route::delete('/{staff}', [StaffController::class, 'destroy']);
});

Route::delete('v1/admin/staff/{staff}/sessions', [StaffController::class, 'revokeSessions'])
    ->whereNumber('staff')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:staff.security', 'recent.auth', 'throttle:10,1', AuditAccountWrite::class]);
Route::post('v1/admin/staff/{staff}/reset-2fa', [StaffController::class, 'resetTwoFactor'])
    ->whereNumber('staff')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:staff.security', 'recent.auth', 'throttle:6,1']);
Route::post('v1/admin/staff/{staff}/password-reset', [StaffController::class, 'sendPasswordReset'])
    ->whereNumber('staff')->middleware(['auth:sanctum,api', 'audience:admin', 'permission:staff.security', 'throttle:6,1', AuditAccountWrite::class]);

Route::get('v1/admin/staff/{staff}/performance', [StaffController::class, 'performance'])
    ->whereNumber('staff')
    ->middleware(['auth:sanctum,api', 'audience:admin', 'permission:staff.view_performance']);

Route::prefix('v1/staff-invitations')->group(function (): void {
    Route::get('/{token}', [StaffInvitationController::class, 'show'])->middleware('throttle:30,1');
    Route::post('/{token}/accept', [StaffInvitationController::class, 'accept'])->middleware('throttle:6,1');
});

Route::prefix('v1/admin/customers')->middleware(['auth:sanctum,api', 'audience:admin'])->group(function (): void {
    Route::get('/', [CustomerController::class, 'index'])->middleware('permission:customers.view');
    Route::get('/export', [CustomerController::class, 'export'])->middleware('permission:customers.view');
    Route::post('/{customer}/notes', [CustomerController::class, 'storeNote'])->middleware('permission:users.manage');
    Route::get('/{customer}', [CustomerController::class, 'show'])->middleware('permission:customers.view');
    Route::patch('/{customer}/status', [CustomerController::class, 'update'])->middleware('permission:users.manage');
    Route::patch('/{customer}', [CustomerController::class, 'update'])->middleware('permission:users.manage');
});
