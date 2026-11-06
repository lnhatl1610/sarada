<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImportJobResource;
use App\Models\ImportJob;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportHistoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ImportJob::query()->with('user')->latest('id');
        if (! $request->user()->hasAdminPermission('exports.view_all')) {
            $query->where('user_id', $request->user()->id);
        }

        return ImportJobResource::collection($query->paginate(min(max((int) $request->integer('per_page', 20), 1), 100)));
    }

    public function show(Request $request, ImportJob $importJob): ImportJobResource
    {
        abort_unless($this->canView($request, $importJob), 404);

        return new ImportJobResource($importJob->loadMissing('user'));
    }

    public function errors(Request $request, ImportJob $importJob): StreamedResponse
    {
        abort_unless($this->canView($request, $importJob), 404);
        abort_unless($importJob->failed_rows > 0 && is_array($importJob->error_rows), 404);

        return response()->streamDownload(function () use ($importJob): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, ['Dòng', 'SKU', 'Lỗi']);
            foreach ($importJob->error_rows as $row) {
                fputcsv($handle, [$row['line'] ?? '', $row['sku'] ?? '', $row['error'] ?? 'Dòng không hợp lệ']);
            }
            fclose($handle);
        }, 'inventory-import-errors-'.$importJob->id.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function canView(Request $request, ImportJob $importJob): bool
    {
        return (int) $importJob->user_id === (int) $request->user()->id
            || $request->user()->hasAdminPermission('exports.view_all');
    }
}
