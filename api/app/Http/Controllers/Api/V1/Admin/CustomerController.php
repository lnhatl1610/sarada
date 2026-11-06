<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\CreateCustomerNoteRequest;
use App\Http\Requests\Api\V1\Admin\ExportAdminCustomersRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminCustomersRequest;
use App\Http\Requests\Api\V1\Admin\UpdateCustomerRequest;
use App\Models\User;
use App\Modules\AdminAccess\Actions\AddCustomerNoteAction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerController extends Controller
{
    public function index(ListAdminCustomersRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumns = [
            'name' => 'users.name', 'email' => 'users.email', 'orders_count' => 'orders_count',
            'delivered_total' => 'delivered_total', 'status' => 'users.status', 'created_at' => 'users.created_at',
            'last_order_at' => 'last_order_at',
        ];
        $countFilters = $filters;
        unset($countFilters['status'], $countFilters['page'], $countFilters['per_page'], $countFilters['sort']);
        $filteredCustomers = $this->filteredCustomersQuery($countFilters);
        $statusCounts = DB::query()->fromSub($filteredCustomers, 'filtered_customers')
            ->select('status')->selectRaw('COUNT(*) as customer_count')->groupBy('status')
            ->pluck('customer_count', 'status')->map(static fn ($count): int => (int) $count)->all();
        $statusCounts = array_replace(['active' => 0, 'blocked' => 0], $statusCounts);
        $statusCounts['all'] = array_sum(array_diff_key($statusCounts, ['all' => true]));
        $customers = (clone $filteredCustomers)
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('users.id')->paginate($filters['per_page'] ?? 25);

        return response()->json(['data' => $customers->getCollection()->map(fn (User $customer): array => [
            'id' => $customer->id, 'name' => $customer->name, 'email' => $customer->email, 'phone' => $customer->phone,
            'avatar' => $customer->avatar, 'email_verified' => $customer->email_verified_at !== null,
            'status' => $customer->status, 'order_count' => (int) $customer->orders_count,
            'total_spent' => (int) ($customer->delivered_total ?? 0), 'created_at' => $customer->created_at,
            'last_order_at' => $customer->last_order_at,
        ]), 'meta' => ['current_page' => $customers->currentPage(), 'last_page' => $customers->lastPage(), 'per_page' => $customers->perPage(), 'total' => $customers->total()], 'status_counts' => $statusCounts]);
    }

    private function filteredCustomersQuery(array $filters): Builder
    {
        $netOrderAmount = 'GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0)';

        return User::query()->whereHas('roles', fn ($query) => $query->where('name', 'customer'))
            ->withCount('orders')
            ->addSelect(['delivered_total' => DB::table('orders')->whereColumn('orders.user_id', 'users.id')->whereIn('orders.status', ['delivered', 'completed'])->selectRaw("COALESCE(SUM({$netOrderAmount}), 0)")])
            ->addSelect(['last_order_at' => DB::table('orders')->whereColumn('orders.user_id', 'users.id')->selectRaw('MAX(placed_at)')])
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search->where('name', 'like', '%'.$filters['q'].'%')->orWhere('email', 'like', '%'.$filters['q'].'%')->orWhere('phone', 'like', '%'.$filters['q'].'%')))
            ->when(isset($filters['from']), fn ($query) => $query->whereDate('created_at', '>=', $filters['from']))
            ->when(isset($filters['to']), fn ($query) => $query->whereDate('created_at', '<=', $filters['to']))
            ->when(isset($filters['email_verified']), fn ($query) => $filters['email_verified'] ? $query->whereNotNull('email_verified_at') : $query->whereNull('email_verified_at'))
            ->when(isset($filters['min_spent']), fn ($query) => $query->having('delivered_total', '>=', $filters['min_spent']))
            ->when(isset($filters['max_spent']), fn ($query) => $query->having('delivered_total', '<=', $filters['max_spent']))
            ->when(isset($filters['min_orders']), fn ($query) => $query->having('orders_count', '>=', $filters['min_orders']))
            ->when(isset($filters['max_orders']), fn ($query) => $query->having('orders_count', '<=', $filters['max_orders']))
            ->when(isset($filters['last_order_from']), fn ($query) => $query->having('last_order_at', '>=', $filters['last_order_from'].' 00:00:00'))
            ->when(isset($filters['last_order_to']), fn ($query) => $query->having('last_order_at', '<=', $filters['last_order_to'].' 23:59:59'))
            ->when(isset($filters['province_code']), fn ($query) => $query->whereHas('addresses', fn ($address) => $address->where('province_code', $filters['province_code'])))
            ->when(isset($filters['gender']), fn ($query) => $query->where('gender', $filters['gender']));
    }

    public function export(ExportAdminCustomersRequest $request): StreamedResponse
    {
        $filters = $request->validated();
        $netOrderAmount = 'GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0)';
        $customers = User::query()->whereHas('roles', fn ($query) => $query->where('name', 'customer'))
            ->select(['users.id', 'users.name', 'users.email', 'users.phone', 'users.status', 'users.created_at'])
            ->withCount('orders')
            ->addSelect(['delivered_total' => DB::table('orders')->whereColumn('orders.user_id', 'users.id')->whereIn('orders.status', ['delivered', 'completed'])->selectRaw("COALESCE(SUM({$netOrderAmount}), 0)")])
            ->addSelect(['last_order_at' => DB::table('orders')->whereColumn('orders.user_id', 'users.id')->selectRaw('MAX(placed_at)')])
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search->where('name', 'like', '%'.$filters['q'].'%')->orWhere('email', 'like', '%'.$filters['q'].'%')->orWhere('phone', 'like', '%'.$filters['q'].'%')))
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->when(isset($filters['from']), fn ($query) => $query->whereDate('created_at', '>=', $filters['from']))
            ->when(isset($filters['to']), fn ($query) => $query->whereDate('created_at', '<=', $filters['to']))
            ->when(isset($filters['email_verified']), fn ($query) => $filters['email_verified'] ? $query->whereNotNull('email_verified_at') : $query->whereNull('email_verified_at'))
            ->when(isset($filters['min_spent']), fn ($query) => $query->having('delivered_total', '>=', $filters['min_spent']))
            ->when(isset($filters['max_spent']), fn ($query) => $query->having('delivered_total', '<=', $filters['max_spent']))
            ->when(isset($filters['min_orders']), fn ($query) => $query->having('orders_count', '>=', $filters['min_orders']))
            ->when(isset($filters['max_orders']), fn ($query) => $query->having('orders_count', '<=', $filters['max_orders']))
            ->when(isset($filters['last_order_from']), fn ($query) => $query->having('last_order_at', '>=', $filters['last_order_from'].' 00:00:00'))
            ->when(isset($filters['last_order_to']), fn ($query) => $query->having('last_order_at', '<=', $filters['last_order_to'].' 23:59:59'))
            ->when(isset($filters['province_code']), fn ($query) => $query->whereHas('addresses', fn ($address) => $address->where('province_code', $filters['province_code'])))
            ->when(isset($filters['gender']), fn ($query) => $query->where('gender', $filters['gender']))
            ->orderByDesc('created_at')->cursor();

        return response()->streamDownload(function () use ($customers): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, ['ID', 'Họ tên', 'Email', 'Số điện thoại', 'Số đơn', 'Đã chi (VND)', 'Trạng thái', 'Ngày đăng ký', 'Mua gần nhất']);
            foreach ($customers as $customer) {
                fputcsv($handle, [$customer->id, $customer->name, $customer->email, $customer->phone, $customer->orders_count, (int) ($customer->delivered_total ?? 0), $customer->status, $customer->created_at, $customer->last_order_at]);
            }
            fclose($handle);
        }, 'customers-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function show(int $customer): JsonResponse
    {
        $user = $this->customer($customer)->load(['addresses' => fn ($query) => $query->orderByDesc('is_default')->orderBy('id'), 'reviews.product']);
        $orders = DB::table('orders')->where('user_id', $customer)->select('id', 'code', 'grand_total', 'status', 'payment_status', 'placed_at')->orderByDesc('placed_at')->limit(20)->get();
        $netOrderAmount = 'GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0)';
        $orderStats = DB::table('orders')->where('user_id', $customer)
            ->selectRaw("COUNT(*) as order_count, COALESCE(SUM(CASE WHEN status IN (?, ?) THEN {$netOrderAmount} ELSE 0 END), 0) as total_spent, COALESCE(ROUND(AVG(CASE WHEN status IN (?, ?) THEN {$netOrderAmount} END)), 0) as average_order_value", ['delivered', 'completed', 'delivered', 'completed'])
            ->first();
        $lastOrderAt = DB::table('orders')->where('user_id', $customer)->max('placed_at');
        $wishlist = DB::table('wishlists')->join('products', 'products.id', '=', 'wishlists.product_id')
            ->where('wishlists.user_id', $customer)->select('products.id', 'products.name', 'products.slug')->limit(30)->get();
        $cart = DB::table('carts')->leftJoin('cart_items', 'cart_items.cart_id', '=', 'carts.id')
            ->leftJoin('product_variants', 'product_variants.id', '=', 'cart_items.variant_id')
            ->leftJoin('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('attribute_values as colors', 'colors.id', '=', 'product_variants.color_value_id')
            ->leftJoin('attribute_values as sizes', 'sizes.id', '=', 'product_variants.size_value_id')
            ->where('carts.user_id', $customer)
            ->select('cart_items.id', 'products.name as product_name', 'product_variants.sku', 'colors.value as color', 'sizes.value as size', 'cart_items.quantity', 'cart_items.unit_price_snapshot')
            ->orderBy('cart_items.id')->limit(100)->get();
        $cartSummary = DB::table('carts')->leftJoin('cart_items', 'cart_items.cart_id', '=', 'carts.id')
            ->where('carts.user_id', $customer)
            ->selectRaw('COALESCE(SUM(cart_items.quantity), 0) as item_count, COALESCE(SUM(cart_items.quantity * cart_items.unit_price_snapshot), 0) as total_value')
            ->first();
        $notes = DB::table('customer_notes')->leftJoin('users as actors', 'actors.id', '=', 'customer_notes.created_by')
            ->where('customer_notes.customer_id', $customer)
            ->orderByDesc('customer_notes.created_at')->limit(100)
            ->get(['customer_notes.id', 'customer_notes.content', 'customer_notes.created_at', 'actors.id as actor_id', 'actors.name as actor_name']);

        return response()->json(['data' => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone, 'avatar' => $user->avatar,
            'email_verified' => $user->email_verified_at !== null,
            'gender' => $user->gender, 'birthday' => $user->birthday?->format('Y-m-d'), 'status' => $user->status,
            'created_at' => $user->created_at, 'addresses' => $user->addresses, 'orders' => $orders,
            'reviews' => $user->reviews, 'wishlist' => $wishlist,
            'cart' => ['items' => $cart, 'item_count' => (int) $cartSummary->item_count, 'total_value' => (int) $cartSummary->total_value],
            'notes' => $notes,
            'order_count' => (int) $orderStats->order_count,
            'total_spent' => (int) $orderStats->total_spent,
            'average_order_value' => (int) $orderStats->average_order_value,
            'last_order_at' => $lastOrderAt,
        ]]);
    }

    public function storeNote(CreateCustomerNoteRequest $request, int $customer, AddCustomerNoteAction $action): JsonResponse
    {
        $this->customer($customer);
        $note = $action->execute($customer, $request->user(), $request->validated('content'));

        return response()->json(['data' => $note], 201);
    }

    public function update(UpdateCustomerRequest $request, int $customer): JsonResponse
    {
        $user = $this->customer($customer);
        $data = $request->validated();
        DB::transaction(function () use ($user, $data): void {
            $user->update($data);
            if (($data['status'] ?? null) === 'blocked') {
                $user->tokens()->delete();
                DB::table('refresh_tokens')->where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
            }
        });

        return $this->show($customer);
    }

    private function customer(int $id): User
    {
        return User::query()->whereHas('roles', fn ($query) => $query->where('name', 'customer'))->findOrFail($id);
    }
}
