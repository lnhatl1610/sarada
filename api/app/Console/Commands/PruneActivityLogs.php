<?php

namespace App\Console\Commands;

use App\Models\Setting;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

#[Signature('activitylog:prune {--days=}')]
#[Description('Remove admin activity logs older than the configured retention period')]
class PruneActivityLogs extends Command
{
    public function handle(): int
    {
        if (! Schema::hasTable('activity_logs')) {
            $this->info('Activity log table is not installed.');

            return self::SUCCESS;
        }

        $configuredDays = (int) (Setting::query()->where('key', 'activity.retention_days')->value('value') ?? 365);
        $days = max(30, min(3650, (int) ($this->option('days') ?: $configuredDays)));
        $cutoff = now()->subDays($days);
        $deleted = 0;
        DB::table('activity_logs')->where('created_at', '<', $cutoff)->orderBy('id')->chunkById(1000, function ($rows) use (&$deleted): void {
            $deleted += DB::table('activity_logs')->whereIn('id', $rows->pluck('id'))->delete();
        });
        $this->info("Removed {$deleted} activity log rows older than {$days} days.");

        return self::SUCCESS;
    }
}
