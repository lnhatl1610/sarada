<?php

namespace App\Http\Controllers\Api\V1\Identity;

use App\Http\Controllers\Controller;
use App\Jobs\BuildPersonalDataExport;
use App\Models\ExportJob;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AccountPrivacyController extends Controller
{
    public function retention(): JsonResponse
    {
        $activityLogDays = (int) (Setting::query()->where('key', 'activity.retention_days')->value('value') ?? 365);

        return response()->json(['data' => [
            'login_history_days' => 180,
            'read_notifications_days' => 90,
            'activity_log_days' => max(30, min(3650, $activityLogDays)),
            'personal_exports_days' => 7,
        ]]);
    }

    public function exports(Request $request): JsonResponse
    {
        $items = ExportJob::query()->where('user_id', $request->user()->id)->where('type', 'personal_data')->orderByDesc('created_at')->limit(20)->get();
        foreach ($items as $item) {
            if ($item->status === 'ready' && $item->expires_at?->isPast()) {
                $expiredPath = $item->file_path;
                $item->update(['status' => 'expired', 'file_path' => null]);
                if ($expiredPath) {
                    Storage::disk('local')->delete($expiredPath);
                }
            }
        }

        return response()->json(['data' => $items->map(fn (ExportJob $item): array => $this->exportData($item))->values()]);
    }

    public function createExport(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeJobs = ExportJob::query()->where('user_id', $user->id)->where('type', 'personal_data')->whereIn('status', ['queued', 'running'])->count();
        if ($activeJobs >= 2) {
            return response()->json(['message' => 'Bạn đã có yêu cầu xuất dữ liệu đang xử lý.'], 429);
        }

        $job = ExportJob::query()->create(['user_id' => $user->id, 'type' => 'personal_data', 'status' => 'queued', 'progress' => 0, 'created_at' => now()]);
        BuildPersonalDataExport::dispatch($job->id);

        return response()->json(['data' => $this->exportData($job), 'message' => 'Đã tiếp nhận yêu cầu xuất dữ liệu.'], 202);
    }

    public function download(Request $request, int $job): BinaryFileResponse
    {
        $export = ExportJob::query()->where('user_id', $request->user()->id)->where('type', 'personal_data')->findOrFail($job);
        abort_unless($export->status === 'ready' && $export->expires_at?->isFuture() && $export->file_path, 410, 'Tệp xuất đã hết hạn hoặc chưa sẵn sàng.');
        abort_unless(Storage::disk('local')->exists($export->file_path), 404);

        return response()->download(Storage::disk('local')->path($export->file_path), 'fashion-store-personal-data-'.$export->id.'.zip');
    }

    /** @return array<string, mixed> */
    private function exportData(ExportJob $job): array
    {
        return [
            'id' => $job->id,
            'status' => $job->status,
            'progress' => $job->progress,
            'file_size' => $job->file_size,
            'error' => $job->error,
            'created_at' => $job->created_at?->toIso8601String(),
            'finished_at' => $job->finished_at?->toIso8601String(),
            'expires_at' => $job->expires_at?->toIso8601String(),
            'download_url' => $job->status === 'ready' && $job->expires_at?->isFuture()
                ? URL::temporarySignedRoute('account.privacy.exports.download', $job->expires_at, ['job' => $job->id])
                : null,
        ];
    }
}
