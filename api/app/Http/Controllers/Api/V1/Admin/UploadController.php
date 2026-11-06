<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UploadAdminFileRequest;
use Illuminate\Http\JsonResponse;

class UploadController extends Controller
{
    public function store(UploadAdminFileRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $file = $validated['file'];
        $path = $file->store('admin/uploads', 'public');

        return response()->json([
            'data' => [
                'path' => $path,
                'url' => asset('storage/'.$path),
                'name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ],
        ], 201);
    }
}
