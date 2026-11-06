<?php

namespace App\Console\Commands;

use App\Models\UserTask;
use App\Notifications\AdminPersonalNotification;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

#[Signature('admin:send-task-reminders')]
#[Description('Send due reminders for personal admin tasks')]
class SendTaskReminders extends Command
{
    public function handle(): int
    {
        if (! Schema::hasTable('user_tasks')) {
            $this->info('Personal task table is not installed.');

            return self::SUCCESS;
        }

        $ids = UserTask::query()->where('status', '<>', 'done')->whereNotNull('remind_at')
            ->where('remind_at', '<=', now())
            ->where(fn ($query) => $query->whereNull('reminded_at')->orWhereColumn('reminded_at', '<', 'remind_at'))
            ->orderBy('remind_at')->limit(100)->pluck('id');
        $sent = 0;

        foreach ($ids as $id) {
            $didSend = DB::transaction(function () use ($id): bool {
                $task = UserTask::query()->with('assignee')->lockForUpdate()->find($id);
                if (! $task || $task->status === 'done' || ! $task->remind_at || $task->remind_at->isFuture()) {
                    return false;
                }
                if ($task->reminded_at && $task->reminded_at->greaterThanOrEqualTo($task->remind_at)) {
                    return false;
                }

                $user = $task->assignee;
                if ($user) {
                    $saved = Schema::hasTable('user_preferences')
                        ? DB::table('user_preferences')->where('user_id', $user->id)->where('key', 'admin_notifications')->value('value')
                        : null;
                    $preferences = is_string($saved) ? (json_decode($saved, true) ?: []) : [];
                    $channels = $preferences['task_reminder'] ?? [];
                    $inApp = (bool) ($channels['in_app'] ?? true);
                    $email = (bool) ($channels['email'] ?? false);

                    if ($inApp || $email) {
                        $href = match ($task->subject_type) {
                            'order' => '/orders/'.$task->subject_id,
                            'product' => '/products/'.$task->subject_id.'/edit',
                            'customer' => '/customers/'.$task->subject_id,
                            'inventory' => '/inventory/adjustments/'.$task->subject_id,
                            default => '/me/tasks',
                        };
                        $user->notify(new AdminPersonalNotification(
                            'task_reminder',
                            'Đến giờ: '.$task->title,
                            'Việc cần làm của bạn đã đến thời điểm nhắc.',
                            $href,
                            'normal',
                            $inApp,
                            $email,
                        ));
                    }
                }

                $nextReminder = match ($task->repeat_rule) {
                    'daily' => $task->remind_at->copy()->addDay(),
                    'weekly' => $task->remind_at->copy()->addWeek(),
                    default => null,
                };
                while ($nextReminder && $nextReminder->lessThanOrEqualTo(now())) {
                    $nextReminder = $task->repeat_rule === 'daily' ? $nextReminder->addDay() : $nextReminder->addWeek();
                }
                $task->update(['remind_at' => $nextReminder, 'reminded_at' => now()]);

                return $user !== null;
            });

            $sent += (int) $didSend;
        }

        $this->info("Processed {$sent} task reminders.");

        return self::SUCCESS;
    }
}
