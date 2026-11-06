<?php

namespace App\Modules\Catalog\Actions;

use App\Jobs\SendStorefrontNotificationSms;
use App\Models\ProductPriceAlert;
use App\Notifications\ProductPriceDropNotification;
use App\Support\StorefrontNotificationPreferences;
use Illuminate\Support\Facades\DB;

class DispatchProductPriceAlertsAction
{
    public function execute(): int
    {
        $alertIds = ProductPriceAlert::query()->where('is_active', true)->orderBy('id')->limit(1000)->pluck('id');
        $notified = 0;

        foreach ($alertIds as $alertId) {
            $sent = DB::transaction(function () use ($alertId): bool {
                $alert = ProductPriceAlert::query()->with(['user', 'product.variants' => fn ($query) => $query->where('is_active', true)])
                    ->lockForUpdate()->find($alertId);
                if (! $alert || ! $alert->is_active || ! $alert->user || ! $alert->product || $alert->product->status !== 'active') {
                    return false;
                }

                $pricingAt = now();
                $currentPrice = $alert->product->variants->map(fn ($variant): int => $variant->effectivePrice($alert->product, $pricingAt))->min();
                if ($currentPrice === null || $currentPrice >= $alert->reference_price) {
                    return false;
                }

                $previousPrice = $alert->reference_price;
                $alert->forceFill(['is_active' => false, 'notified_at' => $pricingAt])->save();
                $url = rtrim((string) config('app.frontend_url', config('app.url')), '/').'/products/'.rawurlencode($alert->product->slug);
                $alert->user->notify(new ProductPriceDropNotification($alert->product->name, $previousPrice, $currentPrice, $url));
                if (StorefrontNotificationPreferences::wants($alert->user, 'price_drops', 'sms')) {
                    $href = '/products/'.rawurlencode($alert->product->slug);
                    SendStorefrontNotificationSms::dispatch(
                        $alert->user->id,
                        'price_drops',
                        $alert->product->name.' vừa giảm còn '.number_format($currentPrice, 0, ',', '.').'₫.',
                        $href,
                    );
                }

                return true;
            });

            if ($sent) {
                $notified++;
            }
        }

        return $notified;
    }
}
