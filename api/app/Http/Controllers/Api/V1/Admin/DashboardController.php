<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AdminSearchRequest;
use App\Http\Requests\Api\V1\Admin\DashboardDaysRequest;
use App\Http\Requests\Api\V1\Admin\DashboardSummaryRequest;
use Carbon\Carbon;
use DateTimeZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function alerts(Request $request): JsonResponse
    {
        $pendingOrders = DB::table('orders')->where('status', 'pending');
        $deliveryFailedOrders = DB::table('orders')->where('status', 'delivery_failed');
        $failedPayments = DB::table('payments')->join('orders', 'orders.id', '=', 'payments.order_id')->where('payments.status', 'failed');
        $latestFailedPayments = fn () => DB::table('payments')
            ->join('orders', 'orders.id', '=', 'payments.order_id')
            ->where('payments.status', 'failed')
            ->select('orders.id', 'orders.code', 'orders.customer_name')
            ->selectRaw('MAX(payments.updated_at) as updated_at')
            ->groupBy('orders.id', 'orders.code', 'orders.customer_name');
        $pendingReviews = DB::table('reviews')->where('status', 'pending');
        $lowStock = DB::table('inventories')
            ->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereNull('products.deleted_at')
            ->where('products.status', 'active')
            ->whereRaw('inventories.quantity - inventories.reserved <= inventories.low_stock_threshold');
        $pendingApprovals = DB::table('users')->where('status', 'pending_approval')->whereNotNull('email_verified_at');

        $user = $request->user();
        $can = fn (string $permission): bool => $user?->hasAdminPermission($permission) ?? false;

        return response()->json(['data' => [
            'counts' => [
                'pending_orders' => $can('orders.view') ? (clone $pendingOrders)->count() : 0,
                'delivery_failed_orders' => $can('orders.view') ? (clone $deliveryFailedOrders)->count() : 0,
                'failed_payments' => $can('orders.view') ? (clone $failedPayments)->distinct()->count('payments.order_id') : 0,
                'pending_reviews' => $can('reviews.moderate') ? (clone $pendingReviews)->count() : 0,
                'low_stock' => $can('inventory.view') ? (clone $lowStock)->count() : 0,
                'pending_staff_approvals' => $can('users.manage') ? (clone $pendingApprovals)->count() : 0,
            ],
            'items' => [
                'pending_orders' => $can('orders.view') ? (clone $pendingOrders)->orderByDesc('created_at')->limit(5)->get(['id', 'code', 'customer_name', 'created_at']) : [],
                'delivery_failed_orders' => $can('orders.view') ? (clone $deliveryFailedOrders)->orderByDesc('updated_at')->limit(5)->get(['id', 'code', 'customer_name', 'updated_at']) : [],
                'failed_payments' => $can('orders.view') ? $latestFailedPayments()->orderByDesc('updated_at')->orderByDesc('orders.id')->limit(5)->get() : [],
                'pending_reviews' => $can('reviews.moderate') ? DB::table('reviews')->join('products', 'products.id', '=', 'reviews.product_id')
                    ->where('reviews.status', 'pending')->orderByDesc('reviews.created_at')->limit(5)
                    ->get(['reviews.id', 'reviews.product_id', 'products.name as product_name', 'reviews.created_at']) : [],
                'low_stock' => $can('inventory.view') ? (clone $lowStock)->orderByRaw('(inventories.quantity - inventories.reserved) asc')->limit(5)
                    ->get(['product_variants.id', 'product_variants.sku', 'products.name as product_name', 'inventories.quantity', 'inventories.reserved'])
                    : [],
                'pending_staff_approvals' => $can('users.manage') ? (clone $pendingApprovals)->orderBy('created_at')->limit(5)->get(['id', 'name', 'email', 'created_at']) : [],
            ],
        ]]);
    }

    public function search(AdminSearchRequest $request): JsonResponse
    {
        $data = $request->validated();
        $term = trim($data['q']);
        $like = '%'.$term.'%';
        $user = $request->user();
        $canSearch = fn (string $permission): bool => $user?->hasAdminPermission($permission) ?? false;

        $products = $canSearch('products.view') ? DB::table('products')
            ->whereNull('products.deleted_at')
            ->where(fn ($query) => $query->where('products.name', 'like', $like)
                ->orWhere('products.sku', 'like', $like)
                ->orWhereExists(fn ($variants) => $variants->selectRaw('1')->from('product_variants')
                    ->whereColumn('product_variants.product_id', 'products.id')->where('product_variants.sku', 'like', $like)))
            ->select('products.id', 'products.name', 'products.slug', 'products.thumbnail', 'products.sku')
            ->orderBy('products.name')->limit(5)->get()
            ->map(fn ($row) => ['id' => $row->id, 'label' => $row->name, 'detail' => $row->sku ? 'SKU '.$row->sku : $row->slug, 'url' => '/?page=productDetail&id='.$row->id]) : collect();

        $orders = $canSearch('orders.view') ? DB::table('orders')
            ->where(fn ($query) => $query->where('code', 'like', $like)->orWhere('customer_name', 'like', $like)->orWhere('customer_phone', 'like', $like)->orWhere('customer_email', 'like', $like))
            ->orderByDesc('created_at')->limit(5)->get(['id', 'code', 'customer_name', 'customer_phone', 'status'])
            ->map(fn ($row) => ['id' => $row->id, 'label' => $row->code, 'detail' => $row->customer_name.' · '.$row->customer_phone, 'url' => '/?page=orders&order='.$row->id]) : collect();

        $customers = $canSearch('customers.view') ? DB::table('users')
            ->join('role_user', 'role_user.user_id', '=', 'users.id')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->where('roles.name', 'customer')->whereNull('users.deleted_at')
            ->where(fn ($query) => $query->where('users.name', 'like', $like)->orWhere('users.email', 'like', $like)->orWhere('users.phone', 'like', $like))
            ->orderBy('users.name')->limit(5)->get(['users.id', 'users.name', 'users.email', 'users.phone'])
            ->map(fn ($row) => ['id' => $row->id, 'label' => $row->name, 'detail' => $row->email ?: $row->phone, 'url' => '/customers/'.$row->id]) : collect();

        return response()->json(['data' => [
            'products' => $products,
            'orders' => $orders,
            'customers' => $customers,
        ]]);
    }

    public function summary(DashboardSummaryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $timezone = $this->dashboardTimezone($request->user()?->timezone);
        ['start' => $start, 'end' => $end, 'days' => $periodDays] = $this->dashboardDateRange($data, $timezone);
        $previousStart = $start->copy()->setTimezone($timezone)->subDays($periodDays)->setTimezone('UTC');
        $periodOrders = DB::table('orders')->whereBetween('created_at', [$start, $end]);
        $previousOrders = DB::table('orders')->where('created_at', '>=', $previousStart)->where('created_at', '<', $start);
        $netOrderAmount = 'GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0)';
        $revenue = (clone $periodOrders)->where('payment_status', 'paid')->whereIn('status', ['delivered', 'completed'])->sum(DB::raw($netOrderAmount));
        $paidCount = (clone $periodOrders)->where('payment_status', 'paid')->whereIn('status', ['delivered', 'completed'])->count();
        $previousRevenue = (clone $previousOrders)->where('payment_status', 'paid')->whereIn('status', ['delivered', 'completed'])->sum(DB::raw($netOrderAmount));
        $previousPaidCount = (clone $previousOrders)->where('payment_status', 'paid')->whereIn('status', ['delivered', 'completed'])->count();
        $orderCount = (clone $periodOrders)->count();
        $previousOrderCount = (clone $previousOrders)->count();
        $cancelledOrReturned = (clone $periodOrders)->whereIn('status', ['cancelled', 'returned'])->count();
        $previousCancelledOrReturned = (clone $previousOrders)->whereIn('status', ['cancelled', 'returned'])->count();
        $customerCountForPeriod = fn ($from, $to) => DB::table('users')
            ->join('role_user', 'role_user.user_id', '=', 'users.id')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->where('roles.name', 'customer')->whereNull('users.deleted_at')
            ->whereBetween('users.created_at', [$from, $to])->count();
        $newCustomers = $customerCountForPeriod($start, $end);
        $previousNewCustomers = $customerCountForPeriod($previousStart, (clone $start)->subSecond());
        $lowStock = DB::table('inventories')
            ->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereNull('products.deleted_at')
            ->where('products.status', 'active')
            ->whereRaw('inventories.quantity - inventories.reserved <= inventories.low_stock_threshold')
            ->count();
        $statusBreakdown = (clone $periodOrders)->select('status')->selectRaw('COUNT(*) as count')->groupBy('status')->orderByDesc('count')->get()
            ->map(fn ($row): array => ['status' => $row->status, 'count' => (int) $row->count]);
        $paymentBreakdown = (clone $periodOrders)->where('payment_status', 'paid')->whereIn('status', ['delivered', 'completed'])->select('payment_method')->selectRaw("COUNT(*) as count, COALESCE(SUM({$netOrderAmount}), 0) as revenue")->groupBy('payment_method')->orderByDesc('revenue')->get()
            ->map(fn ($row): array => ['payment_method' => $row->payment_method, 'count' => (int) $row->count, 'revenue' => (int) $row->revenue]);
        $itemRefundShare = 'CASE WHEN COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0) >= COALESCE((SELECT SUM(refund_items.line_total) FROM order_items AS refund_items WHERE refund_items.order_id = orders.id), 0) THEN order_items.line_total ELSE ROUND(order_items.line_total * COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0) / NULLIF((SELECT SUM(refund_items.line_total) FROM order_items AS refund_items WHERE refund_items.order_id = orders.id), 0)) END';
        $categoryBreakdown = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->whereBetween('orders.created_at', [$start, $end])
            ->where('orders.payment_status', 'paid')
            ->whereIn('orders.status', ['delivered', 'completed'])
            ->select('products.category_id')
            ->selectRaw("COALESCE(categories.name, 'Chưa phân loại') as category_name")
            ->selectRaw("COALESCE(SUM(GREATEST(order_items.line_total - ({$itemRefundShare}), 0)), 0) as revenue")
            ->groupBy('products.category_id', 'categories.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row): array => [
                'category_id' => $row->category_id === null ? null : (int) $row->category_id,
                'category_name' => (string) $row->category_name,
                'revenue' => (int) $row->revenue,
            ]);
        $lowStockRows = DB::table('inventories')->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')->join('products', 'products.id', '=', 'product_variants.product_id')->leftJoin('attribute_values as color_values', 'color_values.id', '=', 'product_variants.color_value_id')->leftJoin('attribute_values as size_values', 'size_values.id', '=', 'product_variants.size_value_id')->whereNull('products.deleted_at')->where('products.status', 'active')->whereRaw('inventories.quantity - inventories.reserved <= inventories.low_stock_threshold')->orderByRaw('(inventories.quantity - inventories.reserved) asc')->limit(5)->get(['products.id as product_id', 'products.name as product_name', 'product_variants.sku', 'color_values.value as color_name', 'size_values.value as size_name', 'inventories.quantity', 'inventories.reserved']);

        return response()->json(['data' => [
            'period_days' => $periodDays,
            'revenue' => (int) $revenue,
            'previous_revenue' => (int) $previousRevenue,
            'order_count' => (int) $orderCount,
            'previous_order_count' => (int) $previousOrderCount,
            'paid_order_count' => (int) $paidCount,
            'average_paid_order_value' => $paidCount > 0 ? (int) floor($revenue / $paidCount) : 0,
            'previous_average_paid_order_value' => $previousPaidCount > 0 ? (int) floor($previousRevenue / $previousPaidCount) : 0,
            'new_customer_count' => (int) $newCustomers,
            'previous_new_customer_count' => (int) $previousNewCustomers,
            'cancellation_return_rate' => $orderCount > 0 ? round($cancelledOrReturned * 100 / $orderCount, 1) : 0,
            'previous_cancellation_return_rate' => $previousOrderCount > 0 ? round($previousCancelledOrReturned * 100 / $previousOrderCount, 1) : 0,
            'pending_order_count' => DB::table('orders')->where('status', 'pending')->count(),
            'low_stock_count' => (int) $lowStock,
            'status_breakdown' => $statusBreakdown,
            'payment_breakdown' => $paymentBreakdown,
            'category_breakdown' => $categoryBreakdown,
            'low_stock_products' => $lowStockRows,
        ]]);
    }

    public function revenue(DashboardDaysRequest $request): JsonResponse
    {
        $data = $request->validated();
        $timezone = $this->dashboardTimezone($request->user()?->timezone);
        ['start' => $start, 'end' => $end, 'days' => $days] = $this->dashboardDateRange($data, $timezone);
        $groupBy = $data['group_by'] ?? 'day';
        $localCreatedAt = $this->localCreatedAtExpression($timezone, $start, $end);
        $bucketExpression = match ($groupBy) {
            'week' => "DATE_SUB(DATE({$localCreatedAt}), INTERVAL WEEKDAY({$localCreatedAt}) DAY)",
            'month' => "DATE_FORMAT({$localCreatedAt}, '%Y-%m-01')",
            default => "DATE({$localCreatedAt})",
        };
        $netOrderAmount = 'GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0)';
        $rows = DB::table('orders')
            ->selectRaw("{$bucketExpression} as date, SUM(CASE WHEN orders.payment_status = 'paid' AND orders.status IN ('delivered', 'completed') THEN {$netOrderAmount} ELSE 0 END) as revenue, COUNT(*) as orders")
            ->whereBetween('orders.created_at', [$start, $end])
            ->groupByRaw($bucketExpression)
            ->orderBy('date')
            ->get();

        $rowsByDate = $rows->keyBy('date');
        $cursor = $start->copy()->setTimezone($timezone);
        if ($groupBy === 'week') {
            $cursor->startOfWeek(Carbon::MONDAY);
        } elseif ($groupBy === 'month') {
            $cursor->startOfMonth();
        }
        $lastBucket = $end->copy()->setTimezone($timezone);
        if ($groupBy === 'week') {
            $lastBucket->startOfWeek(Carbon::MONDAY);
        } elseif ($groupBy === 'month') {
            $lastBucket->startOfMonth();
        }
        $series = collect();
        while ($cursor->lessThanOrEqualTo($lastBucket)) {
            $date = $cursor->toDateString();
            $row = $rowsByDate->get($date);
            $series->push([
                'date' => $date,
                'revenue' => (int) ($row->revenue ?? 0),
                'orders' => (int) ($row->orders ?? 0),
            ]);
            match ($groupBy) {
                'week' => $cursor->addWeek(),
                'month' => $cursor->addMonth(),
                default => $cursor->addDay(),
            };
        }

        return response()->json(['data' => $series]);
    }

    public function topProducts(DashboardDaysRequest $request): JsonResponse
    {
        $data = $request->validated();
        $timezone = $this->dashboardTimezone($request->user()?->timezone);
        ['start' => $start, 'end' => $end] = $this->dashboardDateRange($data, $timezone);
        $itemRefundShare = 'CASE WHEN COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0) >= COALESCE((SELECT SUM(refund_items.line_total) FROM order_items AS refund_items WHERE refund_items.order_id = orders.id), 0) THEN order_items.line_total ELSE ROUND(order_items.line_total * COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0) / NULLIF((SELECT SUM(refund_items.line_total) FROM order_items AS refund_items WHERE refund_items.order_id = orders.id), 0)) END';
        $products = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->whereBetween('orders.created_at', [$start, $end])
            ->where('orders.payment_status', 'paid')
            ->whereIn('orders.status', ['delivered', 'completed'])
            ->select('order_items.product_id', 'order_items.product_name')
            ->selectRaw("MAX(products.slug) as product_slug, MAX(products.thumbnail) as thumbnail, SUM(order_items.quantity) as units_sold, SUM(GREATEST(order_items.line_total - ({$itemRefundShare}), 0)) as revenue")
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('units_sold')
            ->limit(5)
            ->get();

        return response()->json(['data' => $products->map(fn ($product): array => [
            'product_id' => $product->product_id === null ? null : (int) $product->product_id,
            'product_name' => $product->product_name,
            'product_slug' => $product->product_slug,
            'thumbnail' => $product->thumbnail,
            'units_sold' => (int) $product->units_sold,
            'revenue' => (int) $product->revenue,
        ])]);
    }

    /** @return array{start: Carbon, end: Carbon, days: int} */
    private function dashboardTimezone(?string $timezone): string
    {
        if (is_string($timezone) && in_array($timezone, timezone_identifiers_list(), true)) {
            return $timezone;
        }

        $applicationTimezone = (string) config('app.timezone', 'UTC');

        return in_array($applicationTimezone, timezone_identifiers_list(), true) ? $applicationTimezone : 'UTC';
    }

    private function dashboardDateRange(array $data, string $timezone): array
    {
        if (isset($data['from'], $data['to'])) {
            $start = Carbon::parse($data['from'], $timezone)->startOfDay()->setTimezone('UTC');
            $end = Carbon::parse($data['to'], $timezone)->endOfDay()->setTimezone('UTC');

            return [
                'start' => $start,
                'end' => $end,
                'days' => max(1, (int) $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1),
            ];
        }

        $days = (int) ($data['days'] ?? 7);
        $end = Carbon::now($timezone)->endOfDay();
        $start = $end->copy()->startOfDay()->subDays($days - 1);

        return [
            'start' => $start->setTimezone('UTC'),
            'end' => $end->setTimezone('UTC'),
            'days' => $days,
        ];
    }

    private function localCreatedAtExpression(string $timezone, Carbon $start, Carbon $end): string
    {
        $zone = new DateTimeZone($timezone);
        $transitions = $zone->getTransitions($start->getTimestamp(), $end->getTimestamp());
        if ($transitions === false || $transitions === []) {
            return 'TIMESTAMPADD(SECOND, '.$zone->getOffset($start).', orders.created_at)';
        }

        $expression = 'TIMESTAMPADD(SECOND, '.(int) $transitions[0]['offset'].', orders.created_at)';
        foreach (array_slice($transitions, 1) as $transition) {
            $transitionAt = Carbon::createFromTimestampUTC((int) $transition['ts'])->format('Y-m-d H:i:s');
            $offset = (int) $transition['offset'];
            $expression = "CASE WHEN orders.created_at >= '{$transitionAt}' THEN TIMESTAMPADD(SECOND, {$offset}, orders.created_at) ELSE {$expression} END";
        }

        return $expression;
    }
}
