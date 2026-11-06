<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ChangeAccountEmailRequest;
use App\Http\Requests\Api\V1\Storefront\ChangeAccountPasswordRequest;
use App\Http\Requests\Api\V1\Storefront\DeleteAccountRequest;
use App\Http\Requests\Api\V1\Storefront\ListAccountActivityRequest;
use App\Http\Requests\Api\V1\Storefront\ListAccountSessionsRequest;
use App\Http\Requests\Api\V1\Storefront\StoreAddressRequest;
use App\Http\Requests\Api\V1\Storefront\StoreWishlistListRequest;
use App\Http\Requests\Api\V1\Storefront\UpdateAccountPreferencesRequest;
use App\Http\Requests\Api\V1\Storefront\UpdateAddressRequest;
use App\Http\Requests\Api\V1\Storefront\UpdateWishlistListRequest;
use App\Http\Requests\Api\V1\Storefront\UpdateWishlistListShareRequest;
use App\Http\Requests\Api\V1\Storefront\UpdateProfileRequest;
use App\Http\Requests\Api\V1\Storefront\UploadAccountAvatarRequest;
use App\Http\Resources\AccountResource;
use App\Http\Resources\AddressResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\WishlistListResource;
use App\Models\Order;
use App\Models\PendingEmailChange;
use App\Models\Product;
use App\Models\User;
use App\Modules\Identity\Actions\ChangeAdminPasswordAction;
use App\Modules\Identity\Actions\ManageWishlistListAction;
use App\Modules\Identity\Actions\ReportSuspiciousAdminSessionAction;
use App\Notifications\AccountEmailChangedNotification;
use App\Notifications\AccountEmailChangeNotification;
use App\Notifications\AccountPasswordChangedNotification;
use App\Support\AdminNotificationDispatcher;
use App\Support\AdminSecurityAlerts;
use App\Support\ClientDeviceDetails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function preferences(Request $request): JsonResponse
    {
        $rows = DB::table('user_preferences')->where('user_id', $request->user()->id)
            ->where('key', '<>', 'admin_digest_state')->get(['key', 'value']);

        return response()->json(['data' => $rows->mapWithKeys(fn ($row) => [$row->key => json_decode($row->value, true) ?? []])]);
    }

    public function updatePreferences(UpdateAccountPreferencesRequest $request): JsonResponse
    {
        $data = $request->validated();
        DB::table('user_preferences')->upsert([[
            'user_id' => $request->user()->id,
            'key' => $data['key'],
            'value' => json_encode($data['value'], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]], ['user_id', 'key'], ['value', 'updated_at']);

        return response()->json(['data' => [$data['key'] => $data['value']], 'message' => 'Đã lưu tùy chọn tài khoản.']);
    }

    public function exportPreferences(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);
        $row = DB::table('user_preferences')->where('user_id', $request->user()->id)->where('key', 'admin_appearance')->value('value');
        $stored = is_string($row) ? json_decode($row, true) : null;
        $defaults = [
            'locale' => 'vi', 'theme' => 'light', 'accent' => 'burgundy', 'font_size' => 16, 'zoom' => 100,
            'show_breadcrumbs' => true, 'high_contrast' => false, 'strong_focus' => false, 'date_format' => 'dmy',
            'time_format' => '24h', 'number_locale' => 'vi-VN', 'currency_position' => 'suffix', 'week_start' => 1,
            'dashboard_default_period' => '30', 'dashboard_compare_previous' => true, 'remember_collapsed_groups' => false,
            'pinned_pages' => [], 'dashboard_widgets' => ['metrics', 'alerts', 'revenue', 'recent_orders', 'breakdown', 'top_products', 'recent_activity'],
            'default_landing_page' => 'dashboard', 'table_density' => 'comfortable', 'page_size' => 20,
            'sidebar_collapsed' => false, 'reduce_motion' => false, 'shortcuts_enabled' => true,
        ];
        $supportedKeys = [...array_keys($defaults), 'shortcuts', 'menu_layout'];
        $appearance = array_replace($defaults, is_array($stored) ? array_intersect_key($stored, array_flip($supportedKeys)) : []);

        return response()->json([
            'schema_version' => 1,
            'exported_at' => now()->toISOString(),
            'settings' => ['admin_appearance' => $appearance],
        ]);
    }

    public function importPreferences(Request $request): JsonResponse
    {
        abort_unless($request->user()->isAdmin(), 403);
        $backup = $request->validate([
            'schema_version' => ['required', 'integer', Rule::in([1])],
            'exported_at' => ['sometimes', 'date'],
            'settings' => ['required', 'array:admin_appearance'],
            'settings.admin_appearance' => ['required', 'array', 'max:64'],
        ]);

        $payload = ['key' => 'admin_appearance', 'value' => $backup['settings']['admin_appearance']];
        $rulesRequest = new UpdateAccountPreferencesRequest;
        $rulesRequest->replace($payload);
        $rulesRequest->setUserResolver(fn () => $request->user());
        $validated = Validator::make($payload, $rulesRequest->rules())->validate();
        DB::table('user_preferences')->upsert([[
            'user_id' => $request->user()->id,
            'key' => $validated['key'],
            'value' => json_encode($validated['value'], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]], ['user_id', 'key'], ['value', 'updated_at']);

        return response()->json(['data' => [$validated['key'] => $validated['value']], 'message' => 'Preferences imported.']);
    }

    public function activity(ListAccountActivityRequest $request): JsonResponse
    {
        $data = $request->validated();
        $sort = $data['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $columns = ['created_at' => 'created_at', 'module' => 'module', 'action' => 'action', 'path' => 'path', 'ip' => 'ip'];
        $rows = DB::table('activity_logs')->where('user_id', $request->user()->id)
            ->when(isset($data['module']), fn ($query) => $query->where('module', $data['module']))
            ->when(isset($data['action']), fn ($query) => $query->where('action', $data['action']))
            ->when(isset($data['from']), fn ($query) => $query->whereDate('created_at', '>=', $data['from']))
            ->when(isset($data['to']), fn ($query) => $query->whereDate('created_at', '<=', $data['to']))
            ->orderBy($columns[$field], $descending ? 'desc' : 'asc')->orderByDesc('id')->paginate($data['per_page'] ?? 20);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }

    public function verifyEmail(Request $request, int $id, string $hash): JsonResponse|RedirectResponse
    {
        $user = User::query()->findOrFail($id);
        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);
        $pendingApproval = $user->status === 'pending_approval' && ! $user->hasVerifiedEmail();
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }
        if ($pendingApproval) {
            AdminNotificationDispatcher::send(
                'staff_pending',
                'users.manage',
                'Tài khoản mới chờ phê duyệt',
                $user->name.' đã xác minh email và đang chờ phê duyệt.',
                '/staff',
            );
        }

        if (! $request->expectsJson()) {
            return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/verify-email?verified=1');
        }

        return response()->json(['message' => 'Email đã được xác thực.']);
    }

    public function sendVerification(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email đã được xác thực.']);
        }
        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Đã gửi email xác thực.']);
    }

    public function show(Request $request): JsonResponse
    {
        return (new AccountResource($request->user()->load(['roles', 'pendingEmailChange', 'creator:id,name'])))->response();
    }

    public function uploadAvatar(UploadAccountAvatarRequest $request): JsonResponse
    {
        $user = $request->user();
        $old = $user->avatar;
        $path = $request->file('avatar')->store('avatars', 'public');
        try {
            DB::transaction(fn () => $user->forceFill(['avatar' => Storage::disk('public')->url($path)])->save());
        } catch (\Throwable $exception) {
            Storage::disk('public')->delete($path);
            throw $exception;
        }
        if ($old && str_starts_with($old, Storage::disk('public')->url(''))) {
            Storage::disk('public')->delete(str_replace(Storage::disk('public')->url(''), '', $old));
        }

        return response()->json(['data' => ['avatar' => $user->avatar]]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $old = $user->avatar;
        DB::transaction(fn () => $user->forceFill(['avatar' => null])->save());
        if ($old && str_starts_with($old, Storage::disk('public')->url(''))) {
            Storage::disk('public')->delete(str_replace(Storage::disk('public')->url(''), '', $old));
        }

        return response()->json(['data' => ['avatar' => null]]);
    }

    public function updateEmail(ChangeAccountEmailRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $token = Str::random(64);
        $expiresAt = now()->addHour();
        DB::transaction(function () use ($user, $data, $token, $expiresAt): void {
            $user->newQuery()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            PendingEmailChange::query()->where('email', $data['email'])->where('expires_at', '<=', now())->delete();
            PendingEmailChange::query()->where('user_id', $user->id)->delete();
            PendingEmailChange::query()->create([
                'user_id' => $user->id,
                'email' => $data['email'],
                'token_hash' => hash('sha256', $token),
                'expires_at' => $expiresAt,
            ]);
        });
        $url = url('/api/v1/account/email/verify/'.urlencode($token));
        Notification::route('mail', $data['email'])->notify(new AccountEmailChangeNotification($url, $expiresAt->format('d/m/Y H:i')));

        return response()->json(['data' => [
            'email' => $user->email,
            'email_verified' => $user->email_verified_at !== null,
            'pending_email' => $data['email'],
            'pending_email_expires_at' => $expiresAt->toIso8601String(),
        ], 'message' => 'Đã gửi liên kết xác nhận tới email mới. Email hiện tại vẫn được dùng cho tới khi xác minh.']);
    }

    public function confirmEmailChange(Request $request, string $token): RedirectResponse
    {
        [$user, $oldEmail] = DB::transaction(function () use ($token): array {
            $request = PendingEmailChange::query()->where('token_hash', hash('sha256', $token))->lockForUpdate()->first();
            abort_if(! $request || $request->expires_at->isPast(), 403, 'Liên kết xác nhận email không hợp lệ hoặc đã hết hạn.');
            $user = User::query()->whereKey($request->user_id)->lockForUpdate()->firstOrFail();
            abort_if(User::query()->where('email', $request->email)->where('id', '<>', $user->id)->exists(), 409, 'Email này đã được tài khoản khác sử dụng.');
            $oldEmail = $user->email;
            $user->forceFill(['email' => $request->email, 'email_verified_at' => now()])->save();
            $request->delete();

            return [$user, $oldEmail];
        });

        DB::table('activity_logs')->insert([
            'user_id' => $user->id,
            'module' => 'account',
            'action' => 'EMAIL_CHANGED',
            'path' => 'api/v1/account/email/verify',
            'changes' => json_encode([
                'before' => ['email' => $oldEmail],
                'after' => ['email' => $user->email],
                'changed_fields' => ['email'],
            ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'ip' => $request->ip(),
            'created_at' => now(),
        ]);

        $baseUrl = $user->isAdmin() ? config('app.admin_url', 'http://localhost:5174') : config('app.frontend_url', config('app.url'));
        $target = rtrim((string) $baseUrl, '/').($user->isAdmin() ? '/account/security' : '/account').'?email_verified=1';
        if (filter_var($oldEmail, FILTER_VALIDATE_EMAIL)) {
            Notification::route('mail', $oldEmail)->notify(new AccountEmailChangedNotification);
        }
        AdminSecurityAlerts::send($user, 'credentials_changed', 'Email quản trị đã thay đổi', 'Email tài khoản quản trị vừa được thay đổi.', true);

        return redirect()->away($target);
    }

    public function updatePassword(ChangeAccountPasswordRequest $request, ChangeAdminPasswordAction $changePassword): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $currentId = $user->currentAccessToken()?->id;
        $logoutOtherDevices = $data['logout_other_devices'] ?? true;
        $changePassword->execute($user, $data['current_password'] ?? null, $data['password'], $currentId, $logoutOtherDevices, $request->attributes->get('sudo_mode_active') === true);
        $user->notify(new AccountPasswordChangedNotification($logoutOtherDevices));

        return response()->json(['message' => $logoutOtherDevices ? 'Đã đổi mật khẩu. Các phiên khác đã đăng xuất.' : 'Đã đổi mật khẩu. Các phiên khác vẫn được giữ đăng nhập.', 'data' => ['must_change_password' => false]]);
    }

    public function sessions(ListAccountSessionsRequest $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()?->id;
        $latestRefresh = DB::table('refresh_tokens')->where('user_id', $request->user()->id)
            ->whereNotNull('access_token_id')->selectRaw('MAX(id) as id, access_token_id')->groupBy('access_token_id');
        $query = DB::table('personal_access_tokens as token')
            ->leftJoinSub($latestRefresh, 'latest_refresh', fn ($join) => $join->on('latest_refresh.access_token_id', '=', 'token.id'))
            ->leftJoin('refresh_tokens as refresh', 'refresh.id', '=', 'latest_refresh.id')
            ->where('token.tokenable_type', User::class)
            ->where('token.tokenable_id', $request->user()->id)
            ->where('token.token_type', 'session')
            ->orderByRaw('CASE WHEN token.id = ? THEN 0 ELSE 1 END', [$currentId]);

        $mapTokens = fn ($tokens) => $tokens->map(function ($token) use ($currentId): array {
            return [
                ...(array) $token,
                ...ClientDeviceDetails::fromUserAgent($token->device_info),
                'is_current' => (int) $token->id === (int) $currentId,
            ];
        });

        $validated = $request->validated();
        $sort = $validated['sort'] ?? '-last_used_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $columns = ['last_used_at' => 'token.last_used_at', 'created_at' => 'token.created_at', 'ip' => 'refresh.ip', 'device_info' => 'refresh.device_info'];
        if (array_key_exists('page', $validated) || array_key_exists('per_page', $validated)) {
            $tokens = $query->orderBy($columns[$field], $descending ? 'desc' : 'asc')->orderByDesc('token.id')
                ->paginate((int) ($validated['per_page'] ?? 20), ['token.id', 'token.name', 'token.last_used_at', 'token.created_at', 'refresh.ip', 'refresh.device_info']);

            return response()->json([
                'data' => $mapTokens($tokens->getCollection()),
                'meta' => [
                    'current_page' => $tokens->currentPage(),
                    'last_page' => $tokens->lastPage(),
                    'per_page' => $tokens->perPage(),
                    'total' => $tokens->total(),
                ],
            ]);
        }

        $tokens = $query->orderBy($columns[$field], $descending ? 'desc' : 'asc')->orderByDesc('token.id')
            ->get(['token.id', 'token.name', 'token.last_used_at', 'token.created_at', 'refresh.ip', 'refresh.device_info']);

        return response()->json(['data' => $mapTokens($tokens)]);
    }

    public function reportSession(Request $request, int $session, ReportSuspiciousAdminSessionAction $reportSession): JsonResponse
    {
        $reportSession->execute($request->user(), $session, $request->user()->currentAccessToken()?->id);

        return response()->json(['message' => 'Đã thu hồi phiên lạ. Hãy đổi mật khẩu và bật xác thực hai yếu tố.', 'data' => ['must_change_password' => true]]);
    }

    public function deleteSession(Request $request, int $session): JsonResponse
    {
        $token = $request->user()->tokens()->where('token_type', 'session')->findOrFail($session);
        if ((int) $token->id === (int) $request->user()->currentAccessToken()?->id) {
            return response()->json(['message' => 'Dùng chức năng đăng xuất để kết thúc phiên hiện tại.'], 422);
        }
        DB::transaction(function () use ($request, $token): void {
            $request->user()->tokens()->whereKey($token->id)->where('token_type', 'session')->delete();
            DB::table('refresh_tokens')->where('access_token_id', $token->id)->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
        });

        return response()->json(['message' => 'Đã đăng xuất thiết bị.']);
    }

    public function deleteOtherSessions(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()?->id;
        DB::transaction(function () use ($request, $currentId): void {
            $otherSessionIds = $request->user()->tokens()->where('token_type', 'session')->where('id', '!=', $currentId)->pluck('id');
            $request->user()->tokens()->where('token_type', 'session')->where('id', '!=', $currentId)->delete();
            DB::table('refresh_tokens')->where('user_id', $request->user()->id)->whereNull('revoked_at')->whereIn('access_token_id', $otherSessionIds)->update(['revoked_at' => now(), 'updated_at' => now()]);
        });

        return response()->json(['message' => 'Đã đăng xuất các thiết bị khác.']);
    }

    public function deleteAccount(DeleteAccountRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user->roles()->where('name', 'customer')->exists()) {
            abort(403, 'Chỉ khách hàng mới có thể xóa tài khoản.');
        }
        if (Order::query()->where('user_id', $user->id)->whereIn('status', ['pending', 'confirmed', 'processing', 'shipping'])->exists()) {
            throw ValidationException::withMessages(['account' => 'Tài khoản còn đơn hàng đang xử lý.']);
        }
        DB::transaction(function () use ($user): void {
            DB::table('refresh_tokens')->where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
            $user->tokens()->delete();
            $user->passkeys()->delete();
            $user->forceFill(['webauthn_user_handle' => null])->save();
            $user->forceFill(['height_cm' => null, 'weight_kg' => null, 'bust_cm' => null, 'waist_cm' => null, 'hip_cm' => null])->save();
            $user->delete();
        });

        return response()->json(['message' => 'Tài khoản đã được xóa.']);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated())->save();

        return (new AccountResource($user->load(['roles', 'pendingEmailChange', 'creator:id,name'])))->response();
    }

    public function addresses(Request $request)
    {
        return AddressResource::collection($request->user()->addresses()->orderByDesc('is_default')->orderByDesc('is_default_billing')->orderByDesc('updated_at')->get());
    }

    public function storeAddress(StoreAddressRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $address = DB::transaction(function () use ($user, $data) {
            $user->newQuery()->whereKey($user->id)->lockForUpdate()->first();
            $addressCount = $user->addresses()->lockForUpdate()->count();
            if ($addressCount >= 10) {
                throw ValidationException::withMessages(['address' => 'Mỗi tài khoản chỉ lưu tối đa 10 địa chỉ.']);
            }
            $hasShippingDefault = $user->addresses()->where('is_default', true)->exists();
            $hasBillingDefault = $user->addresses()->where('is_default_billing', true)->exists();
            $makeDefault = ($data['is_default'] ?? false) || ! $hasShippingDefault;
            $makeBillingDefault = ($data['is_default_billing'] ?? false) || ! $hasBillingDefault;
            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }
            if ($makeBillingDefault) {
                $user->addresses()->update(['is_default_billing' => false]);
            }

            return $user->addresses()->create([...$data, 'is_default' => $makeDefault, 'is_default_billing' => $makeBillingDefault]);
        });

        return (new AddressResource($address))->response()->setStatusCode(201);
    }

    public function updateAddress(UpdateAddressRequest $request, int $address)
    {
        $user = $request->user();
        $data = $request->validated();
        $record = DB::transaction(function () use ($user, $address, $data) {
            $user->newQuery()->whereKey($user->id)->lockForUpdate()->first();
            $record = $user->addresses()->lockForUpdate()->findOrFail($address);
            $makeDefault = ($data['is_default'] ?? false) === true
                || $record->is_default
                || ! $user->addresses()->where('is_default', true)->where('id', '!=', $record->id)->exists();
            if ($makeDefault) {
                $user->addresses()->where('id', '!=', $record->id)->update(['is_default' => false]);
                $data['is_default'] = true;
            }
            $makeBillingDefault = ($data['is_default_billing'] ?? false) === true
                || $record->is_default_billing
                || ! $user->addresses()->where('is_default_billing', true)->where('id', '!=', $record->id)->exists();
            if ($makeBillingDefault) {
                $user->addresses()->where('id', '!=', $record->id)->update(['is_default_billing' => false]);
                $data['is_default_billing'] = true;
            }
            $record->update($data);

            return $record->fresh();
        });

        return new AddressResource($record);
    }

    public function deleteAddress(Request $request, int $address): JsonResponse
    {
        DB::transaction(function () use ($request, $address): void {
            $user = $request->user();
            $user->newQuery()->whereKey($user->id)->lockForUpdate()->first();
            $record = $user->addresses()->lockForUpdate()->findOrFail($address);
            $wasDefault = $record->is_default;
            $wasBillingDefault = $record->is_default_billing;
            $record->delete();
            if ($wasDefault || $wasBillingDefault) {
                $fallback = $user->addresses()->latest('id')->first();
                if ($fallback && $wasDefault) {
                    $fallback->update(['is_default' => true]);
                }
                if ($fallback && $wasBillingDefault) {
                    $fallback->update(['is_default_billing' => true]);
                }
            }
        });

        return response()->json(['message' => 'Đã xóa địa chỉ.']);
    }

    public function setDefaultAddress(Request $request, int $address): JsonResponse
    {
        DB::transaction(function () use ($request, $address): void {
            $user = $request->user();
            $user->newQuery()->whereKey($user->id)->lockForUpdate()->first();
            $record = $user->addresses()->lockForUpdate()->findOrFail($address);
            $user->addresses()->update(['is_default' => false]);
            $record->update(['is_default' => true]);
        });

        return response()->json(['message' => 'Đã đặt địa chỉ mặc định.']);
    }

    public function wishlistLists(Request $request)
    {
        $this->defaultWishlistListId($request->user());
        $lists = $request->user()->wishlistLists()->withCount('products')->orderByDesc('is_default')->orderBy('id')->get();

        return WishlistListResource::collection($lists);
    }

    public function createWishlistList(StoreWishlistListRequest $request, ManageWishlistListAction $action): JsonResponse
    {
        $list = $action->create($request->user(), $request->validated('name'));

        return (new WishlistListResource($list->loadCount('products')))->response()->setStatusCode(201);
    }

    public function updateWishlistList(UpdateWishlistListRequest $request, int $wishlistList, ManageWishlistListAction $action): WishlistListResource
    {
        return new WishlistListResource($action->rename($request->user(), $wishlistList, $request->validated('name'))->loadCount('products'));
    }

    public function deleteWishlistList(Request $request, int $wishlistList, ManageWishlistListAction $action): JsonResponse
    {
        $action->delete($request->user(), $wishlistList);

        return response()->json(['message' => 'Đã xóa danh sách yêu thích.']);
    }

    public function updateWishlistListShare(UpdateWishlistListShareRequest $request, int $wishlistList, ManageWishlistListAction $action): WishlistListResource
    {
        $list = $action->setShareable($request->user(), $wishlistList, (bool) $request->validated('shareable'));

        return new WishlistListResource($list->loadCount('products'));
    }

    public function wishlistListProducts(Request $request, int $wishlistList)
    {
        $list = $request->user()->wishlistLists()->whereKey($wishlistList)->firstOrFail();
        $products = $list->products()->published()
            ->with(['category', 'brand', 'images', 'variants' => fn ($variants) => $variants->where('is_active', true)->with(['color', 'size', 'inventory'])])
            ->orderByPivot('created_at', 'desc')
            ->paginate(min(max((int) $request->query('per_page', 20), 1), 48));

        return ProductResource::collection($products);
    }

    public function addProductToWishlistList(Request $request, int $wishlistList, int $product, ManageWishlistListAction $action): JsonResponse
    {
        $action->addProduct($request->user(), $wishlistList, $product);

        return response()->json(['message' => 'Đã thêm vào danh sách yêu thích.'], 201);
    }

    public function removeProductFromWishlistList(Request $request, int $wishlistList, int $product, ManageWishlistListAction $action): JsonResponse
    {
        $action->removeProduct($request->user(), $wishlistList, $product);

        return response()->json(['message' => 'Đã xóa khỏi danh sách yêu thích.']);
    }

    public function sharedWishlist(Request $request, string $token): JsonResponse
    {
        $list = \App\Models\WishlistList::query()->where('share_token', $token)->firstOrFail();
        $products = $list->products()->published()
            ->with(['category', 'brand', 'images', 'variants' => fn ($variants) => $variants->where('is_active', true)->with(['color', 'size', 'inventory'])])
            ->orderByPivot('created_at', 'desc')
            ->paginate(min(max((int) $request->query('per_page', 20), 1), 48));

        return response()->json([
            'data' => [
                'name' => $list->name,
                'products' => ProductResource::collection($products)->response()->getData(true),
            ],
        ]);
    }

    public function wishlist(Request $request)
    {
        $user = $request->user();
        $listId = $this->defaultWishlistListId($user);
        $products = $user->wishlistedProducts()
            ->wherePivot('wishlist_list_id', $listId)
            ->published()
            ->with(['category', 'brand', 'images', 'variants' => fn ($variants) => $variants->where('is_active', true)->with(['color', 'size', 'inventory'])])
            ->orderByDesc('wishlists.created_at')
            ->paginate(min(max((int) $request->query('per_page', 20), 1), 48));

        return ProductResource::collection($products);
    }

    public function addToWishlist(Request $request, int $product): JsonResponse
    {
        $record = Product::query()->published()->findOrFail($product);
        $user = $request->user();
        $listId = $this->defaultWishlistListId($user);
        DB::table('wishlists')->insertOrIgnore([
            'user_id' => $user->id,
            'wishlist_list_id' => $listId,
            'product_id' => $record->id,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Đã thêm vào danh sách yêu thích.'], 201);
    }

    public function removeFromWishlist(Request $request, int $product): JsonResponse
    {
        $listId = $this->defaultWishlistListId($request->user());
        DB::table('wishlists')->where('wishlist_list_id', $listId)->where('product_id', $product)->delete();

        return response()->json(['message' => 'Đã xóa khỏi danh sách yêu thích.']);
    }

    private function defaultWishlistListId(User $user): int
    {
        return DB::transaction(function () use ($user): int {
            DB::table('users')->where('id', $user->id)->lockForUpdate()->first();

            $listId = DB::table('wishlist_lists')->where('user_id', $user->id)->where('is_default', true)->value('id');
            if ($listId) {
                return (int) $listId;
            }

            return (int) DB::table('wishlist_lists')->insertGetId([
                'user_id' => $user->id,
                'name' => 'Yêu thích',
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }
}
