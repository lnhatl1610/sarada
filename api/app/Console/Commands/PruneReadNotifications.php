<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneReadNotifications extends Command
{
    protected $signature = 'notifications:prune-read';

    protected $description = 'Delete read notifications older than 90 days';

    public function handle(): int
    {
        $deleted = DB::table('notifications')->whereNotNull('data->event')->whereNotNull('read_at')->where('read_at', '<', now()->subDays(90))->delete();
        $this->components->info("Deleted {$deleted} expired read notifications.");

        return self::SUCCESS;
    }
}
