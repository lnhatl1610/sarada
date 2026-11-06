<?php

namespace App\Jobs;

use App\Http\Controllers\Api\V1\Admin\ReportController;
use App\Http\Requests\Api\V1\Admin\ReportRequest;
use App\Models\ExportJob;
use App\Models\ReportSchedule;
use App\Modules\Reporting\Actions\EligibleReportRecipients;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class SendScheduledReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public function __construct(public readonly int $scheduleId, public readonly string $scheduledAt, public readonly int $exportJobId) {}

    public function handle(EligibleReportRecipients $eligibleRecipients): void
    {
        $schedule = ReportSchedule::query()->with('user')->findOrFail($this->scheduleId);
        if (! $schedule->user || ! $schedule->user->hasAdminPermission('reports.view') || ! $schedule->user->hasAdminPermission('reports.schedule')) {
            $schedule->update(['is_active' => false, 'next_run_at' => null, 'last_run_at' => now(), 'last_error' => 'Lịch đã tắt vì người tạo không còn quyền xem hoặc lên lịch báo cáo.']);
            $this->failQueuedExport('Người tạo lịch không còn quyền xem hoặc lên lịch báo cáo.');

            return;
        }
        $recipients = $eligibleRecipients($schedule->recipients ?? []);
        if ($recipients === []) {
            $schedule->update(['is_active' => false, 'next_run_at' => null, 'last_run_at' => now(), 'last_error' => 'Lịch đã tắt vì không còn người nhận có quyền xem báo cáo.']);
            $this->failQueuedExport('Không còn người nhận có quyền xem báo cáo.');

            return;
        }
        if (count($recipients) !== count($schedule->recipients ?? [])) {
            $schedule->update(['recipients' => $recipients]);
        }
        $timezone = $schedule->timezone;
        $runAt = CarbonImmutable::parse($this->scheduledAt)->setTimezone($timezone);
        [$from, $to] = $this->period($schedule->frequency, $runAt);
        $params = array_merge($schedule->params ?? [], ['from' => $from, 'to' => $to, 'export' => '1']);
        $export = ExportJob::query()->where('user_id', $schedule->user_id)->findOrFail($this->exportJobId);
        $exportParams = $export->params ?? [];
        $delivered = array_values(array_unique(array_map('mb_strtolower', $exportParams['delivered_to'] ?? [])));
        $extension = $schedule->format === 'pdf' ? 'pdf' : 'csv';
        $path = 'exports/reports/'.$schedule->user_id.'/'.$export->id.'.'.$extension;
        $disk = Storage::disk('local');
        $fileExists = $export->file_path === $path && $disk->exists($path);
        $export->update([
            'status' => 'running', 'progress' => $fileExists ? 70 : 10, 'error' => null,
            'params' => array_merge($exportParams, ['schedule_id' => $schedule->id, 'scheduled_at' => $this->scheduledAt, 'report' => $schedule->report, 'format' => $schedule->format, 'from' => $from, 'to' => $to, 'delivered_to' => $delivered]),
        ]);

        try {
            if (! $fileExists) {
                $csv = $this->renderCsv($schedule, $params);
                $content = $schedule->format === 'pdf' ? $this->renderPdf($schedule->name, $from, $to, $csv) : $csv;
                $disk->put($path, $content);
                $export->update(['file_path' => $path, 'file_size' => $disk->size($path), 'progress' => 70]);
            }

            foreach ($recipients as $recipient) {
                if (in_array(mb_strtolower($recipient), $delivered, true)) {
                    continue;
                }
                Mail::raw("Báo cáo {$schedule->name} ({$from} đến {$to}) được đính kèm trong email này.", function ($message) use ($recipient, $schedule, $path, $extension): void {
                    $message->to($recipient)->subject('Báo cáo định kỳ: '.$schedule->name)
                        ->attach(Storage::disk('local')->path($path), [
                            'as' => 'fashion-store-'.$schedule->report.'-'.now()->format('Ymd').'.'.$extension,
                            'mime' => $extension === 'pdf' ? 'application/pdf' : 'text/csv; charset=UTF-8',
                        ]);
                });
                $delivered[] = mb_strtolower($recipient);
                $export->update(['params' => array_merge($export->params ?? [], ['delivered_to' => $delivered])]);
            }

            $export->update(['status' => 'ready', 'progress' => 100, 'expires_at' => now()->addDays(7), 'finished_at' => now(), 'error' => null]);
            $schedule->update(['last_run_at' => now(), 'last_error' => null]);
        } catch (Throwable $exception) {
            $export->update(['status' => 'failed', 'progress' => $disk->exists($path) ? 70 : 0, 'error' => 'Không thể tạo hoặc gửi báo cáo định kỳ.', 'finished_at' => now()]);
            $schedule->update(['last_run_at' => now(), 'last_error' => 'Không thể gửi báo cáo. Vui lòng kiểm tra cấu hình email.']);
            Log::error('Scheduled report failed.', ['schedule_id' => $schedule->id, 'export_job_id' => $export->id, 'exception' => $exception]);
            throw $exception;
        }
    }

    /** @return array{string, string} */
    private function period(string $frequency, CarbonImmutable $runAt): array
    {
        if ($frequency === 'weekly') {
            $from = $runAt->startOfWeek()->subWeek();

            return [$from->toDateString(), $from->endOfWeek()->toDateString()];
        }
        if ($frequency === 'monthly') {
            $from = $runAt->startOfMonth()->subMonthNoOverflow();

            return [$from->toDateString(), $from->endOfMonth()->toDateString()];
        }

        $yesterday = $runAt->startOfDay()->subDay();

        return [$yesterday->toDateString(), $yesterday->toDateString()];
    }

    /** @param array<string, mixed> $params */
    private function renderCsv(ReportSchedule $schedule, array $params): string
    {
        $request = ReportRequest::create('/api/v1/admin/reports/'.$schedule->report, 'GET', $params);
        $request->setContainer(app())->setRedirector(app('redirect'));
        $request->setUserResolver(fn () => $schedule->user);
        $route = new Route('GET', '/api/v1/admin/reports/{report}', []);
        $route->setParameter('report', $schedule->report);
        $request->setRouteResolver(fn () => $route);
        $request->setValidator(Validator::make($request->all(), $request->rules()));

        $response = app(ReportController::class)->overview($request);
        if (! $response instanceof StreamedResponse) {
            throw new \RuntimeException('Report export did not return a CSV stream.');
        }

        ob_start();
        $response->sendContent();
        $csv = ob_get_clean();
        if (! is_string($csv)) {
            throw new \RuntimeException('Could not capture report CSV output.');
        }

        return $csv;
    }

    private function renderPdf(string $title, string $from, string $to, string $csv): string
    {
        $stream = fopen('php://temp', 'r+');
        if ($stream === false) {
            throw new \RuntimeException('Could not create a temporary report stream.');
        }
        fwrite($stream, $csv);
        rewind($stream);
        $lines = [$title.' | '.$from.' - '.$to];
        while (($row = fgetcsv($stream)) !== false) {
            $lines[] = implode(' | ', array_map(static fn (mixed $cell): string => (string) $cell, $row));
        }
        fclose($stream);
        $lines = array_map(static function (string $line): string {
            $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $line);

            return substr($ascii === false ? $line : $ascii, 0, 110);
        }, $lines);

        return $this->buildPdf($lines);
    }

    /** @param list<string> $lines */
    private function buildPdf(array $lines): string
    {
        $pages = array_chunk($lines, 48);
        $objects = [
            1 => '<< /Type /Catalog /Pages 2 0 R >>',
            3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pageReferences = [];
        foreach ($pages as $index => $pageLines) {
            $pageObject = 4 + $index * 2;
            $contentObject = $pageObject + 1;
            $pageReferences[] = $pageObject.' 0 R';
            $text = "BT\n/F1 9 Tf\n40 800 Td\n";
            foreach ($pageLines as $line) {
                $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $line);
                $text .= '('.$escaped.") Tj\n0 -15 Td\n";
            }
            $text .= "ET\n";
            $objects[$pageObject] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents '.$contentObject.' 0 R >>';
            $objects[$contentObject] = '<< /Length '.strlen($text)." >>\nstream\n".$text.'endstream';
        }
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $pageReferences).'] /Count '.count($pageReferences).' >>';
        ksort($objects);
        $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        $offsets = [0];
        foreach ($objects as $number => $object) {
            $offsets[$number] = strlen($pdf);
            $pdf .= $number." 0 obj\n".$object."\nendobj\n";
        }
        $xref = strlen($pdf);
        $count = max(array_keys($objects)) + 1;
        $pdf .= "xref\n0 {$count}\n0000000000 65535 f \n";
        for ($index = 1; $index < $count; $index++) {
            $pdf .= sprintf('%010d 00000 n ', $offsets[$index] ?? 0)."\n";
        }
        $pdf .= "trailer\n<< /Size {$count} /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";

        return $pdf;
    }

    private function failQueuedExport(string $message): void
    {
        if ($this->exportJobId) {
            ExportJob::query()->whereKey($this->exportJobId)->update([
                'status' => 'failed', 'progress' => 0, 'error' => $message, 'finished_at' => now(),
            ]);
        }
    }
}
