<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Validation\UncompromisedVerifier;
use Illuminate\Http\Client\Factory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\NotPwnedVerifier;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(UncompromisedVerifier::class, fn ($app): NotPwnedVerifier => new NotPwnedVerifier($app->make(Factory::class), 5));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

        RateLimiter::for('login', function (Request $request): Limit {
            $email = Str::lower(trim($request->string('identifier', $request->string('email')->toString())->toString()));

            $maxAttempts = (int) (Setting::query()->where('key', 'login_max_attempts')->value('value') ?? 5);

            return Limit::perMinute(max(3, min(20, $maxAttempts)))->by(Str::transliterate($email).'|'.$request->ip());
        });

        RateLimiter::for('uploads', function (Request $request): array {
            $attempts = max(1, min(120, (int) config('store.uploads_per_minute', 20)));
            $userId = $request->user()?->getAuthIdentifier();

            return [
                Limit::perMinute($attempts)->by('uploads-ip|'.$request->ip()),
                Limit::perMinute($attempts)->by('uploads-user|'.($userId ?? 'guest|'.$request->ip())),
            ];
        });

        RateLimiter::for('public-api', function (Request $request): Limit {
            $attempts = max(1, min(600, (int) config('store.public_requests_per_minute', 60)));

            return Limit::perMinute($attempts)->by('public-api|'.$request->ip());
        });
    }
}
