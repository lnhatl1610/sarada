# Báo cáo triển khai planning Admin Sarada

Ngày cập nhật: 24/10/2026

## Phạm vi đã triển khai

- Khung quản trị gồm sidebar phân quyền theo cây menu, breadcrumb, tìm kiếm nhanh, tạo nhanh, thông báo, theme, menu tài khoản và các trang lỗi.
- Các màn hình quản trị catalog, sản phẩm, ảnh/biến thể/SEO, đơn hàng, thanh toán, vận chuyển, kho, khách hàng, đánh giá, khuyến mãi, banner, báo cáo, nhân sự và cài đặt.
- Endpoint Laravel tương ứng, kiểm tra quyền ở backend, request validation tiếng Việt, API Resource/OpenAPI, thao tác nhiều bước trong transaction và các luồng tồn kho/đơn hàng.
- Route tạo/sửa đồng bộ cả khi tải trực tiếp URL và khi điều hướng trong app; collection/coupon edit nạp bản ghi qua endpoint chi tiết có kiểm tra quyền đọc, còn route edit áp dụng đúng quyền cập nhật/quản lý.
- URL chi tiết chỉ chấp nhận ID số dương; ID bằng 0 và đường dẫn không hợp lệ hiển thị 404 thay vì trang chi tiết rỗng.
- Trang thanh toán ghi rõ VNPay/MoMo/Stripe mới có công tắc cấu hình, chưa xử lý giao dịch; khóa kết nối thuộc `.env`.
- Bộ lọc đơn hỗ trợ COD và giao dịch thất bại; thất bại được truy vấn từ `payments.status`, đếm theo từng đơn và hiển thị huy hiệu riêng, nên không làm sai trạng thái thu tiền ở `orders.payment_status`.
- Trạng thái tải/rỗng/lỗi/thử lại dùng component chia sẻ hoặc trạng thái riêng theo trang. Form hiển thị validation 422 cạnh trường; product edit hỗ trợ cả trường của biến thể và ảnh đang chờ lưu.
- Bổ sung migration tags theo lựa chọn đã được người dùng xác nhận; schema và kiểu API đã đồng bộ.
- Rà soát route: chỉ ba đường dẫn tài khoản được planning nêu mới mở trang cài đặt tài khoản; URL tài khoản không hợp lệ hiển thị 404.

## Các file và nhóm file chính

- Admin shell: `admin/src/App.tsx`, các stylesheet shell (`App.css`, `AdminShell.css`, `SidebarLayout.css`, `SidebarScrollbar.css`, `Login.css`) và các component dùng chung trong `admin/src/components/shared/` và `admin/src/components/ui/`.
- Admin feature modules: các file trong `admin/src/features/` cho `account`, `activity`, `campaigns`, `catalog-options`, `customers`, `dashboard`, `errors`, `inventory`, `notifications`, `operations`, `orders`, `preferences`, `products`, `reports`, `search`, `settings`, `shipping`, và `staff`.
- Laravel API: controller, Form Request, Resource, middleware và domain action trong `api/app/Http/`, `api/app/Modules/`, `api/app/Actions/`, cùng routes tại `api/app/Modules/*/Routes/api.php`.
- Schema/contract/tests: migration `api/database/migrations/2026_10_24_000003_create_tags_and_product_tag_tables.php`, `api/openapi.yaml`, các kiểu sinh tại `admin/src/types/api.d.ts`, và feature tests trong `api/tests/Feature/`.
- Bổ sung cho route audit: `api/app/Http/Resources/CampaignResource.php` và `api/tests/Feature/AdminCatalogEditDetailTest.php`.
- Tài liệu: `PLAN_AGENT_ADMIN_UI_FASHION_STORE.md`, `PROGRESS.md`, `docs/ui-ux/admin-app-shell.md`, các page specs dưới `docs/ui-ux/page-specs/`, cùng task/spec trong `specs/20-admin-sql-management/`.
- Workspace không có Git root, nên không có `git diff` đáng tin để phân biệt file mới với file sửa; các nhóm trên là phạm vi file chính theo module, không phải danh sách trạng thái Git.

## Cách chạy

Yêu cầu PHP/Composer, Node.js/npm và MySQL đang chạy local. Tạo/cập nhật các file môi trường từ `.env.example`, cài dependency từ root, sau đó chạy:

```powershell
npm install
npm run dev
```

Lệnh root khởi động API, admin và storefront bằng `concurrently`. Xem cổng và biến môi trường trong README/root `AGENTS.md` và từng app `.env.example`. Quy trình dùng MySQL local; Docker Compose không phải lệnh chạy hiện tại của workspace.

## Kiểm tra đã chạy

- API Feature suite: 53 tests, 469 assertions; chạy trên database MySQL tạm riêng và database đã được xóa sau đó.
- Admin lint: thành công, còn 2 cảnh báo React Compiler hiện hữu.
- Admin TypeScript/Vite production build: thành công, còn cảnh báo chunk JavaScript lớn hơn 500 kB.
- Admin hiện chưa có test runner route/component; frontend route changes được kiểm tra qua lint và TypeScript/Vite build.
- Sau lần kiểm tra route cuối, admin lint và TypeScript/Vite build tiếp tục thành công; lint còn 2 cảnh báo React Compiler hiện hữu.
- Kiểm tra đăng nhập: tài khoản admin mẫu đã cấu hình đang active và có vai trò admin; request từ `http://localhost:5174` tới API đang chạy đăng nhập thành công (HTTP 200), sau đó đăng xuất phiên kiểm tra ngay (HTTP 200). Không in thông tin đăng nhập ra output.
- Laravel Pint: thành công cho controller, request và test liên quan cập nhật product batch.

## Giả định và giới hạn

- Tuân thủ cấu trúc auth hiện có của repository (JWT access token trong bộ nhớ và refresh cookie), dù phần planning gọi tên Sanctum; không thay kiến trúc auth dùng chung của dự án.
- Tag table được thêm sau khi người dùng chọn cho phép migration. Migration đã được áp dụng cho database local.
- Planning yêu cầu xác nhận responsive tại 360px và dark mode. Phần nghiệm thu hình ảnh này đang để sau theo lựa chọn của người dùng; chưa đánh dấu hoàn tất.
- `activity_logs` đã có migration áp dụng từ phần triển khai trước, dù mục 10 của planning nêu không có bảng nhật ký hoạt động. Sidebar hiện không đưa nhật ký vào cây menu; migration/bảng hiện có được giữ nguyên để tránh xóa dữ liệu local.

## Kiểm kê file liên quan (3 ngày gần nhất)

Do workspace không có Git root, danh sách này lấy theo LastWriteTime của các nguồn code, test và tài liệu liên quan; đây là kiểm kê đường dẫn tham khảo, không chứng minh file nào được tạo mới hay sửa trong riêng lượt triển khai planning.

### admin/src
- `D:\projects\web\php\fashion-store\admin\src\AdminAccount.css`
- `D:\projects\web\php\fashion-store\admin\src\AdminOrders.css`
- `D:\projects\web\php\fashion-store\admin\src\AdminPreferences.css`
- `D:\projects\web\php\fashion-store\admin\src\AdminShell.css`
- `D:\projects\web\php\fashion-store\admin\src\App.css`
- `D:\projects\web\php\fashion-store\admin\src\App.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\admin-error-boundary.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\api-validation.ts`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\app-header.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\confirm-dialog.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\data-table.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\date-range-picker.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\filter-bar.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\form-field.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\image-uploader.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\money.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\page-header.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\permission-gate.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\stat-card.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\status-badge.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\shared\ui-states.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\avatar.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\badge.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\breadcrumb.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\button.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\collapsible.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\command.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\dialog.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\dropdown-menu.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\input.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\popover.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\separator.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\sheet.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\sidebar.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\skeleton.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\tooltip.tsx`
- `D:\projects\web\php\fashion-store\admin\src\components\ui\use-mobile.ts`
- `D:\projects\web\php\fashion-store\admin\src\DashboardWidgets.css`
- `D:\projects\web\php\fashion-store\admin\src\features\account\AccountSettingsPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\account\AdminAccountMenu.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\account\ChangePasswordDialog.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\account\PasswordRecoveryPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\account\SidebarUserProfile.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\activity\ActivityLogsPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\campaigns\CampaignPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\catalog-options\CollectionProductsPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\catalog-options\ReferenceDataPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\customers\CustomerExportButton.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\customers\CustomersPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\dashboard\use-admin-dashboard.ts`
- `D:\projects\web\php\fashion-store\admin\src\features\errors\AdminErrorPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\inventory\InventoryAdjustmentDialog.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\inventory\InventoryImportPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\notifications\NotificationBell.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\notifications\use-admin-alerts.ts`
- `D:\projects\web\php\fashion-store\admin\src\features\operations\OperationsPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\operations\ShipmentEditorDialog.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\orders\OrderActionDialog.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\orders\OrderDeliveryDialog.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\orders\OrderNoteEditor.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\orders\OrderPrintDocument.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\preferences\AdminPreferencesPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\products\ProductCreatePage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\products\ProductDetailsPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\products\ProductImagesPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\products\ProductSeoPreview.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\products\ProductStatusSwitch.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\products\ProductTagInput.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\products\RichTextField.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\reports\ReportsPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\search\GlobalSearch.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\settings\StoreSettingsPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\shipping\ShippingMethodsPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\staff\RolePermissionMatrix.tsx`
- `D:\projects\web\php\fashion-store\admin\src\features\staff\StaffPage.tsx`
- `D:\projects\web\php\fashion-store\admin\src\index.css`
- `D:\projects\web\php\fashion-store\admin\src\InventoryControls.css`
- `D:\projects\web\php\fashion-store\admin\src\lib\admin-api.ts`
- `D:\projects\web\php\fashion-store\admin\src\lib\date-format.ts`
- `D:\projects\web\php\fashion-store\admin\src\lib\media-url.ts`
- `D:\projects\web\php\fashion-store\admin\src\lib\use-list-url-state.ts`
- `D:\projects\web\php\fashion-store\admin\src\lib\utils.ts`
- `D:\projects\web\php\fashion-store\admin\src\Login.css`
- `D:\projects\web\php\fashion-store\admin\src\main.tsx`
- `D:\projects\web\php\fashion-store\admin\src\OrderManagement.css`
- `D:\projects\web\php\fashion-store\admin\src\ProductList.css`
- `D:\projects\web\php\fashion-store\admin\src\ReferenceData.css`
- `D:\projects\web\php\fashion-store\admin\src\Reports.css`
- `D:\projects\web\php\fashion-store\admin\src\SidebarLayout.css`
- `D:\projects\web\php\fashion-store\admin\src\SidebarScrollbar.css`
- `D:\projects\web\php\fashion-store\admin\src\types\api.d.ts`
### api/app
- `D:\projects\web\php\fashion-store\api\app\Actions\Catalog\SyncProductSalePrice.php`
- `D:\projects\web\php\fashion-store\api\app\Actions\Catalog\SyncProductTags.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\ActivityLogController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\CampaignController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\CatalogOptionController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Resources\CampaignResource.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\CustomerController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\DashboardController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\InventoryController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\OperationsController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\OrderController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\ProductController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\ProductDetailsController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\ReportController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\ReviewController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\ShippingMethodController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\StaffController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\StoreSettingsController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Admin\UploadController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Identity\AuthController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Storefront\AccountController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Storefront\CheckoutController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Controllers\Api\V1\Storefront\ReviewController.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Middleware\AuditAdminWrite.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Middleware\RequireAccountAudience.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Middleware\RequireAudience.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Middleware\ResetJwtTokenState.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\AdjustInventoryRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\AdminSearchRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\AttachCollectionProductsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\BulkModerateReviewsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\BulkProductActionRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\BulkUpdateOrderStatusRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ChangeAdminPasswordRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\CreateProductRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\DashboardDaysRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\DashboardSummaryRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ExportAdminCustomersRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ImportInventoryCsvRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListAdminCustomersRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListAdminOrdersRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListAdminProductsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListAdminReviewsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListCatalogOptionRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListInventoryMovementsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListInventoryRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListOperationsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ListStaffRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ModerateReviewRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\RefundOrderRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ReorderBannersRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ReorderCatalogOptionsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ReorderCollectionProductsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ReorderProductImagesRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\ReportRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\SaveCampaignRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\SaveCatalogOptionRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\SaveProductDetailsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\SaveProductImageRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\SaveProductVariantRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\SaveShippingMethodRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\SaveStaffRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\SaveStoreSettingsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateCustomerRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateOrderAddressRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateOrderNoteRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateOrderPaymentRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateOrderShipmentRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateOrderStatusRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateProductImageRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateProductRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UpdateRolePermissionsRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UploadAdminFileRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Admin\UploadProductImageRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Identity\ForgotPasswordRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Identity\LoginRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Identity\RegisterRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Identity\ResetPasswordRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Storefront\ChangeAccountEmailRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Storefront\ChangeAccountPasswordRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Storefront\DeleteAccountRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Storefront\StoreAddressRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Storefront\StoreReviewRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Storefront\UpdateAddressRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Storefront\UpdateProfileRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Requests\Api\V1\Storefront\UploadAccountAvatarRequest.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Resources\AccountResource.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Resources\AddressResource.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Resources\CatalogOptionResource.php`
- `D:\projects\web\php\fashion-store\api\app\Http\Resources\ReviewResource.php`
- `D:\projects\web\php\fashion-store\api\app\Models\Product.php`
- `D:\projects\web\php\fashion-store\api\app\Models\Tag.php`
- `D:\projects\web\php\fashion-store\api\app\Models\User.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\AdminAccess\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Cart\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Catalog\Actions\ManageCatalogOptionAction.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Catalog\Actions\ManageCollectionProductsAction.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Catalog\Actions\ReorderCatalogOptionsAction.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Catalog\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Identity\Actions\ChangeAdminPasswordAction.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Identity\Actions\IssueAccessTokenAction.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Identity\Actions\ResolveAccessTokenSessionAction.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Identity\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Inventory\Actions\AdjustInventoryAction.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Inventory\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Inventory\Services\InventoryService.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Orders\Actions\TransitionOrderAction.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Orders\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Promotions\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Reviews\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Modules\Shipping\Routes\api.php`
- `D:\projects\web\php\fashion-store\api\app\Notifications\PasswordResetNotification.php`
### api/routes
### api/database/migrations
- `D:\projects\web\php\fashion-store\api\database\migrations\2026_10_22_000001_create_activity_logs_table.php`
- `D:\projects\web\php\fashion-store\api\database\migrations\2026_10_22_000002_add_product_variant_editor_fields.php`
- `D:\projects\web\php\fashion-store\api\database\migrations\2026_10_22_012832_create_personal_access_tokens_table.php`
- `D:\projects\web\php\fashion-store\api\database\migrations\2026_10_24_000003_create_tags_and_product_tag_tables.php`
### api/tests/Feature
- `D:\projects\web\php\fashion-store\api\tests\Feature\AccountSettingsTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\AdminBannerReorderTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\AdminBrandingTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\AdminDashboardPermissionTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\AdminListFiltersTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\CatalogCategoryReorderTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\AdminCatalogEditDetailTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\CollectionProductManagementTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\CustomerReportTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\DashboardAlertsTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\JwtAuthenticationTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\PaymentOperationsSummaryTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\ProductDetailsBatchUpdateTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\ProductVisibilityStatusTest.php`
- `D:\projects\web\php\fashion-store\api\tests\Feature\StoreSettingsAuditTest.php`
### docs/ui-ux
- `D:\projects\web\php\fashion-store\docs\ui-ux\admin-app-shell.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\admin-settings.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\appearance-picker.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\component-guidelines.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\DESIGN.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\account.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\admin-dashboard.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\admin-inventory.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\admin-orders.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\admin-products.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\admin-reports.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\admin-store-operations.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\cart-checkout.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\catalog.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\product-detail.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\page-specs\storefront-home.md`
- `D:\projects\web\php\fashion-store\docs\ui-ux\PLAN_AGENT_ADMIN_UI_FASHION_STORE_IMPLEMENTATION_REPORT.md`
### specs/20-admin-sql-management
- `D:\projects\web\php\fashion-store\specs\20-admin-sql-management\spec.md`

## Follow-up: order detail planning audit (2026-10-24)

Plan section 5.11 is now backed by an explicit detail response schema and a feature-oriented admin panel. The detail endpoint includes customer identity, immutable product image/name/variant/SKU/price snapshots, payment provider/reference/status/time and sanitized payload, latest-first shipment data, and history actor names. The UI presents these fields, provides product/customer links only when the corresponding view permission exists, gates mutation controls by orders.update_status, and opens the existing shipment editor from order detail. Payment-state updates require an audit note and accept only unpaid or paid; refunds remain on the reason-required endpoint. The order print sheet now uses the newest shipment from the API's newest-first array.

Verification: API suite passed on a disposable MySQL database (55 tests, 489 assertions; temporary database dropped and absence verified); admin lint passed with two existing React Compiler warnings; admin production build passed with the existing large-chunk advisory; OpenAPI type generation and Pint passed. Responsive 360px and dark-mode visual acceptance remains deferred at the user's request.

### Internal-note privacy follow-up

A data-model audit showed orders.note is the customer's checkout note. The admin's internal-note action now appends a marked entry to existing order status history, preserving the checkout note. Admin detail strips the marker and labels the note with the staff actor/time; customer-owned and guest-track endpoints filter those entries. A regression test verifies both preservation and non-disclosure.

Final verification after this follow-up: API suite 56/56 tests and 499 assertions passed on a disposable MySQL database, which was dropped and verified absent. PHP Pint and OpenAPI type generation passed. Admin lint passed with two existing React Compiler warnings; production build passed with the existing bundle-size advisory. Responsive and dark-mode visual acceptance remains deferred at the user's request.
# Content pages follow-up — 2026-10-24

- Added admin page CRUD at `/pages` backed by `content.manage`, with search, server pagination, draft/published state, edit, delete confirmation, API validation feedback, and preview. Admin mutations use the existing `AuditAdminWrite` middleware.
- Added the public `GET /pages/{slug}` API and storefront page rendering. Only published pages are returned. Content is plain text and rendered with line breaks, so the admin preview and public page share safe rendering semantics.
- Updated OpenAPI, generated admin/storefront API types, the admin store-operations spec, and the storefront footer link for terms.
- The editor follows repository form conventions (React Hook Form + Zod, shared field validation, `DataTable`/`FilterBar`, and `ConfirmDialog`); 401 and customer/staff permission checks are covered.
- Added `VITE_STOREFRONT_URL` to `admin/.env.example` so production deployments can point the preview action at the deployed storefront.
- Banner status now reflects activation and schedule boundaries, with a minute refresh while the campaign screen is open.
- Verification after the banner follow-up: admin lint passes with two React Compiler warnings and the production build passes with the existing large-chunk advisory.

### Report fulfillment filter follow-up

- Revenue aggregates and product sales now include only paid orders whose status is `delivered` or `completed`, so paid orders that have not shipped do not inflate fulfilled revenue. Customer repeat/spending identity reports retain the paid-order basis specified by the operations spec.
- Added a regression test covering delivered, completed, and paid-but-pending orders. Full API suite passed (59 tests, 531 assertions) on a disposable MySQL database, dropped and verified absent; Pint passed.
- Verification: the full API suite passed (58 tests, 522 assertions) on a disposable MySQL database; the database was dropped and absence verified. Pint, OpenAPI type generation, admin lint/build, and storefront build passed. Storefront full lint reports 19 errors and 3 warnings in `App.tsx`; new page-fetch code does not add a lint diagnostic. Responsive and dark-mode visual review remains deferred by the user.

### Customer spending lifecycle follow-up — 2026-10-24

- Customer list, detail, and CSV spending totals now include orders in `delivered` and `completed` states, preserving purchases when the order moves from delivered to completed. Added Feature coverage for the three output paths and aligned the planning lifecycle/spec language.
- The current full API Feature suite passes (60 tests, 538 assertions) on a disposable MySQL database, which was removed after the run. Pint and PHP syntax checks pass for the changed PHP files. Admin lint and TypeScript/Vite production build pass; lint has two existing React Compiler warnings and Vite has the existing large-chunk advisory. Responsive and dark-mode visual acceptance remains deferred at the user's request.

### Dashboard latest orders follow-up — 2026-10-24

- Increased the recent-orders query from five to ten rows to meet planning section 5.1. The dashboard spec now records the ten-row expectation. Admin lint and TypeScript/Vite production build pass; existing React Compiler and bundle-size advisories remain.

### Dashboard revenue labeling follow-up — 2026-10-24

- Replaced COD-only wording on dashboard revenue and top-product widgets. The API counts paid orders in delivered/completed states regardless of method, while the chart's order-count series counts orders created during the period; the accessible summary now explains these separate meanings. Admin lint and TypeScript/Vite build pass with the existing advisories.

### Dashboard KPI comparison follow-up — 2026-10-24

- Added immediately preceding period averages, new customer counts, and cancellation/return rates to the dashboard summary API. The five planning KPIs now display relative percent changes; the cancellation/return KPI displays percentage-point change. OpenAPI and generated TypeScript declarations are aligned.
- Full API Feature suite passes (60 tests, 544 assertions) on a disposable MySQL database, which was removed. Pint and API type generation pass; admin lint/build pass with two existing React Compiler warnings and the large-chunk advisory.

### Dashboard KPI count follow-up — 2026-10-24

- Matched plan section 5.1's five KPI cards by removing the repeated low-stock count card; low-stock data stays in the dedicated alert panel. The card grid uses five columns on desktop, three on tablet, and two on mobile. Admin lint and TypeScript/Vite build pass with the existing advisories.
