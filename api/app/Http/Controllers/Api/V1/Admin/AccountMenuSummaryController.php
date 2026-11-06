<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Modules\Identity\Actions\AdminPasswordPolicy;
use App\Support\AdminDndStatus;
use App\Support\AdminPresence;
use App\Support\AdminSystemHealth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AccountMenuSummaryController extends Controller
{
    public function __invoke(Request $request, AdminSystemHealth $health, AdminPasswordPolicy $passwordPolicy): JsonResponse
    {
        $user = $request->user();
        $cacheKey = 'admin-account-menu-summary:'.$user->id;

        $summary = Cache::remember($cacheKey, now()->addSeconds(60), function () use ($user, $health, $passwordPolicy): array {
            $can = fn (string $permission): bool => $user->hasAdminPermission($permission);

            $events = collect([
                'new_order' => 'orders.view',
                'delivery_failed' => 'orders.view',
                'low_stock' => 'inventory.view',
                'review_pending' => 'reviews.moderate',
                'staff_pending' => 'users.manage',
                'weekly_report' => 'reports.view',
                'admin_digest' => null,
                'export_complete' => null,
                'security_new_device' => null,
                'security_failed_logins' => null,
                'security_credentials_changed' => null,
                'security_suspicious_session' => null,
            ])->filter(fn (?string $permission): bool => $permission === null || $can($permission))->keys()->all();
            $events[] = 'task_reminder';

            $unreadNotifications = $events === [] ? 0 : $user->unreadNotifications()->whereIn('data->event', $events)
                ->whereNull('archived_at')
                ->where(fn ($items) => $items->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', now()))
                ->count();
            $pendingOrders = $can('orders.view') ? DB::table('orders')->where('status', 'pending')->count() : 0;
            $ordersOverdue = $can('orders.view') ? DB::table('orders')->whereIn('status', ['confirmed', 'processing'])
                ->where('updated_at', '<=', now()->subHours(24))->count() : 0;
            $pendingCancelReturnRequests = $can('orders.view') && Schema::hasTable('order_change_requests')
                ? DB::table('order_change_requests')->where('status', 'pending')->count() : 0;
            $failedPayments = $can('orders.view') ? DB::table('payments')->where('status', 'failed')->distinct('order_id')->count('order_id') : 0;
            $now = now();
            $couponsExpiring = $can('coupons.view') ? DB::table('coupons')->where('is_active', true)
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
                ->whereRaw('COALESCE(ends_at, expires_at) > ?', [$now])
                ->whereRaw('COALESCE(ends_at, expires_at) <= ?', [$now->copy()->addDays(7)])
                ->where(fn ($query) => $query->whereNull('usage_limit')->orWhereColumn('used_count', '<', 'usage_limit'))
                ->count() : 0;
            $pendingReviews = $can('reviews.moderate') ? DB::table('reviews')->where('status', 'pending')->count() : 0;
            $lowStock = $can('inventory.view') ? DB::table('inventories')
                ->join('product_variants', 'product_variants.id', '=', 'inventories.variant_id')
                ->join('products', 'products.id', '=', 'product_variants.product_id')
                ->whereNull('products.deleted_at')->where('products.status', 'active')
                ->whereRaw('inventories.quantity - inventories.reserved <= inventories.low_stock_threshold')->count() : 0;
            $tasksOverdue = Schema::hasTable('user_tasks') ? $user->personalTasks()->where('status', '<>', 'done')->where('due_at', '<', now())->count() : 0;
            $tasksToday = Schema::hasTable('user_tasks') ? $user->personalTasks()->where('status', '<>', 'done')->whereDate('due_at', today())->count() : 0;
            $failedJobs = $can('system.health') && Schema::hasTable(config('queue.failed.table', 'failed_jobs'))
                ? DB::table(config('queue.failed.table', 'failed_jobs'))->count()
                : 0;
            $hasAdminRole = $user->roles()->whereIn('name', ['admin', 'super_admin'])->exists();
            $passwordExpiresAt = $passwordPolicy->expiresAt($user);
            $passwordExpiryDays = $passwordExpiresAt === null ? null : ($passwordExpiresAt->isPast() ? 0 : (int) now()->startOfDay()->diffInDays($passwordExpiresAt->startOfDay()));
            $passwordExpiryWarning = $passwordExpiresAt !== null && $passwordExpiresAt->lessThanOrEqualTo(now()->addDays(14));
            $securityWarnings = (int) ($user->email_verified_at === null)
                + (int) ($hasAdminRole && $user->two_factor_enabled_at === null)
                + (int) $passwordExpiryWarning;
            $unrecognizedLogin = $user->unreadNotifications()->where('data->event', 'security_new_device')->whereNull('archived_at')
                ->where(fn ($items) => $items->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', now()))->exists();
            $lastLogin = Schema::hasTable('login_attempts')
                ? DB::table('login_attempts')->where('user_id', $user->id)->whereIn('result', ['success', 'passkey'])
                    ->orderByDesc('created_at')->orderByDesc('id')->first(['ip_address', 'user_agent'])
                : null;
            $systemHealth = $can('system.health') ? $health->report()['status'] : 'unavailable';
            $onboarding = [];
            $storedPreferences = [];
            if (Schema::hasTable('user_preferences')) {
                $storedPreferences = DB::table('user_preferences')->where('user_id', $user->id)->whereIn('key', ['admin_onboarding', 'admin_changelog'])->pluck('value', 'key')->all();
                $onboarding = is_string($storedPreferences['admin_onboarding'] ?? null) ? (json_decode($storedPreferences['admin_onboarding'], true) ?: []) : [];
            }
            $appVersion = (string) config('app.version', '0.0.0');
            $changelog = json_decode($storedPreferences['admin_changelog'] ?? '[]', true) ?: [];
            $checklist = [
                ['id' => 'avatar', 'label' => 'Thêm ảnh đại diện', 'href' => '/account/profile', 'complete' => filled($user->avatar)],
                ['id' => 'phone', 'label' => 'Thêm số điện thoại', 'href' => '/account/profile', 'complete' => filled($user->phone)],
                ['id' => 'email', 'label' => 'Xác thực email', 'href' => '/account/security#email', 'complete' => $user->email_verified_at !== null],
                ['id' => 'password', 'label' => 'Đổi mật khẩu lần đầu', 'href' => '/account/security#password', 'complete' => $user->password_changed_at !== null],
                ['id' => 'two_factor', 'label' => 'Bật xác thực hai bước', 'href' => '/account/security#2fa', 'complete' => $user->two_factor_enabled_at !== null],
                ['id' => 'tour', 'label' => 'Xem hướng dẫn bắt đầu', 'href' => '/help/tour', 'complete' => in_array('intro_tour', $onboarding['completed'] ?? [], true)],
            ];

            return [
                'notifications_unread' => $unreadNotifications,
                'notifications_muted' => AdminDndStatus::isActive($user),
                'tasks_overdue' => $tasksOverdue,
                'tasks_today' => $tasksToday,
                'security_warnings' => $securityWarnings,
                'password_expiry_warning' => $passwordExpiryWarning,
                'password_expiry_days' => $passwordExpiryDays,
                'unrecognized_login' => $unrecognizedLogin,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'two_factor_enabled' => $user->two_factor_enabled_at !== null,
                'has_admin_role' => $hasAdminRole,
                'staff_code' => $user->staff_code,
                'changelog_unread' => ($changelog['last_seen_version'] ?? null) === $appVersion ? 0 : 1,
                'failed_jobs' => $failedJobs,
                'quick_links' => [
                    'orders_pending' => $pendingOrders,
                    'orders_overdue' => $ordersOverdue,
                    'orders_cancel_return_requests' => $pendingCancelReturnRequests,
                    'payments_failed' => $failedPayments,
                    'reviews_pending' => $pendingReviews,
                    'low_stock' => $lowStock,
                    'coupons_expiring' => $couponsExpiring,
                ],
                'system_health' => $systemHealth,
                'presence' => AdminPresence::effectiveStatus($user),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'last_login_ip' => $lastLogin?->ip_address ?? $user->last_login_ip,
                'last_login_user_agent' => $lastLogin?->user_agent,
                'timezone' => $user->timezone ?: config('app.timezone'),
                'profile_checklist' => [
                    'completed' => count(array_filter($checklist, fn (array $item): bool => $item['complete'])),
                    'total' => count($checklist),
                    'items' => $checklist,
                ],
            ];
        });

        return response()->json(['data' => $summary]);
    }
}
