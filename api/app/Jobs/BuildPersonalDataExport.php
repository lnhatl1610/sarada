<?php

namespace App\Jobs;

use App\Models\ExportJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;
use ZipArchive;

class BuildPersonalDataExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public function __construct(public readonly int $exportJobId) {}

    public function handle(): void
    {
        $job = ExportJob::query()->with('user')->findOrFail($this->exportJobId);
        $job->update(['status' => 'running', 'progress' => 10, 'error' => null]);
        $userId = $job->user_id;
        $relativePath = null;

        try {
            $profile = DB::table('users')->where('id', $userId)->first([
                'id', 'name', 'email', 'phone', 'phone_verified_at', 'avatar', 'gender', 'birthday', 'height_cm', 'weight_kg', 'bust_cm', 'waist_cm', 'hip_cm', 'status', 'email_verified_at',
                'job_title', 'department', 'bio', 'signature', 'timezone', 'created_at', 'updated_at', 'last_login_at',
            ]);
            $job->update(['progress' => 25]);

            $activityLogs = DB::table('activity_logs')->where('user_id', $userId)->orderBy('id')->get(['module', 'action', 'path', 'changes', 'ip', 'created_at'])
                ->map(function (object $row): array {
                    $entry = (array) $row;
                    if (is_string($entry['changes'] ?? null)) {
                        $decoded = json_decode($entry['changes'], true);
                        $entry['changes'] = is_array($decoded) ? $this->redactSensitiveKeys($decoded) : '[legacy payload omitted]';
                    } elseif (is_array($entry['changes'] ?? null)) {
                        $entry['changes'] = $this->redactSensitiveKeys($entry['changes']);
                    }

                    return $entry;
                });

            $data = [
                'profile.json' => $profile,
                'preferences.json' => DB::table('user_preferences')->where('user_id', $userId)->orderBy('key')->get(['key', 'value', 'created_at', 'updated_at']),
                'tasks.json' => DB::table('user_tasks')->where('user_id', $userId)->orderBy('id')->get([
                    'title', 'description', 'priority', 'status', 'due_at', 'remind_at', 'repeat_rule', 'subject_type', 'subject_id', 'completed_at', 'created_at', 'updated_at',
                ]),
                'activity-logs.json' => $activityLogs,
                'login-history.json' => DB::table('login_attempts')->where('user_id', $userId)->orderBy('id')->get(['result', 'ip_address', 'user_agent', 'location', 'reported_at', 'created_at']),
            ];
            $job->update(['progress' => 65]);

            $relativePath = 'exports/personal-data-'.$userId.'-'.$job->id.'.zip';
            $disk = Storage::disk('local');
            $absolutePath = $disk->path($relativePath);
            $directory = dirname($absolutePath);
            if (! is_dir($directory) && ! mkdir($directory, 0700, true) && ! is_dir($directory)) {
                throw new \RuntimeException('Không tạo được thư mục lưu tệp xuất.');
            }

            $zip = new ZipArchive;
            if ($zip->open($absolutePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new \RuntimeException('Không tạo được tệp ZIP.');
            }
            $zip->addFromString('README.txt', "Bản sao dữ liệu cá nhân Sarada\nTạo lúc: ".now()->toIso8601String()."\nTệp không chứa mật khẩu, mã xác thực hoặc token đăng nhập.\n");
            foreach ($data as $name => $rows) {
                $zip->addFromString($name, json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
            }
            $zip->close();

            $job->update([
                'status' => 'ready', 'progress' => 100, 'file_path' => $relativePath,
                'file_size' => $disk->size($relativePath), 'expires_at' => now()->addDays(7), 'finished_at' => now(), 'error' => null,
            ]);
        } catch (Throwable $exception) {
            if ($relativePath) {
                Storage::disk('local')->delete($relativePath);
            }
            Log::error('Personal data export failed.', ['export_job_id' => $job->id, 'exception' => $exception]);
            $job->update(['status' => 'failed', 'progress' => 0, 'error' => 'Không thể tạo tệp xuất. Vui lòng thử lại.', 'finished_at' => now()]);
            throw $exception;
        }
    }

    /** @param array<string|int, mixed> $values
     * @return array<string|int, mixed>
     */
    private function redactSensitiveKeys(array $values): array
    {
        $safe = [];
        foreach ($values as $key => $value) {
            if (preg_match('/password|token|secret|recovery|credential|authorization|cookie|api_key/i', (string) $key)) {
                continue;
            }
            $safe[$key] = is_array($value) ? $this->redactSensitiveKeys($value) : $value;
        }

        return $safe;
    }
}
