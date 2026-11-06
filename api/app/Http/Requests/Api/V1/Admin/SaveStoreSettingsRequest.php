<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Coupon;
use App\Models\Role;
use App\Support\StorefrontHomeSections;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SaveStoreSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->has('allow_non_expiring_api_tokens')
                && ! $this->user()?->roles()->where('name', 'super_admin')->exists()) {
                $validator->errors()->add('allow_non_expiring_api_tokens', 'Chỉ chủ cửa hàng được thay đổi chính sách token không hết hạn.');
            }
            if ($this->has('password_max_age_days')
                && ! $this->user()?->roles()->where('name', 'super_admin')->exists()) {
                $validator->errors()->add('password_max_age_days', 'Chỉ chủ cửa hàng được thay đổi thời hạn mật khẩu.');
            }

            $bankSettings = DB::table('settings')->whereIn('key', [
                'payment_bank_transfer_enabled', 'payment_bank_bin', 'payment_bank_name', 'payment_bank_account', 'payment_bank_holder',
            ])->pluck('value', 'key')->all();
            $bankSettings = array_replace($bankSettings, $this->only([
                'payment_bank_transfer_enabled', 'payment_bank_bin', 'payment_bank_name', 'payment_bank_account', 'payment_bank_holder',
            ]));
            if (filter_var($bankSettings['payment_bank_transfer_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                foreach (['payment_bank_name', 'payment_bank_account', 'payment_bank_holder'] as $field) {
                    if (trim((string) ($bankSettings[$field] ?? '')) === '') {
                        $validator->errors()->add($field, 'Nhập đầy đủ thông tin ngân hàng trước khi bật chuyển khoản.');
                    }
                }
                if (! preg_match('/^\d{6}$/', (string) ($bankSettings['payment_bank_bin'] ?? ''))) {
                    $validator->errors()->add('payment_bank_bin', 'Mã BIN ngân hàng phải gồm đúng 6 chữ số trước khi bật chuyển khoản/QR.');
                }
            }
        });
    }

    public function rules(): array
    {
        return [
            'store_name' => ['sometimes', 'string', 'max:120'],
            'home_sections' => ['sometimes', 'array', 'size:'.count(StorefrontHomeSections::KEYS), function (string $attribute, mixed $value, \Closure $fail): void {
                if (! is_array($value)) {
                    return;
                }

                $keys = array_column(array_filter($value, 'is_array'), 'key');
                if (count(array_unique($keys)) !== count(StorefrontHomeSections::KEYS)
                    || array_diff(StorefrontHomeSections::KEYS, $keys) !== []
                    || ! collect($value)->contains(fn (mixed $section): bool => is_array($section) && filter_var($section['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN))) {
                    $fail('The home sections must include every supported section once and keep at least one section enabled.');
                }
            }],
            'home_sections.*' => ['required', 'array:key,enabled'],
            'home_sections.*.key' => ['required', 'string', 'distinct', Rule::in(StorefrontHomeSections::KEYS)],
            'home_sections.*.enabled' => ['required', 'boolean'],
            'store_logo' => ['sometimes', 'nullable', 'url', 'max:500'],
            'store_favicon' => ['sometimes', 'nullable', 'url', 'max:500'],
            'store_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'store_phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'store_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'business_hours' => ['sometimes', 'nullable', 'string', 'max:500'],
            'support_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'support_phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'support_hours' => ['sometimes', 'nullable', 'string', 'max:500'],
            'newsletter_welcome_coupon_code' => ['sometimes', 'nullable', 'string', 'max:64', $this->availableWelcomeCoupon()],
            'default_shipping_fee' => ['sometimes', 'integer', 'min:0', 'max:100000000'],
            'free_shipping_threshold' => ['sometimes', 'integer', 'min:0', 'max:1000000000'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'seo_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'seo_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'seo_og_image' => ['sometimes', 'nullable', 'url', 'max:500'],
            'seo_analytics_id' => ['sometimes', 'nullable', 'regex:/^G-[A-Z0-9]{6,20}$/i'],
            'social_facebook' => ['sometimes', 'nullable', 'url', 'max:500'],
            'social_instagram' => ['sometimes', 'nullable', 'url', 'max:500'],
            'instagram_posts' => ['sometimes', 'array', 'max:6'],
            'instagram_posts.*' => ['required', 'array:post_url,image_url,alt'],
            'instagram_posts.*.post_url' => ['required', 'url', 'max:500', 'regex:/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/i'],
            'instagram_posts.*.image_url' => ['required', 'url', 'regex:/^https?:\/\//i', 'max:500'],
            'instagram_posts.*.alt' => ['required', 'string', 'max:180'],
            'social_tiktok' => ['sometimes', 'nullable', 'url', 'max:500'],
            'social_zalo' => ['sometimes', 'nullable', 'url', 'max:500'],
            'social_zalo_oa_id' => ['sometimes', 'nullable', 'string', 'regex:/^\d{1,32}$/'],
            'payment_cod_enabled' => ['sometimes', 'boolean'],
            'payment_bank_transfer_enabled' => ['sometimes', 'boolean'],
            'payment_vnpay_enabled' => ['sometimes', 'boolean'],
            'payment_momo_enabled' => ['sometimes', 'boolean'],
            'payment_stripe_enabled' => ['sometimes', 'boolean'],
            'payment_bank_bin' => ['sometimes', 'nullable', 'regex:/^\d{6}$/'],
            'payment_bank_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'payment_bank_account' => ['sometimes', 'nullable', 'string', 'max:64'],
            'payment_bank_holder' => ['sometimes', 'nullable', 'string', 'max:160'],
            'payment_bank_note' => ['sometimes', 'nullable', 'string', 'max:255'],
            'payment_cancel_unpaid_after_hours' => ['sometimes', 'integer', 'min:0', 'max:720'],
            'mail_from_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'mail_from_address' => ['sometimes', 'nullable', 'email', 'max:255'],
            'email_order_subject' => ['sometimes', 'string', 'max:255'],
            'email_order_body' => ['sometimes', 'string', 'max:5000'],
            'email_shipment_subject' => ['sometimes', 'string', 'max:255'],
            'email_shipment_body' => ['sometimes', 'string', 'max:5000'],
            'email_password_reset_subject' => ['sometimes', 'string', 'max:255'],
            'email_password_reset_body' => ['sometimes', 'string', 'max:5000'],
            'email_invitation_subject' => ['sometimes', 'string', 'max:255'],
            'email_invitation_body' => ['sometimes', 'string', 'max:5000'],
            'new_order_alert_recipients' => ['sometimes', 'nullable', 'string', 'max:2000', $this->validEmailList()],
            'low_stock_alert_recipients' => ['sometimes', 'nullable', 'string', 'max:2000', $this->validEmailList()],
            'maintenance_enabled' => ['sometimes', 'boolean'],
            'maintenance_message' => ['sometimes', 'string', 'max:500'],
            'maintenance_expected_until' => ['sometimes', 'nullable', 'date'],
            'password_min_length' => ['sometimes', 'integer', 'min:8', 'max:64'],
            'password_max_age_days' => ['sometimes', 'integer', 'min:0', 'max:3650'],
            'activity_retention_days' => ['sometimes', 'integer', 'min:30', 'max:3650'],
            'password_require_letter' => ['sometimes', 'boolean'],
            'password_require_number' => ['sometimes', 'boolean'],
            'password_require_special' => ['sometimes', 'boolean'],
            'public_registration_enabled' => ['sometimes', 'boolean'],
            'two_factor_required_roles' => ['sometimes', 'array', 'max:8'],
            'two_factor_required_roles.*' => ['required', 'string', 'distinct', Rule::in(Role::ADMIN_NAMES)],
            'session_duration_days' => ['sometimes', 'integer', 'min:1', 'max:90'],
            'login_max_attempts' => ['sometimes', 'integer', 'min:3', 'max:20'],
            'allow_non_expiring_api_tokens' => ['sometimes', 'boolean'],
        ];
    }

    private function validEmailList(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if ($value === null || trim((string) $value) === '') {
                return;
            }
            foreach (preg_split('/[,;\s]+/', (string) $value) ?: [] as $email) {
                if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                    $fail('Danh sách email chỉ chấp nhận các địa chỉ hợp lệ, ngăn cách bằng dấu phẩy hoặc chấm phẩy.');

                    return;
                }
            }
        };
    }

    private function availableWelcomeCoupon(): \Closure
    {
        return function (string $attribute, mixed $value, \Closure $fail): void {
            if (! is_string($value) || trim($value) === '') {
                return;
            }

            $now = now();
            $available = Coupon::query()->where('code', trim($value))->where('is_active', true)
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
                ->where(fn ($query) => $query->where(fn ($ends) => $ends->whereNotNull('ends_at')->where('ends_at', '>=', $now))
                    ->orWhere(fn ($expires) => $expires->whereNull('ends_at')->where(fn ($fallback) => $fallback->whereNull('expires_at')->orWhere('expires_at', '>=', $now))))
                ->where(fn ($query) => $query->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'))
                ->exists();

            if (! $available) {
                $fail('Chọn mã ưu đãi đang hoạt động, còn hạn và còn lượt dùng.');
            }
        };
    }
}
