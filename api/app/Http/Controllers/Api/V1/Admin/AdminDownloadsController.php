<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ExportAdminCustomersRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminDownloadsRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminOrdersRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminProductsRequest;
use App\Http\Requests\Api\V1\Admin\ListInventoryRequest;
use App\Http\Requests\Api\V1\Admin\ListOperationsRequest;
use App\Http\Requests\Api\V1\Admin\ReportRequest;
use App\Jobs\BuildAdminExport;
use App\Jobs\BuildPersonalDataExport;
use App\Jobs\SendScheduledReport;
use App\Models\ExportJob;
use App\Models\ReportSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminDownloadsController extends Controller
{
    private const EXPORT_TYPES = ['personal_data', 'scheduled_report', 'admin_customers', 'admin_products', 'admin_orders', 'admin_inventory', 'admin_activity', 'admin_report'];

    public function index(ListAdminDownloadsRequest $request): JsonResponse
    {
        $expired = ExportJob::query()->whereIn('type', self::EXPORT_TYPES)
            ->where('status', 'ready')->whereNotNull('expires_at')->where('expires_at', '<=', now());
        if (! $request->user()->hasAdminPermission('exports.view_all')) {
            $expired->where('user_id', $request->user()->id);
        }
        $expired->orderBy('id')->chunkById(100, function ($jobs): void {
            foreach ($jobs as $expiredItem) {
                if ($expiredItem->file_path) {
                    Storage::disk('local')->delete($expiredItem->file_path);
                }
                $expiredItem->update(['status' => 'expired', 'file_path' => null]);
            }
        });

        $query = ExportJob::query()->whereIn('type', self::EXPORT_TYPES);
        if (! $request->user()->hasAdminPermission('exports.view_all')) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }
        $items = $query->with('user:id,name')->orderByDesc('created_at')
            ->paginate(min(100, max(1, $request->integer('per_page', 20))));

        return response()->json([
            'data' => $items->getCollection()->map(fn (ExportJob $item): array => $this->serialize($item))->values(),
            'meta' => ['current_page' => $items->currentPage(), 'per_page' => $items->perPage(), 'total' => $items->total()],
        ]);
    }

    public function createExport(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['customers', 'products', 'orders', 'inventory', 'activity', 'report'])],
            'filters' => ['sometimes', 'array'],
            'filters.report' => ['required_if:type,report', Rule::in(['revenue', 'orders', 'products', 'customers', 'inventory', 'coupons'])],
        ]);
        $type = $data['type'];
        $permission = match ($type) {
            'customers' => 'customers.view', 'products' => 'products.view', 'orders' => 'orders.view',
            'inventory' => 'inventory.view', 'activity' => 'settings.manage', 'report' => 'reports.view',
        };
        abort_unless($request->user()->hasAdminPermission($permission), 403);

        $activeCount = ExportJob::query()->where('user_id', $request->user()->id)
            ->whereIn('type', array_slice(self::EXPORT_TYPES, 2))
            ->whereIn('status', ['queued', 'running'])->count();
        abort_if($activeCount >= 3, 429, 'Đã có 3 tệp xuất đang xử lý. Hãy chờ hoàn tất trước khi tạo thêm.');

        $filters = $data['filters'] ?? [];
        $report = $type === 'report' ? (string) $filters['report'] : null;
        $requestClass = match ($type) {
            'customers' => ExportAdminCustomersRequest::class,
            'products' => ListAdminProductsRequest::class,
            'orders' => ListAdminOrdersRequest::class,
            'inventory' => ListInventoryRequest::class,
            'activity' => ListOperationsRequest::class,
            'report' => ReportRequest::class,
        };
        if ($report !== null) {
            unset($filters['report']);
        }
        if ($type === 'activity') {
            $filters['export'] = true;
        }
        $formRequest = app($requestClass);
        $validatedFilters = Validator::make($filters, $formRequest->rules())->validate();
        if ($report !== null) {
            $validatedFilters['report'] = $report;
        }

        $job = ExportJob::query()->create([
            'user_id' => $request->user()->id,
            'type' => 'admin_'.$type,
            'params' => ['filters' => $validatedFilters, 'format' => 'csv'],
            'status' => 'queued', 'progress' => 0, 'created_at' => now(),
        ]);
        BuildAdminExport::dispatch($job->id, $type, $validatedFilters);

        return response()->json(['data' => $this->serialize($job), 'message' => 'Đã đưa tệp xuất vào hàng đợi.'], 202);
    }

    public function download(Request $request, int $job): BinaryFileResponse
    {
        $item = $this->ownedOrVisible($request, $job);
        abort_unless($item->status === 'ready' && $item->expires_at?->isFuture() && $item->file_path, 410, 'Tệp tải xuống đã hết hạn hoặc chưa sẵn sàng.');
        abort_unless(Storage::disk('local')->exists($item->file_path), 404);

        $format = (string) ($item->params['format'] ?? ($item->type === 'personal_data' ? 'zip' : 'csv'));
        abort_unless(in_array($format, ['csv', 'pdf', 'zip'], true), 404);

        return response()->download(Storage::disk('local')->path($item->file_path), 'fashion-store-export-'.$item->id.'.'.$format);
    }

    public function destroy(Request $request, int $job): JsonResponse
    {
        $item = $this->ownedOrVisible($request, $job);
        abort_unless(! in_array($item->status, ['queued', 'running'], true), 409, 'Không thể xóa tệp đang được xử lý.');
        if ($item->file_path) {
            Storage::disk('local')->delete($item->file_path);
        }
        $item->delete();

        return response()->json(['message' => 'Đã xóa tệp tải xuống.']);
    }

    public function retry(Request $request, int $job): JsonResponse
    {
        $item = $this->ownedOrVisible($request, $job);
        abort_unless(in_array($item->status, ['failed', 'expired'], true), 422, 'Chỉ có thể chạy lại tệp bị lỗi hoặc hết hạn.');
        if ($item->type === 'personal_data') {
            $active = ExportJob::query()->where('user_id', $item->user_id)->where('type', 'personal_data')->whereIn('status', ['queued', 'running'])->count();
            abort_if($active >= 2, 429, 'Tài khoản đã có đủ yêu cầu sao lưu đang xử lý.');
            $retry = ExportJob::query()->create([
                'user_id' => $item->user_id,
                'type' => 'personal_data',
                'params' => ['retry_of' => $item->id],
                'status' => 'queued',
                'progress' => 0,
                'created_at' => now(),
            ]);
            BuildPersonalDataExport::dispatch($retry->id);

            return response()->json(['data' => $this->serialize($retry), 'message' => 'Đã đưa yêu cầu sao lưu vào hàng đợi.'], 202);
        }

        if (str_starts_with($item->type, 'admin_')) {
            $activeCount = ExportJob::query()->where('user_id', $item->user_id)
                ->whereIn('type', array_slice(self::EXPORT_TYPES, 2))
                ->whereIn('status', ['queued', 'running'])->count();
            abort_if($activeCount >= 3, 429, 'Đã có 3 tệp xuất đang xử lý. Hãy chờ hoàn tất trước khi chạy lại.');
            $type = substr($item->type, strlen('admin_'));
            $params = $item->params['filters'] ?? [];
            $params['retry_of'] = $item->id;
            $retry = ExportJob::query()->create([
                'user_id' => $item->user_id, 'type' => $item->type,
                'params' => ['filters' => $params, 'format' => 'csv'],
                'status' => 'queued', 'progress' => 0, 'created_at' => now(),
            ]);
            BuildAdminExport::dispatch($retry->id, $type, $params);

            return response()->json(['data' => $this->serialize($retry), 'message' => 'CSV export added to the queue.'], 202);
        }

        abort_unless($item->type === 'scheduled_report', 422, 'Loại tệp này chưa hỗ trợ chạy lại.');
        $scheduleId = (int) ($item->params['schedule_id'] ?? 0);
        $schedule = ReportSchedule::query()->where('user_id', $item->user_id)->findOrFail($scheduleId);
        $scheduledAt = (string) ($item->params['scheduled_at'] ?? now()->toIso8601String());
        $from = (string) ($item->params['from'] ?? '');
        $to = (string) ($item->params['to'] ?? '');
        $retry = ExportJob::query()->create([
            'user_id' => $item->user_id,
            'type' => 'scheduled_report',
            'params' => ['schedule_id' => $schedule->id, 'scheduled_at' => $scheduledAt, 'report' => $schedule->report, 'format' => $schedule->format, 'from' => $from, 'to' => $to, 'delivered_to' => $item->status === 'failed' ? ($item->params['delivered_to'] ?? []) : [], 'retry_of' => $item->id],
            'status' => 'queued',
            'progress' => 0,
            'created_at' => now(),
        ]);
        SendScheduledReport::dispatch($schedule->id, $scheduledAt, $retry->id);

        return response()->json(['data' => $this->serialize($retry), 'message' => 'Đã đưa báo cáo vào hàng đợi.'], 202);
    }

    private function ownedOrVisible(Request $request, int $id): ExportJob
    {
        $query = ExportJob::query()->whereIn('type', self::EXPORT_TYPES);
        if (! $request->user()->hasAdminPermission('exports.view_all')) {
            $query->where('user_id', $request->user()->id);
        }

        return $query->findOrFail($id);
    }

    /** @return array<string, mixed> */
    private function serialize(ExportJob $item): array
    {
        return [
            'id' => $item->id,
            'user_id' => $item->user_id,
            'owner_name' => $item->user?->name,
            'type' => $item->type,
            'params' => $item->params ?? [],
            'status' => $item->status,
            'progress' => $item->progress,
            'file_size' => $item->file_size,
            'error' => $item->error,
            'created_at' => $item->created_at?->toIso8601String(),
            'finished_at' => $item->finished_at?->toIso8601String(),
            'expires_at' => $item->expires_at?->toIso8601String(),
            'download_url' => $item->status === 'ready' && $item->expires_at?->isFuture() ? '/api/v1/admin/downloads/'.$item->id.'/file' : null,
        ];
    }
}
