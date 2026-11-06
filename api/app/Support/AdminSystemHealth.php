<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Schema;
use Throwable;

final class AdminSystemHealth
{
    public function report(): array
    {
        $services = [
            'api' => ['status' => 'ok', 'message' => 'API đang phản hồi.'],
            'database' => $this->database(),
            'queue' => $this->queue(),
            'failed_jobs' => $this->failedJobs(),
            'scheduler' => $this->scheduler(),
            'mail' => $this->mail(),
            'storage' => $this->storage(),
            'backups' => $this->backups(),
        ];
        $statuses = array_column($services, 'status');
        $status = in_array('error', $statuses, true) ? 'error' : (in_array('warning', $statuses, true) ? 'warning' : 'ok');

        return [
            'status' => $status,
            'checked_at' => now()->toIso8601String(),
            'services' => $services,
            'versions' => [
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
                'node' => getenv('NODE_VERSION') ?: null,
                'environment' => app()->environment(),
            ],
        ];
    }

    private function database(): array
    {
        $startedAt = microtime(true);
        try {
            DB::select('SELECT 1');

            return ['status' => 'ok', 'latency_ms' => (int) round((microtime(true) - $startedAt) * 1000)];
        } catch (Throwable) {
            return ['status' => 'error', 'message' => 'Không kết nối được cơ sở dữ liệu.'];
        }
    }

    private function queue(): array
    {
        $driver = (string) config('queue.default');
        $connection = (array) config("queue.connections.{$driver}", []);
        $queueName = (string) ($connection['queue'] ?? 'default');
        try {
            $pending = match ($driver) {
                'sync', 'deferred', 'background', 'null' => 0,
                'database' => Schema::hasTable($connection['table'] ?? 'jobs')
                    ? DB::table($connection['table'] ?? 'jobs')->where('queue', $queueName)->count()
                    : null,
                'redis' => Redis::connection($connection['connection'] ?? 'default')->llen("queues:{$queueName}"),
                default => null,
            };
            $status = $pending === null ? 'warning' : ($pending > 1000 ? 'warning' : 'ok');

            return ['status' => $status, 'driver' => $driver, 'queue' => $queueName, 'pending' => $pending];
        } catch (Throwable) {
            return ['status' => 'error', 'driver' => $driver, 'queue' => $queueName, 'message' => 'Không đọc được hàng đợi.'];
        }
    }

    private function failedJobs(): array
    {
        try {
            if (! Schema::hasTable(config('queue.failed.table', 'failed_jobs'))) {
                return ['status' => 'warning', 'count' => null, 'message' => 'Chưa có bảng hàng đợi lỗi.'];
            }
            $count = DB::table(config('queue.failed.table', 'failed_jobs'))->count();

            return ['status' => $count > 0 ? 'warning' : 'ok', 'count' => $count];
        } catch (Throwable) {
            return ['status' => 'error', 'count' => null, 'message' => 'Không đọc được hàng đợi lỗi.'];
        }
    }

    private function scheduler(): array
    {
        try {
            $lastRun = Cache::get('admin-system-schedule-heartbeat');
            if (! is_string($lastRun)) {
                return ['status' => 'warning', 'last_run_at' => null, 'message' => 'Chưa ghi nhận lần chạy schedule.'];
            }
            $lastRunAt = now()->parse($lastRun);

            return [
                'status' => $lastRunAt->greaterThan(now()->subMinutes(3)) ? 'ok' : 'error',
                'last_run_at' => $lastRunAt->toIso8601String(),
            ];
        } catch (Throwable) {
            return ['status' => 'error', 'last_run_at' => null, 'message' => 'Không đọc được trạng thái schedule.'];
        }
    }

    private function mail(): array
    {
        $mailer = (string) config('mail.default');
        $transport = config("mail.mailers.{$mailer}.transport");

        return $transport
            ? ['status' => 'ok', 'mailer' => $mailer, 'transport' => $transport]
            : ['status' => 'warning', 'mailer' => $mailer, 'message' => 'Chưa cấu hình transport email.'];
    }

    private function storage(): array
    {
        $path = storage_path();
        $disk = (string) config('filesystems.default');
        $diskConfig = (array) config("filesystems.disks.{$disk}", []);
        $diskRoot = $diskConfig['root'] ?? $path;
        $free = @disk_free_space($path);
        $total = @disk_total_space($path);
        $writable = is_writable($path);
        $diskWritable = ($diskConfig['driver'] ?? null) === 'local' ? is_writable($diskRoot) : null;
        $status = ! $writable || $free === false || $diskWritable === false ? 'error' : ($free < 100 * 1024 * 1024 ? 'warning' : 'ok');

        return [
            'status' => $status,
            'writable' => $writable,
            'free_bytes' => $free === false ? null : (int) $free,
            'total_bytes' => $total === false ? null : (int) $total,
            'disk' => $disk,
            'disk_writable' => $diskWritable,
        ];
    }

    private function backups(): array
    {
        try {
            if (! Schema::hasTable('system_backup_runs')) {
                return ['status' => 'warning', 'last_success_at' => null, 'message' => 'Chưa cài đặt bảng theo dõi sao lưu.'];
            }

            $lastSuccess = DB::table('system_backup_runs')->where('status', 'completed')->max('finished_at');
            if (! is_string($lastSuccess)) {
                return ['status' => 'warning', 'last_success_at' => null, 'message' => 'Chưa có bản sao lưu thành công.'];
            }

            $last = now()->parse($lastSuccess);

            return [
                'status' => $last->greaterThan(now()->subHours(48)) ? 'ok' : 'warning',
                'last_success_at' => $last->toIso8601String(),
                'hours_since_success' => (int) $last->diffInHours(now()),
                'message' => $last->greaterThan(now()->subHours(48)) ? 'Bản sao lưu mới nhất chưa quá 48 giờ.' : 'Đã quá 48 giờ từ lần sao lưu thành công gần nhất.',
            ];
        } catch (Throwable) {
            return ['status' => 'error', 'last_success_at' => null, 'message' => 'Không đọc được trạng thái sao lưu.'];
        }
    }
}
