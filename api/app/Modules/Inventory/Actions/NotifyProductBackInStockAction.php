<?php

namespace App\Modules\Inventory\Actions;

use App\Jobs\SendProductBackInStockSms;
use App\Models\ProductStockAlert;
use App\Models\ProductVariant;
use App\Notifications\ProductBackInStockNotification;
use Illuminate\Support\Facades\Notification;
use Throwable;

class NotifyProductBackInStockAction
{
    public function execute(int $variantId): void
    {
        $variant = ProductVariant::query()->with(['product', 'color', 'size', 'inventory'])->find($variantId);
        if (! $variant || ! $variant->is_active || $variant->product?->status !== 'active') {
            return;
        }

        $available = max(0, (int) ($variant->inventory?->quantity ?? 0) - (int) ($variant->inventory?->reserved ?? 0));
        if ($available < 1) {
            return;
        }

        $label = collect([$variant->color?->value, $variant->size?->value])->filter()->implode(' · ');
        $productUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/').'/products/'.rawurlencode($variant->product->slug);

        ProductStockAlert::query()
            ->where('variant_id', $variantId)
            ->whereNull('queued_at')
            ->orderBy('id')
            ->chunkById(100, function ($alerts) use ($variant, $label, $productUrl): void {
                foreach ($alerts as $alert) {
                    if ($alert->phone !== null) {
                        if (! ProductStockAlert::query()->whereKey($alert->id)->whereNull('queued_at')->update(['queued_at' => now()])) {
                            continue;
                        }

                        try {
                            SendProductBackInStockSms::dispatch($alert->id);
                        } catch (Throwable $exception) {
                            ProductStockAlert::query()->whereKey($alert->id)->update(['queued_at' => null]);
                            report($exception);
                        }

                        continue;
                    }

                    if (! ProductStockAlert::query()->whereKey($alert->id)->delete()) {
                        continue;
                    }

                    try {
                        Notification::route('mail', $alert->email)->notify(new ProductBackInStockNotification(
                            $variant->product->name,
                            $label !== '' ? $label : $variant->sku,
                            $productUrl,
                        ));
                    } catch (Throwable $exception) {
                        ProductStockAlert::query()->firstOrCreate(
                            ['variant_id' => $alert->variant_id, 'user_id' => $alert->user_id, 'email' => $alert->email, 'phone' => null],
                        );
                        report($exception);
                    }
                }
            });
    }
}
