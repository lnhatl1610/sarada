<?php

namespace App\Jobs;

use App\Models\ProductStockAlert;
use App\Models\ProductVariant;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class SendProductBackInStockSms implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public array $backoff = [60, 300, 900];

    public function __construct(public readonly int $alertId)
    {
        $this->afterCommit();
    }

    public function handle(): void
    {
        $alert = ProductStockAlert::query()->whereKey($this->alertId)->whereNotNull('phone')->first();
        if (! $alert) {
            return;
        }

        $variant = ProductVariant::query()->with(['product', 'color', 'size', 'inventory'])->find($alert->variant_id);
        if (! $variant || ! $variant->is_active || $variant->product?->status !== 'active') {
            $alert->delete();

            return;
        }

        if (max(0, (int) ($variant->inventory?->quantity ?? 0) - (int) ($variant->inventory?->reserved ?? 0)) < 1) {
            $alert->update(['queued_at' => null]);

            return;
        }

        $accountSid = (string) config('services.twilio.account_sid');
        $authToken = (string) config('services.twilio.auth_token');
        $fromNumber = (string) config('services.twilio.from_number');

        if ($accountSid === '' || $authToken === '' || $fromNumber === '') {
            throw new RuntimeException('Twilio SMS is not configured for product stock alerts.');
        }

        $variantLabel = collect([$variant->color?->value, $variant->size?->value])->filter()->implode(' · ');
        $productUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/').'/products/'.rawurlencode($variant->product->slug);

        $response = Http::asForm()
            ->withBasicAuth($accountSid, $authToken)
            ->connectTimeout(5)
            ->timeout(10)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json", [
                'To' => $alert->phone,
                'From' => $fromNumber,
                'Body' => "{$variant->product->name} ({$variantLabel}) đã có hàng. Xem tại: {$productUrl}",
            ]);

        if (! $response->successful()) {
            throw new RuntimeException("Twilio SMS delivery failed with HTTP {$response->status()}.");
        }

        $alert->delete();
    }

    public function failed(Throwable $exception): void
    {
        ProductStockAlert::query()->whereKey($this->alertId)->update(['queued_at' => null]);

        Log::warning('Product back-in-stock SMS delivery failed; the subscription is available for retry.', [
            'alert_id' => $this->alertId,
            'exception_type' => $exception::class,
        ]);
    }
}
