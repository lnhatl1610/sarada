<?php

namespace App\Jobs;

use App\Models\SystemBackupRun;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class RunSystemBackup implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 1;

    public int $uniqueFor = 3600;

    public function __construct(public readonly int $runId) {}

    public function uniqueId(): string
    {
        return 'system-backup';
    }

    public function handle(): void
    {
        $run = SystemBackupRun::query()->findOrFail($this->runId);
        $run->update(['status' => 'running', 'started_at' => now(), 'error' => null]);

        $requester = User::query()->find($run->requested_by);
        if (! $requester || $requester->status !== 'active' || ! $requester->hasAdminPermission('system.backup')) {
            $run->update(['status' => 'failed', 'error' => 'The requesting admin no longer has permission to run backups.', 'finished_at' => now()]);

            return;
        }

        try {
            $exitCode = Artisan::call('backup:run');
            if ($exitCode !== 0) {
                throw new \RuntimeException('Spatie backup:run exited with code '.$exitCode.'.');
            }

            $disk = Storage::disk('backups');
            $directory = (string) config('backup.backup.name');
            $file = collect($disk->files($directory))
                ->filter(fn (string $path): bool => str_ends_with(strtolower($path), '.zip'))
                ->sortByDesc(fn (string $path): int => $disk->lastModified($path))
                ->first();

            if (! $file) {
                throw new \RuntimeException('The backup command completed without producing a ZIP archive.');
            }

            $run->update([
                'status' => 'completed',
                'file_name' => basename($file),
                'file_size' => $disk->size($file),
                'finished_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::error('System backup failed.', ['run_id' => $run->id, 'exception' => $exception]);
            $run->update(['status' => 'failed', 'error' => 'Sao lưu thất bại. Kiểm tra log máy chủ, mysqldump, PHP ZIP và mật khẩu mã hóa.', 'finished_at' => now()]);
            throw $exception;
        }
    }
}
