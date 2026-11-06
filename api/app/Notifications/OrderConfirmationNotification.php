<?php

namespace App\Notifications;

use App\Support\StoreEmailTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param array<string, string>|null $bankTransferInstructions */
    public function __construct(
        private readonly string $customerName,
        private readonly string $orderCode,
        private readonly int $orderTotal,
        private readonly ?string $signature = null,
        private readonly ?array $bankTransferInstructions = null,
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $template = StoreEmailTemplates::render('order', 'Xác nhận đơn hàng {order_code} - {store_name}', 'Xin chào {customer_name}, cửa hàng đã nhận đơn hàng {order_code} với tổng tiền {order_total}.', [
            '{customer_name}' => $this->customerName,
            '{order_code}' => $this->orderCode,
            '{order_total}' => number_format($this->orderTotal, 0, ',', '.').' ₫',
        ]);

        $paymentDetails = '';
        if ($this->bankTransferInstructions !== null) {
            $paymentDetails = "\n\nThanh toán chuyển khoản ngân hàng:\n"
                .'Ngân hàng: '.($this->bankTransferInstructions['name'] ?? '')."\n"
                .'Số tài khoản: '.($this->bankTransferInstructions['account'] ?? '')."\n"
                .'Chủ tài khoản: '.($this->bankTransferInstructions['holder'] ?? '')."\n"
                .'Số tiền: '.number_format($this->orderTotal, 0, ',', '.')." ₫\n"
                .'Nội dung chuyển khoản: '.($this->bankTransferInstructions['transfer_content'] ?? '')."\n"
                .'Cửa hàng sẽ xác nhận sau khi đối soát giao dịch.';
            if (trim((string) ($this->bankTransferInstructions['note'] ?? '')) !== '') {
                $paymentDetails .= "\nLưu ý: ".trim($this->bankTransferInstructions['note']);
            }
        }

        return StoreEmailTemplates::addBody(
            StoreEmailTemplates::applySender(new MailMessage)->subject($template['subject'])->greeting('Xin chào '.$this->customerName),
            $template['body'].$paymentDetails.($this->signature !== null && trim($this->signature) !== '' ? "\n\n".trim($this->signature) : ''),
        );
    }
}
