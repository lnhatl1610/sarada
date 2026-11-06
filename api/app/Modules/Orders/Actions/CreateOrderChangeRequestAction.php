<?php

namespace App\Modules\Orders\Actions;

use App\Models\OrderChangeRequest;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class CreateOrderChangeRequestAction
{
    private const RETURN_REQUEST_WINDOW_DAYS = 7;

    /** @return array{request: OrderChangeRequest, order: object} */
    public function handle(string $code, int $userId, string $type, string $reason): array
    {
        return DB::transaction(function () use ($code, $userId, $type, $reason): array {
            abort_unless(Schema::hasTable('order_change_requests'), 503, 'Luồng yêu cầu hủy/trả chưa sẵn sàng; cần áp dụng migration trước.');
            $order = DB::table('orders')->where('code', $code)->where('user_id', $userId)->lockForUpdate()->first();
            abort_if(! $order, 404);

            $eligibleStatuses = $type === 'cancellation'
                ? ['pending', 'confirmed', 'processing']
                : ['delivered', 'completed'];
            if (! in_array($order->status, $eligibleStatuses, true)) {
                throw ValidationException::withMessages([
                    'type' => $type === 'cancellation'
                        ? 'Chỉ có thể yêu cầu hủy đơn trước khi đơn được giao cho đơn vị vận chuyển.'
                        : 'Chỉ có thể yêu cầu trả hàng sau khi đơn đã giao.',
                ]);
            }

            if ($type === 'return') {
                $returnDeadline = $order->delivered_at
                    ? CarbonImmutable::parse($order->delivered_at)->addDays(self::RETURN_REQUEST_WINDOW_DAYS)
                    : null;

                if (! $returnDeadline || now()->greaterThan($returnDeadline)) {
                    throw ValidationException::withMessages([
                        'type' => 'Yêu cầu trả hàng chỉ được gửi trong vòng 7 ngày kể từ khi đơn được giao thành công.',
                    ]);
                }
            }

            $hasPending = DB::table('order_change_requests')->where('order_id', $order->id)->where('status', 'pending')->exists();
            if ($hasPending) {
                throw ValidationException::withMessages(['type' => 'Đơn hàng đã có yêu cầu thay đổi đang chờ xử lý.']);
            }

            $request = OrderChangeRequest::query()->create([
                'order_id' => $order->id,
                'requester_id' => $userId,
                'type' => $type,
                'status' => 'pending',
                'reason' => trim($reason),
            ]);

            return ['request' => $request, 'order' => $order];
        });
    }
}
