<?php

namespace Database\Seeders;

use App\Jobs\DemoNoopQueueJob;
use App\Models\ExportJob;
use App\Models\InventoryAdjustmentBatch;
use App\Models\Role;
use App\Models\User;
use App\Modules\Inventory\Actions\CreateInventoryAdjustmentBatchAction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class AdminWorkflowDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        $admin = User::query()
            ->whereHas('roles', fn ($query) => $query->whereIn('name', Role::ADMIN_NAMES))
            ->orderBy('id')
            ->first();
        if (! $admin) {
            return;
        }

        $this->seedDemoStaff();
        $this->seedPersonalWorkspace($admin);
        $this->seedInventoryAdjustmentBatch($admin);
        $this->seedReportSchedule($admin);
        $this->seedImportHistory($admin);
        $this->seedFailedQueueJob();
        $this->seedReadyDemoExport($admin);
    }

    private function seedDemoStaff(): ?User
    {
        $email = (string) config('store.demo_staff_email', 'demo.staff@example.test');
        $password = (string) config('store.demo_staff_password', '');
        if ($password === '') {
            $password = 'StoreDemo123!';
        }

        $staff = User::query()->firstOrCreate(
            ['email' => $email],
            ['name' => 'Nhân viên demo', 'password' => Hash::make($password), 'status' => 'active', 'job_title' => 'Nhân viên cửa hàng'],
        );
        if ($staff->wasRecentlyCreated) {
            $staff->forceFill(['email_verified_at' => now()])->save();
        } elseif (! Hash::check($password, (string) $staff->password)) {
            $staff->forceFill(['password' => Hash::make($password)])->save();
        }

        $role = Role::query()->where('name', 'staff')->where('guard_name', 'api')->first();
        if (! $role) {
            return null;
        }
        $staff->roles()->syncWithoutDetaching([$role->id]);

        return $staff;
    }

    private function seedInventoryAdjustmentBatch(User $admin): void
    {
        $note = '[Demo] Kiểm kê đa biến thể: cộng 2 sản phẩm vào tồn cho mỗi SKU mẫu.';
        if (InventoryAdjustmentBatch::query()->where('note', $note)->exists()) {
            return;
        }

        $variantIds = DB::table('product_variants as variant')
            ->join('products', 'products.id', '=', 'variant.product_id')
            ->where('products.slug', 'ao-so-mi-linen')
            ->where('variant.is_active', true)
            ->orderBy('variant.sku')
            ->limit(2)
            ->pluck('variant.id');
        if ($variantIds->count() !== 2) {
            return;
        }

        app(CreateInventoryAdjustmentBatchAction::class)->execute([
            'reason_category' => 'stocktake',
            'note' => $note,
            'rows' => $variantIds->map(fn ($variantId): array => [
                'variant_id' => (int) $variantId,
                'quantity_change' => 2,
            ])->all(),
        ], (int) $admin->id);
    }

    private function seedPersonalWorkspace(User $admin): void
    {
        $tasks = [
            ['title' => '[Demo] Kiểm tra ảnh sản phẩm mới', 'priority' => 'high', 'status' => 'todo', 'due_at' => now()->addDay()],
            ['title' => '[Demo] Đối chiếu đơn hàng tuần này', 'priority' => 'normal', 'status' => 'doing', 'due_at' => now()->addDays(2)],
            ['title' => '[Demo] Hoàn tất cập nhật danh mục', 'priority' => 'low', 'status' => 'done', 'due_at' => now()->subDay()],
        ];
        foreach ($tasks as $task) {
            $exists = DB::table('user_tasks')->where('user_id', $admin->id)->where('title', $task['title'])->exists();
            if (! $exists) {
                $now = now();
                DB::table('user_tasks')->insert([
                    'user_id' => $admin->id,
                    'title' => $task['title'],
                    'description' => 'Dữ liệu demo để kiểm tra workspace và chỉ số cá nhân trong Admin.',
                    'priority' => $task['priority'],
                    'status' => $task['status'],
                    'due_at' => $task['due_at'],
                    'completed_at' => $task['status'] === 'done' ? $now : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

    }

    private function seedReportSchedule(User $admin): void
    {
        $exists = DB::table('report_schedules')->where('user_id', $admin->id)->where('name', 'Lịch báo cáo doanh thu demo')->exists();
        if ($exists) {
            return;
        }

        DB::table('report_schedules')->insert([
            'user_id' => $admin->id,
            'name' => 'Lịch báo cáo doanh thu demo',
            'report' => 'revenue',
            'params' => json_encode(['range' => '7d'], JSON_THROW_ON_ERROR),
            'frequency' => 'weekly',
            'format' => 'csv',
            'recipients' => json_encode([$admin->email], JSON_THROW_ON_ERROR),
            'timezone' => $admin->timezone ?: 'Asia/Ho_Chi_Minh',
            'send_time' => '08:00:00',
            'weekday' => 1,
            'next_run_at' => null,
            'is_active' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedImportHistory(User $admin): void
    {
        $filename = 'inventory-demo-with-errors.csv';
        if (DB::table('import_jobs')->where('user_id', $admin->id)->where('source_filename', $filename)->exists()) {
            return;
        }

        DB::table('import_jobs')->insert([
            'user_id' => $admin->id,
            'type' => 'inventory_csv',
            'source_filename' => $filename,
            'status' => 'completed_with_errors',
            'total_rows' => 3,
            'successful_rows' => 2,
            'failed_rows' => 1,
            'error_rows' => json_encode([
                ['line' => 4, 'sku' => 'DEMO-SKU-NOT-FOUND', 'error' => 'Không tìm thấy SKU.'],
            ], JSON_THROW_ON_ERROR),
            'error_message' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedFailedQueueJob(): void
    {
        $table = (string) config('queue.failed.table', 'failed_jobs');
        if (! Schema::hasTable($table)) {
            return;
        }

        $uuid = 'd3a00000-0000-4000-8000-000000000002';
        if (DB::table($table)->where('uuid', $uuid)->exists()) {
            return;
        }

        $connection = (string) config('queue.default');
        $queue = (string) config("queue.connections.{$connection}.queue", 'default');
        $job = new DemoNoopQueueJob;
        $payload = [
            'uuid' => $uuid,
            'displayName' => DemoNoopQueueJob::class,
            'job' => 'Illuminate\\Queue\\CallQueuedHandler@call',
            'maxTries' => $job->tries,
            'maxExceptions' => null,
            'failOnTimeout' => false,
            'backoff' => null,
            'timeout' => null,
            'retryUntil' => null,
            'deleteWhenMissingModels' => false,
            'data' => [
                'commandName' => DemoNoopQueueJob::class,
                'command' => serialize($job),
                'batchId' => null,
            ],
            'delay' => null,
            'createdAt' => now()->timestamp,
        ];

        DB::table($table)->insertOrIgnore([
            'uuid' => $uuid,
            'connection' => $connection,
            'queue' => $queue,
            'payload' => json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            'exception' => "RuntimeException: [Demo] Job giả lập lỗi để kiểm tra màn hàng đợi; có thể thử lại an toàn.\n#0 {main}",
            'failed_at' => now(),
        ]);
    }

    private function seedReadyDemoExport(User $admin): void
    {
        if (! Schema::hasTable('export_jobs')) {
            return;
        }

        $filePath = 'exports/demo/admin-inventory-report.csv';
        $stream = fopen('php://temp', 'r+');
        if ($stream === false) {
            return;
        }

        fwrite($stream, "\xEF\xBB\xBF");
        foreach ([
            ['Ngày', 'Mã SKU', 'Sản phẩm', 'Tồn kho', 'Ghi chú'],
            [now()->toDateString(), 'DEMO-TSHIRT-001', 'Áo thun demo', '48', 'Dữ liệu minh họa, không phải tồn kho thật'],
            [now()->toDateString(), 'DEMO-PANTS-001', 'Quần dài demo', '17', 'Dữ liệu minh họa, không phải tồn kho thật'],
        ] as $row) {
            fputcsv($stream, $row, ',', '"', '');
        }
        rewind($stream);
        $csv = stream_get_contents($stream);
        fclose($stream);
        if (! is_string($csv) || ! Storage::disk('local')->put($filePath, $csv)) {
            return;
        }

        $attributes = [
            'user_id' => $admin->id,
            'type' => 'admin_report',
            'params' => [
                'filters' => ['report' => 'inventory', 'from' => now()->subDays(6)->toDateString(), 'to' => now()->toDateString()],
                'format' => 'csv',
                'demo_fixture' => true,
            ],
            'status' => 'ready',
            'progress' => 100,
            'file_path' => $filePath,
            'file_size' => strlen($csv),
            'error' => null,
            'expires_at' => now()->addDays(7),
            'finished_at' => now(),
        ];
        $export = ExportJob::query()->where('file_path', $filePath)->first();
        if ($export) {
            $export->update($attributes);

            return;
        }

        ExportJob::query()->create([...$attributes, 'created_at' => now()]);
    }
}
