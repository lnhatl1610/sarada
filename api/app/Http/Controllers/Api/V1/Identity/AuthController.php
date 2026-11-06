<?php

namespace App\Http\Controllers\Api\V1\Identity;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ChangeAdminPasswordRequest;
use App\Http\Requests\Api\V1\Identity\ForgotPasswordRequest;
use App\Http\Requests\Api\V1\Identity\LoginRequest;
use App\Http\Requests\Api\V1\Identity\PasskeyLoginRequest;
use App\Http\Requests\Api\V1\Identity\RegisterRequest;
use App\Http\Requests\Api\V1\Identity\ResendVerificationRequest;
use App\Http\Requests\Api\V1\Identity\ResetPasswordRequest;
use App\Http\Requests\Api\V1\Identity\StorefrontLoginRequest;
use App\Http\Requests\Api\V1\Identity\VerifyAdminTwoFactorLoginRequest;
use App\Models\Coupon;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Modules\Identity\Actions\ChangeAdminPasswordAction;
use App\Modules\Identity\Actions\IssueAccessTokenAction;
use App\Modules\Identity\Actions\IssueStorefrontPasskeySessionAction;
use App\Modules\Identity\Services\StorefrontPasskeyService;
use App\Modules\Marketing\Actions\SubscribeToNewsletterAction;
use App\Notifications\AccountPasswordChangedNotification;
use App\Notifications\PasswordResetNotification;
use App\Support\AdminSecurityAlerts;
use App\Support\StorefrontHomeSections;
use App\Support\StorefrontPaymentConfiguration;
use App\Support\StorePasswordPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Cookie;

class AuthController extends Controller
{
    public function registrationStatus(): JsonResponse
    {
        $enabled = filter_var(Setting::query()->where('key', 'public_registration_enabled')->value('value') ?? config('store.public_registration_enabled', false), FILTER_VALIDATE_BOOLEAN);
        $maintenanceEnabled = filter_var(Setting::query()->where('key', 'maintenance_enabled')->value('value') ?? 'false', FILTER_VALIDATE_BOOLEAN);
        $maintenanceMessage = Setting::query()->where('key', 'maintenance_message')->value('value') ?? 'Cửa hàng đang được bảo trì. Vui lòng quay lại sau.';
        $maintenanceUntil = Setting::query()->where('key', 'maintenance_expected_until')->value('value');
        $welcomeCouponCode = trim((string) Setting::query()->where('key', 'newsletter_welcome_coupon_code')->value('value'));
        $welcomeOfferEnabled = $welcomeCouponCode !== '' && $this->hasAvailableNewsletterWelcomeCoupon($welcomeCouponCode);
        $publicSettings = Setting::query()->whereIn('key', ['store_name', 'store_logo', 'store_email', 'store_phone', 'store_address', 'business_hours', 'support_email', 'support_phone', 'support_hours', 'seo_title', 'seo_description', 'seo_og_image', 'seo_analytics_id', 'store_favicon', 'social_facebook', 'social_instagram', 'social_tiktok', 'social_zalo', 'social_zalo_oa_id', 'payment_cod_enabled', 'free_shipping_threshold', 'home_sections', 'instagram_posts'])->pluck('value', 'key');

        return response()->json(['data' => [
            'public_registration_enabled' => $enabled,
            'maintenance_enabled' => $maintenanceEnabled,
            'maintenance_message' => $maintenanceMessage,
            'maintenance_expected_until' => $maintenanceUntil,
            'store_name' => $publicSettings['store_name'] ?? 'Sarada',
            'store_logo' => $publicSettings['store_logo'] ?? '',
            'seo_title' => $publicSettings['seo_title'] ?? '',
            'seo_description' => $publicSettings['seo_description'] ?? '',
            'seo_og_image' => $publicSettings['seo_og_image'] ?? '',
            'seo_analytics_id' => $publicSettings['seo_analytics_id'] ?? '',
            'store_favicon' => $publicSettings['store_favicon'] ?? '',
            'social_zalo_oa_id' => $publicSettings['social_zalo_oa_id'] ?? '',
            'store_email' => $publicSettings['store_email'] ?? '',
            'store_phone' => $publicSettings['store_phone'] ?? '',
            'store_address' => $publicSettings['store_address'] ?? '',
            'business_hours' => $publicSettings['business_hours'] ?? '',
            'support_email' => $publicSettings['support_email'] ?? '',
            'support_phone' => $publicSettings['support_phone'] ?? '',
            'support_hours' => $publicSettings['support_hours'] ?? '',
            'contact_form_enabled' => trim((string) ($publicSettings['support_email'] ?? '')) !== '' || trim((string) ($publicSettings['store_email'] ?? '')) !== '',
            'sms_stock_alerts_enabled' => (bool) config('services.twilio.stock_alerts_enabled'),
            'newsletter_welcome_offer_enabled' => $welcomeOfferEnabled,
            'social_facebook' => $publicSettings['social_facebook'] ?? '',
            'social_instagram' => $publicSettings['social_instagram'] ?? '',
            'social_tiktok' => $publicSettings['social_tiktok'] ?? '',
            'social_zalo' => $publicSettings['social_zalo'] ?? '',
            'payment_cod_enabled' => filter_var($publicSettings['payment_cod_enabled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'payment_bank_transfer_enabled' => app(StorefrontPaymentConfiguration::class)->bankTransferAvailable(),
            'free_shipping_threshold' => (int) ($publicSettings['free_shipping_threshold'] ?? config('store.free_shipping_threshold', 1500000)),
            'home_sections' => StorefrontHomeSections::normalize($publicSettings['home_sections'] ?? null),
            'instagram_posts' => $this->decodeInstagramPosts($publicSettings['instagram_posts'] ?? null),
            'password_policy' => StorePasswordPolicy::configuration(),
        ]]);
    }

    private function hasAvailableNewsletterWelcomeCoupon(string $code): bool
    {
        $now = now();

        return Coupon::query()->where('code', $code)->where('is_active', true)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($query) => $query->where(fn ($ends) => $ends->whereNotNull('ends_at')->where('ends_at', '>=', $now))
                ->orWhere(fn ($expires) => $expires->whereNull('ends_at')->where(fn ($fallback) => $fallback->whereNull('expires_at')->orWhere('expires_at', '>=', $now))))
            ->where(fn ($query) => $query->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'))
            ->exists();
    }

    private function decodeInstagramPosts(mixed $value): array
    {
        if (! is_string($value)) {
            return [];
        }

        $posts = json_decode($value, true);

        if (! is_array($posts) || ! array_is_list($posts)) {
            return [];
        }

        return array_values(array_filter(array_slice($posts, 0, 6), static function (mixed $post): bool {
            return is_array($post)
                && isset($post['post_url'], $post['image_url'], $post['alt'])
                && is_string($post['post_url'])
                && preg_match('/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/i', $post['post_url']) === 1
                && is_string($post['image_url']) && preg_match('/^https?:\/\//i', $post['image_url']) === 1 && filter_var($post['image_url'], FILTER_VALIDATE_URL)
                && is_string($post['alt']) && trim($post['alt']) !== '';
        }));
    }

    public function resendRegistrationVerification(ResendVerificationRequest $request): JsonResponse
    {
        $user = User::query()->where('email', Str::lower($request->validated('email')))->where('status', 'pending_approval')->first();
        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json(['message' => 'Nếu tài khoản cần xác minh, email mới đã được gửi.']);
    }

    public function register(RegisterRequest $request, SubscribeToNewsletterAction $newsletter): JsonResponse
    {
        $registrationEnabled = filter_var(Setting::query()->where('key', 'public_registration_enabled')->value('value') ?? config('store.public_registration_enabled', false), FILTER_VALIDATE_BOOLEAN);
        abort_unless($registrationEnabled, 403, 'Đăng ký công khai hiện đang tắt. Vui lòng liên hệ cửa hàng để được hỗ trợ.');
        $data = $request->validated();

        $marketingConsent = (bool) ($data['marketing_consent'] ?? false);
        unset($data['terms'], $data['marketing_consent']);
        $user = DB::transaction(function () use ($data, $marketingConsent, $newsletter): User {
            $user = User::query()->create($data + ['status' => 'pending_approval']);
            $user->roles()->syncWithoutDetaching([Role::query()->firstOrCreate(['name' => 'customer', 'guard_name' => 'api'])->id]);
            if ($marketingConsent) {
                $newsletter->execute($user->email);
            }

            return $user;
        });
        $user->sendEmailVerificationNotification();

        return response()->json([
            'data' => ['email' => $user->email, 'status' => $user->status],
            'message' => 'Đã tạo tài khoản. Hãy xác minh email; sau đó chủ cửa hàng sẽ duyệt quyền truy cập.',
        ], 202);
    }

    public function storefrontLogin(StorefrontLoginRequest $request, IssueAccessTokenAction $issueAccessToken): JsonResponse
    {
        return $this->login($request, 'storefront', $issueAccessToken);
    }

    public function storefrontPasskeyOptions(StorefrontPasskeyService $passkeys): JsonResponse
    {
        return response()->json(['data' => $passkeys->loginOptions()]);
    }

    public function storefrontPasskeyLogin(
        PasskeyLoginRequest $request,
        StorefrontPasskeyService $passkeys,
        IssueStorefrontPasskeySessionAction $issueSession,
    ): JsonResponse {
        $data = $request->validated();
        $user = $passkeys->authenticate($data['challenge_id'], $data['credential']);
        $issued = $issueSession->execute($user, $request);

        return response()->json([
            'data' => [
                'user' => $this->userData($user),
                'access_token' => $issued['access_token'],
                'token_type' => 'Bearer',
                'expires_in' => (int) config('jwt.ttl', 15) * 60,
            ],
        ])->withCookie($issued['cookie']);
    }

    public function adminLogin(LoginRequest $request, IssueAccessTokenAction $issueAccessToken): JsonResponse
    {
        return $this->login($request, 'admin', $issueAccessToken);
    }

    public function verifyAdminTwoFactor(VerifyAdminTwoFactorLoginRequest $request, IssueAccessTokenAction $issueAccessToken): JsonResponse
    {
        $data = $request->validated();
        $challengeHash = hash('sha256', $data['challenge_token']);
        try {
            $result = DB::transaction(function () use ($request, $data, $challengeHash, $issueAccessToken): array {
                $challenge = DB::table('two_factor_challenges')->where('token_hash', $challengeHash)->lockForUpdate()->first();
                if (! $challenge || $challenge->audience !== 'admin' || $challenge->used_at !== null || now()->greaterThan(Carbon::parse($challenge->expires_at))) {
                    throw ValidationException::withMessages(['code' => 'Yêu cầu xác thực đã hết hạn. Hãy đăng nhập lại.']);
                }

                $user = User::query()->find($challenge->user_id);
                if (! $user || $user->status !== 'active' || ! $user->isAdmin() || ! $user->two_factor_enabled_at || ! $user->two_factor_secret) {
                    throw ValidationException::withMessages(['code' => 'Không thể xác thực yêu cầu đăng nhập này.']);
                }

                if (isset($data['code'])) {
                    $valid = app('pragmarx.google2fa')->verifyKey($user->two_factor_secret, $data['code']);
                } else {
                    $codes = $user->two_factor_recovery_codes ?? [];
                    $index = null;
                    foreach ($codes as $i => $hashedCode) {
                        if (Hash::check($data['recovery_code'], $hashedCode)) {
                            $index = $i;
                            break;
                        }
                    }
                    $valid = $index !== null;
                    if ($valid) {
                        unset($codes[$index]);
                        $user->forceFill(['two_factor_recovery_codes' => array_values($codes)])->save();
                    }
                }

                if (! $valid) {
                    throw ValidationException::withMessages(['code' => 'Mã xác thực không hợp lệ.']);
                }

                DB::table('two_factor_challenges')->where('token_hash', $challengeHash)->update(['used_at' => now(), 'updated_at' => now()]);
                $issued = $this->issue($user, 'admin', $request, $issueAccessToken);
                $this->recordSuccessfulAdminLogin($request, $user);

                return ['user' => $user, 'issued' => $issued];
            });
        } catch (ValidationException $exception) {
            $challenge = DB::table('two_factor_challenges')->where('token_hash', $challengeHash)->where('audience', 'admin')->first();
            $failedUser = $challenge ? User::query()->find($challenge->user_id) : null;
            if ($failedUser?->isAdmin()) {
                $this->recordAdminLoginAttempt($request, $failedUser, $failedUser->email, 'bad_2fa');
            }
            throw $exception;
        }
        $issued = $result['issued'];

        return response()->json(['data' => [
            'user' => $this->userData($result['user']),
            'access_token' => $issued['access_token'], 'token_type' => 'Bearer', 'expires_in' => (int) config('jwt.ttl', 15) * 60,
        ]])->withCookie($issued['cookie']);
    }

    public function storefrontRefresh(Request $request, IssueAccessTokenAction $issueAccessToken): JsonResponse
    {
        return $this->refresh($request, 'storefront', $issueAccessToken);
    }

    public function adminRefresh(Request $request, IssueAccessTokenAction $issueAccessToken): JsonResponse
    {
        return $this->refresh($request, 'admin', $issueAccessToken);
    }

    public function storefrontLogout(Request $request): JsonResponse
    {
        return $this->logout($request, 'storefront');
    }

    public function adminLogout(Request $request): JsonResponse
    {
        return $this->logout($request, 'admin');
    }

    public function adminLogoutAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $accessTokenIds = DB::table('refresh_tokens')->where('user_id', $user->id)->where('audience', 'admin')
            ->whereNotNull('access_token_id')->pluck('access_token_id');

        DB::transaction(function () use ($request, $user, $accessTokenIds): void {
            DB::table('refresh_tokens')->where('user_id', $user->id)->where('audience', 'admin')->whereNull('revoked_at')
                ->update(['revoked_at' => now(), 'updated_at' => now()]);
            $user->tokens()->whereIn('id', $accessTokenIds)->delete();
            $this->recordAdminAuthActivity($request, $user, 'LOGOUT_ALL');
        });

        return response()->json(['message' => 'Đã đăng xuất mọi thiết bị quản trị.'])->withCookie($this->clearRefreshCookie('admin'));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $email = Str::lower($data['email']);
        $user = User::query()->where('email', $email)->first();
        if ($user) {
            $plain = Str::random(64);
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            DB::table('password_reset_tokens')->insert([
                'email' => $email,
                'token' => Hash::make($plain),
                'created_at' => now(),
            ]);
            // Mail delivery is configured by the deployment; the token is intentionally never returned in this response.
            $user->notify(new PasswordResetNotification($plain));
        }

        return response()->json(['message' => 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.']);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $email = Str::lower($data['email']);
        $record = DB::table('password_reset_tokens')->where('email', $email)->first();
        if (! $record || ! Hash::check($data['token'], $record->token) || now()->greaterThan(now()->parse($record->created_at)->addMinutes(60))) {
            throw ValidationException::withMessages(['token' => 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.']);
        }
        $user = User::query()->where('email', $email)->firstOrFail();
        DB::transaction(function () use ($user, $data, $email): void {
            $user->forceFill(['password' => $data['password'], 'password_changed_at' => now()])->save();
            DB::table('personal_access_tokens')->where('tokenable_type', User::class)->where('tokenable_id', $user->id)->delete();
            DB::table('refresh_tokens')->where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
            DB::table('password_reset_tokens')->where('email', $email)->delete();
        });

        return response()->json(['message' => 'Đã đặt lại mật khẩu. Vui lòng đăng nhập lại.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles.permissions');
        $permissions = $user->roles->flatMap(fn ($role) => $role->permissions->pluck('name'))->unique()->values();

        return response()->json(['data' => [
            'user' => $this->userData($user),
            'roles' => $user->roles->pluck('name')->values(),
            'permissions' => $permissions,
        ]]);
    }

    public function adminMe(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles.permissions');
        $permissions = collect($user->adminPermissionNames());
        $settings = Setting::query()->whereIn('key', ['store_name', 'store_logo'])->pluck('value', 'key');

        return response()->json(['data' => [
            'user' => [...$this->userData($user), 'timezone' => $user->timezone, 'must_change_password' => (bool) $user->must_change_password],
            'roles' => $user->roles->pluck('name')->values(),
            'permissions' => $permissions,
            'store' => [
                'store_name' => $settings->get('store_name') ?? 'Sarada',
                'store_logo' => $settings->get('store_logo') ?? '',
            ],
        ]]);
    }

    public function changeAdminPassword(ChangeAdminPasswordRequest $request, ChangeAdminPasswordAction $changePassword): JsonResponse
    {
        $data = $request->validated();
        $logoutOtherDevices = $data['logout_other_devices'] ?? true;
        $changePassword->execute($request->user(), $data['current_password'] ?? null, $data['password'], $request->user()->currentAccessToken()?->id, $logoutOtherDevices, $request->attributes->get('sudo_mode_active') === true);
        $request->user()->notify(new AccountPasswordChangedNotification($logoutOtherDevices));
        AdminSecurityAlerts::send($request->user(), 'credentials_changed', 'Mật khẩu quản trị đã thay đổi', 'Mật khẩu tài khoản quản trị vừa được thay đổi.', true, false);

        return response()->json(['message' => $logoutOtherDevices
            ? 'Đã đổi mật khẩu. Các phiên khác đã đăng xuất.'
            : 'Đã đổi mật khẩu. Các phiên khác vẫn được giữ đăng nhập.']);
    }

    private function login(LoginRequest|StorefrontLoginRequest $request, string $audience, IssueAccessTokenAction $issueAccessToken): JsonResponse
    {
        $data = $request->validated();
        $identityField = $audience === 'storefront' ? 'identifier' : 'email';
        $identity = $data[$identityField];
        $email = $audience === 'admin' ? Str::lower($identity) : $identity;
        $attemptKey = hash('sha256', $email.'|'.$request->ip());
        $failedLoginKey = 'admin-login-failed:'.$attemptKey;
        $lockKey = 'admin-login-lock:'.$attemptKey;

        if ($audience === 'admin' && Cache::has($lockKey)) {
            $this->recordAdminLoginAttempt($request, null, $email, 'locked');

            return $this->adminLoginLockedResponse(max(1, (int) Cache::get($lockKey) - now()->timestamp));
        }

        $isEmail = filter_var($identity, FILTER_VALIDATE_EMAIL) !== false;
        $user = User::query()->where($audience === 'admin' || $isEmail ? 'email' : 'phone', $email)->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            if ($audience === 'admin') {
                $this->recordAdminLoginAttempt($request, $user, $email, 'bad_password');
                RateLimiter::hit($failedLoginKey, 900);

                if (RateLimiter::tooManyAttempts($failedLoginKey, 5)) {
                    $lockedUntil = now()->addMinutes(15);
                    Cache::put($lockKey, $lockedUntil->timestamp, $lockedUntil);
                    if ($user?->isAdmin() && ! Cache::has('admin-security-alert:failed:'.$user->id.':'.$attemptKey)) {
                        Cache::put('admin-security-alert:failed:'.$user->id.':'.$attemptKey, true, $lockedUntil);
                        AdminSecurityAlerts::send($user, 'failed_logins', 'Nhiều lần đăng nhập thất bại', 'Tài khoản quản trị vừa có ít nhất 5 lần đăng nhập sai từ IP '.$request->ip().'.');
                    }
                    RateLimiter::clear($failedLoginKey);
                    $this->recordAdminLoginAttempt($request, $user, $email, 'locked');

                    return $this->adminLoginLockedResponse(900);
                }
            }

            throw ValidationException::withMessages([$identityField => 'Thông tin đăng nhập không chính xác.']);
        }
        if ($audience === 'storefront' && $user->status === 'pending_approval') {
            throw ValidationException::withMessages([$identityField => $user->hasVerifiedEmail() ? 'Tài khoản đang chờ chủ cửa hàng phê duyệt.' : 'Hãy xác minh email trước khi đăng nhập.']);
        }
        if ($user->status !== 'active') {
            if ($audience === 'admin') {
                $this->recordAdminLoginAttempt($request, $user, $email, 'locked');

                return response()->json([
                    'message' => 'Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ quản trị viên.',
                    'data' => ['lock_type' => 'account'],
                ], 423);
            }

            throw ValidationException::withMessages([$identityField => 'Tài khoản không hoạt động. Vui lòng liên hệ quản trị viên.']);
        }
        if ($audience === 'storefront' && ! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([$identityField => 'Hãy xác minh email trước khi đăng nhập.']);
        }
        if ($audience === 'storefront' && ! $isEmail && $user->phone_verified_at === null) {
            throw ValidationException::withMessages([$identityField => 'Số điện thoại chưa được xác minh. Hãy đăng nhập bằng email để xác minh số điện thoại.']);
        }
        if ($audience === 'admin' && ! $user->isAdmin()) {
            $this->recordAdminLoginAttempt($request, $user, $email, 'locked');
            throw ValidationException::withMessages(['email' => 'Bạn không có quyền truy cập trang quản trị.']);
        }

        if ($audience === 'admin') {
            RateLimiter::clear($failedLoginKey);
            Cache::forget($lockKey);
        }

        if ($audience === 'admin') {
            $requiredRoles = json_decode((string) (Setting::query()->where('key', 'two_factor_required_roles')->value('value') ?? '[]'), true) ?: [];
            $matchingRole = $requiredRoles && $user->roles()->whereIn('name', $requiredRoles)->exists();
            if ($matchingRole && (! $user->two_factor_enabled_at || ! $user->two_factor_secret)) {
                throw ValidationException::withMessages(['email' => 'Vai trò tài khoản này yêu cầu bật xác thực hai bước trước khi đăng nhập.']);
            }
        }

        if ($audience === 'admin' && $user->two_factor_enabled_at && $user->two_factor_secret) {
            DB::table('two_factor_challenges')->where('expires_at', '<', now())->delete();
            $challengeToken = bin2hex(random_bytes(64));
            DB::table('two_factor_challenges')->insert([
                'token_hash' => hash('sha256', $challengeToken),
                'user_id' => $user->id,
                'audience' => 'admin',
                'ip' => $request->ip(),
                'device_info' => substr((string) $request->userAgent(), 0, 1000),
                'expires_at' => now()->addMinutes(5),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json(['data' => ['two_factor_required' => true, 'challenge_token' => $challengeToken, 'expires_in' => 300]], 202);
        }

        $rememberMe = $audience !== 'storefront' || (bool) ($data['remember_me'] ?? true);
        $issued = $this->issue($user, $audience, $request, $issueAccessToken, $rememberMe);
        if ($audience === 'admin') {
            $this->recordSuccessfulAdminLogin($request, $user);
        } else {
            $user->forceFill(['last_login_at' => now()])->save();
        }

        return response()->json([
            'data' => ['user' => $this->userData($user), 'access_token' => $issued['access_token'], 'token_type' => 'Bearer', 'expires_in' => (int) config('jwt.ttl', 15) * 60],
        ])->withCookie($issued['cookie']);
    }

    private function adminLoginLockedResponse(int $retryAfterSeconds): JsonResponse
    {
        $retryAfterSeconds = max(1, $retryAfterSeconds);

        return response()->json([
            'message' => 'Tài khoản tạm thời bị khóa do đăng nhập không thành công nhiều lần.',
            'data' => [
                'lock_type' => 'temporary',
                'retry_after_seconds' => $retryAfterSeconds,
                'locked_until' => now()->addSeconds($retryAfterSeconds)->toIso8601String(),
            ],
        ], 423);
    }

    private function issue(User $user, string $audience, Request $request, IssueAccessTokenAction $issueAccessToken, bool $rememberMe = true): array
    {
        $access = $issueAccessToken->execute($user, $audience);
        $refresh = bin2hex(random_bytes(64));
        $refreshId = DB::table('refresh_tokens')->insertGetId([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $refresh),
            'audience' => $audience,
            'access_token_id' => $access->accessToken->id,
            'device_info' => substr((string) $request->userAgent(), 0, 1000),
            'ip' => $request->ip(),
            'expires_at' => now()->addDays($this->sessionDurationDays()),
            'remember_me' => $rememberMe,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'access_token' => $access->plainTextToken,
            'access_token_id' => $access->accessToken->id,
            'refresh_id' => $refreshId,
            'cookie' => $this->refreshCookie($audience, $refresh, $rememberMe),
        ];
    }

    private function refresh(Request $request, string $audience, IssueAccessTokenAction $issueAccessToken): JsonResponse
    {
        $cookieName = $this->cookieName($audience);
        $plain = $request->cookie($cookieName);
        if (! $plain) {
            return response()->json(['message' => 'Phiên đăng nhập đã hết hạn.'], 401)->withCookie($this->clearRefreshCookie($audience));
        }

        $row = DB::table('refresh_tokens')->where('token_hash', hash('sha256', $plain))->first();
        if (! $row || $row->audience !== $audience) {
            return response()->json(['message' => 'Refresh token không hợp lệ.'], 401)->withCookie($this->clearRefreshCookie($audience));
        }

        if ($row->revoked_at) {
            $this->revokeRefreshFamily((int) $row->id, (int) $row->user_id, $audience);

            return response()->json(['message' => 'Phát hiện refresh token đã dùng lại. Vui lòng đăng nhập lại.'], 401)->withCookie($this->clearRefreshCookie($audience));
        }

        if (now()->greaterThan($row->expires_at)) {
            DB::table('refresh_tokens')->where('id', $row->id)->update(['revoked_at' => now(), 'updated_at' => now()]);

            return response()->json(['message' => 'Phiên đăng nhập đã hết hạn.'], 401)->withCookie($this->clearRefreshCookie($audience));
        }

        $user = User::query()->find($row->user_id);
        if (! $user || $user->status !== 'active' || ($audience === 'admin' && ! $user->isAdmin())) {
            DB::table('refresh_tokens')->where('id', $row->id)->update(['revoked_at' => now(), 'updated_at' => now()]);

            return response()->json(['message' => 'Tài khoản không còn quyền truy cập.'], 403)->withCookie($this->clearRefreshCookie($audience));
        }

        $issued = DB::transaction(function () use ($row, $user, $audience, $request, $issueAccessToken): array {
            $locked = DB::table('refresh_tokens')->where('id', $row->id)->lockForUpdate()->first();
            if (! $locked || $locked->revoked_at) {
                $this->revokeRefreshFamily((int) ($locked->id ?? $row->id), (int) $row->user_id, $audience);

                return ['reused' => true];
            }
            if (now()->greaterThan($locked->expires_at)) {
                DB::table('refresh_tokens')->where('id', $row->id)->update(['revoked_at' => now(), 'updated_at' => now()]);

                return ['expired' => true];
            }

            DB::table('refresh_tokens')->where('id', $row->id)->update(['revoked_at' => now(), 'updated_at' => now()]);
            if ($row->access_token_id) {
                DB::table('personal_access_tokens')->where('id', $row->access_token_id)->delete();
            }
            $next = $this->issue($user, $audience, $request, $issueAccessToken, (bool) ($row->remember_me ?? true));
            DB::table('refresh_tokens')->where('id', $row->id)->update(['replaced_by_id' => $next['refresh_id'], 'updated_at' => now()]);

            return $next;
        });

        if (isset($issued['reused'])) {
            return response()->json(['message' => 'Phát hiện refresh token đã dùng lại. Vui lòng đăng nhập lại.'], 401)->withCookie($this->clearRefreshCookie($audience));
        }
        if (isset($issued['expired'])) {
            return response()->json(['message' => 'Phiên đăng nhập đã hết hạn.'], 401)->withCookie($this->clearRefreshCookie($audience));
        }

        return response()->json([
            'data' => ['access_token' => $issued['access_token'], 'token_type' => 'Bearer', 'expires_in' => (int) config('jwt.ttl', 15) * 60],
        ])->withCookie($issued['cookie']);
    }

    private function logout(Request $request, string $audience): JsonResponse
    {
        $currentToken = $request->user()?->currentAccessToken();
        if ($audience === 'admin' && $request->user()) {
            $this->recordAdminAuthActivity($request, $request->user(), 'LOGOUT');
        }
        if ($currentToken) {
            DB::table('refresh_tokens')->where('access_token_id', $currentToken->id)->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
            $currentToken->delete();
        }

        $plain = $request->cookie($this->cookieName($audience));
        if ($plain) {
            DB::table('refresh_tokens')->where('token_hash', hash('sha256', $plain))->update(['revoked_at' => now(), 'updated_at' => now()]);
        }

        return response()->json(['message' => 'Đã đăng xuất.'])->withCookie($this->clearRefreshCookie($audience));
    }

    private function revokeRefreshFamily(int $refreshTokenId, int $userId, string $audience): void
    {
        DB::transaction(function () use ($refreshTokenId, $userId, $audience): void {
            $refreshTokenIds = [];
            $accessTokenIds = [];
            $visited = [];
            $currentId = $refreshTokenId;

            while ($currentId && ! isset($visited[$currentId])) {
                $visited[$currentId] = true;
                $token = DB::table('refresh_tokens')
                    ->where('id', $currentId)
                    ->where('user_id', $userId)
                    ->where('audience', $audience)
                    ->lockForUpdate()
                    ->first(['id', 'replaced_by_id', 'access_token_id']);

                if (! $token) {
                    break;
                }

                $refreshTokenIds[] = (int) $token->id;
                if ($token->access_token_id) {
                    $accessTokenIds[] = (int) $token->access_token_id;
                }
                $currentId = $token->replaced_by_id ? (int) $token->replaced_by_id : null;
            }

            if ($refreshTokenIds) {
                DB::table('refresh_tokens')->whereIn('id', $refreshTokenIds)->whereNull('revoked_at')->update([
                    'revoked_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if ($accessTokenIds) {
                DB::table('personal_access_tokens')->whereIn('id', array_values(array_unique($accessTokenIds)))->delete();
            }
        });
    }

    private function recordSuccessfulAdminLogin(Request $request, User $user, string $result = 'success'): void
    {
        $isNewDevice = Schema::hasTable('login_attempts') && ! DB::table('login_attempts')
            ->where('user_id', $user->id)
            ->whereIn('result', ['success', 'passkey'])
            ->where('ip_address', $request->ip())
            ->where('user_agent', substr((string) $request->userAgent(), 0, 255))
            ->exists();
        $attributes = ['last_login_at' => now()];
        if (Schema::hasColumn('users', 'last_login_ip')) {
            $attributes['last_login_ip'] = $request->ip();
        }
        if (Schema::hasColumn('users', 'last_seen_at')) {
            $attributes['last_seen_at'] = now();
        }
        $user->forceFill($attributes)->save();
        $this->recordAdminLoginAttempt($request, $user, $user->email, $result);
        $this->recordAdminAuthActivity($request, $user, 'LOGIN');
        if ($isNewDevice) {
            AdminSecurityAlerts::send($user, 'new_device', 'Đăng nhập từ thiết bị mới', 'Tài khoản quản trị vừa đăng nhập từ IP '.$request->ip().'.');
        }
    }

    private function recordAdminLoginAttempt(Request $request, ?User $user, ?string $email, string $result): void
    {
        if (! Schema::hasTable('login_attempts')) {
            return;
        }

        DB::table('login_attempts')->insert([
            'user_id' => $user?->id,
            'email' => $email ? Str::lower($email) : null,
            'result' => $result,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'created_at' => now(),
        ]);
    }

    private function userData(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone, 'avatar' => $user->avatar];
    }

    private function recordAdminAuthActivity(Request $request, User $user, string $action): void
    {
        $changes = ['submitted' => []];
        DB::table('activity_logs')->insert([
            'user_id' => $user->id,
            'module' => 'auth',
            'action' => $action,
            'path' => substr($request->path(), 0, 500),
            'changes' => json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'ip' => $request->ip(),
            'created_at' => now(),
        ]);
    }

    private function cookieName(string $audience): string
    {
        return $audience.'_refresh_token';
    }

    private function cookiePath(string $audience): string
    {
        return $audience === 'admin' ? '/api/v1/admin/auth' : '/api/v1/auth';
    }

    private function refreshCookie(string $audience, string $value, bool $rememberMe = true): Cookie
    {
        $minutes = $rememberMe ? 60 * 24 * $this->sessionDurationDays() : 0;

        return cookie($this->cookieName($audience), $value, $minutes, $this->cookiePath($audience), config('session.domain'), app()->isProduction(), true, false, 'lax');
    }

    private function sessionDurationDays(): int
    {
        return max(1, min(90, (int) (Setting::query()->where('key', 'session_duration_days')->value('value') ?? 14)));
    }

    private function clearRefreshCookie(string $audience): Cookie
    {
        return cookie($this->cookieName($audience), '', -1, $this->cookiePath($audience), config('session.domain'), app()->isProduction(), true, false, 'lax');
    }
}
