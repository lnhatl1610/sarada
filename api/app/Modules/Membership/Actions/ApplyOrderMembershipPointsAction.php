<?php

namespace App\Modules\Membership\Actions;

use App\Modules\Membership\Support\MembershipTiers;
use Illuminate\Support\Facades\DB;

class ApplyOrderMembershipPointsAction
{
    public function award(int $orderId): void
    {
        DB::transaction(function () use ($orderId): void {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            if (! $order || ! $order->user_id || ! in_array($order->status, ['delivered', 'completed'], true) || $order->payment_status !== 'paid') {
                return;
            }

            $reference = 'order:'.$orderId.':earn';
            if (DB::table('membership_transactions')->where('reference_key', $reference)->exists()) {
                return;
            }

            DB::table('users')->where('id', $order->user_id)->lockForUpdate()->first();
            $eligibleSpend = max(0, (int) $order->subtotal - (int) $order->discount_total);
            $rollingSpend = $this->rollingPaidSpend((int) $order->user_id);
            $tier = MembershipTiers::forSpend($rollingSpend);
            $points = intdiv(intdiv($eligibleSpend, 10_000) * $tier['earn_rate_basis_points'], 10_000);
            if ($points < 1) {
                return;
            }

            DB::table('membership_transactions')->insert([
                'user_id' => $order->user_id,
                'order_id' => $orderId,
                'reference_key' => $reference,
                'type' => 'earn',
                'points_delta' => $points,
                'amount_vnd' => $eligibleSpend,
                'earn_rate_basis_points' => $tier['earn_rate_basis_points'],
                'description' => 'Tích điểm đơn hàng '.$order->code,
                'expires_at' => now()->addYear(),
                'created_at' => now(),
            ]);
        });
    }

    public function adjustAfterRefund(int $orderId, int $refundId): void
    {
        DB::transaction(function () use ($orderId, $refundId): void {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            if (! $order || ! $order->user_id) {
                return;
            }
            $earned = DB::table('membership_transactions')->where('order_id', $orderId)->where('type', 'earn')->first();
            DB::table('users')->where('id', $order->user_id)->lockForUpdate()->first();
            if ($earned) {
                $reference = 'refund:'.$refundId;
                if (! DB::table('membership_transactions')->where('reference_key', $reference)->exists()) {
                    $refunded = (int) DB::table('payment_refunds')->where('order_id', $orderId)->sum('amount');
                    $gross = max(0, (int) $order->grand_total);
                    $eligibleAfterRefund = $gross > 0
                        ? intdiv((int) $earned->amount_vnd * max(0, $gross - $refunded), $gross)
                        : 0;
                    $targetPoints = $order->status === 'returned'
                        ? 0
                        : intdiv(intdiv($eligibleAfterRefund, 10_000) * (int) $earned->earn_rate_basis_points, 10_000);
                    $currentOrderPoints = (int) DB::table('membership_transactions')->where('order_id', $orderId)
                        ->whereIn('type', ['earn', 'refund_adjustment', 'return_reversal'])->sum('points_delta');
                    $delta = $targetPoints - $currentOrderPoints;

                    if ($delta !== 0) {
                        DB::table('membership_transactions')->insert([
                            'user_id' => $earned->user_id,
                            'order_id' => $orderId,
                            'payment_refund_id' => $refundId,
                            'source_transaction_id' => $earned->id,
                            'reference_key' => $reference,
                            'type' => 'refund_adjustment',
                            'points_delta' => $delta,
                            'amount_vnd' => $eligibleAfterRefund,
                            'earn_rate_basis_points' => $earned->earn_rate_basis_points,
                            'description' => 'Điều chỉnh điểm sau hoàn tiền đơn hàng '.$order->code,
                            'expires_at' => $earned->expires_at,
                            'created_at' => now(),
                        ]);
                    }
                }
            }

            $this->restoreRedeemedPoints($order, $refundId);
        });
    }

    public function reverseReturnedOrder(int $orderId): void
    {
        DB::transaction(function () use ($orderId): void {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            if (! $order || ! $order->user_id) {
                return;
            }
            DB::table('users')->where('id', $order->user_id)->lockForUpdate()->first();
            $earned = DB::table('membership_transactions')->where('order_id', $orderId)->where('type', 'earn')->first();
            $reference = 'order:'.$orderId.':return';
            if ($earned && ! DB::table('membership_transactions')->where('reference_key', $reference)->exists()) {
                $remainingPoints = (int) DB::table('membership_transactions')->where('order_id', $orderId)
                    ->whereIn('type', ['earn', 'refund_adjustment', 'return_reversal'])->sum('points_delta');
                if ($remainingPoints !== 0) {
                    DB::table('membership_transactions')->insert([
                        'user_id' => $earned->user_id,
                        'order_id' => $orderId,
                        'source_transaction_id' => $earned->id,
                        'reference_key' => $reference,
                        'type' => 'return_reversal',
                        'points_delta' => -$remainingPoints,
                        'amount_vnd' => $earned->amount_vnd,
                        'earn_rate_basis_points' => $earned->earn_rate_basis_points,
                        'description' => 'Thu hồi điểm do trả đơn hàng '.$order->code,
                        'expires_at' => $earned->expires_at,
                        'created_at' => now(),
                    ]);
                }
            }

            $this->restoreRedeemedPoints($order, null);
        });
    }

    private function rollingPaidSpend(int $userId): int
    {
        $subquery = '(select coalesce(sum(payment_refunds.amount), 0) from payment_refunds where payment_refunds.order_id = orders.id)';

        return (int) DB::table('orders')->where('user_id', $userId)
            ->whereIn('status', ['delivered', 'completed'])
            ->where('payment_status', 'paid')
            ->where('delivered_at', '>=', now()->subYear())
            ->sum(DB::raw('GREATEST(0, grand_total - '.$subquery.')'));
    }

    private function restoreRedeemedPoints(object $order, ?int $refundId): void
    {
        $redemptions = DB::table('membership_transactions')->where('order_id', $order->id)->where('type', 'redeem')->get();
        if ($redemptions->isEmpty()) {
            return;
        }

        $isReturned = $order->status === 'returned';
        $refunded = $isReturned ? (int) $order->grand_total : (int) DB::table('payment_refunds')->where('order_id', $order->id)->sum('amount');
        $paidTotal = max(0, (int) $order->grand_total);

        foreach ($redemptions as $redemption) {
            $redeemedPoints = abs((int) $redemption->points_delta);
            $targetRestored = $isReturned
                ? $redeemedPoints
                : ($paidTotal > 0 ? intdiv($redeemedPoints * min($refunded, $paidTotal), $paidTotal) : 0);
            $alreadyRestored = (int) DB::table('membership_transactions')->where('order_id', $order->id)
                ->where('type', 'redeem_reversal')->where('source_transaction_id', $redemption->source_transaction_id)
                ->sum('points_delta');
            $delta = max(0, $targetRestored - $alreadyRestored);
            if ($delta < 1) {
                continue;
            }

            $reference = $isReturned
                ? 'order:'.$order->id.':return:redeem:'.$redemption->source_transaction_id
                : 'refund:'.$refundId.':redeem:'.$redemption->source_transaction_id;
            if (DB::table('membership_transactions')->where('reference_key', $reference)->exists()) {
                continue;
            }

            DB::table('membership_transactions')->insert([
                'user_id' => $redemption->user_id,
                'order_id' => $order->id,
                'payment_refund_id' => $refundId,
                'source_transaction_id' => $redemption->source_transaction_id,
                'reference_key' => $reference,
                'type' => 'redeem_reversal',
                'points_delta' => $delta,
                'amount_vnd' => $delta * MembershipTiers::POINT_VALUE_VND,
                'description' => $isReturned ? 'Hoàn lại điểm do trả đơn hàng '.$order->code : 'Hoàn lại điểm sau hoàn tiền đơn hàng '.$order->code,
                'expires_at' => $redemption->expires_at,
                'created_at' => now(),
            ]);
        }
    }
}
