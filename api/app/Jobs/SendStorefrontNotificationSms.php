<?php

namespace App\Jobs;

use App\Models\User;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class SendStorefrontNotificationSms implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [60, 300, 900];

    public function __construct(
        public readonly int $userId,
        public readonly string $event,
        public readonly string $message,
        public readonly string $href,
    ) {
        $this->afterCommit();
    }

    public function handle(): void
    {
        $user = User::query()->find($this->userId);
        if (! $user || ! $user->phone || ! StorefrontNotificationPreferences::wants($user, $this->event, 'sms')) {
            return;
        }

        $accountSid = (string) config('services.twilio.account_sid');
        $authToken = (string) config('services.twilio.auth_token');
        $fromNumber = (string) config('services.twilio.from_number');
        if ($accountSid === '' || $authToken === '' || $fromNumber === '') {
            throw new RuntimeException('Twilio SMS is not configured for storefront notifications.');
        }

        $phone = trim((string) $user->phone);
        $phone = str_starts_with($phone, '0') ? '+84'.substr($phone, 1) : $phone;
        $url = rtrim((string) config('app.frontend_url', config('app.url')), '/').$this->href;
        $response = Http::asForm()
            ->withBasicAuth($accountSid, $authToken)
            ->connectTimeout(5)
            ->timeout(10)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                'To' => $phone,
                'From' => $fromNumber,
                'Body' => $this->message.' '.$url,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException("Twilio SMS delivery failed with HTTP {$response->status()}.");
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::warning('Storefront notification SMS delivery failed.', [
            'user_id' => $this->userId,
            'event' => $this->event,
            'exception_type' => $exception::class,
        ]);
    }
}
