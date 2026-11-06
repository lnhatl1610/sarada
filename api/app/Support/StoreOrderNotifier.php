<?php

namespace App\Support;

use App\Jobs\SendStorefrontNotificationSms;
use App\Models\User;
use App\Notifications\OrderConfirmationNotification;
use App\Notifications\OrderShipmentNotification;
use App\Notifications\StorefrontOrderUpdateNotification;
use App\Notifications\StoreOperationalAlertNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class StoreOrderNotifier
{
    public static function orderPlaced(object $order, ?string $signature = null): void
    {
        $customer = ! empty($order->user_id) ? User::query()->find($order->user_id) : null;
        if ($customer) {
            $customer->notify(new StorefrontOrderUpdateNotification(
                'order_placed',
                'Đơn hàng đã được tiếp nhận',
                'Cửa hàng đã nhận đơn hàng '.$order->code.'.',
                (string) $order->code,
            ));
            if (StorefrontNotificationPreferences::wants($customer, 'orders', 'sms')) {
                SendStorefrontNotificationSms::dispatch($customer->id, 'orders', 'Cửa hàng đã nhận đơn hàng '.$order->code.'.', '/account/orders/'.rawurlencode((string) $order->code));
            }
        }

        AdminNotificationDispatcher::send(
            'new_order',
            'orders.view',
            'Đơn hàng mới '.$order->code,
            'Khách hàng '.$order->customer_name.' vừa tạo đơn hàng mới.',
            '/orders/'.$order->id,
        );

        if (filter_var($order->customer_email ?? null, FILTER_VALIDATE_EMAIL)
            && (! $customer || StorefrontNotificationPreferences::wants($customer, 'orders', 'email'))) {
            Notification::route('mail', $order->customer_email)->notify(new OrderConfirmationNotification(
                (string) $order->customer_name,
                (string) $order->code,
                (int) $order->grand_total,
                $signature,
                isset($order->payment_instructions) && is_string($order->payment_instructions)
                    ? json_decode($order->payment_instructions, true)
                    : null,
            ));
        }

        $recipients = self::recipients('new_order_alert_recipients');
        if ($recipients) {
            Notification::route('mail', $recipients)->notify(new StoreOperationalAlertNotification(
                'Có đơn hàng mới '.$order->code,
                "Đơn hàng {$order->code} vừa được tạo.\nKhách hàng: {$order->customer_name}\nTổng tiền: ".number_format((int) $order->grand_total, 0, ',', '.').' ₫',
            ));
        }
    }

    public static function shipmentUpdated(object $order, ?string $trackingCode, ?string $signature = null): void
    {
        $customer = ! empty($order->user_id) ? User::query()->find($order->user_id) : null;
        if ($customer) {
            $customer->notify(new StorefrontOrderUpdateNotification(
                'order_shipped',
                'Đơn hàng đang được giao',
                'Đơn hàng '.$order->code.' đã được gửi đi.'.($trackingCode ? ' Mã vận đơn: '.$trackingCode.'.' : ''),
                (string) $order->code,
                $trackingCode,
            ));
            if (StorefrontNotificationPreferences::wants($customer, 'orders', 'sms')) {
                $message = 'Đơn hàng '.$order->code.' đã được gửi đi.'.($trackingCode ? ' Mã vận đơn: '.$trackingCode.'.' : '');
                SendStorefrontNotificationSms::dispatch($customer->id, 'orders', $message, '/account/orders/'.rawurlencode((string) $order->code));
            }
        }

        if (! filter_var($order->customer_email ?? null, FILTER_VALIDATE_EMAIL)
            || ($customer && ! StorefrontNotificationPreferences::wants($customer, 'orders', 'email'))) {
            return;
        }

        Notification::route('mail', $order->customer_email)->notify(new OrderShipmentNotification(
            (string) $order->customer_name,
            (string) $order->code,
            $trackingCode,
            $signature,
        ));
    }

    public static function becameLowStock(int $variantId, int $available, int $threshold): void
    {
        $recipients = self::recipients('low_stock_alert_recipients');
        $item = DB::table('product_variants as variants')
            ->join('products', 'products.id', '=', 'variants.product_id')
            ->where('variants.id', $variantId)->whereNull('products.deleted_at')
            ->first(['products.name as product_name', 'variants.sku']);
        if (! $item) {
            return;
        }

        AdminNotificationDispatcher::send(
            'low_stock',
            'inventory.view',
            'Sắp hết hàng: '.$item->sku,
            "{$item->product_name} còn {$available} sản phẩm, ngưỡng cảnh báo là {$threshold}.",
            '/?page=inventory&inventory_q='.urlencode($item->sku),
        );

        if (! $recipients) {
            return;
        }

        Notification::route('mail', $recipients)->notify(new StoreOperationalAlertNotification(
            'Tồn kho sắp hết: '.$item->sku,
            "Sản phẩm: {$item->product_name}\nSKU: {$item->sku}\nKhả dụng: {$available}\nNgưỡng cảnh báo: {$threshold}",
        ));
    }

    /** @return list<string> */
    private static function recipients(string $setting): array
    {
        $value = (string) (DB::table('settings')->where('key', $setting)->value('value') ?? '');

        return array_values(array_unique(array_filter(array_map('trim', preg_split('/[,;\s]+/', $value) ?: []), fn (string $email): bool => filter_var($email, FILTER_VALIDATE_EMAIL) !== false)));
    }
}
