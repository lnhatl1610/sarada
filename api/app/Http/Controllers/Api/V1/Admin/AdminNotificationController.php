<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListAdminNotificationsRequest;
use App\Http\Requests\Api\V1\Admin\SnoozeAdminNotificationRequest;
use App\Http\Requests\Api\V1\Admin\UpdateAdminNotificationArchiveRequest;
use App\Http\Resources\AdminNotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class AdminNotificationController extends Controller
{
    public function index(ListAdminNotificationsRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $query = $request->user()->notifications()->whereIn('data->event', $this->visibleEvents($request));
        $active = fn () => (clone $query)->whereNull('archived_at')->where(fn ($items) => $items->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', now()));
        $unreadCount = $active()->whereNull('read_at')->count();
        $page = $query
            ->when(($filters['status'] ?? 'all') === 'archived', fn ($items) => $items->whereNotNull('archived_at'))
            ->when(($filters['status'] ?? 'all') !== 'archived', fn ($items) => $items->whereNull('archived_at')->where(fn ($activeItems) => $activeItems->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', now())))
            ->when(($filters['status'] ?? null) === 'unread' || ($filters['unread'] ?? false), fn ($items) => $items->whereNull('read_at'))
            ->when(isset($filters['event']), fn ($items) => $items->where('data->event', $filters['event']))
            ->when(isset($filters['priority']), fn ($items) => $items->where(fn ($priorityItems) => $filters['priority'] === 'normal'
                ? $priorityItems->where('data->priority', 'normal')->orWhereNull('data->priority')
                : $priorityItems->where('data->priority', $filters['priority'])))
            ->when(isset($filters['q']), fn ($items) => $items->where(fn ($search) => $search->where('data->title', 'like', '%'.$filters['q'].'%')->orWhere('data->detail', 'like', '%'.$filters['q'].'%')))
            ->latest()->paginate($filters['per_page'] ?? 25);

        return response()->json([
            'data' => collect($page->items())->map(fn (DatabaseNotification $notification): array => (new AdminNotificationResource($notification))->resolve($request))->values(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $item = $request->user()->notifications()
            ->whereIn('data->event', $this->visibleEvents($request))
            ->findOrFail($notification);
        $item->markAsRead();

        return response()->json(['data' => ['id' => $item->id, 'read_at' => $item->fresh()->read_at?->toIso8601String()]]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $request->user()->unreadNotifications()
            ->whereIn('data->event', $this->visibleEvents($request))
            ->whereNull('archived_at')
            ->where(fn ($items) => $items->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', now()))
            ->update(['read_at' => now()]);

        return response()->json(['data' => ['updated_count' => $count]]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()->unreadNotifications()
            ->whereIn('data->event', $this->visibleEvents($request))
            ->whereNull('archived_at')
            ->where(fn ($items) => $items->whereNull('snoozed_until')->orWhere('snoozed_until', '<=', now()))
            ->count();

        return response()->json(['data' => ['unread_count' => $count]]);
    }

    public function archive(UpdateAdminNotificationArchiveRequest $request, string $notification): JsonResponse
    {
        $item = $request->user()->notifications()->whereIn('data->event', $this->visibleEvents($request))->findOrFail($notification);
        $item->forceFill(['archived_at' => $request->validated('archived', true) ? now() : null])->save();

        return response()->json(['data' => (new AdminNotificationResource($item->fresh()))->resolve($request)]);
    }

    public function snooze(SnoozeAdminNotificationRequest $request, string $notification): JsonResponse
    {
        $item = $request->user()->notifications()->whereIn('data->event', $this->visibleEvents($request))->findOrFail($notification);
        $until = match ($request->validated('until')) {
            'one_hour' => now()->addHour(),
            'this_afternoon' => now()->setTime(15, 0)->isFuture() ? now()->setTime(15, 0) : now()->addDay()->setTime(15, 0),
            'tomorrow' => now()->addDay()->startOfDay()->setTime(9, 0),
        };
        $item->forceFill(['snoozed_until' => $until])->save();

        return response()->json(['data' => ['id' => $item->id, 'snoozed_until' => $until->toIso8601String()]]);
    }

    public function destroy(Request $request, string $notification): JsonResponse
    {
        $item = $request->user()->notifications()->whereIn('data->event', $this->visibleEvents($request))->findOrFail($notification);
        $item->delete();

        return response()->json(['data' => ['id' => $notification, 'deleted' => true]]);
    }

    /** @return list<string> */
    private function visibleEvents(Request $request): array
    {
        $permissions = [
            'new_order' => 'orders.view',
            'delivery_failed' => 'orders.view',
            'low_stock' => 'inventory.view',
            'review_pending' => 'reviews.moderate',
            'staff_pending' => 'users.manage',
            'weekly_report' => 'reports.view',
            'admin_digest' => null,
            'export_complete' => null,
        ];
        $permissions['task_reminder'] = null;
        if ($request->user()->roles()->where('name', 'super_admin')->exists()) {
            return array_keys($permissions);
        }

        return collect($permissions)->filter(fn (?string $permission): bool => $permission === null || $request->user()->hasAdminPermission($permission))->keys()->values()->all();
    }
}
