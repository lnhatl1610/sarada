<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Modules\Orders\Actions\TransitionOrderAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CancelExpiredUnpaidOrders extends Command
{
    protected $signature = 'orders:cancel-expired-unpaid';

    protected $description = 'Cancel expired unpaid non-COD orders through the order state machine';

    public function handle(TransitionOrderAction $transition): int
    {
        $hours = (int) (Setting::query()->where('key', 'payment_cancel_unpaid_after_hours')->value('value') ?? 24);
        if ($hours < 1) {
            $this->info('Tự hủy đơn chưa thanh toán đang tắt.');

            return self::SUCCESS;
        }

        $cutoff = now()->subHours($hours);
        $orders = DB::table('orders')->whereIn('status', ['pending', 'confirmed', 'processing'])
            ->where('payment_status', 'unpaid')->whereNotIn('payment_method', ['cod'])
            ->whereRaw('COALESCE(placed_at, created_at) <= ?', [$cutoff])
            ->orderBy('id')->limit(100)->get(['id', 'code']);

        $cancelled = 0;
        foreach ($orders as $order) {
            try {
                $transition->handle((int) $order->id, 'cancelled', 'Tự động hủy sau '.$hours.' giờ chưa thanh toán.', null);
                $cancelled++;
            } catch (ValidationException) {
                // Another request may have changed the state after the candidate query.
            }
        }

        $this->info("Đã tự động hủy {$cancelled} đơn quá hạn.");

        return self::SUCCESS;
    }
}
