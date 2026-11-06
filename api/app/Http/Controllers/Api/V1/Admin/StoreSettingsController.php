<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\SaveStoreSettingsRequest;
use App\Http\Requests\Api\V1\Admin\TestStoreEmailRequest;
use App\Models\Setting;
use App\Models\User;
use App\Support\StorefrontHomeSections;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class StoreSettingsController extends Controller
{
    private const DEFAULTS = [
        'store_name' => 'Sarada', 'store_logo' => '', 'store_favicon' => '', 'store_email' => '', 'store_phone' => '', 'store_address' => '', 'business_hours' => '',
        'support_email' => '', 'support_phone' => '', 'support_hours' => '',
        'newsletter_welcome_coupon_code' => '',
        'default_shipping_fee' => 30000, 'free_shipping_threshold' => 1500000, 'low_stock_threshold' => 5,
        'seo_title' => '', 'seo_description' => '', 'social_facebook' => '', 'social_instagram' => '', 'social_tiktok' => '', 'social_zalo' => '', 'social_zalo_oa_id' => '',
        'instagram_posts' => [],
        'seo_og_image' => '', 'seo_analytics_id' => '',
        'payment_cod_enabled' => true, 'payment_bank_transfer_enabled' => false, 'payment_vnpay_enabled' => false, 'payment_momo_enabled' => false, 'payment_stripe_enabled' => false,
        'payment_bank_bin' => '', 'payment_bank_name' => '', 'payment_bank_account' => '', 'payment_bank_holder' => '', 'payment_bank_note' => '',
        'payment_cancel_unpaid_after_hours' => 24,
        'mail_from_name' => 'Sarada', 'mail_from_address' => '',
        'email_order_subject' => 'Xác nhận đơn hàng {order_code} - {store_name}', 'email_order_body' => 'Xin chào {customer_name}, cửa hàng đã nhận đơn hàng {order_code} với tổng tiền {order_total}.',
        'email_shipment_subject' => 'Đơn hàng {order_code} đang được giao', 'email_shipment_body' => 'Đơn hàng {order_code} đã được gửi đi. Mã vận đơn: {tracking_code}.',
        'email_password_reset_subject' => 'Đặt lại mật khẩu {store_name}', 'email_password_reset_body' => 'Bạn vừa yêu cầu đặt lại mật khẩu tại {store_name}. Liên kết có hiệu lực trong 60 phút.',
        'email_invitation_subject' => 'Lời mời tham gia {store_name}', 'email_invitation_body' => 'Bạn được mời tham gia {store_name} với vai trò {role}. Liên kết hết hạn lúc {expires_at}.',
        'new_order_alert_recipients' => '', 'low_stock_alert_recipients' => '',
        'maintenance_enabled' => false, 'maintenance_message' => 'Cửa hàng đang được bảo trì. Vui lòng quay lại sau.', 'maintenance_expected_until' => '',
        'password_min_length' => 10, 'password_require_letter' => true, 'password_require_number' => true, 'password_require_special' => false,
        'public_registration_enabled' => false, 'two_factor_required_roles' => [], 'session_duration_days' => 14, 'login_max_attempts' => 5,
        'security.allow_non_expiring_api_tokens' => false,
        'security.password_max_age_days' => 0,
        'activity.retention_days' => 365,
    ];

    public function show(): JsonResponse
    {
        $settings = Setting::query()->whereIn('key', [...array_keys(self::DEFAULTS), 'home_sections'])->pluck('value', 'key')->all();
        $defaults = self::DEFAULTS;
        $defaults['home_sections'] = StorefrontHomeSections::defaults();
        $data = [];
        foreach ($defaults as $key => $default) {
            $value = $settings[$key] ?? config('store.'.$key, $default);
            $data[$key] = $key === 'home_sections'
                ? StorefrontHomeSections::normalize($value)
                : (is_int($default) ? (int) $value : (is_bool($default) ? filter_var($value, FILTER_VALIDATE_BOOLEAN) : (is_array($default) ? (is_array($value) ? $value : (json_decode((string) $value, true) ?: [])) : $value)));
        }
        $data['timezone'] = (string) config('app.timezone');
        $data['password_max_age_days'] = $data['security.password_max_age_days'];
        $data['activity_retention_days'] = $data['activity.retention_days'];

        return response()->json(['data' => $data]);
    }

    public function update(SaveStoreSettingsRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (array_key_exists('two_factor_required_roles', $data) && $data['two_factor_required_roles']) {
            $notEnrolled = User::query()->where('status', 'active')
                ->whereHas('roles', fn ($query) => $query->whereIn('name', $data['two_factor_required_roles']))
                ->whereNull('two_factor_enabled_at')->exists();
            if ($notEnrolled) {
                throw ValidationException::withMessages([
                    'two_factor_required_roles' => 'Tất cả nhân viên thuộc vai trò đã chọn phải bật xác thực hai bước trước khi áp dụng chính sách.',
                ]);
            }
        }
        $settings = $request->validated();
        if (array_key_exists('allow_non_expiring_api_tokens', $settings)) {
            $settings['security.allow_non_expiring_api_tokens'] = $settings['allow_non_expiring_api_tokens'];
            unset($settings['allow_non_expiring_api_tokens']);
        }
        if (array_key_exists('password_max_age_days', $settings)) {
            $settings['security.password_max_age_days'] = $settings['password_max_age_days'];
            unset($settings['password_max_age_days']);
        }
        if (array_key_exists('activity_retention_days', $settings)) {
            $settings['activity.retention_days'] = $settings['activity_retention_days'];
            unset($settings['activity_retention_days']);
        }
        DB::transaction(function () use ($settings): void {
            foreach ($settings as $key => $value) {
                Setting::query()->updateOrCreate(['key' => $key], ['value' => $value === null ? null : (is_array($value) ? json_encode($value, JSON_THROW_ON_ERROR) : (string) $value)]);
            }
        });

        return $this->show();
    }

    public function sendTestEmail(TestStoreEmailRequest $request): JsonResponse
    {
        $data = $request->validated();
        $settings = Setting::query()->whereIn('key', array_keys(self::DEFAULTS))->pluck('value', 'key');
        $type = $data['template'];
        $subject = (string) ($settings['email_'.$type.'_subject'] ?? self::DEFAULTS['email_'.$type.'_subject']);
        $body = (string) ($settings['email_'.$type.'_body'] ?? self::DEFAULTS['email_'.$type.'_body']);
        $values = [
            '{store_name}' => (string) ($settings['store_name'] ?? self::DEFAULTS['store_name']),
            '{customer_name}' => 'Khách hàng thử nghiệm', '{order_code}' => 'DH-TEST-0001',
            '{order_total}' => '1.250.000 ₫', '{tracking_code}' => 'TEST123456',
            '{role}' => 'Nhân viên', '{expires_at}' => now()->addDay()->format('d/m/Y H:i'),
            '{reset_url}' => rtrim((string) config('app.frontend_url'), '/').'/reset-password/demo?email='.urlencode($data['email']),
            '{invite_url}' => rtrim((string) config('app.admin_url'), '/').'/accept-invite/demo-token',
        ];
        $subject = strtr($subject, $values);
        $body = strtr($body, $values);
        $fromAddress = trim((string) ($settings['mail_from_address'] ?? ''));
        $fromName = trim((string) ($settings['mail_from_name'] ?? ''));

        Mail::raw($body, function ($message) use ($data, $subject, $fromAddress, $fromName): void {
            $message->to($data['email'])->subject($subject);
            if ($fromAddress !== '') {
                $message->from($fromAddress, $fromName !== '' ? $fromName : null);
            }
        });

        return response()->json(['message' => 'Đã gửi email thử nghiệm.']);
    }
}
