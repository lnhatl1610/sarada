<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class FailedJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $summary = trim(strtok((string) $this->exception, "\n") ?: 'Job lỗi không có nội dung chi tiết.');
        $summary = preg_replace('/(password|token|secret|authorization)(["\' ]*[:=]["\' ]*)[^,;\s]+/i', '$1$2[đã ẩn]', $summary) ?? $summary;

        return [
            'id' => $this->id,
            'connection' => $this->connection,
            'queue' => $this->queue,
            'failed_at' => $this->failed_at,
            'summary' => Str::limit($summary, 400),
        ];
    }
}
