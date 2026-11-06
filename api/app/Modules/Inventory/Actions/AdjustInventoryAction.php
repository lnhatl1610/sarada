<?php

namespace App\Modules\Inventory\Actions;

use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Modules\Inventory\Services\InventoryService;

class AdjustInventoryAction
{
    public function __construct(private readonly InventoryService $inventory) {}

    /** @return array{inventory: Inventory, movement: InventoryMovement} */
    public function execute(int $variantId, int $quantityChange, string $reason, int $actorId, string $movementType = 'adjust', string $referenceType = 'manual_adjustment', ?int $referenceId = null): array
    {
        return $this->inventory->adjust($variantId, $quantityChange, $reason, $actorId, $movementType, $referenceType, $referenceId);
    }
}
