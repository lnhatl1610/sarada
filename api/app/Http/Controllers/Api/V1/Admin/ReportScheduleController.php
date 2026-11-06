<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ReportScheduleRequest;
use App\Models\ReportSchedule;
use App\Modules\Reporting\Actions\EligibleReportRecipients;
use App\Modules\Reporting\Actions\NextReportScheduleRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $schedules = ReportSchedule::query()->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')->paginate(min(100, max(1, $request->integer('per_page', 20))));

        return response()->json([
            'data' => $schedules->getCollection()->map(fn (ReportSchedule $schedule): array => $this->serialize($schedule))->values(),
            'meta' => ['current_page' => $schedules->currentPage(), 'per_page' => $schedules->perPage(), 'total' => $schedules->total()],
        ]);
    }

    public function store(ReportScheduleRequest $request, NextReportScheduleRun $nextRun, EligibleReportRecipients $eligibleRecipients): JsonResponse
    {
        $data = $request->validated();
        $eligibleRecipients->assertAllAllowed($data['recipients']);
        $data['user_id'] = $request->user()->id;
        $data['next_run_at'] = $nextRun($data['frequency'], $data['timezone'], $data['send_time'], $data['weekday'] ?? null, $data['month_day'] ?? null, now()->toImmutable());

        $schedule = ReportSchedule::query()->create($data);

        return response()->json(['data' => $this->serialize($schedule), 'message' => 'Đã tạo lịch gửi báo cáo.'], 201);
    }

    public function update(ReportScheduleRequest $request, int $schedule, NextReportScheduleRun $nextRun, EligibleReportRecipients $eligibleRecipients): JsonResponse
    {
        $item = ReportSchedule::query()->where('user_id', $request->user()->id)->findOrFail($schedule);
        $data = $request->validated();
        if (isset($data['recipients'])) {
            $eligibleRecipients->assertAllAllowed($data['recipients']);
        }
        $next = array_merge($item->getAttributes(), $data);
        if (array_intersect(array_keys($data), ['frequency', 'send_time', 'timezone', 'weekday', 'month_day', 'is_active'])) {
            $data['next_run_at'] = ($data['is_active'] ?? $item->is_active)
                ? $nextRun($next['frequency'], $next['timezone'], substr((string) $next['send_time'], 0, 5), isset($next['weekday']) ? (int) $next['weekday'] : null, isset($next['month_day']) ? (int) $next['month_day'] : null, now()->toImmutable())
                : null;
        }
        $item->update($data);

        return response()->json(['data' => $this->serialize($item->refresh()), 'message' => 'Đã cập nhật lịch gửi báo cáo.']);
    }

    public function destroy(Request $request, int $schedule): JsonResponse
    {
        ReportSchedule::query()->where('user_id', $request->user()->id)->findOrFail($schedule)->delete();

        return response()->json(['message' => 'Đã xóa lịch gửi báo cáo.']);
    }

    /** @return array<string, mixed> */
    private function serialize(ReportSchedule $schedule): array
    {
        return [
            'id' => $schedule->id,
            'name' => $schedule->name,
            'report' => $schedule->report,
            'params' => $schedule->params ?? [],
            'frequency' => $schedule->frequency,
            'format' => $schedule->format,
            'recipients' => $schedule->recipients ?? [],
            'timezone' => $schedule->timezone,
            'send_time' => substr((string) $schedule->send_time, 0, 5),
            'weekday' => $schedule->weekday,
            'month_day' => $schedule->month_day,
            'next_run_at' => $schedule->next_run_at?->toIso8601String(),
            'last_run_at' => $schedule->last_run_at?->toIso8601String(),
            'last_error' => $schedule->last_error,
            'is_active' => $schedule->is_active,
            'created_at' => $schedule->created_at?->toIso8601String(),
            'updated_at' => $schedule->updated_at?->toIso8601String(),
        ];
    }
}
