<?php

declare(strict_types=1);

use App\Jobs\DemoNoopQueueJob;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

$apiDirectory = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'api';
require $apiDirectory.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR.'autoload.php';

$app = require $apiDirectory.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'app.php';
$app->make(Kernel::class)->bootstrap();

$expectedPermissions = [
    'products.view', 'products.create', 'products.update', 'products.delete',
    'orders.view', 'orders.update_status', 'orders.cancel',
    'inventory.view', 'inventory.adjust', 'coupons.view', 'coupons.manage',
    'customers.view', 'users.manage', 'staff.security', 'reports.view', 'reports.schedule',
    'content.manage', 'reviews.moderate', 'settings.manage', 'tasks.assign', 'system.health',
    'system.backup', 'api_tokens.manage',
];
$permissionIds = DB::table('permissions')->where('guard_name', 'api')->whereIn('name', $expectedPermissions)->pluck('id', 'name');
$superAdminRole = DB::table('roles')->where('name', 'super_admin')->where('guard_name', 'api')->first(['id']);
$superAdminPermissionCount = $superAdminRole === null ? 0 : DB::table('permission_role')
    ->where('role_id', $superAdminRole->id)
    ->whereIn('permission_id', $permissionIds->values())
    ->distinct()
    ->count('permission_id');

$activeVariantCount = (int) DB::table('product_variants as variant')
    ->join('products', 'products.id', '=', 'variant.product_id')
    ->where('variant.is_active', true)
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->count('variant.id');
$activeVariantsWithInventory = (int) DB::table('product_variants as variant')
    ->join('products', 'products.id', '=', 'variant.product_id')
    ->join('inventories', 'inventories.variant_id', '=', 'variant.id')
    ->where('variant.is_active', true)
    ->where('products.status', 'active')
    ->whereNull('products.deleted_at')
    ->count('variant.id');
$inventoryMovements = DB::table('inventory_movements')->count();
$catalogTagCount = DB::table('tags')->count();
$taggedActiveProductCount = DB::table('product_tag')
    ->join('products', 'products.id', '=', 'product_tag.product_id')
    ->where('products.status', 'active')->whereNull('products.deleted_at')
    ->distinct()->count('products.id');
$activeShippingMethods = DB::table('shipping_methods')->where('is_active', true)->count();
$demoAdjustmentBatch = DB::table('inventory_adjustment_batches')
    ->where('note', '[Demo] Kiểm kê đa biến thể: cộng 2 sản phẩm vào tồn cho mỗi SKU mẫu.')
    ->first(['id', 'code', 'reason_category']);
$demoAdjustmentMovementCount = $demoAdjustmentBatch === null ? 0 : DB::table('inventory_movements')
    ->where('reference_type', 'inventory_adjustment_batch')->where('reference_id', $demoAdjustmentBatch->id)
    ->where('type', 'adjust')->count();

$orders = DB::table('orders');
$ordersWithItems = (clone $orders)->whereExists(function ($query): void {
    $query->selectRaw('1')->from('order_items')->whereColumn('order_items.order_id', 'orders.id');
})->count();
$ordersWithPayments = (clone $orders)->whereExists(function ($query): void {
    $query->selectRaw('1')->from('payments')->whereColumn('payments.order_id', 'orders.id');
})->count();
$ordersWithStatusHistory = (clone $orders)->whereExists(function ($query): void {
    $query->selectRaw('1')->from('order_status_histories')->whereColumn('order_status_histories.order_id', 'orders.id');
})->count();
$deliveredOrdersWithShipment = (clone $orders)->whereIn('status', ['delivered', 'completed'])->whereExists(function ($query): void {
    $query->selectRaw('1')->from('shipments')->whereColumn('shipments.order_id', 'orders.id');
})->count();
$activityLogs = DB::table('activity_logs')->count();
$demoCouponOrder = DB::table('orders')
    ->where('idempotency_key', 'seed:storefront-customer-cod-order-v1')
    ->first(['id', 'coupon_id', 'discount_total']);
$demoCouponUsage = $demoCouponOrder === null || $demoCouponOrder->coupon_id === null ? null : DB::table('coupon_usages')
    ->where('order_id', $demoCouponOrder->id)
    ->where('coupon_id', $demoCouponOrder->coupon_id)
    ->first(['discount']);
$demoCouponDiscountAmount = $demoCouponOrder === null ? 0 : (int) $demoCouponOrder->discount_total;
$demoCouponDiscountMatches = $demoCouponOrder !== null && $demoCouponUsage !== null
    && $demoCouponDiscountAmount > 0
    && (int) $demoCouponUsage->discount === (int) $demoCouponOrder->discount_total;

$roles = ['super_admin', 'admin', 'staff', 'customer', 'sales_manager', 'warehouse_staff', 'customer_service', 'content_editor', 'accountant'];
$existingRoles = DB::table('roles')->where('guard_name', 'api')->whereIn('name', $roles)->pluck('name')->all();
$adminRoleNames = array_values(array_diff($roles, ['customer']));
$activeAdminLoginAccounts = DB::table('users')->join('role_user', 'role_user.user_id', '=', 'users.id')
    ->join('roles', 'roles.id', '=', 'role_user.role_id')->where('users.status', 'active')
    ->where('roles.guard_name', 'api')->whereIn('roles.name', $adminRoleNames)->distinct('users.id')->count('users.id');
$adminSeedEmail = strtolower(trim((string) config('store.admin_seed_email', '')));
$adminSeedPassword = (string) config('store.admin_seed_password', '');
$adminSeedConfigured = $adminSeedEmail !== '' || $adminSeedPassword !== '';
$adminSeedUser = $adminSeedEmail === '' ? null : DB::table('users')->where('email', $adminSeedEmail)->first(['id', 'status', 'password']);
$adminSeedIsSuperAdmin = $adminSeedUser !== null && DB::table('role_user')->join('roles', 'roles.id', '=', 'role_user.role_id')
    ->where('role_user.user_id', $adminSeedUser->id)->where('roles.guard_name', 'api')->where('roles.name', 'super_admin')->exists();
$adminSeedCredentialsReady = ! $adminSeedConfigured || ($adminSeedEmail !== '' && $adminSeedPassword !== ''
    && $adminSeedUser !== null && $adminSeedUser->status === 'active' && $adminSeedIsSuperAdmin
    && Hash::check($adminSeedPassword, (string) $adminSeedUser->password));
$orderCount = (int) $orders->count();
$workflowAdminId = DB::table('users')->join('role_user', 'role_user.user_id', '=', 'users.id')
    ->join('roles', 'roles.id', '=', 'role_user.role_id')->whereIn('roles.name', ['super_admin', 'admin'])
    ->orderBy('users.id')->value('users.id');
$workspaceTasks = $workflowAdminId === null ? 0 : DB::table('user_tasks')->where('user_id', $workflowAdminId)->whereIn('title', [
    '[Demo] Kiểm tra ảnh sản phẩm mới', '[Demo] Đối chiếu đơn hàng tuần này', '[Demo] Hoàn tất cập nhật danh mục',
])->count();
$notificationCount = $workflowAdminId === null ? 0 : DB::table('notifications')->where('id', 'd3a00000-0000-4000-8000-000000000001')->where('notifiable_id', $workflowAdminId)->count();
$inactiveSchedules = $workflowAdminId === null ? 0 : DB::table('report_schedules')->where('user_id', $workflowAdminId)->where('name', 'Lịch báo cáo doanh thu demo')->where('is_active', false)->count();
$demoImportJob = $workflowAdminId === null ? null : DB::table('import_jobs')->where('user_id', $workflowAdminId)->where('source_filename', 'inventory-demo-with-errors.csv')->where('status', 'completed_with_errors')->first(['failed_rows', 'error_rows']);
$demoImportErrors = $demoImportJob === null ? [] : (is_array($demoImportJob->error_rows) ? $demoImportJob->error_rows : json_decode((string) $demoImportJob->error_rows, true));
$demoImportErrors = is_array($demoImportErrors) ? $demoImportErrors : [];
$demoCustomerEmail = (string) config('store.demo_customer_email', 'demo.customer@example.test');
$demoCustomerId = DB::table('users')->where('email', $demoCustomerEmail)->value('id');
$customerNotes = $demoCustomerId === null || $workflowAdminId === null ? 0 : DB::table('customer_notes')->where('customer_id', $demoCustomerId)->where('created_by', $workflowAdminId)->where('content', 'Ghi chú demo: khách hàng thuộc tài khoản mẫu; không chứa dữ liệu liên hệ thật.')->count();
$demoStaffEmail = (string) config('store.demo_staff_email', 'demo.staff@example.test');
$demoStaff = DB::table('users')->where('email', $demoStaffEmail)->first(['id', 'status', 'email_verified_at', 'password']);
$demoStaffHasRole = $demoStaff !== null && DB::table('role_user')->join('roles', 'roles.id', '=', 'role_user.role_id')->where('role_user.user_id', $demoStaff->id)->where('roles.name', 'staff')->exists();
$demoStaffPassword = (string) config('store.demo_staff_password', '');
if ($demoStaffPassword === '') {
    $demoStaffPassword = 'StoreDemo123!';
}
$demoStaffLoginReady = $demoStaff !== null && $demoStaff->status === 'active' && $demoStaff->email_verified_at !== null
    && Hash::check($demoStaffPassword, (string) $demoStaff->password);

$demoFailedJob = DB::table((string) config('queue.failed.table', 'failed_jobs'))
    ->where('uuid', 'd3a00000-0000-4000-8000-000000000002')
    ->first(['queue', 'payload', 'exception']);
$demoFailedJobPayload = $demoFailedJob === null ? [] : json_decode((string) $demoFailedJob->payload, true);
$demoFailedJobPayload = is_array($demoFailedJobPayload) ? $demoFailedJobPayload : [];
$demoFailedJobIsSafe = $demoFailedJob !== null
    && ($demoFailedJobPayload['data']['commandName'] ?? null) === DemoNoopQueueJob::class
    && str_contains((string) $demoFailedJob->exception, '[Demo]');
$demoExport = DB::table('export_jobs')->where('user_id', $workflowAdminId)
    ->where('type', 'admin_report')->where('file_path', 'exports/demo/admin-inventory-report.csv')
    ->where('status', 'ready')->first(['file_path', 'file_size', 'expires_at']);
$demoExportFileExists = $demoExport !== null && Storage::disk('local')->exists((string) $demoExport->file_path);
$demoExportContents = $demoExportFileExists ? Storage::disk('local')->get((string) $demoExport->file_path) : '';
$demoReadyExport = $demoExport !== null && is_string($demoExportContents) && (int) $demoExport->file_size === strlen($demoExportContents)
    && $demoExport->expires_at !== null && strtotime((string) $demoExport->expires_at) > time()
    && str_contains($demoExportContents, 'DEMO-TSHIRT-001')
    && str_contains($demoExportContents, 'DEMO-PANTS-001');

$checks = [
    'All documented API roles are seeded' => count($existingRoles) === count($roles),
    'All documented API permissions are seeded' => $permissionIds->count() === count($expectedPermissions),
    'super_admin is assigned all documented permissions' => $superAdminRole !== null && $superAdminPermissionCount === count($expectedPermissions),
    'At least one active Admin account can access the Admin audience' => $activeAdminLoginAccounts > 0,
    'Configured ADMIN_SEED credentials match an active super_admin account' => $adminSeedCredentialsReady,
    'Every active published variant has an inventory row' => $activeVariantCount > 0 && $activeVariantsWithInventory === $activeVariantCount,
    'Inventory history contains at least one movement' => $inventoryMovements > 0,
    'Every demo order has at least one item' => $orderCount > 0 && $ordersWithItems === $orderCount,
    'Every demo order has a payment record' => $orderCount > 0 && $ordersWithPayments === $orderCount,
    'Every demo order has status history' => $orderCount > 0 && $ordersWithStatusHistory === $orderCount,
    'Delivered demo orders have shipment records' => $deliveredOrdersWithShipment > 0,
    'Seeded coupon usage records its non-zero order discount snapshot' => $demoCouponDiscountMatches,
    'Admin workspace has demo tasks' => $workspaceTasks === 3,
    'Admin workflows have a personal notice and inactive report schedule' => $notificationCount > 0 && $inactiveSchedules > 0,
    'Inventory import history has a completed-with-errors example for CSV error download' => $demoImportJob !== null && (int) $demoImportJob->failed_rows === count($demoImportErrors) && count($demoImportErrors) > 0,
    'Demo staff account is login-ready' => $demoStaffLoginReady && $demoStaffHasRole,
    'Admin tag APIs have reusable tags attached to active demo products' => $catalogTagCount >= 6 && $taggedActiveProductCount > 0,
    'Manual-order API has an active shipping method to select' => $activeShippingMethods > 0,
    'Inventory voucher APIs have a multi-SKU demo batch and ledger entries' => $demoAdjustmentBatch !== null && $demoAdjustmentBatch->reason_category === 'stocktake' && $demoAdjustmentMovementCount >= 2,
    'Failed-job APIs have one retry-safe local demo job' => $demoFailedJobIsSafe,
    'Downloads APIs have a ready demo CSV and matching private file' => $demoReadyExport,
];

$counts = [
    'api_roles' => count($existingRoles),
    'expected_api_roles' => count($roles),
    'api_permissions' => $permissionIds->count(),
    'expected_api_permissions' => count($expectedPermissions),
    'super_admin_permissions' => $superAdminPermissionCount,
    'active_admin_login_accounts' => $activeAdminLoginAccounts,
    'configured_admin_seed_credentials_ready' => $adminSeedConfigured ? ($adminSeedCredentialsReady ? 'yes' : 'no') : 'not configured',
    'active_published_variants' => $activeVariantCount,
    'active_variants_with_inventory' => $activeVariantsWithInventory,
    'inventory_movements' => $inventoryMovements,
    'catalog_tags' => $catalogTagCount,
    'active_products_with_tags' => $taggedActiveProductCount,
    'active_shipping_methods' => $activeShippingMethods,
    'demo_multi_sku_adjustment_vouchers' => $demoAdjustmentBatch === null ? 0 : 1,
    'demo_adjustment_ledger_rows' => $demoAdjustmentMovementCount,
    'orders' => $orderCount,
    'orders_with_items' => $ordersWithItems,
    'orders_with_payments' => $ordersWithPayments,
    'orders_with_status_history' => $ordersWithStatusHistory,
    'delivered_orders_with_shipments' => $deliveredOrdersWithShipment,
    'activity_logs' => $activityLogs,
    'seeded_coupon_discount_vnd' => $demoCouponDiscountAmount,
    'seeded_coupon_discount_matches_order' => $demoCouponDiscountMatches ? 1 : 0,
    'admin_workspace_demo_tasks' => $workspaceTasks,
    'admin_demo_notifications' => $notificationCount,
    'inactive_demo_report_schedules' => $inactiveSchedules,
    'demo_inventory_import_error_rows' => count($demoImportErrors),
    'login_ready_demo_staff_accounts' => $demoStaffLoginReady ? 1 : 0,
    'retry_safe_demo_failed_jobs' => $demoFailedJobIsSafe ? 1 : 0,
    'ready_demo_exports' => $demoReadyExport ? 1 : 0,
];

echo "Admin API demo data coverage (read-only):\n";
foreach ($counts as $name => $count) {
    echo "- {$name}: {$count}\n";
}

$failures = array_keys(array_filter($checks, static fn (bool $passed): bool => ! $passed));
echo '- failed coverage checks: '.count($failures)."\n";
foreach ($failures as $failure) {
    echo "  - {$failure}\n";
}

exit($failures === [] ? 0 : 1);
