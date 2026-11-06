<?php

use App\Http\Controllers\Api\V1\Admin\AccountMenuSummaryController;
use App\Http\Controllers\Api\V1\Admin\AccountSecurityController;
use App\Http\Controllers\Api\V1\Admin\AdminPushSubscriptionController;
use App\Http\Controllers\Api\V1\Admin\PersonalApiTokenController;
use App\Http\Controllers\Api\V1\Admin\PersonalWorkspaceController;
use App\Http\Controllers\Api\V1\Admin\SudoModeController;
use App\Http\Controllers\Api\V1\Identity\AccountPrivacyController;
use App\Http\Controllers\Api\V1\Identity\AuthController;
use App\Http\Controllers\Api\V1\Identity\TwoFactorController;
use App\Http\Controllers\Api\V1\Storefront\AccountController;
use App\Http\Controllers\Api\V1\Storefront\AccountPhoneChangeController;
use App\Http\Controllers\Api\V1\Storefront\AccountProductStockAlertController;
use App\Http\Controllers\Api\V1\Storefront\CatalogController;
use App\Http\Controllers\Api\V1\Storefront\CustomerNotificationController;
use App\Http\Controllers\Api\V1\Storefront\PasskeyController;
use App\Http\Controllers\Api\V1\Storefront\ProductPriceAlertController;
use App\Http\Controllers\Api\V1\Storefront\RecentlyViewedProductController;
use App\Http\Controllers\Api\V1\Storefront\StorefrontNotificationPreferencesController;
use App\Http\Controllers\Api\V1\Storefront\VoucherWalletController;
use App\Http\Middleware\AuditAccountWrite;
use App\Http\Middleware\RequireSudoForSecurityAlertDisable;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/auth/registration-status', [AuthController::class, 'registrationStatus'])->middleware('throttle:public-api');
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:login');
    Route::post('/auth/resend-verification', [AuthController::class, 'resendRegistrationVerification'])->middleware('throttle:6,1');
    Route::post('/auth/login', [AuthController::class, 'storefrontLogin'])->middleware('throttle:login');
    Route::post('/auth/passkeys/options', [AuthController::class, 'storefrontPasskeyOptions'])->middleware('throttle:login');
    Route::post('/auth/passkeys/login', [AuthController::class, 'storefrontPasskeyLogin'])->middleware('throttle:login');
    Route::post('/auth/refresh', [AuthController::class, 'storefrontRefresh']);
    Route::get('/email/verify/{id}/{hash}', [AccountController::class, 'verifyEmail'])->middleware('signed')->name('verification.verify');
    Route::get('/account/email/verify/{token}', [AccountController::class, 'confirmEmailChange'])->middleware('throttle:10,1')->name('account.email.verify');
    Route::post('/auth/logout', [AuthController::class, 'storefrontLogout'])->middleware(['auth:api', 'audience:storefront']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware(['auth:api', 'audience:storefront']);
    Route::middleware(['auth:api', 'audience:storefront'])->group(function (): void {
        Route::get('/account/passkeys', [PasskeyController::class, 'index']);
        Route::post('/account/passkeys/options', [PasskeyController::class, 'registrationOptions'])->middleware('throttle:6,1');
        Route::post('/account/passkeys', [PasskeyController::class, 'store'])->middleware('throttle:6,1');
        Route::delete('/account/passkeys/{passkey}', [PasskeyController::class, 'destroy'])->whereNumber('passkey')->middleware('throttle:6,1');
    });

    Route::get('/account/menu-summary', AccountMenuSummaryController::class)->middleware(['auth:api', 'audience:admin']);
    Route::middleware(['auth:api', 'audience:admin'])->group(function (): void {
        Route::post('/account/push-subscriptions/test', [AdminPushSubscriptionController::class, 'test'])->middleware('throttle:3,1');
        Route::get('/account/sudo', [SudoModeController::class, 'show']);
        Route::post('/account/sudo', [SudoModeController::class, 'store'])->middleware('throttle:6,1');
        Route::post('/account/unlock', [AccountSecurityController::class, 'unlock'])->middleware('throttle:5,1');
        Route::get('/account/tokens', [PersonalApiTokenController::class, 'index'])->middleware('permission:api_tokens.manage');
        Route::post('/account/tokens', [PersonalApiTokenController::class, 'store'])->middleware(['permission:api_tokens.manage', 'recent.auth', 'throttle:3,1', AuditAccountWrite::class]);
        Route::delete('/account/tokens/{token}', [PersonalApiTokenController::class, 'destroy'])->whereNumber('token')->middleware(['permission:api_tokens.manage', 'recent.auth', 'throttle:6,1', AuditAccountWrite::class]);
        Route::get('/account/login-history', [AccountSecurityController::class, 'loginHistory']);
        Route::get('/account/security-score', [AccountSecurityController::class, 'securityScore']);
        Route::put('/account/presence', [AccountSecurityController::class, 'updatePresence']);
        Route::post('/account/presence/activity', [AccountSecurityController::class, 'recordActivity'])->middleware('throttle:30,1');
    });

    Route::middleware(['auth:api', 'account-audience'])->group(function (): void {
        Route::get('/account/privacy/exports', [AccountPrivacyController::class, 'exports']);
        Route::get('/account/privacy/retention', [AccountPrivacyController::class, 'retention']);
        Route::post('/account/privacy/exports', [AccountPrivacyController::class, 'createExport'])->middleware('throttle:3,1');
        Route::get('/account/privacy/exports/{job}/download', [AccountPrivacyController::class, 'download'])
            ->whereNumber('job')->middleware('signed')->name('account.privacy.exports.download');
    });

    Route::prefix('me')->middleware(['auth:api', 'audience:admin'])->group(function (): void {
        Route::get('/task-assignees', [PersonalWorkspaceController::class, 'taskAssignees']);
        Route::get('/performance', [PersonalWorkspaceController::class, 'performance']);
        Route::get('/tasks', [PersonalWorkspaceController::class, 'tasks']);
        Route::get('/reminders', [PersonalWorkspaceController::class, 'reminders']);
        Route::post('/tasks/{task}/snooze', [PersonalWorkspaceController::class, 'snoozeReminder'])->whereNumber('task')->middleware('throttle:30,1');
        Route::post('/tasks', [PersonalWorkspaceController::class, 'storeTask']);
        Route::patch('/tasks/{task}', [PersonalWorkspaceController::class, 'updateTask']);
        Route::delete('/tasks/{task}', [PersonalWorkspaceController::class, 'deleteTask']);
        Route::post('/tasks/{task}/complete', [PersonalWorkspaceController::class, 'completeTask']);
    });

    Route::middleware(['auth:api', 'account-audience'])->group(function (): void {
        Route::get('/account/push-subscriptions', [AdminPushSubscriptionController::class, 'index']);
        Route::post('/account/push-subscriptions', [AdminPushSubscriptionController::class, 'store'])->middleware('throttle:10,1');
        Route::delete('/account/push-subscriptions/{subscription}', [AdminPushSubscriptionController::class, 'destroy'])->whereNumber('subscription')->middleware('throttle:20,1');
    });

    Route::middleware(['auth:api', 'account-audience', AuditAccountWrite::class])->group(function (): void {
        Route::get('/account', [AccountController::class, 'show']);
        Route::put('/account/profile', [AccountController::class, 'updateProfile']);
        Route::patch('/account/profile', [AccountController::class, 'updateProfile']);
        Route::post('/account/phone/change', [AccountPhoneChangeController::class, 'request'])->middleware(['recent.auth', 'throttle:3,1']);
        Route::post('/account/phone/change/confirm', [AccountPhoneChangeController::class, 'confirm'])->middleware(['recent.auth', 'throttle:10,1']);
        Route::post('/account/avatar', [AccountController::class, 'uploadAvatar'])->middleware('throttle:uploads');
        Route::delete('/account/avatar', [AccountController::class, 'deleteAvatar']);
        Route::put('/account/email', [AccountController::class, 'updateEmail'])->middleware(['recent.auth', 'throttle:6,1']);
        Route::put('/account/password', [AccountController::class, 'updatePassword'])->middleware(['recent.auth', 'throttle:6,1']);
        Route::get('/account/security/two-factor', [TwoFactorController::class, 'status']);
        Route::post('/account/security/two-factor/setup', [TwoFactorController::class, 'start'])->middleware(['recent.auth', 'throttle:6,1']);
        Route::post('/account/security/two-factor/confirm', [TwoFactorController::class, 'confirm'])->middleware(['recent.auth', 'throttle:6,1']);
        Route::post('/account/security/two-factor/recovery-codes', [TwoFactorController::class, 'regenerate'])->middleware(['recent.auth', 'throttle:6,1']);
        Route::delete('/account/security/two-factor', [TwoFactorController::class, 'disable'])->middleware(['recent.auth', 'throttle:6,1']);
        Route::post('/account/email/verification-notification', [AccountController::class, 'sendVerification'])->middleware('throttle:6,1');
        Route::get('/account/sessions', [AccountController::class, 'sessions']);
        Route::post('/account/sessions/{session}/report', [AccountController::class, 'reportSession'])->whereNumber('session')->middleware('throttle:3,1');
        Route::get('/account/preferences', [AccountController::class, 'preferences']);
        Route::put('/account/preferences', [AccountController::class, 'updatePreferences'])->middleware(RequireSudoForSecurityAlertDisable::class);
        Route::get('/account/preferences/export', [AccountController::class, 'exportPreferences']);
        Route::post('/account/preferences/import', [AccountController::class, 'importPreferences']);
        Route::get('/account/activity', [AccountController::class, 'activity']);
        Route::delete('/account/sessions', [AccountController::class, 'deleteOtherSessions']);
        Route::delete('/account/sessions/{session}', [AccountController::class, 'deleteSession']);
        Route::delete('/account', [AccountController::class, 'deleteAccount']);
    });

    Route::middleware(['auth:api', 'audience:storefront'])->group(function (): void {
        Route::get('/account/vouchers', [VoucherWalletController::class, 'index']);
        Route::get('/account/recommendations', [CatalogController::class, 'personalized'])->middleware('throttle:public-api');
        Route::get('/account/notifications', [CustomerNotificationController::class, 'index']);
        Route::post('/account/notifications/read-all', [CustomerNotificationController::class, 'markAllRead'])->middleware('throttle:30,1');
        Route::patch('/account/notifications/{notification}/read', [CustomerNotificationController::class, 'markRead'])->middleware('throttle:60,1');
        Route::get('/account/notification-preferences', [StorefrontNotificationPreferencesController::class, 'show']);
        Route::put('/account/notification-preferences', [StorefrontNotificationPreferencesController::class, 'update'])->middleware('throttle:20,1');
        Route::get('/account/recently-viewed-products', [RecentlyViewedProductController::class, 'index']);
        Route::put('/account/recently-viewed-products', [RecentlyViewedProductController::class, 'sync'])->middleware('throttle:30,1');
        Route::get('/account/addresses', [AccountController::class, 'addresses']);
        Route::post('/account/addresses', [AccountController::class, 'storeAddress']);
        Route::patch('/account/addresses/{address}', [AccountController::class, 'updateAddress']);
        Route::put('/account/addresses/{address}', [AccountController::class, 'updateAddress']);
        Route::patch('/account/addresses/{address}/default', [AccountController::class, 'setDefaultAddress']);
        Route::delete('/account/addresses/{address}', [AccountController::class, 'deleteAddress']);
        Route::get('/wishlist/lists', [AccountController::class, 'wishlistLists']);
        Route::post('/wishlist/lists', [AccountController::class, 'createWishlistList'])->middleware('throttle:20,1');
        Route::patch('/wishlist/lists/{wishlistList}', [AccountController::class, 'updateWishlistList'])->whereNumber('wishlistList');
        Route::delete('/wishlist/lists/{wishlistList}', [AccountController::class, 'deleteWishlistList'])->whereNumber('wishlistList');
        Route::patch('/wishlist/lists/{wishlistList}/share', [AccountController::class, 'updateWishlistListShare'])->whereNumber('wishlistList');
        Route::get('/wishlist/lists/{wishlistList}/products', [AccountController::class, 'wishlistListProducts'])->whereNumber('wishlistList');
        Route::put('/wishlist/lists/{wishlistList}/products/{product}', [AccountController::class, 'addProductToWishlistList'])->whereNumber(['wishlistList', 'product'])->middleware('throttle:30,1');
        Route::delete('/wishlist/lists/{wishlistList}/products/{product}', [AccountController::class, 'removeProductFromWishlistList'])->whereNumber(['wishlistList', 'product']);
        Route::get('/wishlist', [AccountController::class, 'wishlist']);
        Route::put('/wishlist/{product}', [AccountController::class, 'addToWishlist']);
        Route::delete('/wishlist/{product}', [AccountController::class, 'removeFromWishlist']);
        Route::get('/account/product-price-alerts', [ProductPriceAlertController::class, 'index']);
        Route::put('/account/products/{product}/price-alert', [ProductPriceAlertController::class, 'store'])->whereNumber('product')->middleware('throttle:10,1');
        Route::delete('/account/products/{product}/price-alert', [ProductPriceAlertController::class, 'destroy'])->whereNumber('product')->middleware('throttle:10,1');
        Route::post('/account/products/{product}/stock-alerts', [AccountProductStockAlertController::class, 'store'])->whereNumber('product')->middleware('throttle:5,1');
    });

    Route::get('/shared-wishlists/{token}', [AccountController::class, 'sharedWishlist'])->where('token', '[A-Za-z0-9]+')->middleware('throttle:60,1');

    Route::prefix('admin/auth')->group(function (): void {
        Route::post('/login', [AuthController::class, 'adminLogin'])->middleware('throttle:login');
        Route::post('/two-factor/verify', [AuthController::class, 'verifyAdminTwoFactor'])->middleware('throttle:login');
        Route::post('/refresh', [AuthController::class, 'adminRefresh']);
        Route::post('/logout', [AuthController::class, 'adminLogout'])->middleware(['auth:api', 'audience:admin']);
        Route::post('/logout-all', [AuthController::class, 'adminLogoutAll'])->middleware(['auth:api', 'audience:admin']);
        Route::get('/me', [AuthController::class, 'adminMe'])->middleware(['auth:api', 'audience:admin']);
        Route::post('/password', [AuthController::class, 'changeAdminPassword'])->middleware(['auth:api', 'audience:admin', 'recent.auth', AuditAccountWrite::class, 'throttle:login']);
    });

});
