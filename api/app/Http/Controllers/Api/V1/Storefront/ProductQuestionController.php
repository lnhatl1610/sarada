<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\StoreProductQuestionRequest;
use App\Http\Resources\StorefrontProductQuestionResource;
use App\Models\Product;
use App\Modules\Reviews\Actions\AskProductQuestionAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductQuestionController extends Controller
{
    public function index(string $slug): AnonymousResourceCollection
    {
        $product = Product::query()->published()->where('slug', $slug)->firstOrFail();
        $questions = $product->questions()
            ->where('status', 'answered')->whereNotNull('answer')
            ->with(['user:id,name', 'answerer:id,name'])
            ->orderByDesc('answered_at')->orderByDesc('id')->paginate(10);

        return StorefrontProductQuestionResource::collection($questions);
    }

    public function store(StoreProductQuestionRequest $request, string $slug, AskProductQuestionAction $action): JsonResponse
    {
        $question = $action->execute($request->user(), $slug, $request->validated('question'));

        return response()->json(['data' => ['id' => $question->id, 'status' => $question->status, 'message' => 'Câu hỏi đã được gửi đến cửa hàng và sẽ hiển thị sau khi có phản hồi.']], 201);
    }
}
