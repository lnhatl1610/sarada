<?php

namespace App\Modules\Orders\Actions;

use App\Support\AdminNotificationDispatcher;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

class SendWeeklyAdminReportAction
{
    /**
     * @return array{from: string, to: string, fulfilled_orders: int, net_revenue: int, low_stock_variants: int}
     */
    public function handle(?CarbonInterface $reference = null): array
    {
        $now = $reference
            ? CarbonImmutable::instance($reference)->setTimezone(config('app.timezone'))
            : CarbonImmutable::now(config('app.timezone'));
        $toExclusive = $now->startOfWeek(CarbonImmutable::MONDAY);
        $from = $toExclusive->subWeek();
        $to = $toExclusive->subDay();
        $netOrderAmount = 'GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0)';
        $sales = DB::table('orders')
            ->where('payment_status', 'paid')
            ->whereIn('status', ['delivered', 'completed'])
            ->where('placed_at', '>=', $from)
            ->where('placed_at', '<', $toExclusive)
            ->selectRaw("COUNT(*) as fulfilled_orders, COALESCE(SUM({$netOrderAmount}), 0) as net_revenue")
            ->first();
        $lowStockVariants = (int) DB::table('inventories')
            ->whereRaw('(quantity - reserved) <= low_stock_threshold')
            ->count();
        $fromDate = $from->toDateString();
        $toDate = $to->toDateString();
        $revenue = (int) ($sales->net_revenue ?? 0);
        $fulfilledOrders = (int) ($sales->fulfilled_orders ?? 0);
        $periodLabel = $from->format('d/m').'–'.$to->format('d/m');
        $title = 'Báo cáo tuần '.$periodLabel;
        $detail = sprintf(
            'Tuần %s: doanh thu thuần %s ₫ từ %s đơn đã giao hoặc hoàn tất. Hiện có %s biến thể cần chú ý tồn kho.',
            $periodLabel,
            number_format($revenue, 0, ',', '.'),
            number_format($fulfilledOrders, 0, ',', '.'),
            number_format($lowStockVariants, 0, ',', '.'),
        );
        $href = '/reports/revenue?from='.rawurlencode($fromDate).'&to='.rawurlencode($toDate);

        AdminNotificationDispatcher::send('weekly_report', 'reports.view', $title, $detail, $href);

        return [
            'from' => $fromDate,
            'to' => $toDate,
            'fulfilled_orders' => $fulfilledOrders,
            'net_revenue' => $revenue,
            'low_stock_variants' => $lowStockVariants,
        ];
    }
}
