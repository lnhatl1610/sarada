<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

#[Signature('storefront-search:prune')]
#[Description('Remove aggregated storefront search terms older than 30 days')]
class PruneStorefrontSearchTerms extends Command
{
    public function handle(): int
    {
        if (! Schema::hasTable('storefront_search_terms')) {
            $this->info('Storefront search trend table is not installed.');

            return self::SUCCESS;
        }

        $deleted = DB::table('storefront_search_terms')
            ->where('search_date', '<', today()->subDays(29)->toDateString())
            ->delete();

        $this->info("Removed {$deleted} storefront search term rows older than 30 days.");

        return self::SUCCESS;
    }
}
