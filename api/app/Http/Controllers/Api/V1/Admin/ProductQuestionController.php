<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\AnswerProductQuestionRequest;
use App\Http\Requests\Api\V1\Admin\ListProductQuestionsRequest;
use App\Http\Resources\AdminProductQuestionResource;
use App\Models\ProductQuestion;
use App\Modules\Reviews\Actions\AnswerProductQuestionAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductQuestionController extends Controller
{
    public function index(ListProductQuestionsRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $query = ProductQuestion::query()
            ->when(isset($filters['status']), fn ($builder) => $builder->where('status', $filters['status']))
            ->when(isset($filters['q']), fn ($builder) => $builder->where(fn ($search) => $search
                ->where('question', 'like', '%'.$filters['q'].'%')
                ->orWhere('answer', 'like', '%'.$filters['q'].'%')
                ->orWhereHas('product', fn ($product) => $product->where('name', 'like', '%'.$filters['q'].'%'))
                ->orWhereHas('user', fn ($user) => $user->where('name', 'like', '%'.$filters['q'].'%'))));

        return AdminProductQuestionResource::collection($query->with(['product:id,name,slug', 'user:id,name', 'answerer:id,name'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')->orderByDesc('id')->paginate($filters['per_page'] ?? 20));
    }

    public function update(AnswerProductQuestionRequest $request, ProductQuestion $question, AnswerProductQuestionAction $action): JsonResponse
    {
        $data = $request->validated();
        $updated = $action->execute($request->user(), (int) $question->id, $data['status'], $data['answer'] ?? null);

        return response()->json(['data' => new AdminProductQuestionResource($updated)]);
    }
}
