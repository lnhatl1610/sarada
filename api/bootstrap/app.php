<?php

use App\Http\Middleware\AuditAdminWrite;
use App\Http\Middleware\OptionalStorefrontAuthentication;
use App\Http\Middleware\RequestCorrelationId;
use App\Http\Middleware\RequireAccountAudience;
use App\Http\Middleware\RequireAudience;
use App\Http\Middleware\RequirePermission;
use App\Http\Middleware\RequireRecentAuthentication;
use App\Http\Middleware\ResetJwtTokenState;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->call(fn () => cache()->put('admin-system-schedule-heartbeat', now()->toIso8601String(), now()->addMinutes(3)))
            ->everyMinute()->name('admin-system-health-heartbeat')->withoutOverlapping();
        $schedule->command('orders:cancel-expired-unpaid')->everyMinute()->withoutOverlapping();
        $schedule->command('admin:send-weekly-report')
            ->weeklyOn(1, '08:00')
            ->timezone(config('app.timezone'))
            ->withoutOverlapping();
        $schedule->command('login-attempts:prune')->dailyAt('02:30')->withoutOverlapping();
        $schedule->command('activitylog:prune')->dailyAt('02:40')->withoutOverlapping();
        $schedule->command('admin:send-task-reminders')->everyMinute()->withoutOverlapping();
        $schedule->command('digest:send')->everyMinute()->withoutOverlapping();
        $schedule->command('reports:dispatch-scheduled')->everyMinute()->withoutOverlapping();
        $schedule->command('storefront:dispatch-price-alerts')->everyFifteenMinutes()->withoutOverlapping();
        $schedule->command('storefront:dispatch-cart-recovery')->everyFifteenMinutes()->withoutOverlapping();
        $schedule->command('notifications:prune-read')->dailyAt('03:10')->withoutOverlapping();
        $schedule->command('storefront-search:prune')->dailyAt('03:12')->withoutOverlapping();
        $schedule->command('admin:prune-recent-items')->dailyAt('03:15')->withoutOverlapping();
        $schedule->command('account-exports:prune')->dailyAt('03:20')->withoutOverlapping();
        $schedule->command('backup:clean')->dailyAt('03:30')->withoutOverlapping();
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(null);
        $middleware->prependToGroup('api', ResetJwtTokenState::class);
        $middleware->appendToGroup('api', AuditAdminWrite::class);
        $middleware->appendToGroup('api', RequestCorrelationId::class);
        $middleware->alias([
            'audience' => RequireAudience::class,
            'account-audience' => RequireAccountAudience::class,
            'permission' => RequirePermission::class,
            'recent.auth' => RequireRecentAuthentication::class,
            'optional.storefront.auth' => OptionalStorefrontAuthentication::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
