<?php

namespace App\Modules\Membership\Actions;

use App\Modules\Membership\Support\MembershipTiers;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RedeemMembershipPointsAction
{
    /** @return array{available_points: int, points_used: int, discount_vnd: int} */
    public function preview(int $userId, int $maximumDiscountVnd): array
    {
        $available = max(0, (int) DB::table('membership_transactions')->where('user_id', $userId)
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->sum('points_delta'));
        $pointsUsed = min($available, intdiv(max(0, $maximumDiscountVnd), MembershipTiers::POINT_VALUE_VND));

        return [
            'available_points' => $available,
            'points_used' => $pointsUsed,
            'discount_vnd' => $pointsUsed * MembershipTiers::POINT_VALUE_VND,
        ];
    }

    public function redeemForOrder(int $userId, int $orderId, string $orderCode, int $points): void
    {
        if ($points < 1) {
            return;
        }

        if (! DB::table('users')->where('id', $userId)->lockForUpdate()->first()) {
            throw ValidationException::withMessages(['use_points' => 'Tài khoản không còn hoạt động.']);
        }
        $remaining = $points;
        $lots = DB::table('membership_transactions')->where('user_id', $userId)->where('type', 'earn')
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderByRaw('expires_at IS NULL')
            ->orderBy('expires_at')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        foreach ($lots as $lot) {
            $netPoints = (int) DB::table('membership_transactions')
                ->where(fn ($query) => $query->where('id', $lot->id)->orWhere('source_transaction_id', $lot->id))
                ->sum('points_delta');
            $availableFromLot = max(0, $netPoints);
            $allocated = min($remaining, $availableFromLot);
            if ($allocated < 1) {
                continue;
            }

            DB::table('membership_transactions')->insert([
                'user_id' => $userId,
                'order_id' => $orderId,
                'source_transaction_id' => $lot->id,
                'reference_key' => 'order:'.$orderId.':redeem:'.$lot->id,
                'type' => 'redeem',
                'points_delta' => -$allocated,
                'amount_vnd' => $allocated * MembershipTiers::POINT_VALUE_VND,
                'description' => 'Dùng điểm cho đơn hàng '.$orderCode,
                'expires_at' => $lot->expires_at,
                'created_at' => now(),
            ]);

            $remaining -= $allocated;
            if ($remaining === 0) {
                break;
            }
        }

        if ($remaining > 0) {
            throw ValidationException::withMessages(['use_points' => 'Số dư điểm đã thay đổi. Vui lòng tính lại đơn hàng.']);
        }
    }
}
