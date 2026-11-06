<?php

use App\Providers\AppServiceProvider;
use NotificationChannels\WebPush\WebPushServiceProvider;
use PHPOpenSourceSaver\JWTAuth\Providers\LaravelServiceProvider;
use PragmaRX\Google2FALaravel\ServiceProvider;
use Spatie\Backup\BackupServiceProvider;

return [
    AppServiceProvider::class,
    LaravelServiceProvider::class,
    ServiceProvider::class,
    BackupServiceProvider::class,
    WebPushServiceProvider::class,
];
