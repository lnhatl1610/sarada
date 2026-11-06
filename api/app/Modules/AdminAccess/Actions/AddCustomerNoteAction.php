<?php

namespace App\Modules\AdminAccess\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AddCustomerNoteAction
{
    public function execute(int $customerId, User $actor, string $content): array
    {
        return DB::transaction(function () use ($customerId, $actor, $content): array {
            $customer = User::query()->whereHas('roles', fn ($query) => $query->where('name', 'customer'))->lockForUpdate()->findOrFail($customerId);
            $id = DB::table('customer_notes')->insertGetId([
                'customer_id' => $customer->id,
                'created_by' => $actor->id,
                'content' => trim($content),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return (array) DB::table('customer_notes')->leftJoin('users as actors', 'actors.id', '=', 'customer_notes.created_by')
                ->where('customer_notes.id', $id)
                ->first(['customer_notes.id', 'customer_notes.content', 'customer_notes.created_at', 'actors.id as actor_id', 'actors.name as actor_name']);
        });
    }
}
