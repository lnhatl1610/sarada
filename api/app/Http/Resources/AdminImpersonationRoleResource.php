<?php

namespace App\Http\Resources;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminImpersonationRoleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Role $role */
        $role = $this->resource;

        return [
            'id' => $role->id,
            'name' => $role->name,
            'label' => Role::DEFINITIONS[$role->name]['label'] ?? $role->name,
            'permissions' => $role->permissions->map(fn ($permission): array => ['name' => $permission->name])->values(),
        ];
    }
}
