<?php

namespace App\Modules\Reporting\Actions;

use App\Models\Role;
use App\Models\User;
use App\Notifications\AdminPersonalNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SendAdminDigestAction
{
    private const SECTIONS = ['orders', 'revenue', 'low_stock', 'reviews', 'overdue_tasks'];

    public function handle(?CarbonImmutable $reference = null): int
    {
        if (! Schema::hasTable('user_preferences')) {
            return 0;
        }

        $users = User::query()->where('status', 'active')
            ->whereHas('roles', fn ($query) => $query->whereIn('name', Role::ADMIN_NAMES))
            ->with('roles.permissions')->get();
        if ($users->isEmpty()) {
            return 0;
        }

        $preferences = DB::table('user_preferences')->whereIn('user_id', $users->modelKeys())
            ->whereIn('key', ['admin_digest', 'admin_notifications'])->get(['user_id', 'key', 'value'])
            ->groupBy('user_id');
        $processed = 0;

        foreach ($users as $user) {
            $userPreferences = $preferences->get($user->id, collect())->keyBy('key');
            $digest = $this->decode($userPreferences->get('admin_digest')?->value);
            $frequency = $digest['frequency'] ?? 'off';
            if (! in_array($frequency, ['daily', 'weekly'], true)) {
                continue;
            }

            $timezone = $this->timezone($user->timezone ?? null);
            $localNow = ($reference ?? CarbonImmutable::now('UTC'))->setTimezone($timezone);
            $time = is_string($digest['time'] ?? null) ? $digest['time'] : '08:00';
            if (! preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time) || $localNow->format('H:i') < $time
                || ($frequency === 'weekly' && $localNow->dayOfWeekIso !== CarbonImmutable::MONDAY)) {
                continue;
            }

            $periodKey = $frequency === 'daily'
                ? 'daily:'.$localNow->toDateString()
                : 'weekly:'.$localNow->startOfWeek(CarbonImmutable::MONDAY)->toDateString();
            $sections = array_values(array_intersect(self::SECTIONS, is_array($digest['sections'] ?? null) ? $digest['sections'] : []));
            $lines = $this->summary($user, $sections, $frequency, $localNow);
            $channels = $this->decode($userPreferences->get('admin_notifications')?->value)['admin_digest'] ?? [];
            $inApp = (bool) ($channels['in_app'] ?? true);
            $email = (bool) ($channels['email'] ?? false);
            $didProcess = DB::transaction(function () use ($user, $periodKey, $lines, $inApp, $email, $frequency): bool {
                $now = now();
                DB::table('user_preferences')->insertOrIgnore([
                    'user_id' => $user->id,
                    'key' => 'admin_digest_state',
                    'value' => json_encode([], JSON_THROW_ON_ERROR),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $stateRow = DB::table('user_preferences')->where('user_id', $user->id)
                    ->where('key', 'admin_digest_state')->lockForUpdate()->first();
                $state = $this->decode($stateRow?->value);
                if (($state['period_key'] ?? null) === $periodKey) {
                    return false;
                }

                if ($lines !== [] && ($inApp || $email)) {
                    $user->notify(new AdminPersonalNotification(
                        'admin_digest',
                        $frequency === 'daily' ? 'Bản tin tóm tắt hàng ngày' : 'Bản tin tóm tắt hàng tuần',
                        implode("\n", $lines),
                        '/dashboard',
                        'normal',
                        $inApp,
                        $email,
                    ));
                }

                DB::table('user_preferences')->where('user_id', $user->id)->where('key', 'admin_digest_state')->update([
                    'value' => json_encode(['period_key' => $periodKey, 'checked_at' => $now->toIso8601String()], JSON_THROW_ON_ERROR),
                    'updated_at' => $now,
                ]);

                return true;
            });

            $processed += (int) $didProcess;
        }

        return $processed;
    }

    /** @param list<string> $sections
     * @return list<string>
     */
    private function summary(User $user, array $sections, string $frequency, CarbonImmutable $localNow): array
    {
        $lines = [];
        $can = fn (string $permission): bool => $user->hasAdminPermission($permission);
        $periodEnd = $frequency === 'daily'
            ? $localNow->startOfDay()
            : $localNow->startOfWeek(CarbonImmutable::MONDAY);
        $periodStart = $frequency === 'daily' ? $periodEnd->subDay() : $periodEnd->subWeek();

        if (in_array('orders', $sections, true) && $can('orders.view') && Schema::hasTable('orders')) {
            $count = DB::table('orders')->where('status', 'pending')->count();
            if ($count > 0) {
                $lines[] = 'Đơn hàng mới chờ xử lý: '.number_format($count, 0, ',', '.').'.';
            }
        }

        if (in_array('revenue', $sections, true) && $can('reports.view') && Schema::hasTable('orders') && Schema::hasTable('payment_refunds')) {
            $netOrderAmount = 'GREATEST(orders.grand_total - COALESCE((SELECT SUM(payment_refunds.amount) FROM payment_refunds WHERE payment_refunds.order_id = orders.id), 0), 0)';
            $revenue = (int) DB::table('orders')->where('payment_status', 'paid')->whereIn('status', ['delivered', 'completed'])
                ->where('placed_at', '>=', $periodStart->utc())->where('placed_at', '<', $periodEnd->utc())
                ->sum(DB::raw($netOrderAmount));
            if ($revenue > 0) {
                $label = $frequency === 'daily' ? 'hôm qua' : 'tuần trước';
                $lines[] = 'Doanh thu thuần '.$label.': '.number_format($revenue, 0, ',', '.').' ₫.';
            }
        }

        if (in_array('low_stock', $sections, true) && $can('inventory.view') && Schema::hasTable('inventories')) {
            $count = DB::table('inventories')->whereRaw('(quantity - reserved) <= low_stock_threshold')->count();
            if ($count > 0) {
                $lines[] = 'Biến thể cần chú ý tồn kho: '.number_format($count, 0, ',', '.').'.';
            }
        }

        if (in_array('reviews', $sections, true) && $can('reviews.moderate') && Schema::hasTable('reviews')) {
            $count = DB::table('reviews')->where('status', 'pending')->count();
            if ($count > 0) {
                $lines[] = 'Đánh giá chờ duyệt: '.number_format($count, 0, ',', '.').'.';
            }
        }

        if (in_array('overdue_tasks', $sections, true) && Schema::hasTable('user_tasks')) {
            $count = DB::table('user_tasks')->where('user_id', $user->id)->where('status', '<>', 'done')
                ->whereNotNull('due_at')->where('due_at', '<', $localNow->utc())->count();
            if ($count > 0) {
                $lines[] = 'Việc cá nhân quá hạn: '.number_format($count, 0, ',', '.').'.';
            }
        }

        return $lines;
    }

    /** @return array<string, mixed> */
    private function decode(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        $decoded = is_string($value) ? json_decode($value, true) : null;

        return is_array($decoded) ? $decoded : [];
    }

    private function timezone(?string $value): string
    {
        $timezone = $value ?: config('app.timezone', 'UTC');

        return in_array($timezone, timezone_identifiers_list(), true) ? $timezone : 'UTC';
    }
}
