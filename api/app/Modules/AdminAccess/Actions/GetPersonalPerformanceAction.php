<?php

namespace App\Modules\AdminAccess\Actions;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GetPersonalPerformanceAction
{
    /** @return array<string, mixed> */
    public function execute(User $user, string $range, ?User $permissionSubject = null): array
    {
        $timezone = is_string($user->timezone) && in_array($user->timezone, timezone_identifiers_list(), true)
            ? $user->timezone
            : (string) config('app.timezone', 'UTC');
        $now = CarbonImmutable::now($timezone);
        $days = match ($range) {
            'today' => 1,
            '30d' => 30,
            default => 7,
        };
        $currentStart = $now->startOfDay()->subDays($days - 1);
        $previousStart = $currentStart->subDays($days);
        $previousEnd = $currentStart->subSecond();
        $periodBounds = [
            'current' => [$currentStart, $now],
            'previous' => [$previousStart, $previousEnd],
        ];
        $currentMetrics = $this->emptyMetrics();
        $previousMetrics = $this->emptyMetrics();
        $confirmationDurations = ['current' => [], 'previous' => []];
        $timeline = [];
        for ($index = 0; $index < $days; $index++) {
            $date = $currentStart->addDays($index);
            $previousDate = $previousStart->addDays($index);
            $timeline[] = [
                'date' => $date->toDateString(),
                'label' => $date->format('d/m'),
                'current' => 0,
                'previous' => 0,
                'previous_date' => $previousDate->toDateString(),
            ];
        }
        $boundsUtc = [
            $previousStart->utc()->format('Y-m-d H:i:s'),
            $now->utc()->format('Y-m-d H:i:s'),
        ];
        $record = function (string $metric, mixed $createdAt, mixed $placedAt = null) use (
            &$currentMetrics,
            &$previousMetrics,
            &$confirmationDurations,
            &$timeline,
            $periodBounds,
            $timezone,
            $currentStart,
            $previousStart,
        ): void {
            if (! is_string($createdAt) || $createdAt === '') {
                return;
            }
            $occurredAt = CarbonImmutable::parse($createdAt, 'UTC')->setTimezone($timezone);
            $period = null;
            foreach ($periodBounds as $name => [$start, $end]) {
                if ($occurredAt->greaterThanOrEqualTo($start) && $occurredAt->lessThanOrEqualTo($end)) {
                    $period = $name;
                    break;
                }
            }
            if ($period === null) {
                return;
            }

            $metricBucket = $period === 'current' ? $currentMetrics : $previousMetrics;
            if (is_int($metricBucket[$metric] ?? null)) {
                $metricBucket[$metric]++;
                if ($period === 'current') {
                    $currentMetrics = $metricBucket;
                } else {
                    $previousMetrics = $metricBucket;
                }
            }

            $dayOffset = (int) ($period === 'current'
                ? $currentStart->diffInDays($occurredAt->startOfDay())
                : $previousStart->diffInDays($occurredAt->startOfDay()));
            if (isset($timeline[$dayOffset])) {
                $timeline[$dayOffset][$period]++;
            }

            if ($metric === 'orders_confirmed' && is_string($placedAt) && $placedAt !== '') {
                $placed = CarbonImmutable::parse($placedAt, 'UTC');
                $confirmationDurations[$period][] = max(0, $placed->diffInSeconds(CarbonImmutable::parse($createdAt, 'UTC')));
            }
        };

        $permissionSubject ??= $user;
        $canViewOrders = $this->userHasPermission($permissionSubject, 'orders.view');
        $canViewInventory = $this->userHasPermission($permissionSubject, 'inventory.view');
        $canModerateReviews = $this->userHasPermission($permissionSubject, 'reviews.moderate');
        foreach (['current', 'previous'] as $period) {
            $metrics = $period === 'current' ? $currentMetrics : $previousMetrics;
            $metrics['orders_confirmed'] = $canViewOrders ? 0 : null;
            $metrics['orders_packed'] = $canViewOrders ? 0 : null;
            $metrics['orders_delivered'] = $canViewOrders ? 0 : null;
            $metrics['orders_cancelled'] = $canViewOrders ? 0 : null;
            $metrics['average_confirmation_minutes'] = $canViewOrders ? null : null;
            $metrics['inventory_adjustments'] = $canViewInventory ? 0 : null;
            $metrics['reviews_approved'] = $canModerateReviews ? 0 : null;
            $metrics['tasks_on_time'] = 0;
            if ($period === 'current') {
                $currentMetrics = $metrics;
            } else {
                $previousMetrics = $metrics;
            }
        }

        if ($canViewOrders) {
            DB::table('order_status_histories')->join('orders', 'orders.id', '=', 'order_status_histories.order_id')
                ->where('order_status_histories.changed_by', $user->id)
                ->whereIn('order_status_histories.to_status', ['confirmed', 'processing', 'delivered', 'cancelled'])
                ->whereBetween('order_status_histories.created_at', $boundsUtc)
                ->get(['order_status_histories.to_status', 'order_status_histories.created_at', 'orders.placed_at', 'orders.created_at as order_created_at'])
                ->each(function (object $event) use ($record): void {
                    $metric = match ($event->to_status) {
                        'confirmed' => 'orders_confirmed',
                        'processing' => 'orders_packed',
                        'delivered' => 'orders_delivered',
                        'cancelled' => 'orders_cancelled',
                    };
                    $record($metric, (string) $event->created_at, $metric === 'orders_confirmed' ? (string) ($event->placed_at ?? $event->order_created_at) : null);
                });
        }

        if ($canViewInventory) {
            DB::table('inventory_movements')->where('created_by', $user->id)->where('type', 'adjust')
                ->whereBetween('created_at', $boundsUtc)->orderBy('created_at')
                ->get(['created_at'])->each(fn (object $event) => $record('inventory_adjustments', (string) $event->created_at));
        }

        if ($canModerateReviews && Schema::hasTable('activity_logs')) {
            DB::table('activity_logs')->where('user_id', $user->id)->where('module', 'reviews')->where('action', 'UPDATE')
                ->where('path', 'like', 'api/v1/admin/reviews/%/status')->whereBetween('created_at', $boundsUtc)
                ->orderBy('created_at')->get(['changes', 'created_at'])->each(function (object $event) use ($record): void {
                    $changes = is_string($event->changes) ? json_decode($event->changes, true) : null;
                    if (is_array($changes) && ($changes['status'] ?? null) === 'approved') {
                        $record('reviews_approved', (string) $event->created_at);
                    }
                });
        }

        if (Schema::hasTable('user_tasks')) {
            DB::table('user_tasks')->where('user_id', $user->id)->where('status', 'done')->whereNotNull('completed_at')
                ->whereNotNull('due_at')->whereColumn('completed_at', '<=', 'due_at')
                ->whereBetween('completed_at', $boundsUtc)->orderBy('completed_at')->get(['completed_at'])
                ->each(fn (object $event) => $record('tasks_on_time', (string) $event->completed_at));
        }

        foreach (['current', 'previous'] as $period) {
            $durations = $confirmationDurations[$period];
            $average = $durations === [] ? null : round(array_sum($durations) / count($durations) / 60, 1);
            if ($period === 'current') {
                $currentMetrics['average_confirmation_minutes'] = $canViewOrders ? $average : null;
            } else {
                $previousMetrics['average_confirmation_minutes'] = $canViewOrders ? $average : null;
            }
        }

        return [
            'subject' => ['id' => $user->id, 'name' => $user->name],
            'range' => $range,
            'timezone' => $timezone,
            'period_start' => $currentStart->toDateString(),
            'period_end' => $now->toDateString(),
            'previous_start' => $previousStart->toDateString(),
            'previous_end' => $previousEnd->toDateString(),
            'current' => $currentMetrics,
            'previous' => $previousMetrics,
            'timeline' => $timeline,
            'available' => ['orders' => $canViewOrders, 'inventory' => $canViewInventory, 'reviews' => $canModerateReviews],
        ];
    }

    /** @return array<string, int|null> */
    private function emptyMetrics(): array
    {
        return [
            'orders_confirmed' => 0,
            'orders_packed' => 0,
            'orders_delivered' => 0,
            'orders_cancelled' => 0,
            'average_confirmation_minutes' => null,
            'inventory_adjustments' => 0,
            'reviews_approved' => 0,
            'tasks_on_time' => 0,
        ];
    }

    private function userHasPermission(User $user, string $permission): bool
    {
        return $user->hasAdminPermission($permission);
    }
}
