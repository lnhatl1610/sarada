<?php

namespace App\Console\Commands;

use App\Modules\Reporting\Actions\SendAdminDigestAction;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('digest:send')]
#[Description('Send due daily or weekly admin summary digests')]
class SendAdminDigest extends Command
{
    public function handle(SendAdminDigestAction $sendAdminDigest): int
    {
        $processed = $sendAdminDigest->handle();
        $this->info("Processed {$processed} due admin digests.");

        return self::SUCCESS;
    }
}
