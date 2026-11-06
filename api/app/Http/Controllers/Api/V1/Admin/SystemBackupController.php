<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreSystemBackupRequest;
use App\Jobs\RunSystemBackup;
use App\Models\SystemBackupRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SystemBackupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $disk = Storage::disk('backups');
        $directory = (string) config('backup.backup.name');
        $files = collect($disk->files($directory))
            ->filter(fn (string $path): bool => str_ends_with(strtolower($path), '.zip'))
            ->sortByDesc(fn (string $path): int => $disk->lastModified($path))
            ->take(100)
            ->map(fn (string $path): array => [
                'file_name' => basename($path),
                'size' => $disk->size($path),
                'created_at' => now()->setTimestamp($disk->lastModified($path))->toIso8601String(),
                'download_url' => route('admin.system.backups.download', ['file' => basename($path)]),
            ])->values();

        $runs = SystemBackupRun::query()->with('requester:id,name,email')->latest()->limit(50)->get()
            ->map(fn (SystemBackupRun $run): array => [
                'id' => $run->id,
                'status' => $run->status,
                'file_name' => $run->file_name,
                'file_size' => $run->file_size,
                'error' => $run->error,
                'requested_by' => $run->requester?->name,
                'created_at' => $run->created_at?->toIso8601String(),
                'started_at' => $run->started_at?->toIso8601String(),
                'finished_at' => $run->finished_at?->toIso8601String(),
            ]);

        return response()->json(['data' => ['backups' => $files, 'runs' => $runs]]);
    }

    public function store(StoreSystemBackupRequest $request): JsonResponse
    {
        if (! filled(config('backup.backup.password'))) {
            return response()->json(['message' => 'Configure BACKUP_ARCHIVE_PASSWORD before creating a backup.'], 503);
        }

        if (SystemBackupRun::query()->whereIn('status', ['queued', 'running'])->exists()) {
            return response()->json(['message' => 'A backup is already queued or running.'], 409);
        }

        $run = SystemBackupRun::query()->create(['requested_by' => $request->user()->id, 'status' => 'queued']);
        RunSystemBackup::dispatch($run->id);

        return response()->json(['data' => ['id' => $run->id, 'status' => $run->status], 'message' => 'Backup request queued.'], 202);
    }

    public function download(string $file): StreamedResponse
    {
        abort_unless(preg_match('/^[A-Za-z0-9._-]+\.zip$/i', $file) === 1, 404);
        $path = (string) config('backup.backup.name').'/'.$file;
        abort_unless(Storage::disk('backups')->exists($path), 404);

        return Storage::disk('backups')->download($path, $file, ['Content-Type' => 'application/zip']);
    }
}
