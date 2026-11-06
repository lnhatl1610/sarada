<?php

namespace App\Modules\Catalog\Actions;

use App\Models\ProductStockAlert;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubscribeToProductStockAlertAction
{
    public function execute(string $slug, int $variantId, ?string $email, ?string $phone, ?int $userId = null): void
    {
        DB::transaction(function () use ($slug, $variantId, $email, $phone, $userId): void {
            $variant = ProductVariant::query()
                ->whereKey($variantId)
                ->where('is_active', true)
                ->whereHas('product', fn ($query) => $query->published()->where('slug', $slug))
                ->firstOrFail();

            $inventory = $variant->inventory()->lockForUpdate()->first();
            $available = max(0, (int) ($inventory?->quantity ?? 0) - (int) ($inventory?->reserved ?? 0));
            if ($available > 0) {
                throw ValidationException::withMessages(['variant_id' => 'Biến thể này hiện còn hàng.']);
            }

            if ($userId !== null) {
                ProductStockAlert::query()->firstOrCreate(
                    ['variant_id' => $variant->id, 'user_id' => $userId],
                    ['email' => $email, 'phone' => null],
                );
            } else {
                ProductStockAlert::query()->firstOrCreate(['variant_id' => $variant->id, 'email' => $email, 'phone' => $phone]);
            }
        });
    }
}
