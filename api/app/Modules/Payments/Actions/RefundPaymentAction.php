<?php

namespace App\Modules\Payments\Actions;

use App\Models\PaymentRefund;
use App\Modules\Membership\Actions\ApplyOrderMembershipPointsAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RefundPaymentAction
{
    public function __construct(private readonly ApplyOrderMembershipPointsAction $membershipPoints) {}

    /** @return array{refund: PaymentRefund, order_payment_status: string, refunded_amount: int, refundable_amount: int} */
    public function execute(int $paymentId, int $amount, string $reason, int $actorId): array
    {
        return DB::transaction(function () use ($paymentId, $amount, $reason, $actorId): array {
            $orderId = DB::table('payments')->where('id', $paymentId)->value('order_id');
            abort_if($orderId === null, 404);

            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            abort_if(! $order, 404);
            $payment = DB::table('payments')->where('id', $paymentId)->where('order_id', $orderId)->lockForUpdate()->first();
            abort_if(! $payment, 404);

            if (! in_array($order->status, ['delivered', 'returned'], true) || $order->payment_status !== 'paid') {
                throw ValidationException::withMessages(['order' => 'Chỉ có thể hoàn tiền cho đơn đã giao/trả và đã thanh toán.']);
            }
            if (! in_array($payment->status, ['success', 'paid'], true)) {
                throw ValidationException::withMessages(['payment' => 'Chỉ giao dịch đã thanh toán mới được hoàn tiền.']);
            }

            $alreadyRefunded = (int) DB::table('payment_refunds')->where('payment_id', $paymentId)->sum('amount');
            $remaining = max(0, (int) $payment->amount - $alreadyRefunded);
            if ($amount < 1 || $amount > $remaining) {
                throw ValidationException::withMessages(['amount' => "Số tiền hoàn phải từ 1 đến {$remaining} VND còn có thể hoàn."]);
            }

            $now = now();
            $refund = PaymentRefund::query()->create([
                'order_id' => $orderId,
                'payment_id' => $paymentId,
                'amount' => $amount,
                'reason' => $reason,
                'recorded_by' => $actorId,
            ]);
            $refundedAmount = $alreadyRefunded + $amount;
            $refundableAmount = max(0, (int) $payment->amount - $refundedAmount);
            if ($refundableAmount === 0) {
                DB::table('payments')->where('id', $paymentId)->update(['status' => 'refunded', 'updated_at' => $now]);
            }

            $totalCaptured = (int) DB::table('payments')->where('order_id', $orderId)->whereIn('status', ['success', 'paid', 'refunded'])->sum('amount');
            $totalRefunded = (int) DB::table('payment_refunds')->where('order_id', $orderId)->sum('amount');
            $orderPaymentStatus = $totalCaptured > 0 && $totalRefunded >= $totalCaptured ? 'refunded' : 'paid';
            DB::table('orders')->where('id', $orderId)->update(['payment_status' => $orderPaymentStatus, 'updated_at' => $now]);
            $this->membershipPoints->adjustAfterRefund((int) $orderId, (int) $refund->id);
            DB::table('order_status_histories')->insert([
                'order_id' => $orderId,
                'from_status' => $order->status,
                'to_status' => $order->status,
                'note' => 'Hoàn tiền '.number_format($amount, 0, ',', '.').' VND: '.$reason,
                'changed_by' => $actorId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            return [
                'refund' => $refund,
                'order_payment_status' => $orderPaymentStatus,
                'refunded_amount' => $refundedAmount,
                'refundable_amount' => $refundableAmount,
            ];
        });
    }
}
