<?php

namespace App\Console\Commands;

use App\Modules\Catalog\Actions\DispatchProductPriceAlertsAction;
use Illuminate\Console\Command;

class DispatchProductPriceAlerts extends Command
{
    protected $signature = 'storefront:dispatch-price-alerts';

    protected $description = 'Queue customer emails for products whose effective price has dropped';

    public function handle(DispatchProductPriceAlertsAction $action): int
    {
        $this->info('Queued '.$action->execute().' product price alert(s).');

        return self::SUCCESS;
    }
}
