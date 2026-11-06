<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AuditAdminWrite
{
    public function handle(Request $request, Closure $next): Response
    {
        $isAdminExport = $request->isMethod('GET')
            && (str_ends_with($request->path(), '/export') || $request->boolean('export'));
        $auditCandidate = ($request->is('api/v1/admin/*') || $request->is('api/v1/me/*'))
            && ! $request->is('api/v1/admin/auth/*')
            && (! $request->isMethod('GET') || $isAdminExport);
        $resourceTable = $auditCandidate ? $this->resourceTable($request) : null;
        $resourceId = $auditCandidate ? $this->resourceId($request) : null;
        $resourceKey = $resourceTable ? $this->resourceKey($request) : 'id';
        $beforeSnapshot = $this->snapshot($resourceTable, $resourceKey, $resourceId);
        $reviewProductIds = $auditCandidate ? $this->reviewProductIds($request) : [];
        $beforeBatch = $auditCandidate ? $this->batchSnapshot($request, null, $reviewProductIds) : [];
        $settingsKeys = $request->is('api/v1/admin/settings') ? array_slice(array_keys($request->all()), 0, 100) : [];
        $beforeSettings = $settingsKeys === [] ? [] : $this->settingsSnapshot($settingsKeys);
        $response = $next($request);
        $isAdminWrite = $auditCandidate && $request->user();
        if (! $isAdminWrite || $response->getStatusCode() >= 400) {
            return $response;
        }

        $path = $request->path();
        $module = $request->is('api/v1/admin/storefront-promotion-campaigns*') ? 'campaigns' : (explode('/', $path)[3] ?? 'admin');
        $submitted = $this->redact($request->except(['password', 'password_confirmation', 'current_password', 'token', 'secret', 'api_key']));
        $changes = $request->is('api/v1/admin/settings')
            ? $this->settingsChanges($beforeSettings, $this->settingsSnapshot($settingsKeys), $settingsKeys)
            : ['submitted' => $submitted];
        $responseContent = $response->getContent();
        $responseBody = is_string($responseContent) ? json_decode($responseContent, true) : null;
        $responseData = data_get($responseBody, 'data');
        if ($resourceTable) {
            $responseId = data_get($responseBody, 'data.id');
            $snapshotId = $resourceId ?? (is_numeric($responseId) ? (int) $responseId : (is_string($responseId) && $responseId !== '' ? $responseId : null));
            $afterSnapshot = $this->snapshot($resourceTable, $resourceKey, $snapshotId);
            if ($beforeSnapshot || $afterSnapshot) {
                $beforeRaw = $beforeSnapshot ? (array) $beforeSnapshot : [];
                $afterRaw = $afterSnapshot ? (array) $afterSnapshot : [];
                $allKeys = array_unique([...array_keys($beforeRaw), ...array_keys($afterRaw)]);
                $changedKeys = ! $beforeSnapshot || ! $afterSnapshot
                    ? $allKeys
                    : array_values(array_filter($allKeys, fn (string $key): bool => ($beforeRaw[$key] ?? null) !== ($afterRaw[$key] ?? null)));
                $changedMask = array_fill_keys($changedKeys, true);
                $changes = [
                    'before' => $this->redact(array_intersect_key($beforeRaw, $changedMask)),
                    'after' => $this->redact(array_intersect_key($afterRaw, $changedMask)),
                    'changed_fields' => $changedKeys,
                    'submitted' => $submitted,
                ];
            }
        }
        $afterBatch = $this->batchSnapshot($request, is_array($responseData) ? $responseData : null, $reviewProductIds);
        if ($beforeBatch !== [] || $afterBatch !== []) {
            $batchChanges = $this->batchChanges($beforeBatch, $afterBatch);
            $changes['before'] = [...($changes['before'] ?? []), 'batch_records' => $batchChanges['before']];
            $changes['after'] = [...($changes['after'] ?? []), 'batch_records' => $batchChanges['after']];
        }
        $uploadedFiles = $this->uploadedFilesAudit($request, is_array($responseData) ? $responseData : null);
        if ($uploadedFiles !== []) {
            $beforeChanges = $changes['before'] ?? [];
            $afterChanges = $changes['after'] ?? [];
            $changes['before'] = [...$beforeChanges, 'batch_records' => [...($beforeChanges['batch_records'] ?? []), 'uploaded_files' => []]];
            $changes['after'] = [...$afterChanges, 'batch_records' => [...($afterChanges['batch_records'] ?? []), 'uploaded_files' => $uploadedFiles]];
        }
        if (! $request->is('api/v1/admin/settings') && is_array($responseData) && $responseData !== []) {
            $changes['result'] = $this->redact($responseData);
        }
        DB::table('activity_logs')->insert([
            'user_id' => $request->user()->id,
            'module' => $module,
            'action' => $isAdminExport ? 'EXPORT' : $request->method(),
            'path' => substr($path, 0, 500),
            'changes' => $changes === null ? null : json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'ip' => $request->ip(),
            'created_at' => now(),
        ]);

        return $response;
    }

    private function resourceTable(Request $request): ?string
    {
        if ($request->is('api/v1/admin/staff/invitations*')) {
            return 'staff_invitations';
        }
        if ($request->is('api/v1/admin/staff/roles/*')) {
            return 'roles';
        }
        if ($request->is('api/v1/admin/customers/*/notes')) {
            return 'customer_notes';
        }
        if ($request->is('api/v1/admin/inventory/adjustments*')) {
            return 'inventory_adjustment_batches';
        }
        if ($request->is('api/v1/admin/inventory/*/adjust')) {
            return 'inventories';
        }
        if ($request->is('api/v1/admin/products/*/variants*')) {
            return 'product_variants';
        }
        if ($request->is('api/v1/admin/products/*/images*')) {
            return 'product_images';
        }
        if ($request->is('api/v1/admin/products/*/duplicate')) {
            return 'products';
        }
        if ($request->is('api/v1/admin/orders/*/shipment')) {
            return 'shipments';
        }
        if ($request->is('api/v1/admin/campaigns/coupons*')) {
            return 'coupons';
        }
        if ($request->is('api/v1/admin/campaigns/banners*')) {
            return 'banners';
        }
        if ($request->is('api/v1/admin/storefront-promotion-campaigns*')) {
            return 'storefront_promotion_campaigns';
        }

        $resource = explode('/', $request->path())[3] ?? '';
        if ($resource === 'catalog-options') {
            $kind = explode('/', $request->path())[4] ?? '';

            return match ($kind) {
                'categories' => 'categories',
                'brands' => 'brands',
                'colors', 'sizes' => 'attribute_values',
                'collections' => 'collections',
                default => null,
            };
        }

        return match ($resource) {
            'products' => 'products',
            'categories' => 'categories',
            'brands' => 'brands',
            'colors', 'sizes' => 'attribute_values',
            'orders' => 'orders',
            'payments' => 'payments',
            'customers' => 'users',
            'shipping-rates' => 'shipping_rates',
            'coupons' => 'coupons',
            'banners' => 'banners',
            'storefront-promotion-campaigns' => 'storefront_promotion_campaigns',
            'pages' => 'pages',
            'stores' => 'store_locations',
            'faqs' => 'faqs',
            'staff' => 'users',
            'roles' => 'roles',
            'tags' => 'tags',
            'collections' => 'collections',
            'inventory' => 'inventories',
            'reviews' => 'reviews',
            'notifications' => 'notifications',
            'shipping-methods' => 'shipping_methods',
            default => null,
        };
    }

    private function resourceId(Request $request): int|string|null
    {
        if (
            $request->is('api/v1/admin/customers/*/notes')
            || $request->is('api/v1/admin/products/*/variants')
            || $request->is('api/v1/admin/products/*/images')
            || $request->is('api/v1/admin/products/*/images/upload')
            || $request->is('api/v1/admin/products/*/videos/upload')
            || $request->is('api/v1/admin/products/*/images/reorder')
            || $request->is('api/v1/admin/products/*/duplicate')
        ) {
            return null;
        }
        if (preg_match('#^api/v1/admin/products/[^/]+/variants/([0-9]+)(?:/|$)#', $request->path(), $matches)) {
            return (int) $matches[1];
        }
        if (preg_match('#^api/v1/admin/products/[^/]+/images/([0-9]+)(?:/|$)#', $request->path(), $matches)) {
            return (int) $matches[1];
        }

        foreach ($request->route()?->parameters() ?? [] as $value) {
            if (is_object($value) && method_exists($value, 'getKey')) {
                $value = $value->getKey();
            }
            if (is_numeric($value)) {
                return (int) $value;
            }
            if (is_string($value) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value)) {
                return $value;
            }
        }

        return null;
    }

    private function resourceKey(Request $request): string
    {
        if ($request->is('api/v1/admin/inventory/*/adjust')) {
            return 'variant_id';
        }
        if ($request->is('api/v1/admin/orders/*/shipment')) {
            return 'order_id';
        }

        return 'id';
    }

    private function snapshot(?string $table, string $key, int|string|null $value): ?object
    {
        if ($table === null || $value === null) {
            return null;
        }

        $query = DB::table($table)->where($key, $value);
        if ($table === 'shipments') {
            $query->orderByDesc('id');
        }

        return $query->first();
    }

    /** @param array<int, string> $keys
     * @return array<string, mixed>
     */
    private function settingsSnapshot(array $keys): array
    {
        $rows = DB::table('settings')->whereIn('key', $keys)->get(['key', 'value']);
        $snapshot = [];
        foreach ($rows as $row) {
            $snapshot[$row->key] = $row->value;
        }

        return $snapshot;
    }

    /** @param array<string, mixed> $before
     * @param  array<string, mixed>  $after
     * @return array<string, mixed>
     */
    private function settingsChanges(array $before, array $after, array $submittedKeys): array
    {
        $keys = array_unique([...array_keys($before), ...array_keys($after)]);
        $changed = array_values(array_filter($keys, fn (string $key): bool => ($before[$key] ?? null) !== ($after[$key] ?? null)));
        $keyOrder = array_flip($submittedKeys);
        usort($changed, static fn (string $left, string $right): int => ($keyOrder[$left] ?? PHP_INT_MAX) <=> ($keyOrder[$right] ?? PHP_INT_MAX));

        return ['changed_fields' => $changed];
    }

    /** @return array<string, array<string, array<string, mixed>>> */
    private function batchSnapshot(Request $request, ?array $responseData = null, array $reviewProductIds = []): array
    {
        $path = $request->path();
        $targets = [];
        if ($reviewProductIds !== []) {
            $targets[] = ['name' => 'review_product_aggregates', 'table' => 'products', 'key' => 'id', 'ids' => $reviewProductIds];
        }
        if ($request->is('api/v1/admin/orders/bulk-status')) {
            $targets[] = ['name' => 'orders', 'table' => 'orders', 'key' => 'id', 'ids' => $request->input('order_ids', [])];
        } elseif ($request->is('api/v1/admin/reviews/bulk-status')) {
            $targets[] = ['name' => 'reviews', 'table' => 'reviews', 'key' => 'id', 'ids' => $request->input('review_ids', [])];
        } elseif ($request->is('api/v1/admin/products/bulk')) {
            $targets[] = ['name' => 'products', 'table' => 'products', 'key' => 'id', 'ids' => $request->input('ids', [])];
        } elseif ($request->is('api/v1/admin/inventory/threshold')) {
            $targets[] = ['name' => 'inventory', 'table' => 'inventories', 'key' => 'variant_id', 'ids' => $request->input('variant_ids', [])];
        } elseif ($request->is('api/v1/admin/tags/merge')) {
            $sourceIds = $request->input('source_ids');
            $targets[] = ['name' => 'tags', 'table' => 'tags', 'key' => 'id', 'ids' => [...(is_array($sourceIds) ? $sourceIds : []), $request->input('target_id')]];
        } elseif (preg_match('#^api/v1/admin/(categories|sizes|colors)/reorder$#', $path, $matches)) {
            $kind = $matches[1];
            $targets[] = ['name' => $kind, 'table' => $kind === 'categories' ? 'categories' : 'attribute_values', 'key' => 'id', 'ids' => $request->input('items', [])];
        } elseif ($request->is('api/v1/admin/banners/reorder')) {
            $targets[] = ['name' => 'banners', 'table' => 'banners', 'key' => 'id', 'ids' => $request->input('ids', [])];
        } elseif (preg_match('#^api/v1/admin/products/([0-9]+)/images/reorder$#', $path, $matches)) {
            $targets[] = ['name' => 'product_images', 'table' => 'product_images', 'key' => 'id', 'ids' => $request->input('images', []), 'where' => ['product_id' => (int) $matches[1]]];
        } elseif (preg_match('#^api/v1/admin/collections/([0-9]+)/products/reorder$#', $path, $matches)) {
            $targets[] = ['name' => 'collection_products', 'table' => 'collection_product', 'key' => 'product_id', 'ids' => $request->input('products', []), 'where' => ['collection_id' => (int) $matches[1]], 'identity' => ['collection_id', 'product_id']];
        }

        if (preg_match('#^api/v1/admin/(?:catalog-options/)?collections/([0-9]+)$#', $path, $matches)) {
            $targets[] = ['name' => 'collection_products', 'table' => 'collection_product', 'key' => 'product_id', 'ids' => [], 'where' => ['collection_id' => (int) $matches[1]], 'identity' => ['collection_id', 'product_id']];
        }

        if ($request->is('api/v1/admin/notifications/read-all') && $request->user()) {
            $targets[] = [
                'name' => 'notifications',
                'table' => 'notifications',
                'key' => 'notifiable_id',
                'ids' => [$request->user()->getKey()],
                'where' => ['notifiable_type' => $request->user()->getMorphClass(), 'read_at' => null],
                'identity' => ['id'],
            ];
        }

        if (preg_match('#^api/v1/admin/staff/roles/([0-9]+)$#', $path, $matches)) {
            $targets[] = ['name' => 'role_permissions', 'table' => 'permission_role', 'key' => 'role_id', 'ids' => [(int) $matches[1]], 'identity' => ['role_id', 'permission_id']];
        }
        if ($request->is('api/v1/admin/staff') || preg_match('#^api/v1/admin/staff/pending-approvals/[0-9]+/approve$#', $path)) {
            $userIds = $request->is('api/v1/admin/staff')
                ? $this->numericIds([$responseData['id'] ?? null])
                : $this->numericIds([$request->route('user')]);
            $targets[] = ['name' => 'staff_roles', 'table' => 'role_user', 'key' => 'user_id', 'ids' => $userIds, 'identity' => ['user_id', 'role_id']];
        }
        if (preg_match('#^api/v1/admin/staff/([0-9]+)(?:/|$)#', $path, $matches)) {
            $userId = (int) $matches[1];
            if ($userId > 0) {
                $targets[] = ['name' => 'staff_roles', 'table' => 'role_user', 'key' => 'user_id', 'ids' => [$userId], 'identity' => ['user_id', 'role_id']];
            }
        }
        if ($request->is('api/v1/admin/products/bulk') && in_array($request->input('action'), ['assign_collections', 'assign_tags'], true)) {
            $productIds = $request->input('ids', []);
            if ($request->input('action') === 'assign_collections') {
                $targets[] = ['name' => 'product_collections', 'table' => 'collection_product', 'key' => 'product_id', 'ids' => $productIds, 'identity' => ['product_id', 'collection_id']];
            } else {
                $targets[] = ['name' => 'product_tags', 'table' => 'product_tag', 'key' => 'product_id', 'ids' => $productIds, 'identity' => ['product_id', 'tag_id']];
            }
        }
        if (preg_match('#^api/v1/admin/products/([0-9]+)(?:/details|/size-recommendations)?$#', $path, $matches)) {
            $productId = (int) $matches[1];
            $targets[] = ['name' => 'product_collections', 'table' => 'collection_product', 'key' => 'product_id', 'ids' => [$productId], 'identity' => ['product_id', 'collection_id']];
            $targets[] = ['name' => 'product_tags', 'table' => 'product_tag', 'key' => 'product_id', 'ids' => [$productId], 'identity' => ['product_id', 'tag_id']];
            $variantIds = $this->numericIds(DB::table('product_variants')->where('product_id', $productId)->limit(100)->pluck('id')->all());
            $targets[] = ['name' => 'product_variants', 'table' => 'product_variants', 'key' => 'id', 'ids' => $variantIds];
            $targets[] = ['name' => 'product_images', 'table' => 'product_images', 'key' => 'id', 'ids' => [], 'where' => ['product_id' => $productId], 'identity' => ['id']];
            $targets[] = ['name' => 'product_size_recommendations', 'table' => 'product_size_recommendations', 'key' => 'product_id', 'ids' => [], 'where' => ['product_id' => $productId], 'identity' => ['size_value_id']];
            $this->addInventoryAuditTargets($targets, $variantIds);
        }
        if ($request->is('api/v1/admin/products') || preg_match('#^api/v1/admin/products/[0-9]+/duplicate$#', $path)) {
            $productIds = $this->numericIds([$responseData['id'] ?? null]);
            $targets[] = ['name' => 'product_collections', 'table' => 'collection_product', 'key' => 'product_id', 'ids' => $productIds, 'identity' => ['product_id', 'collection_id']];
            $targets[] = ['name' => 'product_tags', 'table' => 'product_tag', 'key' => 'product_id', 'ids' => $productIds, 'identity' => ['product_id', 'tag_id']];
        }
        if (preg_match('#^api/v1/admin/collections/([0-9]+)/products(?:/([0-9]+))?$#', $path, $matches)) {
            $productIds = $request->input('product_ids');
            $productIds = is_array($productIds) ? $productIds : [];
            if (($matches[2] ?? '') !== '') {
                $productIds[] = (int) $matches[2];
            }
            $targets[] = ['name' => 'collection_products', 'table' => 'collection_product', 'key' => 'product_id', 'ids' => $productIds, 'where' => ['collection_id' => (int) $matches[1]], 'identity' => ['collection_id', 'product_id']];
        }
        if ($request->is('api/v1/admin/tags/merge')) {
            $tagIds = [...$this->numericIds($request->input('source_ids')), ...$this->numericIds([$request->input('target_id')])];
            $targets[] = ['name' => 'tagged_products', 'table' => 'product_tag', 'key' => 'tag_id', 'ids' => $tagIds, 'identity' => ['tag_id', 'product_id']];
        }
        if (preg_match('#^api/v1/admin/orders/([0-9]+)/(status|payment-status|note)$#', $path, $matches)) {
            $orderId = (int) $matches[1];
            $targets[] = ['name' => 'order_history', 'table' => 'order_status_histories', 'key' => 'order_id', 'ids' => [$orderId], 'identity' => ['id'], 'latest' => true];
            if ($matches[2] === 'payment-status' || $request->boolean('payment_collected')) {
                $targets[] = ['name' => 'order_payments', 'table' => 'payments', 'key' => 'order_id', 'ids' => [$orderId], 'identity' => ['id'], 'latest' => true];
            }
        }
        if (preg_match('#^api/v1/admin/orders/([0-9]+)/shipment$#', $path, $matches)) {
            $targets[] = ['name' => 'orders', 'table' => 'orders', 'key' => 'id', 'ids' => [(int) $matches[1]]];
        }
        if (preg_match('#^api/v1/admin/orders/([0-9]+)/refund$#', $path, $matches)) {
            $orderId = (int) $matches[1];
            $paymentId = DB::table('payments')->where('order_id', $orderId)->whereIn('status', ['success', 'paid', 'refunded'])->orderByDesc('id')->value('id');
            if ($paymentId !== null) {
                $targets[] = ['name' => 'order_payments', 'table' => 'payments', 'key' => 'id', 'ids' => [$paymentId]];
                $targets[] = ['name' => 'payment_refunds', 'table' => 'payment_refunds', 'key' => 'payment_id', 'ids' => [], 'where' => ['payment_id' => $paymentId], 'identity' => ['id'], 'latest' => true];
            }
        }
        if (preg_match('#^api/v1/admin/payments/([0-9]+)/refund$#', $path, $matches)) {
            $paymentId = (int) $matches[1];
            $targets[] = ['name' => 'payment_refunds', 'table' => 'payment_refunds', 'key' => 'payment_id', 'ids' => [], 'where' => ['payment_id' => $paymentId], 'identity' => ['id'], 'latest' => true];
        }
        if ($request->is('api/v1/admin/orders/bulk-status')) {
            $orderIds = $request->input('order_ids', []);
            $targets[] = ['name' => 'order_history', 'table' => 'order_status_histories', 'key' => 'order_id', 'ids' => $orderIds, 'identity' => ['id'], 'latest' => true];
            if ($request->boolean('payment_collected')) {
                $targets[] = ['name' => 'order_payments', 'table' => 'payments', 'key' => 'order_id', 'ids' => $orderIds, 'identity' => ['id'], 'latest' => true];
            }
        }
        if (preg_match('#^api/v1/admin/orders/([0-9]+)/status$#', $path, $matches)) {
            $this->addOrderSideEffectAuditTargets($targets, [(int) $matches[1]]);
        } elseif ($request->is('api/v1/admin/orders/bulk-status')) {
            $orderIds = $request->input('order_ids', []);
            $this->addOrderSideEffectAuditTargets($targets, is_array($orderIds) ? $orderIds : []);
        }
        if ($request->is('api/v1/admin/orders/manual')) {
            $orderIds = $this->numericIds([$responseData['id'] ?? null]);
            $targets[] = ['name' => 'manual_order_items', 'table' => 'order_items', 'key' => 'order_id', 'ids' => $orderIds, 'identity' => ['id']];
            $targets[] = ['name' => 'manual_order_payments', 'table' => 'payments', 'key' => 'order_id', 'ids' => $orderIds, 'identity' => ['id']];
            $this->addInventoryAuditTargets($targets, $this->variantIdsFromRows($request->input('items', [])));
            $this->addOrderSideEffectAuditTargets($targets, $orderIds);
            $couponInput = $request->input('coupon_code', '');
            $couponCode = is_string($couponInput) ? strtoupper(trim($couponInput)) : '';
            if ($couponCode !== '') {
                $couponId = DB::table('coupons')->where('code', $couponCode)->value('id');
                $targets[] = ['name' => 'manual_order_coupon', 'table' => 'coupons', 'key' => 'id', 'ids' => $this->numericIds([$couponId])];
            }
        }
        if (preg_match('#^api/v1/admin/products/([0-9]+)/variants$#', $path, $matches)) {
            $variantIds = $this->numericIds([$responseData['id'] ?? null]);
            $this->addInventoryAuditTargets($targets, $variantIds);
        }
        if (($request->is('api/v1/admin/products') || preg_match('#^api/v1/admin/products/[0-9]+/duplicate$#', $path)) && $responseData !== null) {
            $productIds = $this->numericIds([$responseData['id'] ?? null]);
            if ($productIds !== []) {
                $productId = $productIds[0];
                $variantIds = $this->numericIds(DB::table('product_variants')->where('product_id', $productId)->pluck('id')->all());
                $targets[] = ['name' => 'created_product_variants', 'table' => 'product_variants', 'key' => 'id', 'ids' => $variantIds];
                $targets[] = ['name' => 'created_product_images', 'table' => 'product_images', 'key' => 'id', 'ids' => [], 'where' => ['product_id' => $productId], 'identity' => ['id']];
                $this->addInventoryAuditTargets($targets, $variantIds);
            }
        }
        if (preg_match('#^api/v1/admin/inventory/([0-9]+)/adjust$#', $path, $matches)) {
            $this->addInventoryAuditTargets($targets, [(int) $matches[1]]);
        }
        if ($request->is('api/v1/admin/inventory/import-csv')) {
            $this->addInventoryAuditTargets($targets, $this->inventoryImportVariantIds($request));
        }
        if ($request->is('api/v1/admin/inventory/adjustments')) {
            $this->addInventoryAuditTargets($targets, $this->variantIdsFromRows($request->input('rows', [])));
        }
        if (preg_match('#^api/v1/admin/products/([0-9]+)/images(?:/|$)#', $path, $matches)) {
            $productId = (int) $matches[1];
            $targets[] = ['name' => 'image_parent_product', 'table' => 'products', 'key' => 'id', 'ids' => [$productId]];
            $targets[] = ['name' => 'product_images', 'table' => 'product_images', 'key' => 'id', 'ids' => [], 'where' => ['product_id' => $productId], 'identity' => ['id']];
        }
        if (
            $request->isMethod('DELETE')
            && preg_match('#^api/v1/admin/staff/([0-9]+)(?:/sessions)?$#', $path, $matches)
        ) {
            $staffId = (int) $matches[1];
            $targets[] = ['name' => 'staff_refresh_sessions', 'table' => 'refresh_tokens', 'key' => 'user_id', 'ids' => [$staffId], 'identity' => ['id']];
            $targets[] = ['name' => 'staff_access_sessions', 'table' => 'personal_access_tokens', 'key' => 'tokenable_id', 'ids' => [], 'where' => ['tokenable_id' => $staffId, 'tokenable_type' => User::class], 'identity' => ['id']];
        }

        $snapshots = [];
        foreach ($targets as $target) {
            $ids = $this->numericIds($target['ids']);
            $where = $target['where'] ?? [];
            if ($ids === [] && $where === []) {
                continue;
            }
            $query = DB::table($target['table']);
            if ($ids !== []) {
                $query->whereIn($target['key'], $ids);
            }
            foreach ($where as $column => $value) {
                $query->where($column, $value);
            }
            if ($target['latest_per_key'] ?? false) {
                foreach ($ids as $id) {
                    $latestQuery = DB::table($target['table'])->where($target['key'], $id);
                    foreach ($where as $column => $value) {
                        $latestQuery->where($column, $value);
                    }
                    $row = $latestQuery->orderByDesc('id')->first();
                    if ($row) {
                        $record = (array) $row;
                        $identityFields = $target['identity'] ?? [$target['key']];
                        $identity = implode(':', array_map(fn (string $field): string => (string) ($record[$field] ?? ''), $identityFields));
                        $snapshots[$target['name']][$identity] = $record;
                    }
                }

                continue;
            }
            if ($target['latest'] ?? false) {
                $query->orderByDesc('id');
            }
            foreach ($query->limit(100)->get() as $row) {
                $record = (array) $row;
                $identityFields = $target['identity'] ?? [$target['key']];
                $identity = implode(':', array_map(fn (string $field): string => (string) ($record[$field] ?? ''), $identityFields));
                $snapshots[$target['name']][$identity] = $record;
            }
        }

        return $snapshots;
    }

    /** @return list<int> */
    private function reviewProductIds(Request $request): array
    {
        if ($request->is('api/v1/admin/reviews/bulk-status')) {
            $reviewIds = $this->numericIds($request->input('review_ids', []));
        } elseif (preg_match('#^api/v1/admin/reviews/([0-9]+)(?:/status)?$#', $request->path(), $matches)) {
            $reviewIds = [(int) $matches[1]];
        } else {
            return [];
        }

        return $this->numericIds(DB::table('reviews')->whereIn('id', $reviewIds)->pluck('product_id')->all());
    }

    /** @param array<int, array<string, mixed>> $targets
     * @param  list<int>  $variantIds
     */
    private function addInventoryAuditTargets(array &$targets, array $variantIds): void
    {
        if ($variantIds === []) {
            return;
        }

        $targets[] = ['name' => 'inventory', 'table' => 'inventories', 'key' => 'variant_id', 'ids' => $variantIds];
        $targets[] = ['name' => 'inventory_movements', 'table' => 'inventory_movements', 'key' => 'variant_id', 'ids' => $variantIds, 'identity' => ['id'], 'latest_per_key' => true];
    }

    /** @param array<int, array<string, mixed>> $targets
     * @param  list<int|string>  $orderIds
     */
    private function addOrderSideEffectAuditTargets(array &$targets, array $orderIds): void
    {
        $orderIds = $this->numericIds($orderIds);
        if ($orderIds === []) {
            return;
        }

        $variantIds = $this->numericIds(DB::table('order_items')->whereIn('order_id', $orderIds)->whereNotNull('variant_id')->pluck('variant_id')->all());
        $this->addInventoryAuditTargets($targets, $variantIds);
        $couponIds = $this->numericIds(DB::table('orders')->whereIn('id', $orderIds)->whereNotNull('coupon_id')->pluck('coupon_id')->all());
        if ($couponIds !== []) {
            $targets[] = ['name' => 'order_coupons', 'table' => 'coupons', 'key' => 'id', 'ids' => $couponIds];
            $targets[] = ['name' => 'order_coupon_usages', 'table' => 'coupon_usages', 'key' => 'order_id', 'ids' => $orderIds, 'identity' => ['id']];
        }
    }

    /** @return list<int> */
    private function variantIdsFromRows(mixed $rows): array
    {
        if (! is_array($rows)) {
            return [];
        }

        return $this->numericIds(array_map(static fn (mixed $row): mixed => is_array($row) ? ($row['variant_id'] ?? null) : null, $rows));
    }

    /** @return list<int> */
    private function inventoryImportVariantIds(Request $request): array
    {
        $file = $request->file('file');
        if (! $file instanceof UploadedFile || ! is_string($file->getRealPath())) {
            return [];
        }
        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            return [];
        }
        fgetcsv($handle);
        $skus = [];
        while (($row = fgetcsv($handle)) !== false && count($skus) < 100) {
            $sku = trim((string) ($row[0] ?? ''));
            if ($sku !== '') {
                $skus[$sku] = $sku;
            }
        }
        fclose($handle);

        return $this->numericIds(DB::table('product_variants')->whereIn('sku', array_values($skus))->pluck('id')->all());
    }

    /** @return list<int> */
    private function numericIds(mixed $values): array
    {
        if (! is_array($values)) {
            return [];
        }
        $ids = [];
        foreach ($values as $value) {
            if (is_array($value)) {
                $value = $value['id'] ?? null;
            } elseif (is_object($value) && method_exists($value, 'getKey')) {
                $value = $value->getKey();
            }
            if (is_int($value) || (is_string($value) && ctype_digit($value))) {
                $ids[] = (int) $value;
            }
        }

        return array_slice(array_values(array_unique($ids)), 0, 100);
    }

    /** @return array<string, array<string, int|string|null>> */
    private function uploadedFilesAudit(Request $request, ?array $responseData): array
    {
        if ($request->is('api/v1/admin/inventory/import*')) {
            return [];
        }

        $files = [];
        foreach ($request->allFiles() as $field => $file) {
            $this->collectUploadedFiles($file, (string) $field, $files);
            if (count($files) >= 10) {
                break;
            }
        }

        foreach ($files as &$fileData) {
            $storedPath = data_get($responseData, 'path') ?? data_get($responseData, 'url');
            if (is_string($storedPath) && $storedPath !== '') {
                $pathOnly = parse_url($storedPath, PHP_URL_PATH);
                $fileData['stored_path'] = mb_substr(is_string($pathOnly) && $pathOnly !== '' ? $pathOnly : $storedPath, 0, 500);
            }
        }
        unset($fileData);

        return $files;
    }

    /** @param array<string, array<string, int|string|null>> $output */
    private function collectUploadedFiles(mixed $value, string $field, array &$output): void
    {
        if ($value instanceof UploadedFile) {
            $realPath = $value->getRealPath();
            $originalName = basename(str_replace('\\', '/', $value->getClientOriginalName()));
            $originalName = preg_replace('/[[:cntrl:]]/', '', $originalName) ?? '';
            $output[$field] = [
                'file_name' => mb_substr($originalName, 0, 180),
                'mime_type' => $value->getMimeType(),
                'size_bytes' => $value->getSize(),
                'sha256' => is_string($realPath) && is_file($realPath) ? hash_file('sha256', $realPath) ?: null : null,
            ];

            return;
        }

        if (! is_array($value)) {
            return;
        }

        foreach ($value as $key => $nested) {
            if (count($output) >= 10) {
                break;
            }
            $this->collectUploadedFiles($nested, $field.'.'.$key, $output);
        }
    }

    /** @param array<string, array<string, array<string, mixed>>> $before
     * @param  array<string, array<string, array<string, mixed>>>  $after
     * @return array{before: array<string, mixed>, after: array<string, mixed>}
     */
    private function batchChanges(array $before, array $after): array
    {
        $changedBefore = [];
        $changedAfter = [];
        foreach (array_unique([...array_keys($before), ...array_keys($after)]) as $group) {
            $changedRowsBefore = [];
            $changedRowsAfter = [];
            $beforeRows = $before[$group] ?? [];
            $afterRows = $after[$group] ?? [];
            foreach (array_unique([...array_keys($beforeRows), ...array_keys($afterRows)]) as $id) {
                $beforeFields = $beforeRows[$id] ?? [];
                $afterFields = $afterRows[$id] ?? [];
                $changedFields = array_values(array_filter(
                    array_unique([...array_keys($beforeFields), ...array_keys($afterFields)]),
                    fn (string $field): bool => ($beforeFields[$field] ?? null) !== ($afterFields[$field] ?? null),
                ));
                if ($changedFields === []) {
                    continue;
                }
                $mask = array_fill_keys($changedFields, true);
                $changedRowsBefore[$id] = $this->redact(array_intersect_key($beforeFields, $mask));
                $changedRowsAfter[$id] = $this->redact(array_intersect_key($afterFields, $mask));
            }
            if ($changedRowsBefore !== [] || $changedRowsAfter !== []) {
                $changedBefore[$group] = $changedRowsBefore;
                $changedAfter[$group] = $changedRowsAfter;
            }
        }

        return ['before' => $changedBefore, 'after' => $changedAfter];
    }

    private function redact(array $input): array
    {
        $output = [];
        foreach ($input as $key => $value) {
            if (preg_match('/password|token|secret|key|credential|raw_payload|authorization|cookie|bank_account|account_number/i', (string) $key)) {
                $output[$key] = '[hidden]';
            } elseif ($value instanceof UploadedFile) {
                $output[$key] = ['uploaded_file' => true, 'size_bytes' => $value->getSize()];
            } elseif (is_array($value)) {
                $limited = array_slice($value, 0, 100, true);
                $output[$key] = $this->redact($limited);
                if (count($value) > 100) {
                    $output[$key]['_truncated_items'] = count($value) - 100;
                }
            } elseif (is_scalar($value) || $value === null) {
                $output[$key] = is_string($value) ? mb_substr($value, 0, 500) : $value;
            } else {
                $output[$key] = '[unsupported value]';
            }
        }

        return $output;
    }
}
