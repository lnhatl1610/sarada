<?php

use App\Http\Controllers\Api\V1\Storefront\NewsletterSubscriptionController;
use App\Http\Controllers\Api\V1\Storefront\StoreContactMessageController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/newsletter/subscriptions', [NewsletterSubscriptionController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('newsletter.subscriptions.store');

    Route::post('/newsletter/unsubscribe-requests', [NewsletterSubscriptionController::class, 'requestUnsubscribe'])
        ->middleware('throttle:5,1')
        ->name('newsletter.unsubscribe-requests.store');

    Route::post('/newsletter/unsubscribe-confirmations', [NewsletterSubscriptionController::class, 'confirmUnsubscribe'])
        ->middleware('throttle:5,1')
        ->name('newsletter.unsubscribe-confirmations.store');

    Route::post('/contact/messages', [StoreContactMessageController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('contact.messages.store');
});
