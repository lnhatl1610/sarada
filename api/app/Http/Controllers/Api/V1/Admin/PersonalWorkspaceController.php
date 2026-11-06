<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListPersonalPerformanceRequest;
use App\Http\Requests\Api\V1\Admin\ListPersonalRemindersRequest;
use App\Http\Requests\Api\V1\Admin\ListPersonalTasksRequest;
use App\Http\Requests\Api\V1\Admin\SnoozePersonalTaskRequest;
use App\Http\Requests\Api\V1\Admin\StorePersonalTaskRequest;
use App\Http\Requests\Api\V1\Admin\UpdatePersonalTaskRequest;
use App\Http\Resources\PersonalPerformanceResource;
use App\Http\Resources\PersonalTaskResource;
use App\Models\Role;
use App\Models\User;
use App\Models\UserTask;
use App\Modules\AdminAccess\Actions\GetPersonalPerformanceAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonalWorkspaceController extends Controller
{
    public function performance(ListPersonalPerformanceRequest $request, GetPersonalPerformanceAction $performance): JsonResponse
    {
        return PersonalPerformanceResource::make($performance->execute($request->user(), $request->validated('range', '7d')))->response();
    }

    public function taskAssignees(Request $request): JsonResponse
    {
        $user = $request->user();
        $canAssign = $user->hasAdminPermission('tasks.assign');

        abort_unless($canAssign, 403);

        $assignees = User::query()
            ->where('status', 'active')
            ->whereHas('roles', fn ($query) => $query->whereIn('name', Role::ADMIN_NAMES))
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $assignees]);
    }

    public function tasks(ListPersonalTasksRequest $request)
    {
        $filters = $request->validated();
        $query = UserTask::query()->where('user_id', $request->user()->id);

        if (($filters['tab'] ?? null) === 'assigned') {
            $query = UserTask::query()->where('assigned_by', $request->user()->id)->where('user_id', '<>', $request->user()->id);
        } else {
            $tab = $filters['tab'] ?? null;
            $query->when($tab === 'today', fn ($items) => $items->whereDate('due_at', today())->where('status', '<>', 'done'))
                ->when($tab === 'upcoming', fn ($items) => $items->whereDate('due_at', '>', today())->where('status', '<>', 'done'))
                ->when($tab === 'overdue', fn ($items) => $items->where('due_at', '<', now())->where('status', '<>', 'done'))
                ->when($tab === 'done', fn ($items) => $items->where('status', 'done'));
        }

        $items = $query->with('assignee:id,name')
            ->when(isset($filters['priority']), fn ($items) => $items->where('priority', $filters['priority']))
            ->when(isset($filters['subject_type']), fn ($items) => $items->where('subject_type', $filters['subject_type']))
            ->orderByRaw("CASE WHEN status = 'done' THEN 1 ELSE 0 END")
            ->orderByRaw('due_at IS NULL')->orderBy('due_at')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 20);

        return PersonalTaskResource::collection($items);
    }

    public function reminders(ListPersonalRemindersRequest $request)
    {
        $items = $request->user()->personalTasks()
            ->where('status', '<>', 'done')->whereNotNull('remind_at')
            ->with('assignee:id,name')->orderBy('remind_at')->orderBy('id')
            ->paginate(50);

        return PersonalTaskResource::collection($items);
    }

    public function snoozeReminder(SnoozePersonalTaskRequest $request, int $task): JsonResponse
    {
        $item = $request->user()->personalTasks()->findOrFail($task);
        if ($item->status === 'done') {
            return response()->json(['message' => 'Không thể hoãn nhắc việc đã hoàn tất.', 'code' => 'TASK_ALREADY_COMPLETED'], 422);
        }

        $duration = $request->validated('duration');
        $remindAt = match ($duration) {
            '10_minutes' => now()->addMinutes(10),
            '1_hour' => now()->addHour(),
            'tomorrow_morning' => Carbon::now($request->user()->timezone ?: config('app.timezone'))->addDay()->startOfDay()->addHours(8),
        };
        $item->update(['remind_at' => $remindAt, 'reminded_at' => null]);
        $this->forgetMenuSummary($request);

        return (new PersonalTaskResource($item->fresh()))->response();
    }

    public function storeTask(StorePersonalTaskRequest $request): JsonResponse
    {
        $data = $request->validated();
        $assigneeId = $data['user_id'] ?? $request->user()->id;
        unset($data['user_id']);
        $task = UserTask::query()->create($data + [
            'user_id' => $assigneeId,
            'assigned_by' => $assigneeId === $request->user()->id ? null : $request->user()->id,
            'completed_at' => ($data['status'] ?? null) === 'done' ? now() : null,
        ]);
        $this->forgetMenuSummary($request);

        return (new PersonalTaskResource($task))->response()->setStatusCode(201);
    }

    public function updateTask(UpdatePersonalTaskRequest $request, int $task): JsonResponse
    {
        $item = $request->user()->personalTasks()->findOrFail($task);
        $data = $request->validated();
        if (array_key_exists('status', $data)) {
            $data['completed_at'] = $data['status'] === 'done' ? ($item->completed_at ?? now()) : null;
        }
        if (array_key_exists('remind_at', $data)) {
            $data['reminded_at'] = null;
        }
        $item->update($data);
        $this->forgetMenuSummary($request);

        return (new PersonalTaskResource($item->fresh()))->response();
    }

    public function completeTask(Request $request, int $task): JsonResponse
    {
        $item = $request->user()->personalTasks()->findOrFail($task);
        $item->update(['status' => 'done', 'completed_at' => now()]);
        $this->forgetMenuSummary($request);

        return (new PersonalTaskResource($item->fresh()))->response();
    }

    public function deleteTask(Request $request, int $task): JsonResponse
    {
        $request->user()->personalTasks()->findOrFail($task)->delete();
        $this->forgetMenuSummary($request);

        return response()->json(['message' => 'Đã xóa việc cần làm.']);
    }

    private function forgetMenuSummary(Request $request): void
    {
        Cache::forget('admin-account-menu-summary:'.$request->user()->id);
    }
}
