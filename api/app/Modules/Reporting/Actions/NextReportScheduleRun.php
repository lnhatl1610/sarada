<?php

namespace App\Modules\Reporting\Actions;

use Carbon\CarbonImmutable;

class NextReportScheduleRun
{
    public function __invoke(string $frequency, string $timezone, string $sendTime, ?int $weekday, ?int $monthDay, CarbonImmutable $after): CarbonImmutable
    {
        $localAfter = $after->setTimezone($timezone);
        $candidate = $localAfter->startOfDay()->setTimeFromTimeString($sendTime);

        if ($frequency === 'weekly') {
            $day = $weekday ?? 1;
            $candidate = $candidate->addDays(($day - (int) $candidate->dayOfWeekIso + 7) % 7);
            if ($candidate->lessThanOrEqualTo($localAfter)) {
                $candidate = $candidate->addWeek();
            }
        } elseif ($frequency === 'monthly') {
            $day = $monthDay ?? 1;
            $candidate = $candidate->day(min($day, $candidate->daysInMonth));
            if ($candidate->lessThanOrEqualTo($localAfter)) {
                $nextMonth = $localAfter->addMonthNoOverflow();
                $candidate = $nextMonth->startOfMonth()->day(min($day, $nextMonth->daysInMonth))->setTimeFromTimeString($sendTime);
            }
        } elseif ($candidate->lessThanOrEqualTo($localAfter)) {
            $candidate = $candidate->addDay();
        }

        return $candidate->utc();
    }
}
