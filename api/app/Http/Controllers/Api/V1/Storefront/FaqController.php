<?php

namespace App\Http\Controllers\Api\V1\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Storefront\ListStorefrontFaqsRequest;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;

class FaqController extends Controller
{
    public function index(ListStorefrontFaqsRequest $request): JsonResponse
    {
        $term = trim((string) $request->validated('q', ''));
        $rows = Faq::query()
            ->where('is_active', true)
            ->when($term !== '', fn ($query) => $query->where(fn ($query) => $query->where('category', 'like', '%'.$term.'%')->orWhere('question', 'like', '%'.$term.'%')->orWhere('answer', 'like', '%'.$term.'%')))
            ->orderBy('category_order')->orderBy('category')->orderBy('sort_order')->orderBy('question')->orderBy('id')
            ->limit(250)
            ->get(['id', 'category', 'question', 'answer', 'category_order', 'sort_order']);

        $groups = $rows->groupBy('category')->map(fn ($items, $category) => [
            'category' => $category,
            'items' => $items->map(fn (Faq $faq) => ['id' => $faq->id, 'question' => $faq->question, 'answer' => $faq->answer])->values(),
        ])->values();

        return response()->json(['data' => $groups, 'meta' => ['query' => $term, 'total' => $rows->count()]]);
    }
}
