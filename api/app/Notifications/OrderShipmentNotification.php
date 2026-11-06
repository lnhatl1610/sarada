<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderShipmentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $customerName, private readonly string $orderCode, private readonly ?string $trackingCode, private readonly ?string $signature = null)
    {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $template = StoreEmailTemplates::render('shipment', 'Đơn hàng {order_code} đang được giao', 'Đơn hàng {order_code} đã được gửi đi. Mã vận đơn: {tracking_code}.', [
            '{customer_name}' => $this->customerName,
            '{order_code}' => $this->orderCode,
            '{tracking_code}' => $this->trackingCode ?: 'Đang cập nhật',
        ]);

        return StoreEmailTemplates::addBody(
            StoreEmailTemplates::applySender(new MailMessage)->subject($template['subject'])->greeting('Xin chào '.$this->customerName),
            $template['body'].($this->signature !== null && trim($this->signature) !== '' ? "\n\n".trim($this->signature) : ''),
        );
    }
}
