<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'source_filename' => $this->source_filename,
            'status' => $this->status,
            'total_rows' => $this->total_rows,
            'successful_rows' => $this->successful_rows,
            'failed_rows' => $this->failed_rows,
            'error_message' => $this->error_message,
            'errors_url' => $this->failed_rows > 0 ? url('/api/v1/admin/imports/'.$this->id.'/errors') : null,
            'created_at' => $this->created_at?->toISOString(),
            'user' => $this->whenLoaded('user', fn () => ['id' => $this->user->id, 'name' => $this->user->name]),
        ];
    }
}
