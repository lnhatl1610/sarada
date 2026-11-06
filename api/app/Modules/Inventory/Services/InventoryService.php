<?php

namespace App\Modules\Inventory\Services;

use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\StoreLocationInventory;
use App\Modules\Inventory\Actions\NotifyProductBackInStockAction;
use App\Support\StoreOrderNotifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /** @return array{inventory: Inventory, movement: InventoryMovement} */
    public function adjust(int $variantId, int $quantityChange, string $reason, int $actorId, string $movementType = 'adjust', string $referenceType = 'manual_adjustment', ?int $referenceId = null): array
    {
        return DB::transaction(function () use ($variantId, $quantityChange, $reason, $actorId, $movementType, $referenceType, $referenceId): array {
            $inventory = $this->lockedInventory($variantId);

            if (! $inventory) {
                throw ValidationException::withMessages(['variant_id' => 'Không tìm thấy dòng tồn kho của biến thể.']);
            }

            $nextQuantity = $inventory->quantity + $quantityChange;
            if ($nextQuantity < $inventory->reserved) {
                throw ValidationException::withMessages(['quantity_change' => 'Tồn kho mới không được thấp hơn số lượng đang giữ cho đơn hàng.']);
            }

            $availableBefore = $inventory->quantity - $inventory->reserved;
            $availableAfter = $nextQuantity - $inventory->reserved;
            $inventory->quantity = $nextQuantity;
            $inventory->save();
            $movement = InventoryMovement::query()->create([
                'variant_id' => $variantId,
                'type' => $movementType,
                'quantity_change' => $quantityChange,
                'stock_after' => $nextQuantity,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'note' => $reason,
                'created_by' => $actorId,
            ]);
            $this->notifyIfCrossedLowStock($variantId, $inventory, $availableBefore, $availableAfter);
            $this->notifyIfBackInStock($variantId, $availableBefore, $availableAfter);

            return ['inventory' => $inventory->refresh(), 'movement' => $movement];
        });
    }

    public function initializeVariant(int $variantId, int $quantity, int $threshold, ?int $actorId): Inventory
    {
        return DB::transaction(function () use ($variantId, $quantity, $threshold, $actorId): Inventory {
            if ($quantity < 0 || $threshold < 0) {
                throw ValidationException::withMessages(['inventory' => 'Tồn khởi tạo và ngưỡng tồn kho không được âm.']);
            }

            $inventory = Inventory::query()->create([
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'reserved' => 0,
                'low_stock_threshold' => $threshold,
            ]);

            if ($quantity > 0) {
                $this->recordMovement($variantId, 'import', $quantity, $quantity, null, 'Tồn khởi tạo khi tạo biến thể', $actorId, 'initial_stock');
                $this->notifyIfBackInStock($variantId, 0, $quantity);
            }

            return $inventory;
        });
    }

    public function reserveForOrder(int $variantId, int $quantity, int $orderId, string $note, ?int $actorId): void
    {
        DB::transaction(function () use ($variantId, $quantity, $orderId, $note, $actorId): void {
            $inventory = $this->lockedInventory($variantId);
            if (! $inventory || $quantity < 1 || $inventory->quantity - $inventory->reserved < $quantity) {
                throw ValidationException::withMessages(['inventory' => 'Không đủ tồn kho khả dụng cho đơn hàng.']);
            }

            $inventory->reserved += $quantity;
            $inventory->save();
            $this->recordMovement($variantId, 'reserve', $quantity, $inventory->quantity, $orderId, $note, $actorId);
            $this->notifyIfCrossedLowStock($variantId, $inventory, $inventory->quantity - ($inventory->reserved - $quantity), $inventory->quantity - $inventory->reserved);
        });
    }

    public function releaseOrderReservation(int $variantId, int $quantity, int $orderId, string $note, ?int $actorId): void
    {
        DB::transaction(function () use ($variantId, $quantity, $orderId, $note, $actorId): void {
            $inventory = $this->lockedInventory($variantId);
            if (! $inventory || $quantity < 1 || $inventory->reserved < $quantity) {
                throw ValidationException::withMessages(['inventory' => 'Không thể giải phóng số lượng đã giữ cho đơn này.']);
            }

            $inventory->reserved -= $quantity;
            $inventory->save();
            $this->recordMovement($variantId, 'release', -$quantity, $inventory->quantity, $orderId, $note, $actorId);
            $this->notifyIfBackInStock($variantId, $inventory->quantity - ($inventory->reserved + $quantity), $inventory->quantity - $inventory->reserved);
        });
    }

    public function completeOrderSale(int $variantId, int $productId, int $quantity, int $orderId, string $note, ?int $actorId): void
    {
        DB::transaction(function () use ($variantId, $productId, $quantity, $orderId, $note, $actorId): void {
            $inventory = $this->lockedInventory($variantId);
            if (! $inventory || $quantity < 1 || $inventory->reserved < $quantity || $inventory->quantity < $quantity) {
                throw ValidationException::withMessages(['inventory' => 'Tồn kho đã giữ không còn khớp với đơn hàng.']);
            }

            $inventory->quantity -= $quantity;
            $inventory->reserved -= $quantity;
            $inventory->save();
            DB::table('products')->where('id', $productId)->increment('sold_count', $quantity);
            $this->recordMovement($variantId, 'sale', -$quantity, $inventory->quantity, $orderId, $note, $actorId);
        });
    }

    public function restoreDeliveredSale(int $variantId, int $productId, int $quantity, int $orderId, string $note, ?int $actorId): void
    {
        DB::transaction(function () use ($variantId, $productId, $quantity, $orderId, $note, $actorId): void {
            $inventory = $this->lockedInventory($variantId);
            if (! $inventory || $quantity < 1) {
                throw ValidationException::withMessages(['inventory' => 'Không tìm thấy tồn kho của sản phẩm trả hàng.']);
            }

            $inventory->quantity += $quantity;
            $inventory->save();
            $this->notifyIfBackInStock($variantId, $inventory->quantity - $quantity - $inventory->reserved, $inventory->quantity - $inventory->reserved);
            $product = DB::table('products')->where('id', $productId)->lockForUpdate()->first(['sold_count']);
            if ($product) {
                DB::table('products')->where('id', $productId)->update(['sold_count' => max(0, $product->sold_count - $quantity)]);
            }
            $this->recordMovement($variantId, 'return', $quantity, $inventory->quantity, $orderId, $note, $actorId);
        });
    }

    public function adjustAtStore(int $storeLocationId, int $variantId, int $quantityChange, string $reason, int $actorId): StoreLocationInventory
    {
        return DB::transaction(function () use ($storeLocationId, $variantId, $quantityChange, $reason, $actorId): StoreLocationInventory {
            DB::table('store_locations')->where('id', $storeLocationId)->lockForUpdate()->firstOrFail();
            $inventory = StoreLocationInventory::query()->firstOrCreate(
                ['store_location_id' => $storeLocationId, 'variant_id' => $variantId],
                ['quantity' => 0, 'reserved' => 0, 'low_stock_threshold' => 0],
            );
            $inventory = StoreLocationInventory::query()->whereKey($inventory->id)->lockForUpdate()->firstOrFail();
            $next = $inventory->quantity + $quantityChange;
            if ($quantityChange === 0 || $next < $inventory->reserved) {
                throw ValidationException::withMessages(['quantity_change' => 'Điều chỉnh phải khác 0 và tồn mới không được thấp hơn số lượng đã giữ.']);
            }
            $inventory->quantity = $next;
            $inventory->save();
            $this->recordMovement($variantId, 'adjust', $quantityChange, $next, null, $reason, $actorId, 'store_adjustment', $storeLocationId);

            return $inventory->refresh();
        });
    }

    public function reservePickup(int $storeLocationId, int $variantId, int $quantity, int $orderId, string $note, ?int $actorId): void
    {
        $inventory = $this->lockedStoreInventory($storeLocationId, $variantId);
        if (! $inventory || $quantity < 1 || $inventory->quantity - $inventory->reserved < $quantity) {
            throw ValidationException::withMessages(['pickup_location_id' => 'Cửa hàng không còn đủ tồn cho một sản phẩm trong giỏ. Hãy chọn cửa hàng khác.']);
        }
        $inventory->reserved += $quantity;
        $inventory->save();
        $this->recordMovement($variantId, 'reserve', $quantity, $inventory->quantity, $orderId, $note, $actorId, 'order', $storeLocationId);
    }

    public function releasePickupReservation(int $storeLocationId, int $variantId, int $quantity, int $orderId, string $note, ?int $actorId): void
    {
        $inventory = $this->lockedStoreInventory($storeLocationId, $variantId);
        if (! $inventory || $quantity < 1 || $inventory->reserved < $quantity) {
            throw ValidationException::withMessages(['inventory' => 'Không thể giải phóng tồn đã giữ tại cửa hàng.']);
        }
        $inventory->reserved -= $quantity;
        $inventory->save();
        $this->recordMovement($variantId, 'release', -$quantity, $inventory->quantity, $orderId, $note, $actorId, 'order', $storeLocationId);
    }

    public function completePickupSale(int $storeLocationId, int $variantId, int $productId, int $quantity, int $orderId, string $note, ?int $actorId): void
    {
        $inventory = $this->lockedStoreInventory($storeLocationId, $variantId);
        if (! $inventory || $quantity < 1 || $inventory->reserved < $quantity || $inventory->quantity < $quantity) {
            throw ValidationException::withMessages(['inventory' => 'Tồn cửa hàng đã giữ không còn khớp với đơn nhận tại cửa hàng.']);
        }
        $inventory->quantity -= $quantity;
        $inventory->reserved -= $quantity;
        $inventory->save();
        DB::table('products')->where('id', $productId)->increment('sold_count', $quantity);
        $this->recordMovement($variantId, 'sale', -$quantity, $inventory->quantity, $orderId, $note, $actorId, 'order', $storeLocationId);
    }

    public function restorePickupSale(int $storeLocationId, int $variantId, int $productId, int $quantity, int $orderId, string $note, ?int $actorId): void
    {
        $inventory = $this->lockedStoreInventory($storeLocationId, $variantId);
        if (! $inventory || $quantity < 1) {
            throw ValidationException::withMessages(['inventory' => 'Không tìm thấy tồn cửa hàng để nhận hàng trả.']);
        }
        $inventory->quantity += $quantity;
        $inventory->save();
        $product = DB::table('products')->where('id', $productId)->lockForUpdate()->first(['sold_count']);
        if ($product) {
            DB::table('products')->where('id', $productId)->update(['sold_count' => max(0, $product->sold_count - $quantity)]);
        }
        $this->recordMovement($variantId, 'return', $quantity, $inventory->quantity, $orderId, $note, $actorId, 'order', $storeLocationId);
    }

    private function lockedStoreInventory(int $storeLocationId, int $variantId): ?StoreLocationInventory
    {
        return StoreLocationInventory::query()->where('store_location_id', $storeLocationId)->where('variant_id', $variantId)->lockForUpdate()->first();
    }

    private function lockedInventory(int $variantId): ?Inventory
    {
        return Inventory::query()->where('variant_id', $variantId)->lockForUpdate()->first();
    }

    private function notifyIfCrossedLowStock(int $variantId, Inventory $inventory, int $availableBefore, int $availableAfter): void
    {
        if ($availableBefore > $inventory->low_stock_threshold && $availableAfter <= $inventory->low_stock_threshold) {
            $threshold = (int) $inventory->low_stock_threshold;
            DB::afterCommit(fn () => StoreOrderNotifier::becameLowStock($variantId, $availableAfter, $threshold));
        }
    }

    private function notifyIfBackInStock(int $variantId, int $availableBefore, int $availableAfter): void
    {
        if ($availableBefore <= 0 && $availableAfter > 0) {
            DB::afterCommit(fn () => app(NotifyProductBackInStockAction::class)->execute($variantId));
        }
    }

    private function recordMovement(int $variantId, string $type, int $change, int $stockAfter, ?int $referenceId, string $note, ?int $actorId, string $referenceType = 'order', ?int $storeLocationId = null): void
    {
        InventoryMovement::query()->create([
            'variant_id' => $variantId,
            'store_location_id' => $storeLocationId,
            'type' => $type,
            'quantity_change' => $change,
            'stock_after' => $stockAfter,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'note' => $note,
            'created_by' => $actorId,
        ]);
    }
}
