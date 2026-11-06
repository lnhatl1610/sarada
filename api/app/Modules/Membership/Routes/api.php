<?php

use App\Http\Controllers\Api\V1\Storefront\MembershipController;
use Illuminate\Support\Facades\Route;

Route::get('v1/membership/tiers', [MembershipController::class, 'tiers'])
    ->middleware('throttle:public-api')
    ->name('membership.tiers');

Route::get('v1/account/membership', [MembershipController::class, 'show'])
    ->middleware(['auth:api', 'audience:storefront'])
    ->name('account.membership');
