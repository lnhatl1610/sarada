<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ReportRequest;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function overview(ReportRequest $request): JsonResponse|StreamedResponse
    {
        $data = $request->validated();
        $from = CarbonImmutable::parse($data['from'])->startOfDay();
        $to = CarbonImmutable::parse($data['to'])->endOfDay();
        if ($from->diffInDays($to) > 366) {
            throw ValidationException::withMessages(['to' => 'Khoảng báo cáo tối đa 366 ngày.']);
        }
        $days = (int) $from->diffInDays($to) + 1;
        $previousTo = $from->subDay()->endOfDay();
        $previousFrom = $from->subDays($days)->startOfDay();
        $netOrderAmount = 'GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0)';
        $itemRefundShare = 'CASE WHEN COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0) >= COALESCE((SELECT SUM(refund_items.line_total) FROM order_items AS refund_items WHERE refund_items.order_id = orders.id), 0) THEN order_items.line_total ELSE ROUND(order_items.line_total * COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0) / NULLIF((SELECT SUM(refund_items.line_total) FROM order_items AS refund_items WHERE refund_items.order_id = orders.id), 0)) END';
        $sales = fn ($start, $end) => DB::table('orders')
            ->where('payment_status', 'paid')->whereBetween('placed_at', [$start, $end])
            ->when(isset($data['payment_method']), fn ($query) => $query->where('payment_method', $data['payment_method']))
            ->when(isset($data['province']), fn ($query) => $query->whereRaw("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.province')), 'Không rõ') = ?", [$data['province']]));
        $orderReportRows = fn () => DB::table('orders')->whereBetween('placed_at', [$from, $to])
            ->when(isset($data['status']), fn ($query) => $query->where('status', $data['status']))
            ->when(isset($data['province']), fn ($query) => $query->whereRaw("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.province')), 'Không rõ') = ?", [$data['province']]));
        $fulfilledSales = fn ($start, $end) => $sales($start, $end)->whereIn('status', ['delivered', 'completed']);
        $current = $fulfilledSales($from, $to)->selectRaw("COUNT(*) as order_count, COALESCE(SUM({$netOrderAmount}), 0) as revenue, COALESCE(SUM(orders.discount_total), 0) as discount_total, COALESCE(SUM(orders.shipping_fee), 0) as shipping_total")->first();
        $previous = $fulfilledSales($previousFrom, $previousTo)->selectRaw("COUNT(*) as order_count, COALESCE(SUM({$netOrderAmount}), 0) as revenue, COALESCE(SUM(orders.discount_total), 0) as discount_total, COALESCE(SUM(orders.shipping_fee), 0) as shipping_total")->first();
        $groupBy = $request->route('report') === 'revenue' ? ($data['group_by'] ?? 'day') : 'day';
        $dateGroupExpression = match ($groupBy) {
            'week' => "DATE_FORMAT(placed_at, '%x-W%v')",
            'month' => "DATE_FORMAT(placed_at, '%Y-%m')",
            default => 'DATE(placed_at)',
        };
        $daily = $fulfilledSales($from, $to)->selectRaw("{$dateGroupExpression} as date, COUNT(*) as orders, COALESCE(SUM({$netOrderAmount}), 0) as revenue, COALESCE(SUM(orders.discount_total), 0) as discount_total, COALESCE(SUM(orders.shipping_fee), 0) as shipping_total")
            ->groupByRaw($dateGroupExpression)->orderBy('date')->get();
        $products = DB::table('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.payment_status', 'paid')->whereIn('orders.status', ['delivered', 'completed'])->whereBetween('orders.placed_at', [$from, $to])
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->select('order_items.product_name')->selectRaw("SUM(order_items.quantity) as units_sold, SUM(GREATEST(order_items.line_total - ({$itemRefundShare}), 0)) as revenue")
            ->groupBy('order_items.product_name')->orderByDesc('revenue')->limit(10)->get();
        $inventory = DB::table('inventories')->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')->join('products', 'products.id', '=', 'product_variants.product_id')
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->selectRaw('COUNT(*) as variants, COALESCE(SUM(inventories.quantity * product_variants.price), 0) as retail_value')
            ->selectRaw('COALESCE(SUM(inventories.quantity), 0) as total_quantity, COALESCE(SUM(inventories.quantity - inventories.reserved), 0) as total_available_quantity')
            ->selectRaw('SUM(CASE WHEN inventories.quantity - inventories.reserved <= inventories.low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count')->first();
        $customers = DB::table('users')->join('role_user', 'role_user.user_id', '=', 'users.id')->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->where('roles.name', 'customer')->whereBetween('users.created_at', [$from, $to])->distinct('users.id')->count('users.id');
        $newCustomersTimeline = DB::table('users')->join('role_user', 'role_user.user_id', '=', 'users.id')->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->where('roles.name', 'customer')->whereBetween('users.created_at', [$from, $to])
            ->selectRaw('DATE(users.created_at) as date, COUNT(DISTINCT users.id) as customers')
            ->groupByRaw('DATE(users.created_at)')->orderBy('date')->get();
        $coupons = DB::table('coupon_usages')->join('coupons', 'coupons.id', '=', 'coupon_usages.coupon_id')
            ->join('orders', 'orders.id', '=', 'coupon_usages.order_id')->whereBetween('orders.placed_at', [$from, $to])
            ->when(isset($data['coupon_code']), fn ($query) => $query->where('coupons.code', strtoupper($data['coupon_code'])))
            ->select('coupons.code')->selectRaw('COUNT(*) as usage_count, COALESCE(SUM(orders.discount_total), 0) as discount_total')
            ->selectRaw("COALESCE(SUM(CASE WHEN orders.payment_status = 'paid' AND orders.status IN ('delivered', 'completed') THEN {$netOrderAmount} ELSE 0 END), 0) as revenue")
            ->groupBy('coupons.code')->orderByDesc('usage_count')->limit(10)->get();
        $orderStatuses = $orderReportRows()
            ->select('status')->selectRaw('COUNT(*) as order_count')->groupBy('status')->orderByDesc('order_count')->get();
        $orderTotals = $orderReportRows()
            ->selectRaw('COUNT(*) as order_count, SUM(CASE WHEN status IN (\'cancelled\', \'returned\') THEN 1 ELSE 0 END) as cancelled_or_returned')
            ->selectRaw('AVG(CASE WHEN confirmed_at IS NOT NULL AND shipped_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, confirmed_at, shipped_at) END) as avg_processing_minutes')
            ->first();
        $orderLocations = $orderReportRows()
            ->selectRaw("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.province')), 'Không rõ') as province")
            ->selectRaw('COUNT(*) as order_count')->groupBy('province')->orderByDesc('order_count')->limit(20)->get();
        $paymentMethods = $fulfilledSales($from, $to)->select('payment_method')->selectRaw("COUNT(*) as order_count, COALESCE(SUM({$netOrderAmount}), 0) as revenue")
            ->groupBy('payment_method')->orderByDesc('revenue')->get();
        $phoneIdentity = "REGEXP_REPLACE(COALESCE(orders.customer_phone, ''), '[^0-9]', '')";
        $emailIdentity = "LOWER(TRIM(COALESCE(orders.customer_email, '')))";
        $customerIdentity = "CASE WHEN orders.user_id IS NOT NULL THEN CONCAT('user:', orders.user_id) WHEN NULLIF({$emailIdentity}, '') IS NOT NULL THEN CONCAT('email:', {$emailIdentity}) WHEN NULLIF({$phoneIdentity}, '') IS NOT NULL THEN CONCAT('phone:', {$phoneIdentity}) ELSE CONCAT('order:', orders.id) END";
        $topCustomers = $sales($from, $to)->selectRaw("{$customerIdentity} as customer_key, MAX(orders.customer_name) as customer_name")
            ->selectRaw("COUNT(*) as order_count, COALESCE(SUM({$netOrderAmount}), 0) as spent")
            ->groupByRaw($customerIdentity)->orderByDesc('spent')->limit(10)->get()
            ->map(function ($row) {
                $row->customer_ref = hash_hmac('sha256', (string) $row->customer_key, (string) config('app.key'));
                unset($row->customer_key);

                return $row;
            });
        $revenueCategories = DB::table('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('orders.payment_status', 'paid')->whereIn('orders.status', ['delivered', 'completed'])->whereBetween('orders.placed_at', [$from, $to])
            ->when(isset($data['payment_method']), fn ($query) => $query->where('orders.payment_method', $data['payment_method']))
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->selectRaw("COALESCE(categories.name, 'Không phân loại') as category_name")
            ->selectRaw("SUM(order_items.quantity) as units_sold, COALESCE(SUM(GREATEST(order_items.line_total - ({$itemRefundShare}), 0)), 0) as revenue")
            ->groupBy('categories.name')->orderByDesc('revenue')->get();
        $revenueBrands = DB::table('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')->leftJoin('brands', 'brands.id', '=', 'products.brand_id')
            ->where('orders.payment_status', 'paid')->whereIn('orders.status', ['delivered', 'completed'])->whereBetween('orders.placed_at', [$from, $to])
            ->when(isset($data['payment_method']), fn ($query) => $query->where('orders.payment_method', $data['payment_method']))
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->selectRaw("COALESCE(brands.name, 'Không rõ thương hiệu') as brand_name")
            ->selectRaw("SUM(order_items.quantity) as units_sold, COALESCE(SUM(GREATEST(order_items.line_total - ({$itemRefundShare}), 0)), 0) as revenue")
            ->groupBy('brands.name')->orderByDesc('revenue')->get();
        $productPerformance = DB::table('products')->whereNull('products.deleted_at')
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->select('products.name as product_name', 'products.view_count', 'products.sold_count')
            ->orderByDesc('products.view_count')->limit(20)->get();
        $slowProducts = DB::table('products')->whereNull('products.deleted_at')->whereNotExists(function ($query) use ($from, $to): void {
            $query->selectRaw('1')->from('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->whereColumn('order_items.product_id', 'products.id')->where('orders.payment_status', 'paid')
                ->whereIn('orders.status', ['delivered', 'completed'])
                ->whereBetween('orders.placed_at', [$from, $to]);
        })->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->select('products.name as product_name', 'products.view_count', 'products.sold_count')
            ->orderByDesc('products.view_count')->limit(20)->get();
        $priorPhoneIdentity = "REGEXP_REPLACE(COALESCE(prior_orders.customer_phone, ''), '[^0-9]', '')";
        $priorEmailIdentity = "LOWER(TRIM(COALESCE(prior_orders.customer_email, '')))";
        $hasPriorPurchase = "EXISTS (SELECT 1 FROM orders AS prior_orders WHERE prior_orders.payment_status = 'paid' AND prior_orders.placed_at < ? AND ((orders.user_id IS NOT NULL AND prior_orders.user_id = orders.user_id) OR (NULLIF({$emailIdentity}, '') IS NOT NULL AND {$priorEmailIdentity} = {$emailIdentity}) OR (NULLIF({$phoneIdentity}, '') IS NOT NULL AND {$priorPhoneIdentity} = {$phoneIdentity})))";
        $customerRepeat = $sales($from, $to)
            ->selectRaw("{$customerIdentity} as customer_key, MAX(orders.customer_name) as customer_name, COUNT(*) as order_count")
            ->selectRaw("MAX(CASE WHEN {$hasPriorPurchase} THEN 1 ELSE 0 END) as has_prior_purchase", [$from])
            ->groupByRaw($customerIdentity)->orderBy('customer_name')->get()
            ->map(function ($row) {
                // Use an opaque identifier for stable table keys without exposing contact details.
                $row->customer_ref = hash_hmac('sha256', (string) $row->customer_key, (string) config('app.key'));
                $row->segment = (int) $row->has_prior_purchase > 0 ? 'returning' : 'new';
                unset($row->customer_key);
                unset($row->has_prior_purchase);

                return $row;
            });
        if (isset($data['customer_group'])) {
            $customerRepeat = $customerRepeat->where('segment', $data['customer_group'])->values();
            $allowedCustomerRefs = $customerRepeat->pluck('customer_ref')->flip();
            $topCustomers = $topCustomers->filter(fn ($row) => $allowedCustomerRefs->has($row->customer_ref))->values();
        }
        $customerLocations = $sales($from, $to)->selectRaw("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.province')), 'Không rõ') as province")
            ->selectRaw('COUNT(*) as order_count')->groupBy('province')->orderByDesc('order_count')->get();
        $inventoryStatus = DB::table('inventories')->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')->join('products', 'products.id', '=', 'product_variants.product_id')
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->selectRaw('COALESCE(SUM(CASE WHEN inventories.quantity - inventories.reserved <= 0 THEN 1 ELSE 0 END), 0) as out_count, COALESCE(SUM(CASE WHEN inventories.quantity - inventories.reserved > 0 AND inventories.quantity - inventories.reserved <= inventories.low_stock_threshold THEN 1 ELSE 0 END), 0) as low_count, COALESCE(SUM(CASE WHEN inventories.quantity - inventories.reserved > inventories.low_stock_threshold THEN 1 ELSE 0 END), 0) as available_count')->first();

        $inventoryItems = DB::table('inventories')
            ->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('attribute_values as colors', 'colors.id', '=', 'product_variants.color_value_id')
            ->leftJoin('attribute_values as sizes', 'sizes.id', '=', 'product_variants.size_value_id')
            ->whereNull('products.deleted_at')
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->when(isset($data['threshold']), fn ($query) => $query->whereRaw('GREATEST(inventories.quantity - inventories.reserved, 0) <= ?', [$data['threshold']]), fn ($query) => $query->whereRaw('inventories.quantity - inventories.reserved <= inventories.low_stock_threshold'))
            ->select([
                'products.id as product_id', 'products.name as product_name', 'product_variants.id as variant_id',
                'product_variants.sku', 'colors.value as color', 'sizes.value as size',
                'inventories.quantity', 'inventories.reserved', 'inventories.low_stock_threshold',
            ])
            ->selectRaw('GREATEST(inventories.quantity - inventories.reserved, 0) as available_quantity')
            ->selectRaw("CASE WHEN inventories.quantity - inventories.reserved <= 0 THEN 'out_of_stock' ELSE 'low_stock' END as stock_status")
            ->orderByRaw('GREATEST(inventories.quantity - inventories.reserved, 0) ASC')
            ->orderBy('products.name')->limit(100)->get();
        $stagnantInventory = DB::table('inventories')
            ->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereNull('products.deleted_at')->whereRaw('inventories.quantity > inventories.reserved')
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->whereNotExists(function ($query) use ($from, $to): void {
                $query->selectRaw('1')->from('order_items as sold_items')->join('orders as sold_orders', 'sold_orders.id', '=', 'sold_items.order_id')
                    ->whereColumn('sold_items.variant_id', 'product_variants.id')->where('sold_orders.payment_status', 'paid')
                    ->whereIn('sold_orders.status', ['delivered', 'completed'])->whereBetween('sold_orders.placed_at', [$from, $to]);
            })
            ->select('products.id as product_id', 'products.name as product_name', 'product_variants.sku', 'inventories.quantity', 'inventories.reserved')
            ->selectRaw('GREATEST(inventories.quantity - inventories.reserved, 0) as available_quantity')
            ->selectRaw('(SELECT MAX(sold_orders.placed_at) FROM order_items AS sold_items JOIN orders AS sold_orders ON sold_orders.id = sold_items.order_id WHERE sold_items.variant_id = product_variants.id AND sold_orders.payment_status = \'paid\' AND sold_orders.status IN (\'delivered\', \'completed\')) as last_sold_at')
            ->orderByDesc('available_quantity')->orderBy('products.name')->limit(100)->get();
        $turnoverQuery = DB::table('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.payment_status', 'paid')->whereIn('orders.status', ['delivered', 'completed'])->whereBetween('orders.placed_at', [$from, $to])
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->sum('order_items.quantity');
        $turnoverStockQuery = DB::table('inventories')->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')->join('products', 'products.id', '=', 'product_variants.product_id')
            ->when(isset($data['category_id']), fn ($query) => $query->where('products.category_id', $data['category_id']))
            ->when(isset($data['brand_id']), fn ($query) => $query->where('products.brand_id', $data['brand_id']))
            ->sum(DB::raw('GREATEST(inventories.quantity - inventories.reserved, 0)'));
        $inventoryTurnover = [
            'units_sold' => (int) $turnoverQuery,
            'current_available_quantity' => (int) $turnoverStockQuery,
            'sell_through_rate' => $turnoverQuery + $turnoverStockQuery > 0 ? round($turnoverQuery * 100 / ($turnoverQuery + $turnoverStockQuery), 1) : 0,
        ];

        $filterOptions = [
            'categories' => DB::table('categories')->whereNull('deleted_at')->orderBy('name')->get(['id', 'name']),
            'brands' => DB::table('brands')->orderBy('name')->get(['id', 'name']),
            'payment_methods' => DB::table('orders')->whereBetween('placed_at', [$from, $to])->whereNotNull('payment_method')->distinct()->orderBy('payment_method')->pluck('payment_method'),
            'provinces' => DB::table('orders')->whereBetween('placed_at', [$from, $to])->selectRaw("DISTINCT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(shipping_address, '$.province')), 'Không rõ') as province")->orderBy('province')->pluck('province'),
            'coupon_codes' => DB::table('coupon_usages')->join('coupons', 'coupons.id', '=', 'coupon_usages.coupon_id')->join('orders', 'orders.id', '=', 'coupon_usages.order_id')->whereBetween('orders.placed_at', [$from, $to])->distinct()->orderBy('coupons.code')->pluck('coupons.code'),
        ];

        $section = $request->route('report');
        $periodLabel = match ($groupBy) {
            'week' => 'Doanh thu theo tuần',
            'month' => 'Doanh thu theo tháng',
            default => 'Doanh thu theo ngày',
        };
        $reportFields = [
            'revenue' => ['current', 'previous', 'group_by', 'daily', 'coupons', 'payment_methods', 'revenue_categories', 'revenue_brands', 'filters'],
            'orders' => ['order_statuses', 'order_totals', 'order_locations', 'filters'],
            'products' => ['products', 'slow_products', 'product_performance', 'revenue_categories', 'revenue_brands', 'filters'],
            'customers' => ['new_customers', 'new_customers_timeline', 'top_customers', 'customer_repeat', 'customer_locations', 'filters'],
            'inventory' => ['inventory', 'inventory_status', 'inventory_items', 'stagnant_inventory', 'inventory_turnover', 'filters'],
            'coupons' => ['coupons', 'filters'],
        ];

        if ($request->boolean('export') && $section) {
            $csvRows = match ($section) {
                'products' => array_merge(
                    $productPerformance->map(fn ($row) => ['Hiệu suất sản phẩm', $row->product_name, $row->view_count, $row->sold_count])->all(),
                    $products->map(fn ($row) => ['Sản phẩm bán chạy', $row->product_name, $row->units_sold, $row->revenue])->all(),
                    $revenueCategories->map(fn ($row) => ['Doanh thu theo danh mục', $row->category_name, $row->units_sold, $row->revenue])->all(),
                    $revenueBrands->map(fn ($row) => ['Doanh thu theo thương hiệu', $row->brand_name, $row->units_sold, $row->revenue])->all(),
                    $slowProducts->map(fn ($row) => ['Chưa bán trong kỳ', $row->product_name, $row->view_count, $row->sold_count])->all(),
                ),
                'customers' => array_merge(
                    [['Khách hàng mới', 'Trong kỳ', $customers, '']],
                    $newCustomersTimeline->map(fn ($row) => ['Khách mới theo ngày', $row->date, $row->customers, ''])->all(),
                    $customerRepeat->map(fn ($row) => [$row->segment === 'returning' ? 'Khách quay lại' : 'Khách mua lần đầu', $row->customer_name, $row->order_count, $row->segment])->all(),
                    $customerLocations->map(fn ($row) => ['Đơn theo tỉnh/thành', $row->province, $row->order_count, ''])->all(),
                    $topCustomers->map(fn ($row) => ['Khách chi tiêu cao', $row->customer_name, $row->order_count, $row->spent])->all(),
                ),
                'inventory' => array_merge(
                    [['Tồn kho', 'Tất cả biến thể', $inventory->total_quantity, $inventory->retail_value]],
                    [['Tỷ lệ bán hết ước tính', 'Đã bán / (đã bán + tồn khả dụng)', $inventoryTurnover['sell_through_rate'].'%', '']],
                    $inventoryItems->map(fn ($row) => [$row->stock_status === 'out_of_stock' ? 'Hết hàng' : 'Sắp hết', $row->product_name.' / '.$row->sku, $row->available_quantity, $row->low_stock_threshold])->all(),
                    $stagnantInventory->map(fn ($row) => ['Tồn lâu không bán', $row->product_name.' / '.$row->sku, $row->available_quantity, $row->last_sold_at])->all(),
                ),
                'orders' => array_merge(
                    [['Tổng hợp', 'Tổng đơn', $orderTotals->order_count, ''], ['Tổng hợp', 'Tỷ lệ hủy / trả (%)', $orderTotals->order_count > 0 ? round($orderTotals->cancelled_or_returned * 100 / $orderTotals->order_count, 1) : 0, ''], ['Tổng hợp', 'Thời gian xử lý trung bình (phút)', round((float) ($orderTotals->avg_processing_minutes ?? 0)), '']],
                    $orderStatuses->map(fn ($row) => ['Đơn theo trạng thái', $row->status, $row->order_count, ''])->all(),
                    $orderLocations->map(fn ($row) => ['Đơn theo tỉnh/thành', $row->province, $row->order_count, ''])->all(),
                ),
                'coupons' => $coupons->map(fn ($row) => ['Mã giảm giá', $row->code, $row->usage_count, $row->discount_total, $row->revenue])->all(),
                default => array_merge(
                    $daily->map(fn ($row) => [$periodLabel, $row->date, $row->orders, $row->revenue, $row->discount_total, $row->shipping_total])->all(),
                    $paymentMethods->map(fn ($row) => ['Doanh thu theo phương thức', $row->payment_method, $row->order_count, $row->revenue])->all(),
                    $revenueCategories->map(fn ($row) => ['Doanh thu theo danh mục', $row->category_name, $row->units_sold, $row->revenue])->all(),
                    $revenueBrands->map(fn ($row) => ['Doanh thu theo thương hiệu', $row->brand_name, $row->units_sold, $row->revenue])->all(),
                    $coupons->map(fn ($row) => ['Mã giảm giá', $row->code, $row->usage_count, $row->discount_total])->all(),
                ),
            };

            return response()->streamDownload(function () use ($csvRows): void {
                $handle = fopen('php://output', 'wb');
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, ['Nhóm', 'Tên', 'Số lượng', 'Doanh thu (VND)', 'Đã giảm (VND)', 'Phí giao hàng (VND)']);
                foreach ($csvRows as $row) {
                    fputcsv($handle, $row);
                }
                fclose($handle);
            }, 'report-'.$section.'-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
        }

        if ($request->boolean('export')) {
            return response()->streamDownload(function () use ($daily, $products): void {
                $handle = fopen('php://output', 'wb');
                fputcsv($handle, ['Nhóm', 'Tên', 'Số lượng đơn vị', 'Doanh thu (VND)']);
                foreach ($daily as $row) {
                    fputcsv($handle, ['Ngày', $row->date, $row->orders, $row->revenue]);
                }
                foreach ($products as $row) {
                    fputcsv($handle, ['Sản phẩm', $row->product_name, $row->units_sold, $row->revenue]);
                }
                fclose($handle);
            }, 'report-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
        }

        $reportData = [
            'current' => ['order_count' => (int) $current->order_count, 'revenue' => (int) $current->revenue, 'discount_total' => (int) $current->discount_total, 'shipping_total' => (int) $current->shipping_total],
            'previous' => ['order_count' => (int) $previous->order_count, 'revenue' => (int) $previous->revenue, 'discount_total' => (int) $previous->discount_total, 'shipping_total' => (int) $previous->shipping_total],
            'group_by' => $groupBy, 'daily' => $daily, 'products' => $products, 'slow_products' => $slowProducts,
            'inventory' => [
                'variants' => (int) $inventory->variants,
                'retail_value' => (int) $inventory->retail_value,
                'total_quantity' => (int) $inventory->total_quantity,
                'total_available_quantity' => (int) $inventory->total_available_quantity,
                'low_stock_count' => (int) $inventory->low_stock_count,
            ],
            'new_customers' => $customers, 'new_customers_timeline' => $newCustomersTimeline,
            'coupons' => $coupons, 'payment_methods' => $paymentMethods,
            'order_statuses' => $orderStatuses,
            'order_totals' => [
                'order_count' => (int) ($orderTotals->order_count ?? 0),
                'cancelled_or_returned' => (int) ($orderTotals->cancelled_or_returned ?? 0),
                'cancellation_return_rate' => (int) ($orderTotals->order_count ?? 0) > 0 ? round((int) $orderTotals->cancelled_or_returned * 100 / (int) $orderTotals->order_count, 1) : 0,
                'avg_processing_minutes' => (int) round((float) ($orderTotals->avg_processing_minutes ?? 0)),
            ],
            'order_locations' => $orderLocations,
            'top_customers' => $topCustomers,
            'inventory_status' => [
                'out_count' => (int) $inventoryStatus->out_count,
                'low_count' => (int) $inventoryStatus->low_count,
                'available_count' => (int) $inventoryStatus->available_count,
            ],
            'revenue_categories' => $revenueCategories, 'revenue_brands' => $revenueBrands, 'product_performance' => $productPerformance,
            'customer_repeat' => $customerRepeat,
            'customer_locations' => $customerLocations,
            'filters' => $filterOptions,
            'inventory_items' => $inventoryItems->map(fn ($row) => [
                'product_id' => (int) $row->product_id,
                'product_name' => $row->product_name,
                'variant_id' => (int) $row->variant_id,
                'sku' => $row->sku,
                'color' => $row->color,
                'size' => $row->size,
                'quantity' => (int) $row->quantity,
                'reserved' => (int) $row->reserved,
                'available_quantity' => (int) $row->available_quantity,
                'low_stock_threshold' => (int) $row->low_stock_threshold,
                'stock_status' => $row->stock_status,
            ])->values(),
            'stagnant_inventory' => $stagnantInventory,
            'inventory_turnover' => $inventoryTurnover,
        ];

        if (isset($reportFields[$section])) {
            $reportData = array_intersect_key($reportData, array_flip($reportFields[$section]));
        }

        return response()->json(['data' => $reportData]);
    }
}
