<?php

namespace App\Console\Commands;

use App\Models\ExportJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PrunePersonalDataExports extends Command
{
    protected $signature = 'account-exports:prune';

    protected $description = 'Remove expired export files and keep their status as expired';

    public function handle(): int
    {
        $count = 0;
        ExportJob::query()->where('status', 'ready')->whereNotNull('expires_at')->where('expires_at', '<=', now())
            ->orderBy('id')->chunkById(100, function ($jobs) use (&$count): void {
                foreach ($jobs as $job) {
                    if ($job->file_path) {
                        Storage::disk('local')->delete($job->file_path);
                    }
                    $job->update(['status' => 'expired', 'file_path' => null]);
                    $count++;
                }
            });

        $this->info("Expired export files removed: {$count}");

        return self::SUCCESS;
    }
}
