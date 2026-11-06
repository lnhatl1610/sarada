<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListOperationsRequest;
use App\Http\Requests\Api\V1\Admin\ReorderBannersRequest;
use App\Http\Requests\Api\V1\Admin\SaveCampaignRequest;
use App\Http\Resources\CampaignResource;
use App\Models\Banner;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CampaignController extends Controller
{
    public function index(ListOperationsRequest $request, string $kind): JsonResponse
    {
        $filters = $request->validated();
        $model = $this->model($kind);
        $query = $model::query()
            ->when(isset($filters['q']), fn ($query) => $query->where($kind === 'coupons' ? 'code' : 'title', 'like', '%'.$filters['q'].'%'));
        if ($kind === 'coupons') {
            $query->when(isset($filters['campaign_type']), fn ($query) => $query->where('type', $filters['campaign_type']))
                ->when(isset($filters['from']), fn ($query) => $query->where(fn ($q) => $q->whereNull('starts_at')->orWhereDate('starts_at', '<=', $filters['to'] ?? $filters['from'])))
                ->when(isset($filters['to']), fn ($query) => $query->where(fn ($q) => $q->whereNull('ends_at')->orWhereDate('ends_at', '>=', $filters['from'] ?? $filters['to'])));
            $countQuery = clone $query;
            $now = now();
            $statusCounts = [
                'all' => (clone $countQuery)->count(),
                'running' => (clone $countQuery)->where('is_active', true)
                    ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
                    ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', $now))
                    ->where(fn ($q) => $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'))->count(),
                'upcoming' => (clone $countQuery)->where('is_active', true)->where('starts_at', '>', $now)->count(),
                'expired' => (clone $countQuery)->where(fn ($q) => $q->where('ends_at', '<=', $now)->orWhere(fn ($used) => $used->whereNotNull('usage_limit')->whereColumn('used_count', '>=', 'usage_limit')))->count(),
                'expiring' => (clone $countQuery)->where('is_active', true)
                    ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
                    ->whereRaw('COALESCE(ends_at, expires_at) > ?', [$now])
                    ->whereRaw('COALESCE(ends_at, expires_at) <= ?', [$now->copy()->addDays(7)])
                    ->where(fn ($q) => $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'))->count(),
                'disabled' => (clone $countQuery)->where('is_active', false)->count(),
            ];
            match ($filters['campaign_status'] ?? null) {
                'running' => $query->where('is_active', true)->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                    ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()))
                    ->where(fn ($q) => $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit')),
                'upcoming' => $query->where('is_active', true)->where('starts_at', '>', now()),
                'expired' => $query->where(fn ($q) => $q->where('ends_at', '<=', now())->orWhere(fn ($used) => $used->whereNotNull('usage_limit')->whereColumn('used_count', '>=', 'usage_limit'))),
                'expiring' => $query->where('is_active', true)
                    ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                    ->whereRaw('COALESCE(ends_at, expires_at) > ?', [now()])
                    ->whereRaw('COALESCE(ends_at, expires_at) <= ?', [now()->addDays(7)])
                    ->where(fn ($q) => $q->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit')),
                'disabled' => $query->where('is_active', false),
                default => null,
            };
            $sort = $filters['sort'] ?? 'code';
            $descending = str_starts_with($sort, '-');
            $field = ltrim($sort, '-');
            $sortColumns = [
                'code' => 'code', 'type' => 'type', 'value' => 'value', 'min_order_value' => 'min_order_amount', 'used_count' => 'used_count',
                'starts_at' => 'starts_at', 'expires_at' => 'expires_at', 'is_active' => 'is_active', 'created_at' => 'created_at',
            ];
            if (! isset($sortColumns[$field])) {
                throw ValidationException::withMessages(['sort' => 'Trường sắp xếp không được hỗ trợ cho mã giảm giá.']);
            }
            $query->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('id');
        } else {
            $query->when(isset($filters['campaign_position']), fn ($query) => $query->where('position', $filters['campaign_position']))
                ->when(($filters['campaign_status'] ?? null) === 'active', fn ($query) => $query->where('is_active', true))
                ->when(($filters['campaign_status'] ?? null) === 'inactive', fn ($query) => $query->where('is_active', false));
            $query->orderBy('position')->orderBy('sort_order')->orderBy('id');
        }
        $rows = $query->paginate($filters['per_page'] ?? 20);

        $response = ['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]];
        if ($kind === 'coupons') {
            $response['status_counts'] = $statusCounts;
        }

        return response()->json($response);
    }

    public function show(Request $request): CampaignResource
    {
        $model = $this->model((string) $request->route('kind'));

        return new CampaignResource($model::query()->findOrFail((int) $request->route('campaign')));
    }

    public function store(SaveCampaignRequest $request, string $kind): JsonResponse
    {
        $model = $this->model($kind);
        $data = $this->normalize($kind, $request->validated());
        $item = $model::query()->create($data);

        return response()->json(['data' => $item], 201);
    }

    public function update(SaveCampaignRequest $request, string $kind, int $campaign): JsonResponse
    {
        $model = $this->model($kind);
        $item = $model::query()->findOrFail($campaign);
        $data = $request->validated();
        if ($kind === 'coupons' && ($data['type'] ?? $item->type) === 'percent' && ($data['value'] ?? $item->value) > 100) {
            throw ValidationException::withMessages(['value' => 'Mức giảm phần trăm không vượt quá 100.']);
        }
        $item->update($this->normalize($kind, $data));

        return response()->json(['data' => $item]);
    }

    public function destroy(string $kind, int $campaign): JsonResponse
    {
        $model = $this->model($kind);
        DB::transaction(function () use ($kind, $model, $campaign): void {
            $item = $model::query()->whereKey($campaign)->lockForUpdate()->firstOrFail();
            if ($kind === 'coupons' && ($item->used_count > 0 || DB::table('coupon_usages')->where('coupon_id', $campaign)->exists() || DB::table('orders')->where('coupon_id', $campaign)->exists())) {
                throw ValidationException::withMessages(['campaign' => 'Mã đã sử dụng. Hãy tắt mã thay vì xóa.']);
            }
            $item->delete();
        });

        return response()->json(['message' => 'Đã xóa.']);
    }

    public function usages(ListOperationsRequest $request, int $campaign): JsonResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumns = [
            'order_code' => 'orders.code', 'customer_name' => 'users.name', 'discount' => 'coupon_usages.discount',
            'grand_total' => 'orders.grand_total', 'created_at' => 'coupon_usages.created_at',
        ];
        if (! isset($sortColumns[$field])) {
            throw ValidationException::withMessages(['sort' => 'Trường sắp xếp không được hỗ trợ cho lịch sử sử dụng mã.']);
        }
        Coupon::query()->findOrFail($campaign);
        $query = DB::table('coupon_usages')->join('orders', 'orders.id', '=', 'coupon_usages.order_id')
            ->leftJoin('users', 'users.id', '=', 'coupon_usages.user_id')
            ->where('coupon_usages.coupon_id', $campaign)
            ->select('coupon_usages.id', 'coupon_usages.discount', 'coupon_usages.created_at', 'orders.id as order_id', 'orders.code as order_code', 'orders.grand_total', 'users.name as customer_name');
        $totalDiscount = (int) (clone $query)->sum('coupon_usages.discount');
        $rows = $query->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('coupon_usages.id')->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ], 'summary' => ['total_discount' => $totalDiscount]]);
    }

    public function reorder(ReorderBannersRequest $request, string $kind): JsonResponse
    {
        if ($kind !== 'banners') {
            abort(404);
        }
        $data = $request->validated();
        DB::transaction(function () use ($data): void {
            $positionIds = Banner::query()->where('position', $data['position'])->orderBy('id')->lockForUpdate()->pluck('id')->all();
            $requestedIds = array_map('intval', $data['ids']);
            $positionIds = array_map('intval', $positionIds);
            sort($requestedIds);
            if ($requestedIds !== $positionIds) {
                throw ValidationException::withMessages(['ids' => 'Danh sách sắp xếp phải gồm đầy đủ banner thuộc cùng một vị trí.']);
            }

            foreach ($data['ids'] as $order => $id) {
                Banner::query()->whereKey($id)->where('position', $data['position'])->update(['sort_order' => $order]);
            }
        });

        return response()->json(['message' => 'Đã cập nhật thứ tự banner.']);
    }

    private function normalize(string $kind, array $data): array
    {
        if ($kind === 'coupons') {
            if (isset($data['code'])) {
                $data['code'] = strtoupper($data['code']);
            }
            if (($data['type'] ?? null) === 'percent' && ($data['value'] ?? 0) > 100) {
                throw ValidationException::withMessages(['value' => 'Mức giảm phần trăm không vượt quá 100.']);
            }
            if (array_key_exists('min_order_value', $data)) {
                $data['min_order_amount'] = $data['min_order_value'];
            }
            if (array_key_exists('ends_at', $data)) {
                $data['expires_at'] = $data['ends_at'];
            }
        } elseif (array_key_exists('link', $data)) {
            $data['link_url'] = $data['link'];
        }

        return $data;
    }

    private function model(string $kind): string
    {
        return match ($kind) {
            'coupons' => Coupon::class,
            'banners' => Banner::class,
            default => abort(404),
        };
    }
}
