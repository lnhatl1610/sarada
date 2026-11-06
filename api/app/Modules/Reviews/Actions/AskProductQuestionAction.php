<?php

namespace App\Modules\Reviews\Actions;

use App\Models\Product;
use App\Models\ProductQuestion;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AskProductQuestionAction
{
    public function execute(User $user, string $slug, string $question): ProductQuestion
    {
        return DB::transaction(function () use ($user, $slug, $question): ProductQuestion {
            $product = Product::query()->published()->where('slug', $slug)->firstOrFail();

            return ProductQuestion::query()->create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'question' => trim($question),
                'status' => 'pending',
            ]);
        });
    }
}
