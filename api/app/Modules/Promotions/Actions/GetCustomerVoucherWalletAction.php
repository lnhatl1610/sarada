<?php

namespace App\Modules\Promotions\Actions;

use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class GetCustomerVoucherWalletAction
{
    public function execute(int $userId, int $page, int $perPage, ?string $status): LengthAwarePaginator
    {
        $now = now();
        $userUsage = DB::table('coupon_usages')
            ->select('coupon_id', DB::raw('COUNT(*) as user_usage_count'))
            ->where('user_id', $userId)
            ->groupBy('coupon_id');

        $query = DB::table('coupons')
            ->leftJoinSub($userUsage, 'user_coupon_usage', 'user_coupon_usage.coupon_id', '=', 'coupons.id')
            ->where(function ($query): void {
                $query->where('coupons.is_active', true)->orWhereNotNull('user_coupon_usage.user_usage_count');
            })
            ->select([
                'coupons.id', 'coupons.code', 'coupons.description', 'coupons.type', 'coupons.value',
                'coupons.max_discount', 'coupons.min_order_value', 'coupons.usage_limit',
                'coupons.usage_per_user', 'coupons.used_count', 'coupons.is_active',
                'coupons.starts_at', 'coupons.ends_at', 'coupons.expires_at',
            ])
            ->selectRaw('COALESCE(user_coupon_usage.user_usage_count, 0) as user_usage_count');

        $this->applyStatusFilter($query, $status, $now);

        return $query->orderByRaw('COALESCE(coupons.ends_at, coupons.expires_at) IS NULL')
            ->orderByRaw('COALESCE(coupons.ends_at, coupons.expires_at) ASC')
            ->orderByDesc('coupons.id')
            ->paginate($perPage, ['*'], 'page', $page)
            ->through(fn (object $coupon): array => $this->present($coupon, $now));
    }

    private function applyStatusFilter($query, ?string $status, $now): void
    {
        if ($status === null) {
            return;
        }

        $end = 'COALESCE(coupons.ends_at, coupons.expires_at)';
        match ($status) {
            'expired' => $query->whereRaw($end.' < ?', [$now]),
            'upcoming' => $query->where('coupons.is_active', true)->where('coupons.starts_at', '>', $now)->where(fn ($builder) => $builder->whereNull('coupons.ends_at')->whereNull('coupons.expires_at')->orWhereRaw($end.' >= ?', [$now])),
            'used' => $query->where('coupons.is_active', true)->where(fn ($builder) => $builder->whereNull('coupons.starts_at')->orWhere('coupons.starts_at', '<=', $now))->whereNotNull('coupons.usage_per_user')->whereRaw('COALESCE(user_coupon_usage.user_usage_count, 0) >= coupons.usage_per_user')->where(function ($builder) use ($end, $now): void {
                $builder->whereNull('coupons.ends_at')->whereNull('coupons.expires_at')->orWhereRaw($end.' >= ?', [$now]);
            })->where(fn ($builder) => $builder->whereNull('coupons.usage_limit')->orWhereColumn('coupons.used_count', '<', 'coupons.usage_limit')),
            'available' => $query->where('coupons.is_active', true)->where(fn ($builder) => $builder->whereNull('coupons.starts_at')->orWhere('coupons.starts_at', '<=', $now))->where(function ($builder) use ($end, $now): void {
                $builder->whereNull('coupons.ends_at')->whereNull('coupons.expires_at')->orWhereRaw($end.' >= ?', [$now]);
            })->where(fn ($builder) => $builder->whereNull('coupons.usage_limit')->orWhereColumn('coupons.used_count', '<', 'coupons.usage_limit'))->where(fn ($builder) => $builder->whereNull('coupons.usage_per_user')->orWhereRaw('COALESCE(user_coupon_usage.user_usage_count, 0) < coupons.usage_per_user')),
            'unavailable' => $query->where(function ($builder): void {
                $builder->where('coupons.is_active', false)->orWhere(fn ($limit) => $limit->whereNotNull('coupons.usage_limit')->whereColumn('coupons.used_count', '>=', 'coupons.usage_limit'));
            })->where(fn ($builder) => $builder->whereNull('coupons.starts_at')->orWhere('coupons.starts_at', '<=', $now))->where(function ($builder) use ($end, $now): void {
                $builder->whereNull('coupons.ends_at')->whereNull('coupons.expires_at')->orWhereRaw($end.' >= ?', [$now]);
            }),
            default => null,
        };
    }

    /** @return array<string, mixed> */
    private function present(object $coupon, $now): array
    {
        $expiresAt = $coupon->ends_at ?? $coupon->expires_at;
        $expiresAt = $expiresAt === null ? null : Carbon::parse($expiresAt);
        $startsAt = $coupon->starts_at === null ? null : Carbon::parse($coupon->starts_at);
        $usageCount = (int) $coupon->user_usage_count;
        $globalLimitReached = $coupon->usage_limit !== null && (int) $coupon->used_count >= (int) $coupon->usage_limit;
        $userLimitReached = $coupon->usage_per_user !== null && $usageCount >= (int) $coupon->usage_per_user;

        $status = $expiresAt !== null && $expiresAt->lt($now)
            ? 'expired'
            : (! $coupon->is_active || $globalLimitReached
                ? 'unavailable'
                : ($startsAt !== null && $startsAt->gt($now)
                    ? 'upcoming'
                    : ($userLimitReached ? 'used' : 'available')));

        $reason = match ($status) {
            'expired' => 'Mã ưu đãi đã hết hạn.',
            'unavailable' => ! $coupon->is_active ? 'Mã ưu đãi đã ngừng áp dụng.' : 'Mã ưu đãi đã hết lượt sử dụng.',
            'upcoming' => 'Mã ưu đãi chưa đến thời gian áp dụng.',
            'used' => 'Bạn đã sử dụng hết lượt của mã ưu đãi này.',
            default => null,
        };

        return [
            'id' => (int) $coupon->id,
            'code' => (string) $coupon->code,
            'description' => $coupon->description,
            'type' => (string) $coupon->type,
            'value' => (int) $coupon->value,
            'max_discount' => $coupon->max_discount === null ? null : (int) $coupon->max_discount,
            'min_order_value' => (int) $coupon->min_order_value,
            'starts_at' => $startsAt?->toIso8601String(),
            'ends_at' => $expiresAt?->toIso8601String(),
            'usage_count' => $usageCount,
            'usage_per_user' => $coupon->usage_per_user === null ? null : (int) $coupon->usage_per_user,
            'status' => $status,
            'unavailable_reason' => $reason,
        ];
    }
}
