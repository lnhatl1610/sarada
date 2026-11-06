<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\ListFailedJobsRequest;
use App\Http\Resources\FailedJobResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FailedJobController extends Controller
{
    public function index(ListFailedJobsRequest $request)
    {
        $table = (string) config('queue.failed.table', 'failed_jobs');
        if (! Schema::hasTable($table)) {
            return response()->json(['data' => [], 'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0]]);
        }

        $items = DB::table($table)->orderByDesc('failed_at')->orderByDesc('id')
            ->paginate($request->integer('per_page', 20), ['id', 'connection', 'queue', 'exception', 'failed_at']);

        return FailedJobResource::collection($items);
    }

    public function retry(int $job): JsonResponse
    {
        $table = (string) config('queue.failed.table', 'failed_jobs');
        abort_unless(Schema::hasTable($table), 404);
        $failedJob = DB::table($table)->where('id', $job)->first(['uuid']);
        abort_unless($failedJob, 404);

        Artisan::call('queue:retry', ['id' => [$failedJob->uuid]]);

        return response()->json(['message' => 'Đã đưa job lỗi trở lại hàng đợi.']);
    }

    public function delete(int $job): JsonResponse
    {
        $table = (string) config('queue.failed.table', 'failed_jobs');
        abort_unless(Schema::hasTable($table), 404);
        $deleted = DB::table($table)->where('id', $job)->delete();
        abort_if($deleted === 0, 404);

        return response()->json(['message' => 'Đã xóa job lỗi.']);
    }
}
