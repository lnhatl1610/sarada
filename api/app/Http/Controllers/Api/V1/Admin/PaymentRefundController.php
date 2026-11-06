<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\RefundPaymentRequest;
use App\Modules\Payments\Actions\RefundPaymentAction;
use Illuminate\Http\JsonResponse;

class PaymentRefundController extends Controller
{
    public function store(RefundPaymentRequest $request, int $payment, RefundPaymentAction $action): JsonResponse
    {
        $result = $action->execute($payment, (int) $request->validated('amount'), trim($request->validated('reason')), (int) $request->user()->id);

        return response()->json(['data' => [
            'id' => $result['refund']->id,
            'payment_id' => $payment,
            'amount' => $result['refund']->amount,
            'reason' => $result['refund']->reason,
            'recorded_by' => $result['refund']->recorded_by,
            'created_at' => $result['refund']->created_at,
            'order_payment_status' => $result['order_payment_status'],
            'refunded_amount' => $result['refunded_amount'],
            'refundable_amount' => $result['refundable_amount'],
        ]], 201);
    }
}
