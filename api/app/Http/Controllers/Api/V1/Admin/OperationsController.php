<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListOperationsRequest;
use App\Models\Role;
use App\Support\PaymentPayloadSanitizer;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OperationsController extends Controller
{
    public function showPayment(int $payment): JsonResponse
    {
        $row = DB::table('payments')->join('orders', 'orders.id', '=', 'payments.order_id')
            ->where('payments.id', $payment)
            ->select('payments.*', 'orders.code as order_code', 'orders.grand_total', 'orders.payment_method', 'orders.payment_status as order_payment_status', 'orders.status as order_status', 'orders.customer_name', 'orders.customer_email', 'orders.customer_phone')
            ->selectSub(DB::table('payment_refunds')->selectRaw('COALESCE(SUM(amount), 0)')->whereColumn('payment_refunds.payment_id', 'payments.id'), 'refunded_amount')
            ->first();
        abort_if(! $row, 404);
        $row->raw_payload = PaymentPayloadSanitizer::sanitize($row->raw_payload);
        $row->refundable_amount = max(0, (int) $row->amount - (int) $row->refunded_amount);
        $row->refunds = DB::table('payment_refunds')->leftJoin('users as actors', 'actors.id', '=', 'payment_refunds.recorded_by')
            ->where('payment_refunds.payment_id', $payment)->orderBy('payment_refunds.created_at')->orderBy('payment_refunds.id')
            ->get(['payment_refunds.id', 'payment_refunds.amount', 'payment_refunds.reason', 'payment_refunds.created_at', 'actors.name as recorded_by_name']);

        return response()->json(['data' => $row]);
    }

    public function showCart(int $cart): JsonResponse
    {
        $cartRow = DB::table('carts')->leftJoin('users', 'users.id', '=', 'carts.user_id')
            ->where('carts.id', $cart)->where('carts.expires_at', '>', now())
            ->select('carts.id', 'carts.user_id', 'users.name as customer_name', 'users.email as customer_email', 'users.phone as customer_phone', 'carts.updated_at', 'carts.expires_at')
            ->first();
        abort_unless($cartRow, 404);

        $items = DB::table('cart_items')->join('product_variants', 'product_variants.id', '=', 'cart_items.variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('inventories', 'inventories.variant_id', '=', 'product_variants.id')
            ->leftJoin('attribute_values as colors', 'colors.id', '=', 'product_variants.color_value_id')
            ->leftJoin('attribute_values as sizes', 'sizes.id', '=', 'product_variants.size_value_id')
            ->where('cart_items.cart_id', $cart)
            ->orderBy('cart_items.id')
            ->get(['cart_items.id', 'cart_items.quantity', 'cart_items.unit_price_snapshot', 'products.id as product_id', 'products.name as product_name', 'products.slug as product_slug', 'product_variants.sku', 'colors.value as color', 'sizes.value as size', 'inventories.quantity as stock_quantity'])
            ->map(function (object $item): object {
                $item->quantity = (int) $item->quantity;
                $item->unit_price_snapshot = (int) $item->unit_price_snapshot;
                $item->line_total = $item->quantity * $item->unit_price_snapshot;
                $item->stock_quantity = (int) ($item->stock_quantity ?? 0);

                return $item;
            });

        return response()->json(['data' => [
            'id' => (int) $cartRow->id,
            'customer' => $cartRow->user_id === null ? null : [
                'id' => (int) $cartRow->user_id, 'name' => $cartRow->customer_name,
                'email' => $cartRow->customer_email, 'phone' => $cartRow->customer_phone,
            ],
            'updated_at' => $cartRow->updated_at,
            'expires_at' => $cartRow->expires_at,
            'item_count' => (int) $items->sum('quantity'),
            'cart_value' => (int) $items->sum('line_total'),
            'items' => $items,
        ]]);
    }

    public function index(ListOperationsRequest $request, string $section): JsonResponse
    {
        $filters = $request->validated();
        $query = match ($section) {
            'payments' => DB::table('payments')->join('orders', 'orders.id', '=', 'payments.order_id')
                ->select('payments.id', 'payments.order_id', 'orders.code as order_code', 'orders.customer_name', 'orders.customer_email', 'orders.customer_phone', 'payments.method', 'payments.amount', 'payments.status', 'payments.transaction_ref', 'payments.raw_payload', 'payments.paid_at', 'payments.created_at')
                ->selectSub(DB::table('payment_refunds')->selectRaw('COALESCE(SUM(amount), 0)')->whereColumn('payment_refunds.payment_id', 'payments.id'), 'refunded_amount'),
            'shipments' => DB::table('shipments')->join('orders', 'orders.id', '=', 'shipments.order_id')
                ->select('shipments.id', 'shipments.order_id', 'orders.code as order_code', 'orders.customer_name', 'orders.customer_phone', 'orders.shipping_address', 'shipments.carrier', 'shipments.tracking_code', 'shipments.status', 'shipments.shipped_at', 'shipments.delivered_at', 'shipments.created_at'),
            'movements' => DB::table('inventory_movements')->join('product_variants', 'product_variants.id', '=', 'inventory_movements.variant_id')
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->leftJoin('users', 'users.id', '=', 'inventory_movements.created_by')
                ->select('inventory_movements.id', 'inventory_movements.variant_id', 'inventory_movements.type', 'inventory_movements.quantity_change', 'inventory_movements.stock_after', 'inventory_movements.reference_type', 'inventory_movements.reference_id', 'inventory_movements.note', 'inventory_movements.created_at', 'product_variants.sku', 'products.name as product_name', 'users.name as creator_name'),
            'customers' => DB::table('users')->join('role_user', 'role_user.user_id', '=', 'users.id')->join('roles', 'roles.id', '=', 'role_user.role_id')
                ->leftJoin('orders', 'orders.user_id', '=', 'users.id')->where('roles.name', 'customer')->whereNull('users.deleted_at')
                ->groupBy('users.id', 'users.name', 'users.email', 'users.phone', 'users.status', 'users.created_at')
                ->select('users.id', 'users.name', 'users.email', 'users.phone', 'users.status', 'users.created_at')
                ->selectRaw('COUNT(DISTINCT orders.id) as order_count')
                ->selectRaw("COALESCE(SUM(CASE WHEN orders.payment_status = 'paid' THEN GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0) ELSE 0 END), 0) as total_spent"),
            'carts' => DB::table('carts')->leftJoin('users', 'users.id', '=', 'carts.user_id')->join('cart_items', 'cart_items.cart_id', '=', 'carts.id')
                ->groupBy('carts.id', 'carts.user_id', 'carts.updated_at', 'carts.expires_at', 'users.id', 'users.name', 'users.email', 'users.phone')
                ->select('carts.id', 'carts.user_id', 'users.id as customer_id', 'users.name as customer_name', 'users.email as customer_email', 'users.phone as customer_phone', 'carts.updated_at as created_at', 'carts.expires_at')
                ->selectRaw('SUM(cart_items.quantity) as item_count')
                ->selectRaw('SUM(cart_items.quantity * cart_items.unit_price_snapshot) as cart_value'),
            'wishlist' => ($filters['view'] ?? 'products') === 'customers'
                ? DB::table('wishlists')->join('users', 'users.id', '=', 'wishlists.user_id')
                    ->join('role_user', 'role_user.user_id', '=', 'users.id')->join('roles', 'roles.id', '=', 'role_user.role_id')
                    ->where('roles.name', 'customer')->whereNull('users.deleted_at')
                    ->groupBy('users.id', 'users.name', 'users.email')
                    ->select('users.id', 'users.name as customer_name', 'users.email')
                    ->selectRaw('COUNT(*) as wishlist_count')->selectRaw('MAX(wishlists.created_at) as created_at')
                : DB::table('wishlists')->join('products', 'products.id', '=', 'wishlists.product_id')->leftJoin('categories', 'categories.id', '=', 'products.category_id')
                    ->groupBy('products.id', 'products.name', 'products.slug', 'products.category_id', 'categories.name')
                    ->select('products.id', 'products.name', 'products.slug', 'products.category_id', 'categories.name as category_name')
                    ->selectRaw('COUNT(*) as wishlist_count')->selectRaw('MAX(wishlists.created_at) as created_at')
                    ->selectRaw('(SELECT COALESCE(SUM(inventories.quantity), 0) FROM product_variants INNER JOIN inventories ON inventories.variant_id = product_variants.id WHERE product_variants.product_id = products.id) as stock_quantity'),
            'staff' => DB::table('users')->join('role_user', 'role_user.user_id', '=', 'users.id')->join('roles', 'roles.id', '=', 'role_user.role_id')
                ->whereIn('roles.name', Role::ADMIN_NAMES)->whereNull('users.deleted_at')
                ->select('users.id', 'users.name', 'users.email', 'users.phone', 'users.status', 'users.last_login_at', 'users.created_at', 'roles.name as role'),
            default => abort(404),
        };

        if ($section === 'carts') {
            $inactiveHours = $filters['inactive_hours'] ?? 3;
            $query->where('carts.updated_at', '<=', now()->subHours($inactiveHours))
                ->where('carts.expires_at', '>', now())
                ->when(($filters['customer_type'] ?? null) === 'registered', fn (Builder $q) => $q->whereNotNull('carts.user_id'))
                ->when(($filters['customer_type'] ?? null) === 'guest', fn (Builder $q) => $q->whereNull('carts.user_id'))
                ->when(isset($filters['min_value']), fn (Builder $q) => $q->havingRaw('SUM(cart_items.quantity * cart_items.unit_price_snapshot) >= ?', [$filters['min_value']]))
                ->when(isset($filters['max_value']), fn (Builder $q) => $q->havingRaw('SUM(cart_items.quantity * cart_items.unit_price_snapshot) <= ?', [$filters['max_value']]));
        }
        if ($section === 'wishlist' && ($filters['view'] ?? 'products') === 'products' && isset($filters['category_id'])) {
            $query->where('products.category_id', $filters['category_id']);
        }
        $this->applyFilters($query, $section, $filters);
        $paymentSummary = null;
        $paymentStatusCounts = null;
        $shipmentStatusCounts = null;
        if ($section === 'shipments') {
            $countFilters = $filters;
            unset($countFilters['status'], $countFilters['page'], $countFilters['per_page'], $countFilters['sort']);
            $statusExpression = "CASE WHEN shipments.status IN ('picked_up', 'in_transit') THEN 'in_transit' WHEN shipments.status IN ('failed', 'returned') THEN 'failed' WHEN shipments.status = 'pending' THEN 'waiting' ELSE shipments.status END";
            $countQuery = DB::table('shipments')->join('orders', 'orders.id', '=', 'shipments.order_id')
                ->selectRaw($statusExpression.' as status_key')->selectRaw('COUNT(*) as count')->groupBy('status_key');
            $this->applyFilters($countQuery, $section, $countFilters);
            $shipmentStatusCounts = array_replace(['waiting' => 0, 'in_transit' => 0, 'delivered' => 0, 'failed' => 0],
                $countQuery->pluck('count', 'status_key')->map(static fn ($value): int => (int) $value)->all());
            $shipmentStatusCounts['all'] = array_sum($shipmentStatusCounts);
        }
        if ($section === 'payments') {
            $summaryQuery = DB::table('payments')->join('orders', 'orders.id', '=', 'payments.order_id')
                ->selectRaw("SUM(CASE WHEN payments.status IN ('success', 'paid') AND NOT EXISTS (SELECT 1 FROM payment_refunds WHERE payment_refunds.payment_id = payments.id) THEN 1 ELSE 0 END) as success_count")
                ->selectRaw("COALESCE(SUM(CASE WHEN payments.status IN ('success', 'paid') AND NOT EXISTS (SELECT 1 FROM payment_refunds WHERE payment_refunds.payment_id = payments.id) THEN payments.amount ELSE 0 END), 0) as success_amount")
                ->selectRaw("SUM(CASE WHEN payments.status = 'pending' THEN 1 ELSE 0 END) as pending_count")
                ->selectRaw("COALESCE(SUM(CASE WHEN payments.status = 'pending' THEN payments.amount ELSE 0 END), 0) as pending_amount")
                ->selectRaw("SUM(CASE WHEN payments.status = 'failed' THEN 1 ELSE 0 END) as failed_count")
                ->selectRaw("COALESCE(SUM(CASE WHEN payments.status = 'failed' THEN payments.amount ELSE 0 END), 0) as failed_amount")
                ->selectRaw('0 as refunded_count')->selectRaw('0 as refunded_amount');
            $this->applyFilters($summaryQuery, $section, $filters);
            $paymentSummary = collect((array) $summaryQuery->first())
                ->map(static fn ($value): int => (int) $value)
                ->all();
            $refundSummaryQuery = DB::table('payments')->join('orders', 'orders.id', '=', 'payments.order_id')
                ->where(fn (Builder $query) => $query->where('payments.status', 'refunded')
                    ->orWhereExists(fn (Builder $refunds) => $refunds->selectRaw('1')->from('payment_refunds')->whereColumn('payment_refunds.payment_id', 'payments.id')))
                ->selectRaw('COUNT(DISTINCT payments.id) as refunded_count')
                ->selectRaw("COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM payment_refunds WHERE payment_refunds.payment_id = payments.id) THEN (SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.payment_id = payments.id) WHEN payments.status = 'refunded' THEN payments.amount ELSE 0 END), 0) as refunded_amount");
            $this->applyFilters($refundSummaryQuery, $section, $filters);
            $refundSummary = $refundSummaryQuery->first();
            $paymentSummary['refunded_count'] = (int) ($refundSummary->refunded_count ?? 0);
            $paymentSummary['refunded_amount'] = (int) ($refundSummary->refunded_amount ?? 0);

            $countFilters = $filters;
            unset($countFilters['status'], $countFilters['page'], $countFilters['per_page'], $countFilters['sort']);
            $statusExpression = "CASE WHEN payments.status = 'refunded' OR EXISTS (SELECT 1 FROM payment_refunds WHERE payment_refunds.payment_id = payments.id) THEN 'refunded' WHEN payments.status IN ('success', 'paid') THEN 'success' ELSE payments.status END";
            $countQuery = DB::table('payments')->join('orders', 'orders.id', '=', 'payments.order_id')
                ->selectRaw($statusExpression.' as status_key')->selectRaw('COUNT(*) as count')->groupBy('status_key');
            $this->applyFilters($countQuery, $section, $countFilters);
            $paymentStatusCounts = $countQuery->pluck('count', 'status_key')->map(static fn ($value): int => (int) $value)->all();
            $paymentStatusCounts['all'] = array_sum($paymentStatusCounts);
        }
        $sort = $filters['sort'] ?? match ($section) {
            'wishlist' => '-wishlist_count',
            default => '-created_at',
        };
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $columns = $this->sortableColumns($section, $filters);
        if (! isset($columns[$field])) {
            throw ValidationException::withMessages(['sort' => 'Trường sắp xếp không được hỗ trợ cho danh sách này.']);
        }
        $rows = $query->orderBy($columns[$field], $descending ? 'desc' : 'asc')
            ->orderBy($this->idColumn($section, $filters), 'desc')
            ->paginate($filters['per_page'] ?? 20);

        $items = collect($rows->items())->map(function (object $row) use ($section): object {
            if ($section === 'payments') {
                if (property_exists($row, 'raw_payload')) {
                    $row->raw_payload = PaymentPayloadSanitizer::sanitize($row->raw_payload);
                }
                $row->refunded_amount = (int) ($row->refunded_amount ?? 0);
                $row->refundable_amount = max(0, (int) $row->amount - $row->refunded_amount);
            }

            return $row;
        })->values();

        $response = ['data' => $items, 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]];
        if ($paymentSummary !== null) {
            $response['summary'] = $paymentSummary;
            $response['status_counts'] = $paymentStatusCounts;
        }
        if ($shipmentStatusCounts !== null) {
            $response['status_counts'] = $shipmentStatusCounts;
        }
        if ($section === 'wishlist' && ($filters['view'] ?? 'products') === 'products') {
            $response['filters'] = ['categories' => DB::table('categories')->orderBy('name')->get(['id', 'name'])];
        }

        return response()->json($response);
    }

    private function applyFilters(Builder $query, string $section, array $filters): void
    {
        $column = $this->sortColumn($section);
        if ($section === 'payments') {
            $query->when(isset($filters['from']), fn (Builder $q) => $q->whereDate(DB::raw('COALESCE(payments.paid_at, payments.created_at)'), '>=', $filters['from']))
                ->when(isset($filters['to']), fn (Builder $q) => $q->whereDate(DB::raw('COALESCE(payments.paid_at, payments.created_at)'), '<=', $filters['to']))
                ->when(isset($filters['min_amount']), fn (Builder $q) => $q->where('payments.amount', '>=', $filters['min_amount']))
                ->when(isset($filters['max_amount']), fn (Builder $q) => $q->where('payments.amount', '<=', $filters['max_amount']));
        } else {
            $query->when(isset($filters['from']), fn (Builder $q) => $q->whereDate($column, '>=', $filters['from']))
                ->when(isset($filters['to']), fn (Builder $q) => $q->whereDate($column, '<=', $filters['to']));
        }
        if (isset($filters['status']) && in_array($section, ['payments', 'shipments', 'customers', 'staff', 'movements'], true)) {
            if ($section === 'payments' && $filters['status'] === 'refunded') {
                $query->where(fn (Builder $q) => $q->where('payments.status', 'refunded')->orWhereExists(fn (Builder $refunds) => $refunds->selectRaw('1')->from('payment_refunds')->whereColumn('payment_refunds.payment_id', 'payments.id')));
            } elseif ($section === 'payments' && $filters['status'] === 'success') {
                $query->whereIn('payments.status', ['success', 'paid'])->whereNotExists(fn (Builder $refunds) => $refunds->selectRaw('1')->from('payment_refunds')->whereColumn('payment_refunds.payment_id', 'payments.id'));
            } elseif ($section === 'payments' && ! in_array($filters['status'], ['pending', 'failed'], true)) {
                $query->whereRaw('1 = 0');
            } elseif ($section === 'shipments' && $filters['status'] === 'in_transit') {
                $query->whereIn('shipments.status', ['picked_up', 'in_transit']);
            } elseif ($section === 'shipments' && $filters['status'] === 'failed') {
                $query->whereIn('shipments.status', ['failed', 'returned']);
            } elseif ($section === 'shipments' && $filters['status'] === 'waiting') {
                $query->where('shipments.status', 'pending');
            } else {
                $statusColumn = match ($section) {
                    'customers', 'staff' => 'users.status',
                    'movements' => 'inventory_movements.type',
                    default => $section.'.status',
                };
                $query->where($statusColumn, $filters['status']);
            }
        }
        if ($section === 'payments' && isset($filters['method'])) {
            $query->where('payments.method', $filters['method']);
        }
        if ($section === 'shipments' && isset($filters['carrier'])) {
            $query->where('shipments.carrier', 'like', '%'.$filters['carrier'].'%');
        }
        if (! isset($filters['q'])) {
            return;
        }
        $search = '%'.$filters['q'].'%';
        match ($section) {
            'payments' => $query->where(fn (Builder $q) => $q->where('orders.code', 'like', $search)->orWhere('payments.transaction_ref', 'like', $search)),
            'shipments' => $query->where(fn (Builder $q) => $q->where('orders.code', 'like', $search)->orWhere('orders.customer_name', 'like', $search)->orWhere('orders.customer_phone', 'like', $search)->orWhere('shipments.tracking_code', 'like', $search)),
            'movements' => $query->where(fn (Builder $q) => $q->where('products.name', 'like', $search)->orWhere('product_variants.sku', 'like', $search)->orWhere('users.name', 'like', $search)->orWhere('inventory_movements.note', 'like', $search)),
            'customers', 'staff' => $query->where(fn (Builder $q) => $q->where('users.name', 'like', $search)->orWhere('users.email', 'like', $search)->orWhere('users.phone', 'like', $search)),
            'carts' => $query->where(fn (Builder $q) => $q->where('users.name', 'like', $search)->orWhere('users.email', 'like', $search)),
            'wishlist' => ($filters['view'] ?? 'products') === 'customers'
                ? $query->where(fn (Builder $q) => $q->where('users.name', 'like', $search)->orWhere('users.email', 'like', $search))
                : $query->where('products.name', 'like', $search),
        };
    }

    private function sortColumn(string $section): string
    {
        return match ($section) {
            'customers', 'staff' => 'users.created_at',
            'payments', 'shipments' => $section.'.created_at',
            'movements' => 'inventory_movements.created_at',
            'carts' => 'carts.updated_at',
            'wishlist' => 'wishlists.created_at',
            default => abort(404),
        };
    }

    /** @return array<string, string> */
    private function sortableColumns(string $section, array $filters = []): array
    {
        return match ($section) {
            'payments' => [
                'order_code' => 'orders.code', 'transaction_ref' => 'payments.transaction_ref', 'method' => 'payments.method', 'amount' => 'payments.amount',
                'status' => 'payments.status', 'paid_at' => 'payments.paid_at', 'created_at' => 'payments.created_at',
            ],
            'shipments' => [
                'order_code' => 'orders.code', 'carrier' => 'shipments.carrier', 'tracking_code' => 'shipments.tracking_code',
                'status' => 'shipments.status', 'shipped_at' => 'shipments.shipped_at', 'delivered_at' => 'shipments.delivered_at',
                'created_at' => 'shipments.created_at',
            ],
            'movements' => [
                'created_at' => 'inventory_movements.created_at', 'sku' => 'product_variants.sku', 'type' => 'inventory_movements.type',
                'quantity_change' => 'inventory_movements.quantity_change', 'stock_after' => 'inventory_movements.stock_after',
                'product_name' => 'products.name', 'creator_name' => 'users.name',
            ],
            'customers' => [
                'name' => 'users.name', 'email' => 'users.email', 'status' => 'users.status', 'created_at' => 'users.created_at',
                'order_count' => 'order_count', 'total_spent' => 'total_spent',
            ],
            'carts' => [
                'id' => 'carts.id', 'customer_name' => 'users.name', 'item_count' => 'item_count',
                'cart_value' => 'cart_value', 'created_at' => 'carts.updated_at',
            ],
            'wishlist' => ($filters['view'] ?? 'products') === 'customers'
                ? ['customer_name' => 'users.name', 'email' => 'users.email', 'wishlist_count' => 'wishlist_count', 'created_at' => 'created_at']
                : ['name' => 'products.name', 'slug' => 'products.slug', 'wishlist_count' => 'wishlist_count', 'stock_quantity' => 'stock_quantity', 'created_at' => 'created_at'],
            'staff' => [
                'name' => 'users.name', 'email' => 'users.email', 'role' => 'roles.name', 'status' => 'users.status',
                'last_login_at' => 'users.last_login_at', 'created_at' => 'users.created_at',
            ],
            default => abort(404),
        };
    }

    private function idColumn(string $section, array $filters = []): string
    {
        return match ($section) {
            'payments' => 'payments.id',
            'shipments' => 'shipments.id',
            'movements' => 'inventory_movements.id',
            'customers', 'staff' => 'users.id',
            'carts' => 'carts.id',
            'wishlist' => ($filters['view'] ?? 'products') === 'customers' ? 'users.id' : 'products.id',
            default => abort(404),
        };
    }
}
