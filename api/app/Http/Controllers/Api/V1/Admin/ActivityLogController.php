<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListOperationsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityLogController extends Controller
{
    public function index(ListOperationsRequest $request): JsonResponse|StreamedResponse
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? '-created_at';
        $descending = str_starts_with($sort, '-');
        $field = ltrim($sort, '-');
        $sortColumns = [
            'created_at' => 'activity_logs.created_at', 'user_name' => 'users.name', 'module' => 'activity_logs.module',
            'action' => 'activity_logs.action', 'path' => 'activity_logs.path', 'ip' => 'activity_logs.ip',
        ];
        if (! isset($sortColumns[$field])) {
            throw ValidationException::withMessages(['sort' => 'Trường sắp xếp không được hỗ trợ cho nhật ký hoạt động.']);
        }
        $query = DB::table('activity_logs')->leftJoin('users', 'users.id', '=', 'activity_logs.user_id')
            ->when(isset($filters['q']), fn ($query) => $query->where(fn ($search) => $search->where('users.name', 'like', '%'.$filters['q'].'%')->orWhere('activity_logs.path', 'like', '%'.$filters['q'].'%')->orWhereRaw('CAST(activity_logs.changes AS CHAR) LIKE ?', ['%'.$filters['q'].'%'])))
            ->when(isset($filters['status']), fn ($query) => $query->where('activity_logs.action', $filters['status']))
            ->when(isset($filters['user_id']), fn ($query) => $query->where('activity_logs.user_id', $filters['user_id']))
            ->when(isset($filters['module']), fn ($query) => $query->where('activity_logs.module', $filters['module']))
            ->when(isset($filters['ip']), fn ($query) => $query->where('activity_logs.ip', 'like', '%'.$filters['ip'].'%'))
            ->when(isset($filters['from']), fn ($query) => $query->whereDate('activity_logs.created_at', '>=', $filters['from']))
            ->when(isset($filters['to']), fn ($query) => $query->whereDate('activity_logs.created_at', '<=', $filters['to']))
            ->select('activity_logs.id', 'activity_logs.module', 'activity_logs.action', 'activity_logs.path', 'activity_logs.changes', 'activity_logs.ip', 'activity_logs.created_at', 'users.name as user_name')
            ->orderBy($sortColumns[$field], $descending ? 'desc' : 'asc')->orderByDesc('activity_logs.id');

        if ($request->boolean('export')) {
            return response()->streamDownload(function () use ($query): void {
                $handle = fopen('php://output', 'wb');
                fwrite($handle, "\xEF\xBB\xBF");
                fputcsv($handle, ['Thời gian', 'Nhân viên', 'Phân hệ', 'Hành động', 'Đường dẫn / đối tượng', 'IP', 'Thay đổi']);
                foreach ($query->cursor() as $row) {
                    $values = [$row->created_at, $row->user_name ?? 'Tài khoản đã xóa', $row->module, $row->action, $row->path, $row->ip, $row->changes];
                    fputcsv($handle, array_map(fn ($value) => is_string($value) && preg_match('/^[=+@\-\t\r]/', $value) ? "'".$value : $value, $values));
                }
                fclose($handle);
            }, 'activity-logs-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
        }

        $rows = $query->paginate($filters['per_page'] ?? 20);

        return response()->json(['data' => $rows->items(), 'meta' => [
            'current_page' => $rows->currentPage(), 'last_page' => $rows->lastPage(),
            'per_page' => $rows->perPage(), 'total' => $rows->total(),
        ]]);
    }
}
