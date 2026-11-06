<?php

namespace App\Modules\Membership\Actions;

use App\Modules\Membership\Support\MembershipTiers;
use Illuminate\Support\Facades\DB;

class GetMembershipSummaryAction
{
    public function execute(int $userId): array
    {
        $refunds = '(select coalesce(sum(payment_refunds.amount), 0) from payment_refunds where payment_refunds.order_id = orders.id)';
        $spend = (int) DB::table('orders')->where('user_id', $userId)
            ->whereIn('status', ['delivered', 'completed'])
            ->where('payment_status', 'paid')
            ->where('delivered_at', '>=', now()->subYear())
            ->sum(DB::raw('GREATEST(0, grand_total - '.$refunds.')'));

        $tier = MembershipTiers::forSpend($spend);
        $nextTier = MembershipTiers::nextAfter($tier['key']);
        $pointsQuery = DB::table('membership_transactions')->where('user_id', $userId)
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()));
        $points = max(0, (int) (clone $pointsQuery)->sum('points_delta'));
        $expiring = max(0, (int) DB::table('membership_transactions')->where('user_id', $userId)
            ->whereBetween('expires_at', [now(), now()->addDays(30)])
            ->sum('points_delta'));
        $progressStart = $tier['threshold_vnd'];
        $progressEnd = $nextTier['threshold_vnd'] ?? null;
        $progressPercent = $progressEnd === null || $progressEnd <= $progressStart
            ? 100
            : min(100, max(0, intdiv(max(0, $spend - $progressStart) * 100, $progressEnd - $progressStart)));

        return [
            'current_points' => $points,
            'expiring_points_30_days' => $expiring,
            'spend_12_months_vnd' => $spend,
            'tier' => $tier,
            'next_tier' => $nextTier,
            'progress_percent' => $progressPercent,
            'earn_rate_basis_points' => $tier['earn_rate_basis_points'],
            'point_value_vnd' => MembershipTiers::POINT_VALUE_VND,
            'points_expire_after_months' => MembershipTiers::POINT_EXPIRY_MONTHS,
            'tiers' => MembershipTiers::all(),
        ];
    }
}
