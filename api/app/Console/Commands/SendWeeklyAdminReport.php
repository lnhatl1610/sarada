<?php

namespace App\Console\Commands;

use App\Modules\Orders\Actions\SendWeeklyAdminReportAction;
use Illuminate\Console\Command;

class SendWeeklyAdminReport extends Command
{
    protected $signature = 'admin:send-weekly-report';

    protected $description = 'Send the previous week summary to admins who enabled weekly reports';

    public function handle(SendWeeklyAdminReportAction $sendWeeklyAdminReport): int
    {
        $report = $sendWeeklyAdminReport->handle();
        $this->info(sprintf(
            'Dispatched report %s to %s: %s fulfilled orders, %s VND net revenue, %s low-stock variants.',
            $report['from'],
            $report['to'],
            number_format($report['fulfilled_orders']),
            number_format($report['net_revenue']),
            number_format($report['low_stock_variants']),
        ));

        return self::SUCCESS;
    }
}
