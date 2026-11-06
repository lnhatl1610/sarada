<?php

namespace App\Console\Commands;

use App\Jobs\SendScheduledReport;
use App\Models\ExportJob;
use App\Models\ReportSchedule;
use App\Modules\Reporting\Actions\NextReportScheduleRun;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DispatchScheduledReports extends Command
{
    protected $signature = 'reports:dispatch-scheduled';

    protected $description = 'Queue due scheduled admin reports';

    public function handle(NextReportScheduleRun $nextRun): int
    {
        $dueIds = ReportSchedule::query()->where('is_active', true)->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', now())->orderBy('next_run_at')->limit(500)->pluck('id');

        foreach ($dueIds as $id) {
            DB::transaction(function () use ($id, $nextRun): void {
                $schedule = ReportSchedule::query()->lockForUpdate()->find($id);
                if (! $schedule || ! $schedule->is_active || ! $schedule->next_run_at || $schedule->next_run_at->isFuture()) {
                    return;
                }

                $scheduledAt = $schedule->next_run_at;
                $runAt = $scheduledAt->toIso8601String();
                $export = ExportJob::query()->create([
                    'user_id' => $schedule->user_id,
                    'type' => 'scheduled_report',
                    'params' => ['schedule_id' => $schedule->id, 'scheduled_at' => $runAt, 'report' => $schedule->report, 'format' => $schedule->format, 'delivered_to' => []],
                    'status' => 'queued',
                    'progress' => 0,
                    'created_at' => now(),
                ]);
                $schedule->update([
                    'next_run_at' => $nextRun(
                        $schedule->frequency,
                        $schedule->timezone,
                        (string) $schedule->send_time,
                        $schedule->weekday,
                        $schedule->month_day,
                        $scheduledAt,
                    ),
                    'last_error' => null,
                ]);
                SendScheduledReport::dispatch($schedule->id, $runAt, $export->id)->afterCommit();
            });
        }

        $this->info('Queued '.$dueIds->count().' due report schedule(s).');

        return self::SUCCESS;
    }
}
