<?php

namespace App\Modules\Orders\Actions;

use App\Models\OrderChangeRequest as OrderChangeRequestModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReviewOrderChangeRequestAction
{
    public function __construct(private readonly TransitionOrderAction $transition) {}

    /** @return array{request: OrderChangeRequestModel, order: object} */
    public function handle(int $orderId, int $requestId, int $reviewerId, string $decision, ?string $resolutionNote): array
    {
        return DB::transaction(function () use ($orderId, $requestId, $reviewerId, $decision, $resolutionNote): array {
            $order = DB::table('orders')->where('id', $orderId)->lockForUpdate()->first();
            abort_if(! $order, 404);

            $request = OrderChangeRequestModel::query()->whereKey($requestId)->where('order_id', $orderId)->lockForUpdate()->firstOrFail();
            if ($request->status !== 'pending') {
                throw ValidationException::withMessages(['decision' => 'Yêu cầu này đã được xử lý.']);
            }

            if ($decision === 'approved' && $request->type === 'cancellation') {
                $order = $this->transition->handle((int) $order->id, 'cancelled', $request->reason, $reviewerId);
            } elseif ($decision === 'approved' && ! in_array($order->status, ['delivered', 'completed'], true)) {
                throw ValidationException::withMessages(['decision' => 'Đơn hàng không còn đủ điều kiện xử lý yêu cầu trả hàng.']);
            }

            $request->update([
                'status' => $decision,
                'resolution_note' => $resolutionNote,
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
            ]);

            return ['request' => $request->fresh(), 'order' => $order];
        });
    }
}
