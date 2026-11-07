<?php

namespace App\Modules\Marketing\Actions;

use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendStoreContactMessageAction
{
    private const TOPICS = [
        'product' => 'Tư vấn sản phẩm',
        'order' => 'Đơn hàng',
        'return' => 'Đổi trả và bảo hành',
        'cooperation' => 'Hợp tác',
        'other' => 'Nội dung khác',
    ];

    public function execute(array $data): bool
    {
        $settings = Setting::query()->whereIn('key', ['support_email', 'store_email', 'store_name'])->pluck('value', 'key');
        $recipient = trim((string) ($settings['support_email'] ?? '')) ?: trim((string) ($settings['store_email'] ?? ''));
        if ($recipient === '') {
            return false;
        }

        $storeName = trim((string) ($settings['store_name'] ?? 'Sarada')) ?: 'Sarada';
        $storeName = preg_replace('/[\r\n]+/', ' ', $storeName) ?: 'Sarada';
        $topic = self::TOPICS[$data['topic']] ?? self::TOPICS['other'];
        $body = implode("\n", [
            'Cửa hàng nhận được yêu cầu liên hệ mới.',
            '',
            'Họ tên: '.$data['name'],
            'Số điện thoại: '.$data['phone'],
            'Email: '.$data['email'],
            'Chủ đề: '.$topic,
            'Mã đơn hàng: '.($data['order_code'] ?? 'Không cung cấp'),
            '',
            'Nội dung:',
            $data['message'],
        ]);

        try {
            Mail::raw($body, function ($mail) use ($data, $recipient, $storeName, $topic): void {
                $replyName = preg_replace('/[\r\n]+/', ' ', $data['name']) ?: 'Khách hàng';
                $mail->to($recipient)
                    ->replyTo($data['email'], $replyName)
                    ->subject('['.$storeName.'] Liên hệ: '.$topic);

                if (($data['attachment'] ?? null) instanceof UploadedFile) {
                    $attachment = $data['attachment'];
                    $mime = $attachment->getMimeType() ?: 'application/octet-stream';
                    $extension = match ($mime) {
                        'image/jpeg' => 'jpg',
                        'image/png' => 'png',
                        'image/webp' => 'webp',
                        default => 'bin',
                    };

                    $mail->attachData($attachment->get(), 'contact-attachment.'.$extension, ['mime' => $mime]);
                }
            });
        } catch (Throwable $exception) {
            Log::warning('Storefront contact message email could not be delivered.', ['exception' => $exception::class]);

            return false;
        }

        return true;
    }
}
