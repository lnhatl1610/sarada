<?php

namespace App\Modules\Reviews\Actions;

use App\Models\ProductQuestion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AnswerProductQuestionAction
{
    public function execute(User $actor, int $questionId, string $status, ?string $answer): ProductQuestion
    {
        if ($status === 'answered' && trim((string) $answer) === '') {
            throw ValidationException::withMessages(['answer' => 'Vui lòng nhập nội dung phản hồi.']);
        }

        return DB::transaction(function () use ($actor, $questionId, $status, $answer): ProductQuestion {
            $question = ProductQuestion::query()->lockForUpdate()->findOrFail($questionId);
            $isAnswered = $status === 'answered';
            $question->forceFill([
                'status' => $status,
                'answer' => $isAnswered ? trim((string) $answer) : $question->answer,
                'answered_by' => $isAnswered ? $actor->id : $question->answered_by,
                'answered_at' => $isAnswered ? now() : $question->answered_at,
            ])->save();

            return $question->refresh()->load(['user:id,name', 'answerer:id,name', 'product:id,name,slug']);
        });
    }
}
