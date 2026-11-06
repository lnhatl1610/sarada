<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePersonalTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $assignee = $this->input('user_id');
        if ($assignee === null || (int) $assignee === (int) $this->user()?->id) {
            return $this->user() !== null;
        }

        return $this->user()?->hasAdminPermission('tasks.assign') ?? false;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'integer', Rule::exists('users', 'id')->where('status', 'active')],
            'title' => ['required', 'string', 'min:1', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'priority' => ['sometimes', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'status' => ['sometimes', Rule::in(['todo', 'doing', 'done'])],
            'due_at' => ['nullable', 'date'],
            'remind_at' => ['nullable', 'date'],
            'repeat_rule' => ['nullable', Rule::in(['daily', 'weekly'])],
            'subject_type' => ['nullable', Rule::in(['order', 'product', 'customer', 'inventory'])],
            'subject_id' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $assigneeId = $this->input('user_id');
            if ($assigneeId !== null && ! User::query()->whereKey($assigneeId)->where('status', 'active')
                ->whereHas('roles', fn ($query) => $query->whereIn('name', Role::ADMIN_NAMES))->exists()) {
                $validator->errors()->add('user_id', 'Chỉ có thể giao việc cho tài khoản nhân viên đang hoạt động.');
            }
        }];
    }
}
