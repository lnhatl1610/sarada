<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class CustomerNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $this->customerNotifications($request)
            ->latest('created_at')
            ->paginate(min(50, max(1, $request->integer('per_page', 20))));

        return response()->json([
            'data' => collect($notifications->items())->map(fn (DatabaseNotification $notification): array => $this->present($notification))->values(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $this->customerNotifications($request)->whereNull('read_at')->count(),
            ],
        ]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $item = $this->customerNotifications($request)->findOrFail($notification);
        if ($item->read_at === null) {
            $item->markAsRead();
        }

        return response()->json(['data' => ['id' => $item->id, 'read_at' => $item->fresh()->read_at?->toIso8601String()]]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->customerNotifications($request)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['data' => ['updated_count' => $count]]);
    }

    private function customerNotifications(Request $request): MorphMany
    {
        return $request->user()->notifications()->where('data->audience', 'storefront');
    }

    /** @return array<string, mixed> */
    private function present(DatabaseNotification $notification): array
    {
        $data = $notification->data;

        return [
            'id' => $notification->id,
            'event' => (string) ($data['event'] ?? 'system'),
            'title' => (string) ($data['title'] ?? ''),
            'message' => (string) ($data['message'] ?? ''),
            'href' => (string) ($data['href'] ?? '/account'),
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
        ];
    }
}
