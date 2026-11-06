<?php

namespace App\Jobs;

use App\Http\Controllers\Api\V1\Admin\ActivityLogController;
use App\Http\Controllers\Api\V1\Admin\CustomerController;
use App\Http\Controllers\Api\V1\Admin\InventoryController;
use App\Http\Controllers\Api\V1\Admin\OrderController;
use App\Http\Controllers\Api\V1\Admin\ProductController;
use App\Http\Controllers\Api\V1\Admin\ReportController;
use App\Http\Requests\Api\V1\Admin\ExportAdminCustomersRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminOrdersRequest;
use App\Http\Requests\Api\V1\Admin\ListAdminProductsRequest;
use App\Http\Requests\Api\V1\Admin\ListInventoryRequest;
use App\Http\Requests\Api\V1\Admin\ListOperationsRequest;
use App\Http\Requests\Api\V1\Admin\ReportRequest;
use App\Models\ExportJob;
use App\Models\User;
use App\Notifications\AdminPersonalNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class BuildAdminExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 2;

    /** @param array<string, mixed> $params */
    public function __construct(public readonly int $exportJobId, public readonly string $type, public readonly array $params) {}

    public function handle(): void
    {
        $export = ExportJob::query()->findOrFail($this->exportJobId);
        $user = User::query()->find($export->user_id);
        $permission = $this->permission();
        if (! $user || $user->status !== 'active' || ! $user->hasAdminPermission($permission)) {
            $this->failExport($export, 'Tài khoản không còn quyền xuất dữ liệu này.');

            return;
        }

        $export->update(['status' => 'running', 'progress' => 10, 'error' => null]);
        $path = null;

        try {
            $response = $this->render($user);
            if (! $response instanceof StreamedResponse) {
                throw new \RuntimeException('Admin export did not return a streamed CSV response.');
            }
            $export->update(['progress' => 35]);

            $temporary = tmpfile();
            if ($temporary === false) {
                throw new \RuntimeException('Could not create a temporary export stream.');
            }
            ob_start(static function (string $buffer) use ($temporary): string {
                fwrite($temporary, $buffer);

                return '';
            }, 1024 * 1024);
            try {
                $response->sendContent();
                ob_end_flush();
            } catch (Throwable $exception) {
                ob_end_clean();
                throw $exception;
            }
            try {
                if (ftell($temporary) === 0) {
                    throw new \RuntimeException('Admin export output was empty.');
                }
                $export->update(['progress' => 75]);
                rewind($temporary);
                $path = 'exports/admin/'.$user->id.'/'.Str::uuid().'.csv';
                $disk = Storage::disk('local');
                $disk->put($path, $temporary);
            } finally {
                fclose($temporary);
            }
            $export->update([
                'status' => 'ready', 'progress' => 100, 'file_path' => $path,
                'file_size' => $disk->size($path), 'expires_at' => now()->addDays(7),
                'finished_at' => now(), 'error' => null,
            ]);
            $user->notify(new AdminPersonalNotification(
                'export_complete',
                'Tệp xuất đã sẵn sàng',
                'Tệp CSV đã xuất xong và có thể tải trong Trung tâm tải xuống trong 7 ngày.',
                '/downloads',
                'normal',
                true,
                false,
            ));
        } catch (Throwable $exception) {
            if ($path !== null) {
                Storage::disk('local')->delete($path);
            }
            $this->failExport($export, 'Không thể tạo tệp CSV. Hãy thử chạy lại.');
            Log::error('Admin data export failed.', [
                'export_job_id' => $export->id,
                'user_id' => $user->id,
                'type' => $this->type,
                'exception' => $exception,
            ]);
            throw $exception;
        }
    }

    private function render(User $user): StreamedResponse
    {
        $params = $this->params;
        if ($this->type === 'report') {
            $report = (string) ($params['report'] ?? '');
            unset($params['report']);
            $params['export'] = true;
            $request = $this->makeRequest(ReportRequest::class, $params, $user, '/api/v1/admin/reports/'.$report, 'report', $report);

            return app(ReportController::class)->overview($request);
        }

        [$requestClass, $controllerClass, $method, $uri] = match ($this->type) {
            'customers' => [ExportAdminCustomersRequest::class, CustomerController::class, 'export', '/api/v1/admin/customers/export'],
            'products' => [ListAdminProductsRequest::class, ProductController::class, 'export', '/api/v1/admin/products/export'],
            'orders' => [ListAdminOrdersRequest::class, OrderController::class, 'export', '/api/v1/admin/orders/export'],
            'inventory' => [ListInventoryRequest::class, InventoryController::class, 'export', '/api/v1/admin/inventory/export'],
            'activity' => [ListOperationsRequest::class, ActivityLogController::class, 'index', '/api/v1/admin/activity-logs'],
            default => throw new \InvalidArgumentException('Unsupported admin export type.'),
        };
        if ($this->type === 'activity') {
            $params['export'] = true;
        }
        $request = $this->makeRequest($requestClass, $params, $user, $uri);

        return app($controllerClass)->{$method}($request);
    }

    /** @param class-string<FormRequest> $class @param array<string, mixed> $params */
    private function makeRequest(string $class, array $params, User $user, string $uri, ?string $routeParameter = null, ?string $routeValue = null): FormRequest
    {
        /** @var FormRequest $request */
        $request = $class::create($uri, 'GET', $params);
        $request->setContainer(app())->setRedirector(app('redirect'));
        $request->setUserResolver(fn (): User => $user);
        $route = new Route('GET', $uri, []);
        if ($routeParameter !== null && $routeValue !== null) {
            $route->setParameter($routeParameter, $routeValue);
        }
        $request->setRouteResolver(fn (): Route => $route);
        $request->setValidator(Validator::make($params, $request->rules()));
        $request->validateResolved();

        return $request;
    }

    private function permission(): string
    {
        return match ($this->type) {
            'customers' => 'customers.view',
            'products' => 'products.view',
            'orders' => 'orders.view',
            'inventory' => 'inventory.view',
            'activity' => 'settings.manage',
            'report' => 'reports.view',
            default => 'exports.view_all',
        };
    }

    private function failExport(ExportJob $export, string $message): void
    {
        $export->update(['status' => 'failed', 'progress' => 0, 'error' => $message, 'finished_at' => now()]);
    }
}
