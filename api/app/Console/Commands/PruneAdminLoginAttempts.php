<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

#[Signature('login-attempts:prune {--days=180}')]
#[Description('Remove admin login history older than the configured retention period')]
class PruneAdminLoginAttempts extends Command
{
    public function handle(): int
    {
        if (! Schema::hasTable('login_attempts')) {
            $this->info('Login history table is not installed.');

            return self::SUCCESS;
        }

        $days = max(30, min(3650, (int) $this->option('days')));
        $deleted = DB::table('login_attempts')->where('created_at', '<', now()->subDays($days))->delete();
        $this->info("Removed {$deleted} login history rows older than {$days} days.");

        return self::SUCCESS;
    }
}
