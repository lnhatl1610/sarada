<?php

namespace App\Http\Requests\Api\V1\Storefront;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $tableDefaults = $this->input('value.table_column_defaults');
            if (! is_array($tableDefaults)) {
                return;
            }

            foreach ($tableDefaults as $tableId => $columns) {
                if (! is_array($columns) || count(array_filter($columns, 'is_string')) !== count($columns)) {
                    continue;
                }

                if (count($columns) !== count(array_unique($columns, SORT_STRING))) {
                    $attribute = "value.table_column_defaults.{$tableId}";
                    $validator->errors()->add($attribute, trans('validation.distinct', ['attribute' => $attribute]));
                }
            }
        });
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $preferenceKeys = ['admin_appearance', 'admin_notifications'];
        if ($this->user()->isAdmin()) {
            $preferenceKeys[] = 'security_alerts';
            $preferenceKeys[] = 'admin_dnd';
            $preferenceKeys[] = 'admin_digest';
            $preferenceKeys[] = 'admin_session_security';
        }
        if ($this->user()->isAdmin()) {
            $preferenceKeys[] = 'admin_onboarding';
            $preferenceKeys[] = 'admin_changelog';
        }
        $rules = ['key' => ['required', 'string', Rule::in($preferenceKeys)]];

        if ($this->input('key') === 'admin_onboarding') {
            return $rules + [
                'value' => ['required', 'array:completed,dismissed,snoozed_until'],
                'value.completed' => ['present', 'array', 'max:20'],
                'value.completed.*' => ['string', Rule::in(['intro_tour', 'product', 'shipping', 'staff', 'two_factor'])],
                'value.dismissed' => ['required', 'boolean'],
                'value.snoozed_until' => ['nullable', 'date'],
            ];
        }
        if ($this->input('key') === 'admin_changelog') {
            return $rules + [
                'value' => ['required', 'array:last_seen_version'],
                'value.last_seen_version' => ['required', 'string', 'max:40'],
            ];
        }

        if ($this->input('key') === 'security_alerts') {
            return $rules + [
                'value' => ['required', 'array:new_device,credentials_changed,failed_logins'],
                'value.new_device' => ['required', 'boolean'],
                'value.credentials_changed' => ['required', 'accepted'],
                'value.failed_logins' => ['required', 'boolean'],
            ];
        }

        if ($this->input('key') === 'admin_dnd') {
            return $rules + [
                'value' => ['required', 'array:until,schedule,allow_urgent'],
                'value.until' => ['nullable', 'date'],
                'value.schedule' => ['required', 'array', 'max:7'],
                'value.schedule.*' => ['required', 'array:days,start,end'],
                'value.schedule.*.days' => ['required', 'array', 'min:1', 'max:7'],
                'value.schedule.*.days.*' => ['integer', 'distinct', 'between:1,7'],
                'value.schedule.*.start' => ['required', 'date_format:H:i'],
                'value.schedule.*.end' => ['required', 'date_format:H:i'],
                'value.allow_urgent' => ['required', 'boolean'],
            ];
        }

        if ($this->input('key') === 'admin_digest') {
            return $rules + [
                'value' => ['required', 'array:frequency,time,sections'],
                'value.frequency' => ['required', Rule::in(['off', 'daily', 'weekly'])],
                'value.time' => ['required', 'date_format:H:i'],
                'value.sections' => ['required', 'array', 'max:5'],
                'value.sections.*' => ['required', 'string', 'distinct', Rule::in(['orders', 'revenue', 'low_stock', 'reviews', 'overdue_tasks'])],
            ];
        }

        if ($this->input('key') === 'admin_session_security') {
            return $rules + [
                'value' => ['required', 'array:idle_timeout_minutes,auto_lock_minutes'],
                'value.idle_timeout_minutes' => ['required', Rule::in([0, 15, 30, 60, 120])],
                'value.auto_lock_minutes' => ['required', Rule::in([0, 5, 10, 15, 30, 60])],
            ];
        }

        if ($this->input('key') === 'admin_appearance') {
            $menuGroups = ['profile', 'frequent', 'account', 'notifications', 'workspace', 'appearance', 'data', 'quick_navigation', 'quick_create', 'system', 'store', 'help'];
            $appearanceKeys = ['locale', 'theme', 'accent', 'font_size', 'zoom', 'show_breadcrumbs', 'high_contrast', 'strong_focus', 'date_format', 'time_format', 'number_locale', 'currency_position', 'week_start', 'dashboard_default_period', 'dashboard_compare_previous', 'remember_collapsed_groups', 'pinned_pages', 'dashboard_widgets', 'default_landing_page', 'table_density', 'table_column_defaults', 'page_size', 'sidebar_collapsed', 'reduce_motion', 'shortcuts', 'shortcuts_enabled'];
            if ($this->user()->isAdmin()) {
                $appearanceKeys[] = 'menu_layout';
            }

            return $rules + [
                'value' => ['required', 'array:'.implode(',', $appearanceKeys)],
                'value.locale' => ['sometimes', Rule::in(['vi', 'en'])],
                'value.theme' => ['required', Rule::in(['light', 'dark', 'system'])],
                'value.accent' => ['required', Rule::in(['burgundy', 'blue', 'emerald', 'violet', 'teal', 'amber'])],
                'value.font_size' => ['sometimes', Rule::in([14, 16, 18])],
                'value.zoom' => ['sometimes', Rule::in([90, 100, 110, 125])],
                'value.show_breadcrumbs' => ['sometimes', 'boolean'],
                'value.high_contrast' => ['sometimes', 'boolean'],
                'value.strong_focus' => ['sometimes', 'boolean'],
                'value.date_format' => ['sometimes', Rule::in(['dmy', 'ymd', 'relative'])],
                'value.time_format' => ['sometimes', Rule::in(['24h', '12h'])],
                'value.number_locale' => ['sometimes', Rule::in(['vi-VN', 'en-US'])],
                'value.currency_position' => ['sometimes', Rule::in(['suffix', 'prefix'])],
                'value.week_start' => ['sometimes', Rule::in([1, 7])],
                'value.dashboard_default_period' => ['sometimes', Rule::in(['7', '30', '90'])],
                'value.dashboard_compare_previous' => ['sometimes', 'boolean'],
                'value.remember_collapsed_groups' => ['sometimes', 'boolean'],
                'value.pinned_pages' => ['sometimes', 'array', 'max:8'],
                'value.pinned_pages.*' => ['required', 'string', 'distinct', Rule::in(['dashboard', 'orders', 'products', 'inventory', 'personalTasks'])],
                'value.dashboard_widgets' => ['sometimes', 'array', 'max:7'],
                'value.dashboard_widgets.*' => ['required', 'string', 'distinct', Rule::in(['metrics', 'alerts', 'revenue', 'recent_orders', 'breakdown', 'top_products', 'recent_activity'])],
                'value.default_landing_page' => ['sometimes', Rule::in(['dashboard', 'orders', 'products', 'inventory', 'personalTasks'])],
                'value.table_density' => ['required', Rule::in(['comfortable', 'compact'])],
                'value.table_column_defaults' => ['sometimes', 'array', 'max:100'],
                'value.table_column_defaults.*' => ['required', 'array', 'max:80'],
                'value.table_column_defaults.*.*' => ['required', 'string', 'max:100'],
                'value.page_size' => ['required', Rule::in([10, 20, 50, 100])],
                'value.sidebar_collapsed' => ['required', 'boolean'],
                'value.reduce_motion' => ['required', 'boolean'],
                'value.shortcuts_enabled' => ['sometimes', 'boolean'],
                'value.shortcuts' => ['sometimes', 'array:search,sidebar,lock,help'],
                'value.shortcuts.search' => ['sometimes', Rule::in(['ctrl+k', 'ctrl+shift+k', 'alt+k'])],
                'value.shortcuts.sidebar' => ['sometimes', Rule::in(['ctrl+b', 'ctrl+shift+b', 'alt+b'])],
                'value.shortcuts.lock' => ['sometimes', Rule::in(['ctrl+l', 'ctrl+shift+l', 'alt+l'])],
                'value.shortcuts.help' => ['sometimes', Rule::in(['?', 'ctrl+shift+?', 'alt+?'])],
                'value.menu_layout' => ['sometimes', 'array:hidden,order'],
                'value.menu_layout.hidden' => ['present_with:value.menu_layout', 'array', 'max:12'],
                'value.menu_layout.hidden.*' => ['string', 'distinct', Rule::in($menuGroups)],
                'value.menu_layout.order' => ['required_with:value.menu_layout', 'array', 'size:12'],
                'value.menu_layout.order.*' => ['required', 'string', 'distinct', Rule::in($menuGroups)],
            ];
        }

        $events = ['new_order', 'delivery_failed', 'low_stock', 'review_pending', 'staff_pending', 'weekly_report', 'admin_digest', 'task_reminder', 'export_complete'];
        $notificationRules = ['value' => ['required', 'array:'.implode(',', $events)]];
        foreach ($events as $event) {
            if ($event === 'admin_digest') {
                continue;
            }
            $notificationRules["value.$event"] = ['required', 'array:in_app,email,push'];
            $notificationRules["value.$event.in_app"] = ['required', 'boolean'];
            $notificationRules["value.$event.email"] = ['required', 'boolean'];
            $notificationRules["value.$event.push"] = ['sometimes', 'boolean'];
        }
        $notificationRules['value.admin_digest'] = ['sometimes', 'array:in_app,email,push'];
        $notificationRules['value.admin_digest.in_app'] = ['required_with:value.admin_digest', 'boolean'];
        $notificationRules['value.admin_digest.email'] = ['required_with:value.admin_digest', 'boolean'];
        $notificationRules['value.admin_digest.push'] = ['sometimes', 'boolean'];

        return $rules + $notificationRules;
    }
}
