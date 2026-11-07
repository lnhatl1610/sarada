import { adminApiFetch, configureAdminApiSession } from './lib/admin-api'
import { ADMIN_API_BASE_URL } from './lib/api-base'
import { formatDate, formatDateTime, formatNumber, formatVnd } from './lib/date-format'
import { useDebouncedValue } from './lib/use-debounced-value'
import { confirmUnsavedForms } from './lib/unsaved-forms'
import { enqueueAdminExportWhenLarge } from './lib/admin-exports'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { changeAdminLanguage } from './lib/i18n'
/* eslint-disable react-hooks/set-state-in-effect -- App synchronizes legacy URL, storage, and API state with the shell. */
import type { FormEvent } from 'react'
import { Activity, Boxes, CalendarClock, ChartNoAxesCombined, ChevronDown, Download, Eye, EyeOff, Heart, LayoutDashboard, LoaderCircle, Package, Plus, Send, Settings2, ShoppingBag, ShoppingCart, Star, Tags, Palette, Ruler, Layers3, CreditCard, Truck, History, Users, UserCog, BadgePercent, Image, ShieldCheck, MessageSquareText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { publishAdminToast } from './lib/admin-toast'
import { getStatusLabel } from './components/shared/status-badge'
import { publishAdminPageSize } from './components/shared/admin-page-size'
import { ConfirmDialog } from './components/shared/confirm-dialog'
import { FormField } from './components/shared/form-field'
import { AdminOtpInput } from './components/shared/AdminOtpInput'
import { PageHeader } from './components/shared/page-header'
import { AppHeader } from './components/shared/app-header'
import type { AdminPreferences } from './features/preferences/AdminPreferencesPage'
import { dashboardWidgetOptions, sidebarDestinationOptions, type DashboardWidgetId, type SidebarDestinationId } from './features/preferences/preferences-options'
import { defaultMenuLayout, menuGroupOptions, type MenuGroupId, type MenuLayout } from './features/preferences/menu-layout'
import { AdminIdleSessionGuard } from './features/account/AdminIdleSessionGuard'
import type { ReferenceKind } from './features/catalog-options/ReferenceDataPage'
import type { OperationsSection } from './features/operations/OperationsPage'
import type { CampaignKind } from './features/campaigns/CampaignPage'
import type { ReportSection } from './features/reports/ReportsPage'
import { AdminAuthLayout } from './features/auth/AdminAuthLayout'
import { AdminErrorBoundary } from './components/shared/admin-error-boundary'
import type { OrderDialogValues } from './features/orders/OrderActionDialog'
import { createApiResponseError } from './components/shared/api-validation'
import { mediaUrl } from './lib/media-url'
import { adminRoleLabels } from './features/staff/roles'
import { defaultAdminShortcuts, isKeyboardEditableTarget, matchesKeyboardShortcut, normalizeAdminShortcuts } from './lib/keyboard-shortcuts'
import { useAdminAlerts } from './features/notifications/use-admin-alerts'
import type { OrderDetail } from './features/orders/OrderDetailPanel'
import type { ReviewDetail } from './features/reviews/ReviewDialogs'
import type { Review } from './features/reviews/ReviewManagementTable'
import type { InventoryItem } from './features/inventory/InventoryTable'
import type { OrderRow as Order } from './features/orders/OrderManagementTable'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  useSidebar,
} from './components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover'
import './App.css'
import './SidebarLayout.css'
import './Login.css'
import './AdminOrders.css'
import './OrderManagement.css'
import './AdminAccount.css'
import './AdminShell.css'
import './SidebarScrollbar.css'
import './AdminHelp.css'
import './OnboardingTour.css'
import './IdleSession.css'

const OrderNoteEditor = lazy(() => import('./features/orders/OrderNoteEditor').then((module) => ({ default: module.OrderNoteEditor })))
const SessionReauthDialog = lazy(() => import('./features/account/SessionReauthDialog').then((module) => ({ default: module.SessionReauthDialog })))
const AdminLockScreen = lazy(() => import('./features/account/AdminLockScreen').then((module) => ({ default: module.AdminLockScreen })))
const PasswordRecoveryPage = lazy(() => import('./features/account/PasswordRecoveryPage').then((module) => ({ default: module.PasswordRecoveryPage })))
const AdminErrorPage = lazy(() => import('./features/errors/AdminErrorPage').then((module) => ({ default: module.AdminErrorPage })))
const AdminLockedPage = lazy(() => import('./features/auth/AdminLockedPage').then((module) => ({ default: module.AdminLockedPage })))
const OrderActionDialog = lazy(() => import('./features/orders/OrderActionDialog').then((module) => ({ default: module.OrderActionDialog })))
const OrderManagementTable = lazy(() => import('./features/orders/OrderManagementTable').then((module) => ({ default: module.OrderManagementTable })))
const OrderDeliveryDialog = lazy(() => import('./features/orders/OrderDeliveryDialog').then((module) => ({ default: module.OrderDeliveryDialog })))
const InventoryThresholdDialog = lazy(() => import('./features/inventory/InventoryThresholdDialog').then((module) => ({ default: module.InventoryThresholdDialog })))
const InventoryAdjustmentDialog = lazy(() => import('./features/inventory/InventoryAdjustmentDialog').then((module) => ({ default: module.InventoryAdjustmentDialog })))
const InventoryTable = lazy(() => import('./features/inventory/InventoryTable').then((module) => ({ default: module.InventoryTable })))
const OrderPrintDocument = lazy(() => import('./features/orders/OrderPrintDocument').then((module) => ({ default: module.OrderPrintDocument })))
const OrderDetailPanel = lazy(() => import('./features/orders/OrderDetailPanel').then((module) => ({ default: module.OrderDetailPanel })))
const ShipmentEditorDialog = lazy(() => import('./features/operations/ShipmentEditorDialog').then((module) => ({ default: module.ShipmentEditorDialog })))
const ReviewDetailDrawer = lazy(() => import('./features/reviews/ReviewDialogs').then((module) => ({ default: module.ReviewDetailDrawer })))
const ReviewModerationDialog = lazy(() => import('./features/reviews/ReviewDialogs').then((module) => ({ default: module.ReviewModerationDialog })))
const ReviewManagementTable = lazy(() => import('./features/reviews/ReviewManagementTable').then((module) => ({ default: module.ReviewManagementTable })))
const AdminProductQuestionsPage = lazy(() => import('./features/reviews/ProductQuestionsPage').then((module) => ({ default: module.ProductQuestionsPage })))
const AccountAreaLayout = lazy(() => import('./features/account/AccountAreaLayout').then((module) => ({ default: module.AccountAreaLayout })))
const AdvancedFilterSheet = lazy(() => import('./components/shared/advanced-filter-sheet').then((module) => ({ default: module.AdvancedFilterSheet })))
const FilterBar = lazy(() => import('./components/shared/filter-bar').then((module) => ({ default: module.FilterBar })))

const PersonalWorkspacePage = lazy(() => import('./features/account/PersonalWorkspacePage').then((module) => ({ default: module.PersonalWorkspacePage })))
const AdminPreferencesPage = lazy(() => import('./features/preferences/AdminPreferencesPage').then((module) => ({ default: module.AdminPreferencesPage })))
const ReferenceDataPage = lazy(() => import('./features/catalog-options/ReferenceDataPage').then((module) => ({ default: module.ReferenceDataPage })))
const OperationsPage = lazy(() => import('./features/operations/OperationsPage').then((module) => ({ default: module.OperationsPage })))
const CampaignPage = lazy(() => import('./features/campaigns/CampaignPage').then((module) => ({ default: module.CampaignPage })))
const PromotionNotificationsPage = lazy(() => import('./features/campaigns/PromotionNotificationsPage').then((module) => ({ default: module.PromotionNotificationsPage })))
const ContentPagesPage = lazy(() => import('./features/content/ContentPagesPage').then((module) => ({ default: module.ContentPagesPage })))
const BlogPostsPage = lazy(() => import('./features/content/BlogPostsPage').then((module) => ({ default: module.BlogPostsPage })))
const FaqsPage = lazy(() => import('./features/content/FaqsPage').then((module) => ({ default: module.FaqsPage })))
const StoreLocationsPage = lazy(() => import('./features/content/StoreLocationsPage').then((module) => ({ default: module.StoreLocationsPage })))
const CareerOpeningsPage = lazy(() => import('./features/content/CareerOpeningsPage').then((module) => ({ default: module.CareerOpeningsPage })))
const StoreSettingsPage = lazy(() => import('./features/settings/StoreSettingsPage').then((module) => ({ default: module.StoreSettingsPage })))
const ShippingMethodsPage = lazy(() => import('./features/shipping/ShippingMethodsPage').then((module) => ({ default: module.ShippingMethodsPage })))
const ReportsPage = lazy(() => import('./features/reports/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const ReportSchedulesPage = lazy(() => import('./features/reports/ReportSchedulesPage').then((module) => ({ default: module.ReportSchedulesPage })))
const DownloadsPage = lazy(() => import('./features/reports/DownloadsPage').then((module) => ({ default: module.DownloadsPage })))
const ActivityLogsPage = lazy(() => import('./features/activity/ActivityLogsPage').then((module) => ({ default: module.ActivityLogsPage })))
const StaffPage = lazy(() => import('./features/staff/StaffPage').then((module) => ({ default: module.StaffPage })))
const StaffInvitationPage = lazy(() => import('./features/staff/StaffInvitationPage').then((module) => ({ default: module.StaffInvitationPage })))
const CustomersPage = lazy(() => import('./features/customers/CustomersPage').then((module) => ({ default: module.CustomersPage })))
const ProductDetailsPage = lazy(() => import('./features/products/ProductDetailsPage').then((module) => ({ default: module.ProductDetailsPage })))
const ProductCreatePage = lazy(() => import('./features/products/ProductCreatePage').then((module) => ({ default: module.ProductCreatePage })))
const ProductImagesPage = lazy(() => import('./features/products/ProductImagesPage').then((module) => ({ default: module.ProductImagesPage })))
const CollectionProductsPage = lazy(() => import('./features/catalog-options/CollectionProductsPage').then((module) => ({ default: module.CollectionProductsPage })))
const TagsPage = lazy(() => import('./features/catalog-options/TagsPage').then((module) => ({ default: module.TagsPage })))
const RolePermissionMatrix = lazy(() => import('./features/staff/RolePermissionMatrix').then((module) => ({ default: module.RolePermissionMatrix })))
const InventoryImportPage = lazy(() => import('./features/inventory/InventoryImportPage').then((module) => ({ default: module.InventoryImportPage })))
const ImportHistoryPage = lazy(() => import('./features/inventory/ImportHistoryPage').then((module) => ({ default: module.ImportHistoryPage })))
const InventoryAdjustmentVoucherPage = lazy(() => import('./features/inventory/InventoryAdjustmentVoucherPage').then((module) => ({ default: module.InventoryAdjustmentVoucherPage })))
const InventoryMovementsPage = lazy(() => import('./features/inventory/InventoryMovementsPage').then((module) => ({ default: module.InventoryMovementsPage })))
const ManualOrderPage = lazy(() => import('./features/orders/ManualOrderPage').then((module) => ({ default: module.ManualOrderPage })))
const PersonalRemindersPage = lazy(() => import('./features/account/PersonalRemindersPage').then((module) => ({ default: module.PersonalRemindersPage })))
const PersonalPerformancePage = lazy(() => import('./features/account/PersonalPerformancePage').then((module) => ({ default: module.PersonalPerformancePage })))
const SystemHealthPage = lazy(() => import('./features/system/SystemHealthPage').then((module) => ({ default: module.SystemHealthPage })))
const SystemBackupsPage = lazy(() => import('./features/system/SystemBackupsPage').then((module) => ({ default: module.SystemBackupsPage })))
const AccountLoginHistoryPage = lazy(() => import('./features/account/AccountLoginHistoryPage').then((module) => ({ default: module.AccountLoginHistoryPage })))
const AccountPrivacyPage = lazy(() => import('./features/account/AccountPrivacyPage').then((module) => ({ default: module.AccountPrivacyPage })))
const AccountApiTokensPage = lazy(() => import('./features/account/AccountApiTokensPage').then((module) => ({ default: module.AccountApiTokensPage })))
const AccountHelpPage = lazy(() => import('./features/help/AccountHelpPage').then((module) => ({ default: module.AccountHelpPage })))
const HelpDiagnosticsPage = lazy(() => import('./features/help/HelpDiagnosticsPage').then((module) => ({ default: module.HelpDiagnosticsPage })))
const AccountSettingsPage = lazy(() => import('./features/account/AccountSettingsPage').then((module) => ({ default: module.AccountSettingsPage })))
const AccountNotificationsPage = lazy(() => import('./features/account/AccountNotificationsPage').then((module) => ({ default: module.AccountNotificationsPage })))
const NotificationCenterPage = lazy(() => import('./features/notifications/NotificationCenterPage').then((module) => ({ default: module.NotificationCenterPage })))
const AccountActivityPage = lazy(() => import('./features/account/AccountActivityPage').then((module) => ({ default: module.AccountActivityPage })))
const AccountOnboardingTour = lazy(() => import('./features/help/AccountOnboardingTour').then((module) => ({ default: module.AccountOnboardingTour })))
const ChangelogPage = lazy(() => import('./features/help/ChangelogPage').then((module) => ({ default: module.ChangelogPage })))
const LicensesPage = lazy(() => import('./features/help/LicensesPage').then((module) => ({ default: module.LicensesPage })))
const ProductListPanel = lazy(() => import('./features/products/ProductListPanel').then((module) => ({ default: module.ProductListPanel })))
const ProductAdvancedFilters = lazy(() => import('./features/products/ProductAdvancedFilters').then((module) => ({ default: module.ProductAdvancedFilters })))

const AdminDashboardPage = lazy(() => import('./features/dashboard/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })))


type Product = import('./features/products/product-list-types').ProductRow
type ProductFilterOption = { id: number; name: string; parent_name?: string | null }
type ShippingMethodOption = { id: number; name: string }
type ProvinceOption = { province_code: string; province_name: string }
type OrderActionState = { mode: 'cancel'; order: Order } | { mode: 'bulk-cancel'; orderIds: number[] } | { mode: 'status'; order: Order; status: string } | { mode: 'bulk-status'; orderIds: number[]; status: string } | { mode: 'address' | 'refund'; order: OrderDetail }
type InventoryCategory = { id: number; name: string; parent_name?: string | null }
type InventoryFilterOption = { id: number; name?: string; value?: string; group_name?: string }
const inventoryCategoryLabel = (category: InventoryCategory) => category.parent_name ? `${category.parent_name} / ${category.name}` : category.name
const latestRefundableAmount = (order: OrderDetail) => {
  const payment = order.payments.find((item) => ['paid', 'success'].includes(item.status) && Number(item.refundable_amount ?? item.amount) > 0)
  return Number(payment?.refundable_amount ?? payment?.amount ?? 0)
}
const inventoryMovementLabel = (type: string) => ({ import: 'Nhập kho', adjust: 'Điều chỉnh', reserve: 'Giữ cho đơn', release: 'Trả hàng giữ', sale: 'Xuất bán', return: 'Nhập lại hàng trả' }[type] ?? type)
const inventoryReferenceLabel = (type: string | null) => type ? ({ order: 'Đơn hàng', csv_import: 'Nhập CSV', manual_import: 'Nhập thủ công', manual_adjustment: 'Điều chỉnh thủ công', inventory_adjustment_batch: 'Phiếu điều chỉnh' }[type] ?? type) : '—'
type InventoryMovement = { id: number; type: string; quantity_change: number; note: string | null; created_at: string; sku: string; product_name: string; actor_name: string | null; reference_type: string | null; reference_id: number | null }
type ReviewModerationTarget = { reviewIds: number[]; status: 'approved' | 'rejected'; subject: string }
type PaginationMeta = { current_page: number; last_page: number; per_page: number; total: number }
type AdminUser = { id: number; name: string; email: string; avatar?: string | null; must_change_password?: boolean; timezone?: string | null }
type StoreBranding = { store_name?: string | null; store_logo?: string | null }
type ActiveFilterChip = { id: string; label: string; onRemove: () => void }

async function fetchAdminOrderDetail(apiUrl: string, accessToken: string, orderId: number): Promise<OrderDetail> {
  const response = await adminApiFetch(`${apiUrl}/admin/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  const body = await response.json().catch(() => ({})) as { data?: OrderDetail; message?: string }
  if (!response.ok || !body.data) throw new Error(body.message ?? 'Không thể tải chi tiết đơn hàng.')
  return body.data
}

const orderTransitions: Record<string, string[]> = { pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipping', 'cancelled'], shipping: ['delivered', 'delivery_failed'], delivery_failed: ['shipping', 'returned'], delivered: ['completed', 'returned'], completed: [], cancelled: [], returned: [] }
const API = ADMIN_API_BASE_URL
const fmt = (amount: number) => formatVnd(amount)

const adminPages = {
  dashboard: { title: 'Tổng quan', permission: 'orders.view' },
  products: { title: 'Sản phẩm', permission: 'products.view' },
  orders: { title: 'Đơn hàng', permission: 'orders.view' },
  manualOrder: { title: 'Tạo đơn thủ công', permission: 'orders.update_status' },
  inventory: { title: 'Kho hàng', permission: 'inventory.view' },
  reviews: { title: 'Đánh giá', permission: 'reviews.moderate' },
  productQuestions: { title: 'Hỏi đáp sản phẩm', permission: 'reviews.moderate' },
  categories: { title: 'Danh mục', permission: 'products.view' },
  brands: { title: 'Thương hiệu', permission: 'products.view' },
  colors: { title: 'Màu sắc', permission: 'products.view' },
  sizes: { title: 'Kích cỡ', permission: 'products.view' },
  collections: { title: 'Bộ sưu tập', permission: 'products.view' },
  tags: { title: 'Thẻ sản phẩm', permission: 'products.view' },
  payments: { title: 'Thanh toán', permission: 'orders.view' },
  shipments: { title: 'Vận đơn', permission: 'orders.view' },
  movements: { title: 'Lịch sử nhập/xuất', permission: 'inventory.view' },
  customers: { title: 'Khách hàng', permission: 'customers.view' },
  carts: { title: 'Giỏ hàng bị bỏ quên', permission: 'users.manage' },
  wishlist: { title: 'Sản phẩm yêu thích', permission: 'reports.view' },
  staff: { title: 'Nhân viên và phân quyền', permission: 'users.manage' },
  roles: { title: 'Vai trò và phân quyền', permission: 'users.manage' },
  acceptInvite: { title: 'Nhận lời mời', permission: 'public' },
  coupons: { title: 'Mã giảm giá', permission: 'coupons.view' },
  promotionNotifications: { title: 'Thông báo ưu đãi', permission: 'coupons.manage' },
  banners: { title: 'Banner', permission: 'content.manage' },
  contentPages: { title: 'Trang nội dung', permission: 'content.manage' },
  blogPosts: { title: 'Bài viết', permission: 'content.manage' },
  faqs: { title: 'Câu hỏi thường gặp', permission: 'content.manage' },
  storeLocations: { title: 'Cửa hàng', permission: 'content.manage' },
  careerOpenings: { title: 'Vị trí tuyển dụng', permission: 'content.manage' },
  settings: { title: 'Cài đặt cửa hàng', permission: 'settings.manage' },
  settingsPayments: { title: 'Cài đặt thanh toán', permission: 'settings.manage' },
  settingsSecurity: { title: 'Bảo mật và đăng ký', permission: 'settings.manage' },
  settingsEmail: { title: 'Email và thông báo', permission: 'settings.manage' },
  settingsSeo: { title: 'SEO', permission: 'settings.manage' },
  settingsMaintenance: { title: 'Bảo trì cửa hàng', permission: 'settings.manage' },
  shippingMethods: { title: 'Phương thức vận chuyển', permission: 'settings.manage' },
  reports: { title: 'Báo cáo', permission: 'reports.view' },
  reportRevenue: { title: 'Doanh thu', permission: 'reports.view' },
  reportOrders: { title: 'Đơn hàng', permission: 'reports.view' },
  reportProducts: { title: 'Sản phẩm', permission: 'reports.view' },
  reportCustomers: { title: 'Khách hàng', permission: 'reports.view' },
  reportInventory: { title: 'Tồn kho', permission: 'reports.view' },
  reportCoupons: { title: 'Khuyến mãi', permission: 'reports.view' },
  reportSchedules: { title: 'Lịch gửi báo cáo', permission: 'reports.schedule' },
  downloads: { title: 'Trung tâm tải xuống', permission: 'authenticated' },
  activityLogs: { title: 'Nhật ký hoạt động', permission: 'settings.manage' },
  productDetail: { title: 'Chi tiết sản phẩm', permission: 'products.view' },
  productImages: { title: 'Ảnh sản phẩm', permission: 'products.update' },
  collectionProducts: { title: 'Sản phẩm bộ sưu tập', permission: 'products.view' },
  forbidden: { title: 'Không có quyền', permission: 'public' },
  notFound: { title: 'Không tìm thấy', permission: 'public' },
  serverError: { title: 'Lỗi hệ thống', permission: 'public' },
  preferences: { title: 'Tùy chọn giao diện', permission: 'authenticated' },
  account: { title: 'Cài đặt tài khoản', permission: 'authenticated' },
  accountNotifications: { title: 'Thông báo của tôi', permission: 'authenticated' },
  notificationsCenter: { title: 'Trung tâm thông báo', permission: 'authenticated' },
  accountActivity: { title: 'Hoạt động của tôi', permission: 'authenticated' },
  accountLoginHistory: { title: 'Lịch sử đăng nhập', permission: 'authenticated' },
  accountPrivacy: { title: 'Quyền riêng tư & dữ liệu', permission: 'authenticated' },
  accountTokens: { title: 'Mã truy cập API cá nhân', permission: 'api_tokens.manage' },
  helpCenter: { title: 'Hướng dẫn sử dụng', permission: 'authenticated' },
  helpPolicy: { title: 'Điều khoản sử dụng', permission: 'authenticated' },
  helpPrivacy: { title: 'Quyền riêng tư', permission: 'authenticated' },
  helpDiagnostics: { title: 'Phiên bản & chẩn đoán', permission: 'authenticated' },
  helpTour: { title: 'Tour giới thiệu', permission: 'authenticated' },
  helpChangelog: { title: 'Có gì mới', permission: 'authenticated' },
  helpLicenses: { title: 'Giấy phép phần mềm', permission: 'authenticated' },
  personalTasks: { title: 'Việc cần làm', permission: 'authenticated' },
  personalReminders: { title: 'Nhắc việc', permission: 'authenticated' },
  personalPerformance: { title: 'Hiệu suất của tôi', permission: 'authenticated' },
  staffPerformance: { title: 'Hiệu suất nhân viên', permission: 'staff.view_performance' },
  systemHealth: { title: 'Trạng thái hệ thống', permission: 'system.health' },
  systemBackups: { title: 'Sao lưu hệ thống', permission: 'system.backup' },
  inventoryImport: { title: 'Nhập kho thủ công / CSV', permission: 'inventory.adjust' },
  imports: { title: 'Lịch sử nhập dữ liệu', permission: 'inventory.view' },
  inventoryAdjust: { title: 'Điều chỉnh tồn', permission: 'inventory.adjust' },
  inventoryAdjustmentBatch: { title: 'Chi tiết phiếu điều chỉnh', permission: 'inventory.view' },
  forgotPassword: { title: 'Quên mật khẩu', permission: 'public' },
  resetPassword: { title: 'Đặt lại mật khẩu', permission: 'public' },
} as const
type AdminPage = keyof typeof adminPages
const directPathMap: Record<string, AdminPage> = {
  '/products': 'products', '/products/create': 'products', '/categories': 'categories', '/brands': 'brands',
  '/colors': 'colors', '/sizes': 'sizes', '/attributes/colors': 'colors', '/attributes/sizes': 'sizes', '/tags': 'tags', '/collections': 'collections', '/collections/create': 'collections', '/reviews': 'reviews', '/product-questions': 'productQuestions',
  '/orders': 'orders', '/orders/create': 'manualOrder', '/shipments': 'shipments', '/payments': 'payments', '/inventory': 'inventory',
  '/inventory/movements': 'movements', '/inventory/import': 'inventoryImport', '/inventory/adjust': 'inventoryAdjust', '/imports': 'imports', '/customers': 'customers', '/carts': 'carts', '/wishlists': 'wishlist', '/coupons': 'coupons', '/coupons/create': 'coupons', '/banners': 'banners', '/campaign-notifications': 'promotionNotifications',
  '/staff': 'staff', '/roles': 'roles', '/activity-logs': 'activityLogs', '/reports': 'reportRevenue', '/reports/revenue': 'reportRevenue', '/reports/schedules': 'reportSchedules', '/downloads': 'downloads', '/reports/products': 'reportProducts', '/reports/customers': 'reportCustomers',
  '/reports/inventory': 'reportInventory', '/reports/orders': 'reportOrders', '/reports/coupons': 'reportCoupons', '/settings/general': 'settings', '/settings/store': 'settings', '/settings/shipping-methods': 'shippingMethods', '/settings/shipping': 'shippingMethods', '/settings/notifications': 'settingsEmail', '/settings/security': 'settingsSecurity',
  '/pages': 'contentPages',
  '/blog': 'blogPosts',
  '/faqs': 'faqs',
  '/stores': 'storeLocations',
  '/career-openings': 'careerOpenings',
  '/settings/payments': 'settingsPayments', '/settings/email': 'settingsEmail', '/settings/seo': 'settingsSeo', '/settings/maintenance': 'settingsMaintenance', '/settings/account': 'account', '/settings/account/security': 'account',
  '/settings/account/sessions': 'account', '/settings/account/privacy': 'accountPrivacy', '/settings/account/tokens': 'accountTokens', '/account/tokens': 'accountTokens', '/account': 'account', '/account/profile': 'account',
  '/account/security': 'account', '/account/sessions': 'account', '/account/notifications': 'accountNotifications', '/notifications': 'notificationsCenter',
  '/account/activity': 'accountActivity', '/account/appearance': 'preferences',
  '/account/login-history': 'accountLoginHistory',
  '/system/health': 'systemHealth', '/system/failed-jobs': 'systemHealth', '/system/backups': 'systemBackups', '/help': 'helpCenter', '/help/policy': 'helpPolicy', '/help/privacy': 'helpPrivacy', '/help/diagnostics': 'helpDiagnostics', '/help/tour': 'helpTour', '/help/changelog': 'helpChangelog', '/help/licenses': 'helpLicenses',
  '/me/tasks': 'personalTasks', '/me/reminders': 'personalReminders', '/me/performance': 'personalPerformance',
}
type NavItem = { page: AdminPage; label: string; permission: string; icon: LucideIcon; href?: string; key?: string; activePath?: string; filter?: { param: string; value: string } }
type NavGroup = { label: string; icon: LucideIcon; items: NavItem[] }
const adminNavGroups: NavGroup[] = [
  { label: 'Tổng quan', icon: LayoutDashboard, items: [{ page: 'dashboard', label: 'Bảng điều khiển', permission: 'orders.view', icon: LayoutDashboard, href: '/' }] },
  { label: 'Bán hàng', icon: ShoppingBag, items: [
    { page: 'orders', label: 'Tất cả đơn hàng', permission: 'orders.view', icon: ShoppingBag, href: '/orders' },
    { page: 'manualOrder', label: 'Tạo đơn thủ công', permission: 'orders.update_status', icon: Plus, href: '/orders/create', activePath: '/orders/create' },
    { page: 'orders', key: 'orders-pending', label: 'Chờ xác nhận', permission: 'orders.view', icon: ShoppingBag, href: '/orders?status=pending', filter: { param: 'status', value: 'pending' } },
    { page: 'orders', key: 'orders-processing', label: 'Đang xử lý', permission: 'orders.view', icon: ShoppingBag, href: '/orders?status=processing', filter: { param: 'status', value: 'processing' } },
    { page: 'orders', key: 'orders-shipping', label: 'Đang giao', permission: 'orders.view', icon: ShoppingBag, href: '/orders?status=shipping', filter: { param: 'status', value: 'shipping' } },
    { page: 'orders', key: 'orders-failed', label: 'Giao thất bại', permission: 'orders.view', icon: ShoppingBag, href: '/orders?status=delivery_failed', filter: { param: 'status', value: 'delivery_failed' } },
    { page: 'orders', key: 'orders-returned', label: 'Đơn trả hàng', permission: 'orders.view', icon: ShoppingBag, href: '/orders?status=returned', filter: { param: 'status', value: 'returned' } },
    { page: 'payments', label: 'Thanh toán', permission: 'orders.view', icon: CreditCard, href: '/payments' },
    { page: 'shipments', label: 'Vận đơn', permission: 'orders.view', icon: Truck, href: '/shipments' },
  ] },
  { label: 'Sản phẩm', icon: Package, items: [
    { page: 'products', label: 'Tất cả sản phẩm', permission: 'products.view', icon: Package, href: '/products' },
    { page: 'products', key: 'products-create', label: 'Thêm sản phẩm', permission: 'products.create', icon: Plus, href: '/products/create', activePath: '/products/create' },
    { page: 'categories', label: 'Danh mục', permission: 'products.view', icon: Tags, href: '/categories' },
    { page: 'brands', label: 'Thương hiệu', permission: 'products.view', icon: Star, href: '/brands' },
    { page: 'colors', label: 'Màu sắc', permission: 'products.view', icon: Palette, href: '/attributes/colors', activePath: '/attributes/colors' },
    { page: 'sizes', label: 'Kích cỡ', permission: 'products.view', icon: Ruler, href: '/attributes/sizes', activePath: '/attributes/sizes' },
    { page: 'tags', label: 'Thẻ sản phẩm', permission: 'products.view', icon: Tags, href: '/tags' },
    { page: 'collections', label: 'Bộ sưu tập', permission: 'products.view', icon: Layers3, href: '/collections' },
  ] },
  { label: 'Kho hàng', icon: Boxes, items: [
    { page: 'inventory', label: 'Tồn kho', permission: 'inventory.view', icon: Boxes, href: '/inventory' },
    { page: 'inventory', key: 'inventory-low-stock', label: 'Sắp hết hàng', permission: 'inventory.view', icon: Boxes, href: '/inventory?stock=low', filter: { param: 'stock', value: 'low' } },
    { page: 'inventoryImport', label: 'Nhập kho thủ công / CSV', permission: 'inventory.adjust', icon: Package, href: '/inventory/import' },
    { page: 'imports', label: 'Lịch sử nhập dữ liệu', permission: 'inventory.view', icon: History, href: '/imports' },
    { page: 'inventoryAdjust', label: 'Phiếu điều chỉnh tồn', permission: 'inventory.adjust', icon: Plus, href: '/inventory/adjust' },
    { page: 'movements', label: 'Lịch sử nhập/xuất', permission: 'inventory.view', icon: History, href: '/inventory/movements' },
  ] },
  { label: 'Khách hàng', icon: Users, items: [
    { page: 'customers', label: 'Danh sách khách hàng', permission: 'customers.view', icon: Users, href: '/customers' },
    { page: 'reviews', label: 'Đánh giá sản phẩm', permission: 'reviews.moderate', icon: Star, href: '/reviews' },
    { page: 'productQuestions', label: 'Hỏi đáp sản phẩm', permission: 'reviews.moderate', icon: MessageSquareText, href: '/product-questions' },
    { page: 'carts', label: 'Giỏ hàng bỏ quên', permission: 'users.manage', icon: ShoppingCart, href: '/carts' },
    { page: 'wishlist', label: 'Sản phẩm yêu thích', permission: 'reports.view', icon: Heart, href: '/wishlists' },
  ] },
  { label: 'Marketing', icon: BadgePercent, items: [
    { page: 'coupons', label: 'Mã giảm giá', permission: 'coupons.view', icon: BadgePercent, href: '/coupons' },
    { page: 'promotionNotifications', label: 'Thông báo ưu đãi', permission: 'coupons.manage', icon: Send, href: '/campaign-notifications' },
    { page: 'banners', label: 'Banner', permission: 'content.manage', icon: Image, href: '/banners' },
  ] },
  { label: 'Nội dung', icon: Image, items: [
    { page: 'contentPages', label: 'Trang nội dung', permission: 'content.manage', icon: Image, href: '/pages' },
    { page: 'blogPosts', label: 'Bài viết', permission: 'content.manage', icon: Image, href: '/blog' },
    { page: 'faqs', label: 'Câu hỏi thường gặp', permission: 'content.manage', icon: MessageSquareText, href: '/faqs' },
    { page: 'storeLocations', label: 'Cửa hàng', permission: 'content.manage', icon: Image, href: '/stores' },
    { page: 'careerOpenings', label: 'Vị trí tuyển dụng', permission: 'content.manage', icon: Image, href: '/career-openings' },
  ] },
  { label: 'Báo cáo', icon: ChartNoAxesCombined, items: [
    { page: 'reportRevenue', label: 'Doanh thu', permission: 'reports.view', icon: ChartNoAxesCombined, href: '/reports/revenue' },
    { page: 'reportOrders', label: 'Đơn hàng', permission: 'reports.view', icon: ShoppingBag, href: '/reports/orders' },
    { page: 'reportProducts', label: 'Sản phẩm', permission: 'reports.view', icon: Package, href: '/reports/products' },
    { page: 'reportCustomers', label: 'Khách hàng', permission: 'reports.view', icon: Users, href: '/reports/customers' },
    { page: 'reportInventory', label: 'Tồn kho', permission: 'reports.view', icon: Boxes, href: '/reports/inventory' },
    { page: 'reportCoupons', label: 'Khuyến mãi', permission: 'reports.view', icon: BadgePercent, href: '/reports/coupons' },
    { page: 'reportSchedules', label: 'Lịch gửi báo cáo', permission: 'reports.schedule', icon: CalendarClock, href: '/reports/schedules' },
    { page: 'downloads', label: 'Trung tâm tải xuống', permission: 'authenticated', icon: Download, href: '/downloads' },
  ] },
  { label: 'Hệ thống', icon: UserCog, items: [
    { page: 'staff', label: 'Nhân viên', permission: 'users.manage', icon: UserCog, href: '/staff' },
    { page: 'roles', label: 'Vai trò và phân quyền', permission: 'users.manage', icon: ShieldCheck, href: '/roles' },
    { page: 'activityLogs', label: 'Nhật ký hoạt động', permission: 'settings.manage', icon: History, href: '/activity-logs' },
    { page: 'systemHealth', label: 'Trạng thái hệ thống', permission: 'system.health', icon: Activity, href: '/system/health' },
    { page: 'systemHealth', key: 'failedJobs', label: 'Hàng đợi lỗi', permission: 'system.health', icon: Activity, href: '/system/failed-jobs' },
    { page: 'systemBackups', label: 'Sao lưu hệ thống', permission: 'system.backup', icon: Activity, href: '/system/backups' },
  ] },
  { label: 'Cài đặt', icon: Settings2, items: [
    { page: 'settings', label: 'Thông tin cửa hàng', permission: 'settings.manage', icon: Settings2, href: '/settings/store', activePath: '/settings/store' },
    { page: 'settingsPayments', label: 'Thanh toán', permission: 'settings.manage', icon: CreditCard, href: '/settings/payments', activePath: '/settings/payments' },
    { page: 'settingsSecurity', label: 'Bảo mật và đăng ký', permission: 'settings.manage', icon: ShieldCheck, href: '/settings/security', activePath: '/settings/security' },
    { page: 'settingsEmail', label: 'Email và thông báo', permission: 'settings.manage', icon: ShoppingBag, href: '/settings/notifications', activePath: '/settings/notifications' },
    { page: 'settingsSeo', label: 'SEO', permission: 'settings.manage', icon: Eye, href: '/settings/seo', activePath: '/settings/seo' },
    { page: 'settingsMaintenance', label: 'Bảo trì cửa hàng', permission: 'settings.manage', icon: Settings2, href: '/settings/maintenance', activePath: '/settings/maintenance' },
    { page: 'shippingMethods', label: 'Vận chuyển', permission: 'settings.manage', icon: Truck, href: '/settings/shipping', activePath: '/settings/shipping' },
  ] },
]
const orderStatusTabs = [
  ['', 'Tất cả'], ['pending', 'Chờ xác nhận'], ['confirmed', 'Đã xác nhận'], ['processing', 'Đang xử lý'],
  ['shipping', 'Đang giao'], ['delivered', 'Đã giao'], ['delivery_failed', 'Giao thất bại'],
  ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy'], ['returned', 'Trả hàng'],
] as const
const visibleAdminNavGroups: NavGroup[] = adminNavGroups
const pageTitles: Record<string, string> = Object.fromEntries(Object.entries(adminPages).map(([key, value]) => [key, value.title]))
const reportSections: Partial<Record<AdminPage, ReportSection>> = { reports: 'revenue', reportRevenue: 'revenue', reportOrders: 'orders', reportProducts: 'products', reportCustomers: 'customers', reportInventory: 'inventory', reportCoupons: 'coupons' }
const referenceKinds: ReferenceKind[] = ['categories', 'brands', 'colors', 'sizes', 'collections']
const operationsSections: OperationsSection[] = ['payments', 'shipments', 'carts', 'wishlist']
const campaignKinds: CampaignKind[] = ['coupons', 'banners']
const defaultAdminPreferences: AdminPreferences = { locale: 'vi', theme: 'light', accent: 'burgundy', fontSize: 16, zoom: 100, showBreadcrumbs: true, highContrast: false, strongFocus: false, dateFormat: 'dmy', timeFormat: '24h', numberLocale: 'vi-VN', currencyPosition: 'suffix', weekStart: 1, dashboardDefaultPeriod: '30', dashboardComparePrevious: true, rememberCollapsedGroups: false, pinnedPages: [], dashboardWidgets: dashboardWidgetOptions.map((option) => option.id), defaultLandingPage: 'dashboard', tableDensity: 'comfortable', tableColumnDefaults: {}, reduceMotion: false, pageSize: 20, sidebarCollapsed: false, menuLayout: defaultMenuLayout, shortcuts: defaultAdminShortcuts, shortcutsEnabled: true }
const themeLightDefaultMigrationKey = 'fashion-admin-theme-light-default-v3'
const normalizeMenuLayout = (value: unknown): MenuLayout => {
  const raw = value && typeof value === 'object' ? value as { hidden?: unknown; order?: unknown } : {}
  const valid = new Set<MenuGroupId>(menuGroupOptions.map((group) => group.id))
  const order = Array.isArray(raw.order) ? raw.order.filter((id): id is MenuGroupId => typeof id === 'string' && valid.has(id as MenuGroupId)) : []
  const uniqueOrder = [...new Set(order)]
  for (const group of menuGroupOptions) if (!uniqueOrder.includes(group.id)) uniqueOrder.push(group.id)
  const hidden = Array.isArray(raw.hidden) ? [...new Set(raw.hidden.filter((id): id is MenuGroupId => typeof id === 'string' && valid.has(id as MenuGroupId)))] : []
  return { hidden, order: uniqueOrder }
}

function routeGuardKey(pathname = location.pathname, search = location.search) {
  const params = new URLSearchParams(search)
  return [pathname, params.get('page') ?? '', params.get('create') ?? '', params.get('order') ?? '', params.get('customer') ?? ''].join('|')
}

function AdminSidebarNavLink({ item, href, active, collapsed, count, sub = false, onNavigate }: {
  item: NavItem
  href: string
  active: boolean
  collapsed: boolean
  count?: number
  sub?: boolean
  onNavigate: (href: string) => void
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const { t } = useTranslation()
  const label = t(item.label)
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onNavigate(href)
    if (isMobile) setOpenMobile(false)
  }
  const link = <a href={href} onClick={handleClick} aria-label={count ? `${label}, ${count} cảnh báo` : label} aria-current={active ? 'page' : undefined} data-tour-href={href}>
    <item.icon size={17} aria-hidden="true" />
    <span>{label}</span>
    {count ? <b className="nav-count">{count}</b> : null}
  </a>

  if (sub) return <SidebarMenuSubItem><SidebarMenuSubButton asChild isActive={active}>
    {link}
  </SidebarMenuSubButton></SidebarMenuSubItem>

  return <SidebarMenuItem><SidebarMenuButton asChild isActive={active} tooltip={collapsed ? label : undefined} className="sidebar-link">
    {link}
  </SidebarMenuButton></SidebarMenuItem>
}

function safeAdminReturnTo(value: string | null, fallback = '/?page=dashboard'): string {
  if (!value) return fallback
  try {
    const target = new URL(value, window.location.origin)
    const queryPage = target.pathname === '/' ? target.searchParams.get('page') : null
    if (target.origin !== window.location.origin || target.pathname === '/login' || (target.pathname === '/' && queryPage === 'login') || target.pathname === '/forgot-password' || target.pathname.startsWith('/reset-password/')) return fallback
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return fallback
  }
}

function App() {
  const { t, i18n } = useTranslation()
  const routeGuardKeyRef = useRef(routeGuardKey())
  const routeHrefRef = useRef(`${location.pathname}${location.search}${location.hash}`)
  const queryClient = useQueryClient()
  const [accessToken, setAccessToken] = useState('')
  const pathInviteToken = location.pathname.match(/^\/accept-invite\/([^/]+)$/)?.[1]
  const pathProductId = location.pathname.match(/^\/products\/([1-9]\d*)\/edit$/)?.[1]
  const pathProductImagesId = location.pathname.match(/^\/products\/([1-9]\d*)\/images$/)?.[1]
  const pathInventoryAdjustmentBatchId = location.pathname.match(/^\/inventory\/adjustments\/([1-9]\d*)$/)?.[1]
  const pathOrderId = location.pathname.match(/^\/orders\/([1-9]\d*)$/)?.[1]
  const pathCustomerId = location.pathname.match(/^\/customers\/([1-9]\d*)$/)?.[1]
  const pathCollectionId = location.pathname.match(/^\/collections\/([1-9]\d*)\/edit$/)?.[1]
  const pathCollectionProductsId = location.pathname.match(/^\/collections\/([1-9]\d*)\/products$/)?.[1]
  const pathCouponId = location.pathname.match(/^\/coupons\/([1-9]\d*)\/edit$/)?.[1]
  const pathStaffPerformanceId = location.pathname.match(/^\/staff\/([1-9]\d*)\/performance$/)?.[1]
  const queryPage = new URLSearchParams(location.search).get('page')
  const page: string = pathInviteToken ? 'acceptInvite' : pathProductId ? 'productDetail' : pathProductImagesId ? 'productImages' : pathInventoryAdjustmentBatchId ? 'inventoryAdjustmentBatch' : pathOrderId ? 'orders' : pathCustomerId ? 'customers' : pathCollectionProductsId ? 'collectionProducts' : pathCollectionId ? 'collections' : pathCouponId ? 'coupons' : pathStaffPerformanceId ? 'staffPerformance' : location.pathname === '/login' ? 'login' : directPathMap[location.pathname] ?? (location.pathname === '/' ? queryPage ?? 'dashboard' : '__not_found__')
  const currentPage = Object.hasOwn(adminPages, page) ? page as AdminPage : null
  const [dashboardVisited, setDashboardVisited] = useState(() => page === 'dashboard')
  const recoveryPath = location.pathname === '/forgot-password' ? 'request' : location.pathname === '/forgot-password/sent' ? 'sent' : location.pathname === '/reset-password/done' ? 'done' : location.pathname.startsWith('/reset-password/') ? 'reset' : null
  const recoveryToken = recoveryPath === 'reset' ? decodeURIComponent(location.pathname.replace('/reset-password/', '')) : undefined
  const errorCode = location.pathname === '/403' ? 403 : location.pathname === '/404' ? 404 : location.pathname === '/500' ? 500 : null
  const requestedReturnTo = new URLSearchParams(location.search).get('returnTo')
  const currentRouteForLogin = page !== 'login' && !recoveryPath ? `${location.pathname}${location.search}${location.hash}` : null
  const loginReturnTo = safeAdminReturnTo(requestedReturnTo ?? currentRouteForLogin, '/')
  const [adminPreferences, setAdminPreferences] = useState<AdminPreferences>(() => {
    try {
      const rawPreferences = localStorage.getItem('fashion-admin-preferences')
      const saved = rawPreferences ? JSON.parse(rawPreferences) as Partial<AdminPreferences> : {}
      const legacyTheme = localStorage.getItem('fashion-admin-theme')
      const storedTheme = saved.theme === 'light' || saved.theme === 'dark' || saved.theme === 'system' ? saved.theme : legacyTheme === 'light' || legacyTheme === 'dark' ? legacyTheme : null
      let themeMigration = localStorage.getItem(themeLightDefaultMigrationKey)
      if (themeMigration === null) {
        themeMigration = 'pending'
        localStorage.setItem(themeLightDefaultMigrationKey, themeMigration)
      }
      return {
        locale: saved.locale === 'en' ? 'en' : 'vi',
        theme: themeMigration === 'pending' ? 'light' : storedTheme ?? 'light',
        accent: ['burgundy', 'blue', 'emerald', 'violet', 'teal', 'amber'].includes(saved.accent ?? '') ? saved.accent! : 'burgundy',
        fontSize: [14, 16, 18].includes(Number(saved.fontSize)) ? Number(saved.fontSize) as AdminPreferences['fontSize'] : 16,
        zoom: [90, 100, 110, 125].includes(Number(saved.zoom)) ? Number(saved.zoom) as AdminPreferences['zoom'] : 100,
        showBreadcrumbs: saved.showBreadcrumbs !== false,
        highContrast: saved.highContrast === true,
        strongFocus: saved.strongFocus === true,
        dateFormat: saved.dateFormat === 'ymd' || saved.dateFormat === 'relative' ? saved.dateFormat : 'dmy',
        timeFormat: saved.timeFormat === '12h' ? '12h' : '24h',
        numberLocale: saved.numberLocale === 'en-US' ? 'en-US' : 'vi-VN',
        currencyPosition: saved.currencyPosition === 'prefix' ? 'prefix' : 'suffix',
        weekStart: Number(saved.weekStart) === 7 ? 7 : 1,
        dashboardDefaultPeriod: saved.dashboardDefaultPeriod === '7' || saved.dashboardDefaultPeriod === '90' ? saved.dashboardDefaultPeriod : '30',
        dashboardComparePrevious: saved.dashboardComparePrevious !== false,
        rememberCollapsedGroups: saved.rememberCollapsedGroups === true,
        pinnedPages: Array.isArray(saved.pinnedPages) ? [...new Set(saved.pinnedPages.filter((id): id is SidebarDestinationId => sidebarDestinationOptions.some((option) => option.id === id)))] .slice(0, 8) : [],
        dashboardWidgets: Array.isArray(saved.dashboardWidgets) ? [...new Set(saved.dashboardWidgets.filter((id): id is DashboardWidgetId => dashboardWidgetOptions.some((option) => option.id === id)))] : defaultAdminPreferences.dashboardWidgets,
        defaultLandingPage: sidebarDestinationOptions.some((option) => option.id === saved.defaultLandingPage) ? saved.defaultLandingPage! : 'dashboard',
        tableDensity: saved.tableDensity === 'compact' || saved.tableDensity === 'comfortable' ? saved.tableDensity : 'comfortable',
        tableColumnDefaults: saved.tableColumnDefaults && typeof saved.tableColumnDefaults === 'object' && !Array.isArray(saved.tableColumnDefaults) ? Object.fromEntries(Object.entries(saved.tableColumnDefaults).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every((id) => typeof id === 'string'))) : {},
        reduceMotion: saved.reduceMotion === true,
        pageSize: [10, 20, 50, 100].includes(Number(saved.pageSize)) ? Number(saved.pageSize) as AdminPreferences['pageSize'] : 20,
        sidebarCollapsed: false,
        menuLayout: normalizeMenuLayout(saved.menuLayout),
        shortcuts: normalizeAdminShortcuts(saved.shortcuts),
        shortcutsEnabled: saved.shortcutsEnabled !== false,
      }
    } catch { return defaultAdminPreferences }
  })
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const adminTheme = adminPreferences.theme === 'system' ? systemTheme : adminPreferences.theme
  useEffect(() => {
    let active = true
    void changeAdminLanguage(adminPreferences.locale).then((locale) => {
      if (active) document.documentElement.lang = locale
    })
    return () => { active = false }
  }, [adminPreferences.locale, i18n])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const previousFocusMode = useRef(false)
  const [collapsedNavGroups, setCollapsedNavGroups] = useState<string[]>(() => adminNavGroups.map((group) => group.label))
  const [hoveredSidebarNavGroup, setHoveredSidebarNavGroup] = useState<string | null>(null)
  const sidebarNavPopoverCloseTimer = useRef<number | null>(null)
  useEffect(() => () => {
    if (sidebarNavPopoverCloseTimer.current !== null) window.clearTimeout(sidebarNavPopoverCloseTimer.current)
  }, [])
  const [routeVersion, setRouteVersion] = useState(0)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [appearanceReadyUserId, setAppearanceReadyUserId] = useState<number | null>(null)
  const defaultLandingRedirectedForUser = useRef<number | null>(null)
  const updateCollapsedNavGroups = useCallback((updater: (current: string[]) => string[]) => setCollapsedNavGroups((current) => {
    const next = updater(current)
    if (adminPreferences.rememberCollapsedGroups && adminUser?.id) localStorage.setItem(`fashion-admin-collapsed-groups:${adminUser.id}`, JSON.stringify(next))
    return next
  }), [adminPreferences.rememberCollapsedGroups, adminUser])
  useEffect(() => {
    if (!adminUser?.id || !adminPreferences.rememberCollapsedGroups) return
    try {
      const saved = localStorage.getItem(`fashion-admin-collapsed-groups:${adminUser.id}`)
      if (!saved) { setCollapsedNavGroups([]); return }
      const groups = JSON.parse(saved) as unknown
      if (Array.isArray(groups)) setCollapsedNavGroups(groups.filter((label): label is string => typeof label === 'string' && adminNavGroups.some((group) => group.label === label)))
    } catch { setCollapsedNavGroups([]) }
  }, [adminUser?.id, adminPreferences.rememberCollapsedGroups])
  const appearanceLoadedForUser = useRef<number | null>(null)
  const [storeBranding, setStoreBranding] = useState<StoreBranding>({ store_name: 'Sarada', store_logo: '' })
  const [adminRoles, setAdminRoles] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productStatusCounts, setProductStatusCounts] = useState<Record<string, number> | null>(null)
  const [productViewMode, setProductViewMode] = useState<'table' | 'grid'>('table')
  const [productStatusUpdatingIds, setProductStatusUpdatingIds] = useState<number[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([])
  const [selectedReviewIds, setSelectedReviewIds] = useState<number[]>([])
  const [reviewDetail, setReviewDetail] = useState<ReviewDetail | null>(null)
  const [reviewModerationTarget, setReviewModerationTarget] = useState<ReviewModerationTarget | null>(null)
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null)
  const [productsLoading, setProductsLoading] = useState(false)
  const [listPage, setListPage] = useState(() => Number(new URLSearchParams(location.search).get(`${page}_page`) ?? 1) || 1)
  const [listRefresh, setListRefresh] = useState(0)
  const [productsMeta, setProductsMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
  const [ordersMeta, setOrdersMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
  const [inventoryMeta, setInventoryMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
  const [inventoryStatusCounts, setInventoryStatusCounts] = useState<Record<string, number> | null>(null)
  const [reviewsMeta, setReviewsMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
  const [reviewStatusCounts, setReviewStatusCounts] = useState<Record<string, number> | null>(null)
  const [productSearch, setProductSearch] = useState(() => new URLSearchParams(location.search).get('products_q') ?? '')
  const [productStatusFilter, setProductStatusFilter] = useState(() => new URLSearchParams(location.search).get('products_status') ?? '')
  const [productFeaturedFilter, setProductFeaturedFilter] = useState(() => { const params = new URLSearchParams(location.search); return params.get('products_is_featured') ?? params.get('products_featured') ?? '' })
  const [productNewFilter, setProductNewFilter] = useState(() => new URLSearchParams(location.search).get('products_is_new') ?? '')
  const [productStockFilter, setProductStockFilter] = useState(() => { const params = new URLSearchParams(location.search); const status = params.get('products_stock_status'); return status ?? (params.get('products_in_stock') === '1' ? 'in_stock' : params.get('products_in_stock') === '0' ? 'out_of_stock' : '') })
  const [productSort, setProductSort] = useState(() => new URLSearchParams(location.search).get('products_sort') ?? '-updated_at')
  const [productCategoryFilters, setProductCategoryFilters] = useState(() => { const params = new URLSearchParams(location.search); return params.get('products_category_ids')?.split(',').filter(Boolean) ?? (params.get('products_category_id') ? [params.get('products_category_id')!] : []) })
  const [productBrandFilters, setProductBrandFilters] = useState(() => { const params = new URLSearchParams(location.search); return params.get('products_brand_ids')?.split(',').filter(Boolean) ?? (params.get('products_brand_id') ? [params.get('products_brand_id')!] : []) })
  const [productCollectionFilters, setProductCollectionFilters] = useState(() => new URLSearchParams(location.search).get('products_collection_ids')?.split(',').filter(Boolean) ?? [])
  const [productGenderFilter, setProductGenderFilter] = useState(() => new URLSearchParams(location.search).get('products_target_gender') ?? '')
  const [productMinPrice, setProductMinPrice] = useState(() => new URLSearchParams(location.search).get('products_min_price') ?? '')
  const [productMaxPrice, setProductMaxPrice] = useState(() => new URLSearchParams(location.search).get('products_max_price') ?? '')
  const [productSaleFilter, setProductSaleFilter] = useState(() => new URLSearchParams(location.search).get('products_has_sale') ?? '')
  const [productImageFilter, setProductImageFilter] = useState(() => new URLSearchParams(location.search).get('products_has_image') ?? '')
  const [productCreatedFrom, setProductCreatedFrom] = useState(() => new URLSearchParams(location.search).get('products_created_from') ?? '')
  const [productCreatedTo, setProductCreatedTo] = useState(() => new URLSearchParams(location.search).get('products_created_to') ?? '')
  const [bulkProductCategoryId, setBulkProductCategoryId] = useState('')
  const [bulkProductCollectionIds, setBulkProductCollectionIds] = useState<string[]>([])
  const [bulkProductTagIds, setBulkProductTagIds] = useState<string[]>([])
  const [productToArchive, setProductToArchive] = useState<Product | null>(null)
  const [confirmBulkArchive, setConfirmBulkArchive] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number> | null>(null)
  const [orderSearch, setOrderSearch] = useState(() => new URLSearchParams(location.search).get('orders_q') ?? '')
  const [orderStatus, setOrderStatus] = useState(() => { const params = new URLSearchParams(location.search); return params.get('orders_status') ?? params.get('status') ?? '' })
  const [orderQueue, setOrderQueue] = useState(() => new URLSearchParams(location.search).get('orders_queue') ?? '')
  const [orderPaymentStatus, setOrderPaymentStatus] = useState(() => { const params = new URLSearchParams(location.search); return params.get('orders_payment_status') ?? params.get('payment_status') ?? '' })
  const [orderPaymentMethod, setOrderPaymentMethod] = useState(() => { const params = new URLSearchParams(location.search); return params.get('orders_payment_method') ?? params.get('payment_method') ?? '' })
  const [orderShippingMethodId, setOrderShippingMethodId] = useState(() => { const params = new URLSearchParams(location.search); return params.get('orders_shipping_method_ids') ?? params.get('orders_shipping_method_id') ?? '' })
  const [orderCouponCode, setOrderCouponCode] = useState(() => new URLSearchParams(location.search).get('orders_coupon_code') ?? '')
  const [orderProvinceCodes, setOrderProvinceCodes] = useState(() => new URLSearchParams(location.search).get('orders_province_codes') ?? '')
  const [orderHasNote, setOrderHasNote] = useState(() => new URLSearchParams(location.search).get('orders_has_note') ?? '')
  const [orderMinTotal, setOrderMinTotal] = useState(() => new URLSearchParams(location.search).get('orders_min_total') ?? '')
  const [orderMaxTotal, setOrderMaxTotal] = useState(() => new URLSearchParams(location.search).get('orders_max_total') ?? '')
  const [orderSort, setOrderSort] = useState(() => new URLSearchParams(location.search).get('orders_sort') ?? '-placed_at')
  const [orderFrom, setOrderFrom] = useState(() => { const params = new URLSearchParams(location.search); return params.get('orders_from') ?? params.get('from') ?? '' })
  const [orderTo, setOrderTo] = useState(() => { const params = new URLSearchParams(location.search); return params.get('orders_to') ?? params.get('to') ?? '' })
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [shipmentOrder, setShipmentOrder] = useState<OrderDetail | null>(null)
  const [orderPrintMode, setOrderPrintMode] = useState<'invoice' | 'delivery' | null>(null)
  const [orderPrintOrders, setOrderPrintOrders] = useState<OrderDetail[]>([])
  const [orderPrintLoading, setOrderPrintLoading] = useState(false)
  useEffect(() => {
    if (!orderPrintMode) return
    const clearPrintedOrders = () => { setOrderPrintMode(null); setOrderPrintOrders([]) }
    window.addEventListener('afterprint', clearPrintedOrders)
    return () => window.removeEventListener('afterprint', clearPrintedOrders)
  }, [orderPrintMode])
  const [orderAction, setOrderAction] = useState<OrderActionState | null>(null)
  const [deliveryConfirmation, setDeliveryConfirmation] = useState<Order | null>(null)
  const [deliveryUpdateBusy, setDeliveryUpdateBusy] = useState(false)
  const [orderDetailError, setOrderDetailError] = useState('')
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [orderDetailTargetId, setOrderDetailTargetId] = useState<number | null>(null)
  const orderDetailRequestVersion = useRef(0)
  const [shippingMethodOptions, setShippingMethodOptions] = useState<ShippingMethodOption[]>([])
  const [orderProvinceOptions, setOrderProvinceOptions] = useState<ProvinceOption[]>([])
  const [orderCouponOptions, setOrderCouponOptions] = useState<string[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventorySearch, setInventorySearch] = useState(() => new URLSearchParams(location.search).get('inventory_q') ?? '')
  const [lowStockOnly, setLowStockOnly] = useState(() => new URLSearchParams(location.search).get('inventory_low_stock') === '1')
  const [inventoryStockStatus, setInventoryStockStatus] = useState(() => { const params = new URLSearchParams(location.search); return params.get('inventory_stock_status') ?? (params.get('stock') === 'low' ? 'low' : '') })
  const [inventoryCategoryId, setInventoryCategoryId] = useState(() => new URLSearchParams(location.search).get('inventory_category_id') ?? '')
  const [inventoryBrandId, setInventoryBrandId] = useState(() => new URLSearchParams(location.search).get('inventory_brand_id') ?? '')
  const [inventoryColorId, setInventoryColorId] = useState(() => new URLSearchParams(location.search).get('inventory_color_value_id') ?? '')
  const [inventorySizeId, setInventorySizeId] = useState(() => new URLSearchParams(location.search).get('inventory_size_value_id') ?? '')
  const [inventorySort, setInventorySort] = useState(() => new URLSearchParams(location.search).get('inventory_sort') ?? 'product_name')
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>([])
  const [inventoryBrands, setInventoryBrands] = useState<InventoryFilterOption[]>([])
  const [inventoryColors, setInventoryColors] = useState<InventoryFilterOption[]>([])
  const [inventorySizes, setInventorySizes] = useState<InventoryFilterOption[]>([])
  const [selectedInventoryVariantIds, setSelectedInventoryVariantIds] = useState<Array<string | number>>([])
  const [inventoryThreshold, setInventoryThreshold] = useState('')
  const [inventoryThresholdUpdating, setInventoryThresholdUpdating] = useState(false)
  const [adjustingInventory, setAdjustingInventory] = useState<InventoryItem | null>(null)
  const [thresholdEditingInventory, setThresholdEditingInventory] = useState<InventoryItem | null>(null)
  const [movementVariantId, setMovementVariantId] = useState<number | null>(null)
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewStatus, setReviewStatus] = useState(() => new URLSearchParams(location.search).get('reviews_status') ?? 'pending')
  const [reviewSearch, setReviewSearch] = useState(() => new URLSearchParams(location.search).get('reviews_q') ?? '')
  const [reviewRating, setReviewRating] = useState(() => new URLSearchParams(location.search).get('reviews_rating') ?? '')
  const [reviewHasImages, setReviewHasImages] = useState(() => new URLSearchParams(location.search).get('reviews_has_images') ?? '')
  const [reviewVerifiedPurchase, setReviewVerifiedPurchase] = useState(() => new URLSearchParams(location.search).get('reviews_verified_purchase') ?? '')
  const [reviewFit, setReviewFit] = useState(() => new URLSearchParams(location.search).get('reviews_fit') ?? '')
  const [reviewFrom, setReviewFrom] = useState(() => new URLSearchParams(location.search).get('reviews_from') ?? '')
  const [reviewTo, setReviewTo] = useState(() => new URLSearchParams(location.search).get('reviews_to') ?? '')
  const [reviewSort, setReviewSort] = useState(() => new URLSearchParams(location.search).get('reviews_sort') ?? '-created_at')
  const debouncedProductSearch = useDebouncedValue(productSearch)
  const debouncedOrderSearch = useDebouncedValue(orderSearch)
  const debouncedInventorySearch = useDebouncedValue(inventorySearch)
  const debouncedReviewSearch = useDebouncedValue(reviewSearch)
  const [permissions, setPermissions] = useState<string[]>([])
  const [rolePreview, setRolePreview] = useState<{ name: string; permissions: string[] } | null>(null)

  const [permissionsChecked, setPermissionsChecked] = useState(false)
  const [showProductForm, setShowProductForm] = useState(() => location.pathname === '/products/create')
  useEffect(() => { setShowProductForm(location.pathname === '/products/create') }, [routeVersion])
  const [apiDown, setApiDown] = useState(false)

  const [adminScreenLocked, setAdminScreenLocked] = useState(() => {
    try { return localStorage.getItem('fashion-admin-screen-locked') === 'true' } catch { return false }
  })
  const markAdminScreenLocked = useCallback(() => {
    setAdminScreenLocked(true)
    try { localStorage.setItem('fashion-admin-screen-locked', 'true') } catch { /* storage may be disabled */ }
  }, [])
  const unlockAdminScreen = useCallback(() => {
    setAdminScreenLocked(false)
    try { localStorage.removeItem('fashion-admin-screen-locked') } catch { /* storage may be disabled */ }
  }, [])
  const lockAdminScreen = useCallback(() => {
    markAdminScreenLocked()
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('fashion-admin-session-activity')
      channel.postMessage({ type: 'lock' })
      channel.close()
    }
  }, [markAdminScreenLocked])
  const alertsQuery = useAdminAlerts({ apiUrl: API, accessToken, userId: adminUser?.id, permissions })
  const refreshStarted = useRef(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const sessionExpiredRef = useRef(false)
  const reauthRestorePendingRef = useRef(false)
  const [authError, setAuthError] = useState('')
  const [loginFieldErrors, setLoginFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get('email') ?? localStorage.getItem('fashion-admin-remember-email') ?? '')
  const [password, setPassword] = useState('')
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false)
  const [rememberLogin, setRememberLogin] = useState(() => localStorage.getItem('fashion-admin-remember') === 'true')
  const [loginBusy, setLoginBusy] = useState(false)
  useEffect(() => {
    const requestedEmail = new URLSearchParams(location.search).get('email')
    if (location.pathname === '/login' && requestedEmail) setEmail(requestedEmail)
  }, [routeVersion])
  const [twoFactorChallenge, setTwoFactorChallenge] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  useEffect(() => {
    const resetPrintMode = () => setOrderPrintMode(null)
    window.addEventListener('afterprint', resetPrintMode)
    return () => window.removeEventListener('afterprint', resetPrintMode)
  }, [])
  useEffect(() => {
    configureAdminApiSession({
      apiBaseUrl: API,
      accessToken,
      onAccessToken: (token) => {
        if (token) {
          sessionExpiredRef.current = false
          setAccessToken(token)
        } else if (!sessionExpiredRef.current) {
          setAccessToken('')
        }
      },
      onSessionExpired: () => {
        sessionExpiredRef.current = true
        setSessionExpired(true)
      },
    })
  }, [accessToken])
  useEffect(() => {
    if (!accessToken || !reauthRestorePendingRef.current) return
    reauthRestorePendingRef.current = false
    void queryClient.invalidateQueries()
  }, [accessToken, queryClient])

  const productFilterOptionsQuery = useQuery({
    queryKey: ['admin', 'product-filter-options', adminUser?.id],
    enabled: Boolean(accessToken && page === 'products' && permissions.includes('products.view')),
    queryFn: async ({ signal }) => {
      const [categoriesResponse, brandsResponse, collectionsResponse, tagsResponse] = await Promise.all([
        adminApiFetch(`${API}/admin/catalog-options/categories?per_page=100`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, signal }),
        adminApiFetch(`${API}/admin/catalog-options/brands?per_page=100`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, signal }),
        adminApiFetch(`${API}/admin/catalog-options/collections?per_page=100`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, signal }),
        adminApiFetch(`${API}/admin/tags?per_page=100`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, signal }),
      ])
      if (!categoriesResponse.ok || !brandsResponse.ok || !collectionsResponse.ok || !tagsResponse.ok) throw new Error('Không tải được danh mục, thương hiệu, bộ sưu tập và thẻ.')
      const [categories, brands, collections, tags] = await Promise.all([
        categoriesResponse.json() as Promise<{ data?: ProductFilterOption[] }>,
        brandsResponse.json() as Promise<{ data?: ProductFilterOption[] }>,
        collectionsResponse.json() as Promise<{ data?: ProductFilterOption[] }>,
        tagsResponse.json() as Promise<{ data?: ProductFilterOption[] }>,
      ])
      return { categories: categories.data ?? [], brands: brands.data ?? [], collections: collections.data ?? [], tags: tags.data ?? [] }
    },
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = () => setSystemTheme(media.matches ? 'dark' : 'light')
    media.addEventListener('change', updateSystemTheme)
    return () => media.removeEventListener('change', updateSystemTheme)
  }, [])
  useEffect(() => {
    const root = document.documentElement
    root.dataset.adminTheme = adminTheme
    root.dataset.adminAccent = adminPreferences.accent
    root.dataset.adminFontSize = String(adminPreferences.fontSize)
    root.dataset.adminZoom = String(adminPreferences.zoom)
    root.dataset.adminContrast = adminPreferences.highContrast ? 'high' : 'normal'
    root.dataset.adminFocus = adminPreferences.strongFocus ? 'strong' : 'normal'
    root.dataset.adminDateFormat = adminPreferences.dateFormat
    root.dataset.adminTimeFormat = adminPreferences.timeFormat
    root.dataset.adminNumberLocale = adminPreferences.numberLocale
    root.dataset.adminCurrencyPosition = adminPreferences.currencyPosition
    root.dataset.adminWeekStart = String(adminPreferences.weekStart)
    root.dataset.adminLocale = adminPreferences.locale
    root.dataset.adminTimezone = adminUser?.timezone || 'Asia/Ho_Chi_Minh'
    root.dataset.adminDensity = adminPreferences.tableDensity
    root.dataset.adminUserId = adminUser?.id == null ? 'guest' : String(adminUser.id)
    root.dataset.adminTableColumnDefaults = JSON.stringify(adminPreferences.tableColumnDefaults)
    root.dataset.adminPageSize = String(adminPreferences.pageSize)
    root.dataset.adminMotion = adminPreferences.reduceMotion ? 'reduced' : 'full'
    window.dispatchEvent(new CustomEvent('fashion-admin-density-change', { detail: { density: adminPreferences.tableDensity } }))
    window.dispatchEvent(new CustomEvent('fashion-admin-apply-table-column-defaults'))
    localStorage.setItem('fashion-admin-preferences', JSON.stringify(adminPreferences))
    publishAdminPageSize(adminPreferences.pageSize, 'preferences')
  }, [adminPreferences, adminTheme, adminUser?.id, adminUser?.timezone])
  useEffect(() => {
    const syncVisibleColumns = (event: Event) => {
      const detail = (event as CustomEvent<{ tableId?: string; columns?: string[] }>).detail
      if (!detail?.tableId || !Array.isArray(detail.columns)) return
      setAdminPreferences((current) => {
        const prior = current.tableColumnDefaults[detail.tableId!] ?? []
        if (prior.length === detail.columns!.length && prior.every((id, index) => id === detail.columns![index])) return current
        return { ...current, tableColumnDefaults: { ...current.tableColumnDefaults, [detail.tableId!]: detail.columns! } }
      })
    }
    window.addEventListener('fashion-admin-table-columns-changed', syncVisibleColumns)
    return () => window.removeEventListener('fashion-admin-table-columns-changed', syncVisibleColumns)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.adminPermissions = permissions.join(',')
  }, [permissions])
  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ pageSize: AdminPreferences['pageSize']; source: 'table' | 'preferences' }>).detail
      if (detail?.source !== 'table' || ![10, 20, 50, 100].includes(detail.pageSize)) return
      setAdminPreferences((current) => current.pageSize === detail.pageSize ? current : { ...current, pageSize: detail.pageSize })
    }
    window.addEventListener('fashion-admin-page-size-change', update)
    return () => window.removeEventListener('fashion-admin-page-size-change', update)
  }, [])
  useEffect(() => {
    const updateDensity = (event: Event) => {
      const density = (event as CustomEvent<{ density?: string }>).detail?.density
      if (density !== 'comfortable' && density !== 'compact') return
      setAdminPreferences((current) => current.tableDensity === density ? current : { ...current, tableDensity: density })
    }
    window.addEventListener('fashion-admin-density-request', updateDensity)
    return () => window.removeEventListener('fashion-admin-density-request', updateDensity)
  }, [])
  useEffect(() => { localStorage.setItem('fashion-admin-sidebar-collapsed', String(sidebarCollapsed)) }, [sidebarCollapsed])
  useEffect(() => {
    if (focusMode) {
      document.getElementById('admin-main-content')?.focus()
      previousFocusMode.current = true
    } else if (previousFocusMode.current) {
      window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.topbar-account-trigger')?.focus())
      previousFocusMode.current = false
    }
  }, [focusMode])
  useEffect(() => {
    if (!focusMode) return
    const exitFocusMode = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocusMode(false)
    }
    window.addEventListener('keydown', exitFocusMode)
    return () => window.removeEventListener('keydown', exitFocusMode)
  }, [focusMode])
  useEffect(() => {
    if (!accessToken) setFocusMode(false)
  }, [accessToken])
  useEffect(() => {
    if (!accessToken || !adminUser?.id) return
    let cancelled = false
    appearanceLoadedForUser.current = null
    setAppearanceReadyUserId(null)
    adminApiFetch(`${API}/account/preferences`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { data?: { admin_appearance?: Record<string, unknown> } }
        if (!response.ok) throw new Error('Không tải được tùy chọn giao diện.')
        if (cancelled) return
        const saved = body.data?.admin_appearance
        if (saved) {
          setAdminPreferences((current) => ({
            ...current,
            locale: saved.locale === 'en' ? 'en' : saved.locale === 'vi' ? 'vi' : current.locale,
            theme: localStorage.getItem(themeLightDefaultMigrationKey) === 'pending' ? 'light' : saved.theme === 'light' || saved.theme === 'dark' || saved.theme === 'system' ? saved.theme : current.theme,
            accent: ['burgundy', 'blue', 'emerald', 'violet', 'teal', 'amber'].includes(String(saved.accent)) ? saved.accent as AdminPreferences['accent'] : current.accent,
            fontSize: [14, 16, 18].includes(Number(saved.font_size)) ? Number(saved.font_size) as AdminPreferences['fontSize'] : current.fontSize,
            zoom: [90, 100, 110, 125].includes(Number(saved.zoom)) ? Number(saved.zoom) as AdminPreferences['zoom'] : current.zoom,
            showBreadcrumbs: typeof saved.show_breadcrumbs === 'boolean' ? saved.show_breadcrumbs : current.showBreadcrumbs,
            highContrast: typeof saved.high_contrast === 'boolean' ? saved.high_contrast : current.highContrast,
            strongFocus: typeof saved.strong_focus === 'boolean' ? saved.strong_focus : current.strongFocus,
            dateFormat: saved.date_format === 'ymd' || saved.date_format === 'relative' || saved.date_format === 'dmy' ? saved.date_format : current.dateFormat,
            timeFormat: saved.time_format === '12h' || saved.time_format === '24h' ? saved.time_format : current.timeFormat,
            numberLocale: saved.number_locale === 'en-US' || saved.number_locale === 'vi-VN' ? saved.number_locale : current.numberLocale,
            currencyPosition: saved.currency_position === 'prefix' || saved.currency_position === 'suffix' ? saved.currency_position : current.currencyPosition,
            weekStart: Number(saved.week_start) === 7 ? 7 : Number(saved.week_start) === 1 ? 1 : current.weekStart,
            dashboardDefaultPeriod: saved.dashboard_default_period === '7' || saved.dashboard_default_period === '90' || saved.dashboard_default_period === '30' ? saved.dashboard_default_period : current.dashboardDefaultPeriod,
            dashboardComparePrevious: typeof saved.dashboard_compare_previous === 'boolean' ? saved.dashboard_compare_previous : current.dashboardComparePrevious,
            rememberCollapsedGroups: typeof saved.remember_collapsed_groups === 'boolean' ? saved.remember_collapsed_groups : current.rememberCollapsedGroups,
            pinnedPages: Array.isArray(saved.pinned_pages) ? [...new Set(saved.pinned_pages.filter((id): id is SidebarDestinationId => sidebarDestinationOptions.some((option) => option.id === id)))] .slice(0, 8) : current.pinnedPages,
            dashboardWidgets: Array.isArray(saved.dashboard_widgets) ? [...new Set(saved.dashboard_widgets.filter((id): id is DashboardWidgetId => dashboardWidgetOptions.some((option) => option.id === id)))] : current.dashboardWidgets,
            defaultLandingPage: sidebarDestinationOptions.some((option) => option.id === saved.default_landing_page) ? saved.default_landing_page as SidebarDestinationId : current.defaultLandingPage,
            tableDensity: saved.table_density === 'compact' || saved.table_density === 'comfortable' ? saved.table_density : current.tableDensity,
            tableColumnDefaults: saved.table_column_defaults && typeof saved.table_column_defaults === 'object' && !Array.isArray(saved.table_column_defaults) ? Object.fromEntries(Object.entries(saved.table_column_defaults).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].every((id) => typeof id === 'string'))) : current.tableColumnDefaults,
            reduceMotion: typeof saved.reduce_motion === 'boolean' ? saved.reduce_motion : current.reduceMotion,
            pageSize: [10, 20, 50, 100].includes(Number(saved.page_size)) ? Number(saved.page_size) as AdminPreferences['pageSize'] : current.pageSize,
            sidebarCollapsed: false,
            menuLayout: saved.menu_layout ? normalizeMenuLayout(saved.menu_layout) : current.menuLayout,
            shortcuts: normalizeAdminShortcuts(saved.shortcuts),
            shortcutsEnabled: typeof saved.shortcuts_enabled === 'boolean' ? saved.shortcuts_enabled : current.shortcutsEnabled,
          }))
        }
        appearanceLoadedForUser.current = adminUser.id
        setAppearanceReadyUserId(adminUser.id)
      })
      .catch(() => { if (!cancelled) { appearanceLoadedForUser.current = adminUser.id; setAppearanceReadyUserId(adminUser.id) } })
    return () => { cancelled = true }
  }, [accessToken, adminUser?.id])

  useEffect(() => {
    if (!accessToken || !adminUser?.id || appearanceLoadedForUser.current !== adminUser.id) return
    const timeout = window.setTimeout(() => {
      const value = {
        theme: adminPreferences.theme,
        accent: adminPreferences.accent,
        table_density: adminPreferences.tableDensity,
        table_column_defaults: adminPreferences.tableColumnDefaults,
        page_size: adminPreferences.pageSize,
        sidebar_collapsed: sidebarCollapsed,
        locale: adminPreferences.locale,
        font_size: adminPreferences.fontSize,
        zoom: adminPreferences.zoom,
        show_breadcrumbs: adminPreferences.showBreadcrumbs,
        high_contrast: adminPreferences.highContrast,
        strong_focus: adminPreferences.strongFocus,
        date_format: adminPreferences.dateFormat,
        time_format: adminPreferences.timeFormat,
        number_locale: adminPreferences.numberLocale,
        currency_position: adminPreferences.currencyPosition,
        week_start: adminPreferences.weekStart,
        dashboard_default_period: adminPreferences.dashboardDefaultPeriod,
        dashboard_compare_previous: adminPreferences.dashboardComparePrevious,
        remember_collapsed_groups: adminPreferences.rememberCollapsedGroups,
        pinned_pages: adminPreferences.pinnedPages,
        dashboard_widgets: adminPreferences.dashboardWidgets,
        default_landing_page: adminPreferences.defaultLandingPage,
        reduce_motion: adminPreferences.reduceMotion,
        menu_layout: adminPreferences.menuLayout,
        shortcuts: adminPreferences.shortcuts,
        shortcuts_enabled: adminPreferences.shortcutsEnabled,
      }
      void adminApiFetch(`${API}/account/preferences`, { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'admin_appearance', value }) })
        .then((response) => {
          if (!response.ok) publishAdminToast({ message: 'Không đồng bộ được giao diện lên tài khoản. Tùy chọn vẫn còn trên trình duyệt này.', tone: 'error' })
          else if (localStorage.getItem(themeLightDefaultMigrationKey) === 'pending') localStorage.setItem(themeLightDefaultMigrationKey, 'done')
        })
        .catch(() => publishAdminToast({ message: 'Không đồng bộ được giao diện lên tài khoản. Tùy chọn vẫn còn trên trình duyệt này.', tone: 'error' }))
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [adminPreferences, sidebarCollapsed, accessToken, adminUser?.id])

  useEffect(() => {
    if (!accessToken) { defaultLandingRedirectedForUser.current = null; return }
    if (!adminUser?.id || !permissionsChecked || appearanceReadyUserId !== adminUser.id || defaultLandingRedirectedForUser.current === adminUser.id) return
    defaultLandingRedirectedForUser.current = adminUser.id
    if (location.pathname !== '/' || location.search || location.hash) return
    const permitted = (option: typeof sidebarDestinationOptions[number]) => option.permission === 'authenticated' || permissions.includes(option.permission)
    const destination = sidebarDestinationOptions.find((option) => option.id === adminPreferences.defaultLandingPage && permitted(option))
      ?? sidebarDestinationOptions.find(permitted)
    if (!destination || destination.href === '/') return
    history.replaceState({}, '', destination.href)
    setRouteVersion((version) => version + 1)
  }, [accessToken, adminUser?.id, permissionsChecked, appearanceReadyUserId, adminPreferences.defaultLandingPage, permissions])

  useEffect(() => {
    if (!accessToken || page !== 'products' || !permissions.includes('products.view')) return
    if (productMinPrice && productMaxPrice && Number(productMinPrice) > Number(productMaxPrice)) { setProductsLoading(false); return }
    if (productCreatedFrom && productCreatedTo && productCreatedFrom > productCreatedTo) { setProductsLoading(false); return }
    const params = new URLSearchParams({ per_page: String(adminPreferences.pageSize), page: String(listPage) })
    if (debouncedProductSearch.trim()) params.set('q', debouncedProductSearch.trim())
    if (productStatusFilter) params.set('status', productStatusFilter)
    if (productFeaturedFilter) params.set('is_featured', productFeaturedFilter)
    if (productNewFilter) params.set('is_new', productNewFilter)
    if (productStockFilter) params.set('stock_status', productStockFilter)
    if (productSort) params.set('sort', productSort)
    productCategoryFilters.forEach((id) => params.append('category_ids[]', id))
    productBrandFilters.forEach((id) => params.append('brand_ids[]', id))
    productCollectionFilters.forEach((id) => params.append('collection_ids[]', id))
    if (productGenderFilter) params.set('target_gender', productGenderFilter)
    if (productMinPrice) params.set('min_price', productMinPrice)
    if (productMaxPrice) params.set('max_price', productMaxPrice)
    if (productSaleFilter) params.set('has_sale', productSaleFilter)
    if (productImageFilter) params.set('has_image', productImageFilter)
    if (productCreatedFrom) params.set('created_from', productCreatedFrom)
    if (productCreatedTo) params.set('created_to', productCreatedTo)
    setProductsLoading(true)
    adminApiFetch(`${API}/admin/products?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }).then(async (res) => { if (!res.ok) throw new Error(); const json = await res.json() as { data?: Product[]; filters?: { status_counts?: Record<string, number> }; meta?: PaginationMeta }; setProducts(json.data ?? []); setProductStatusCounts(json.filters?.status_counts ?? null); if (json.meta) setProductsMeta(json.meta) }).catch(() => setApiDown(true)).finally(() => setProductsLoading(false))
  }, [accessToken, page, permissions, debouncedProductSearch, productStatusFilter, productFeaturedFilter, productNewFilter, productStockFilter, productSort, productCategoryFilters, productBrandFilters, productCollectionFilters, productGenderFilter, productMinPrice, productMaxPrice, productSaleFilter, productImageFilter, productCreatedFrom, productCreatedTo, adminPreferences.pageSize, listPage, listRefresh])
  useEffect(() => {
    if (!accessToken || page !== 'orders' || !permissions.includes('orders.view')) {
      setOrdersLoading(false)
      return
    }
    if (orderMinTotal && orderMaxTotal && Number(orderMinTotal) > Number(orderMaxTotal)) {
      setOrdersLoading(false)
      return
    }
    const params = new URLSearchParams({ per_page: String(adminPreferences.pageSize), page: String(listPage) })
    if (debouncedOrderSearch.trim()) params.set('q', debouncedOrderSearch.trim())
    if (orderStatus) params.set('status', orderStatus)
    if (orderQueue) params.set('queue', orderQueue)
    if (orderPaymentStatus) params.set('payment_status', orderPaymentStatus)
    if (orderPaymentMethod) params.set('payment_method', orderPaymentMethod)
    if (orderShippingMethodId) params.set('shipping_method_ids', orderShippingMethodId)
    if (orderCouponCode.trim()) params.set('coupon_code', orderCouponCode.trim().toUpperCase())
    if (orderProvinceCodes) params.set('province_codes', orderProvinceCodes)
    if (orderHasNote) params.set('has_note', orderHasNote)
    if (orderFrom) params.set('from', orderFrom)
    if (orderTo) params.set('to', orderTo)
    if (orderMinTotal) params.set('min_total', orderMinTotal)
    if (orderMaxTotal) params.set('max_total', orderMaxTotal)
    if (orderSort) params.set('sort', orderSort)
    setOrdersLoading(true)
    adminApiFetch(`${API}/admin/orders?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }).then(async (res) => { if (!res.ok) throw new Error(); const json = await res.json() as { data?: Order[]; meta?: PaginationMeta; filters?: { shipping_methods?: ShippingMethodOption[]; provinces?: ProvinceOption[]; coupon_codes?: string[]; status_counts?: Record<string, number> } }; setOrders(json.data ?? []); setOrderStatusCounts(json.filters?.status_counts ?? {}); setShippingMethodOptions(json.filters?.shipping_methods ?? []); setOrderProvinceOptions(json.filters?.provinces ?? []); setOrderCouponOptions(json.filters?.coupon_codes ?? []); if (json.meta) setOrdersMeta(json.meta) }).catch(() => setApiDown(true)).finally(() => setOrdersLoading(false))
  }, [accessToken, page, permissions, debouncedOrderSearch, orderStatus, orderQueue, orderPaymentStatus, orderPaymentMethod, orderShippingMethodId, orderCouponCode, orderProvinceCodes, orderHasNote, orderFrom, orderTo, orderMinTotal, orderMaxTotal, orderSort, adminPreferences.pageSize, listPage, listRefresh])
  useEffect(() => {
    if (!accessToken) return
    adminApiFetch(`${API}/admin/auth/me`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }).then(async (res) => { if (!res.ok) throw new Error(); const json = await res.json() as { data?: { user?: AdminUser; roles?: string[]; permissions?: string[]; store?: StoreBranding } }; const granted = json.data?.permissions ?? []; setAdminUser(json.data?.user ?? null); setStoreBranding(json.data?.store ?? { store_name: 'Sarada', store_logo: '' }); setAdminRoles(json.data?.roles ?? []); setPermissions(granted); if (!granted.includes('orders.view') && new URLSearchParams(location.search).get('page') === 'dashboard') history.replaceState({}, '', granted.includes('reports.view') ? '/?page=reports' : '/?page=preferences'); setApiDown(false); setPermissionsChecked(true) }).catch(() => { setPermissionsChecked(true); setAccessToken('') })
  }, [accessToken])
  useEffect(() => {
    if (!accessToken || page !== 'inventory' || !permissions.includes('inventory.view')) return
    const params = new URLSearchParams({ per_page: String(adminPreferences.pageSize), page: String(listPage) })
    if (debouncedInventorySearch.trim()) params.set('q', debouncedInventorySearch.trim())
    if (lowStockOnly) params.set('low_stock', '1')
    if (inventoryStockStatus) params.set('stock_status', inventoryStockStatus)
    if (inventoryCategoryId) params.set('category_id', inventoryCategoryId)
    if (inventoryBrandId) params.set('brand_id', inventoryBrandId)
    if (inventoryColorId) params.set('color_value_id', inventoryColorId)
    if (inventorySizeId) params.set('size_value_id', inventorySizeId)
    if (inventorySort) params.set('sort', inventorySort)
    setInventoryLoading(true)
    adminApiFetch(`${API}/admin/inventory?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }).then(async (res) => { if (!res.ok) throw new Error(); const json = await res.json() as { data?: InventoryItem[]; meta?: PaginationMeta; filters?: { status_counts?: Record<string, number>; categories?: InventoryCategory[]; brands?: InventoryFilterOption[]; colors?: InventoryFilterOption[]; sizes?: InventoryFilterOption[] } }; setInventory(json.data ?? []); setInventoryStatusCounts(json.filters?.status_counts ?? null); if (json.meta) setInventoryMeta(json.meta); setInventoryCategories(json.filters?.categories ?? []); setInventoryBrands(json.filters?.brands ?? []); setInventoryColors(json.filters?.colors ?? []); setInventorySizes(json.filters?.sizes ?? []) }).catch(() => setApiDown(true)).finally(() => setInventoryLoading(false))
  }, [accessToken, page, permissions, debouncedInventorySearch, lowStockOnly, inventoryStockStatus, inventoryCategoryId, inventoryBrandId, inventoryColorId, inventorySizeId, inventorySort, adminPreferences.pageSize, listPage, listRefresh])
  useEffect(() => {
    if (!accessToken || page !== 'reviews' || !permissions.includes('reviews.moderate')) return
    if (reviewFrom && reviewTo && reviewFrom > reviewTo) { setReviews([]); setReviewsLoading(false); return }
    const params = new URLSearchParams({ per_page: String(adminPreferences.pageSize), page: String(listPage), status: reviewStatus })
    if (debouncedReviewSearch.trim()) params.set('q', debouncedReviewSearch.trim())
    if (reviewRating) params.set('rating', reviewRating)
    if (reviewHasImages) params.set('has_images', reviewHasImages)
    if (reviewVerifiedPurchase) params.set('verified_purchase', reviewVerifiedPurchase)
    if (reviewFit) params.set('fit', reviewFit)
    if (reviewFrom) params.set('from', reviewFrom)
    if (reviewTo) params.set('to', reviewTo)
    if (reviewSort) params.set('sort', reviewSort)
    setReviewsLoading(true)
    adminApiFetch(`${API}/admin/reviews?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }).then(async (res) => { if (!res.ok) throw new Error(); const json = await res.json() as { data?: Review[]; meta?: PaginationMeta; status_counts?: Record<string, number> }; setReviews(json.data ?? []); setReviewStatusCounts(json.status_counts ?? null); if (json.meta) setReviewsMeta(json.meta) }).catch(() => setApiDown(true)).finally(() => setReviewsLoading(false))
  }, [accessToken, page, permissions, reviewStatus, debouncedReviewSearch, reviewRating, reviewHasImages, reviewVerifiedPurchase, reviewFit, reviewFrom, reviewTo, reviewSort, adminPreferences.pageSize, listPage, listRefresh])
  useEffect(() => {
    const orderId = pathOrderId ?? new URLSearchParams(location.search).get('order')
    if (!accessToken || !permissions.includes('orders.view') || page !== 'orders' || !orderId || !/^\d+$/.test(orderId)) return
    const parsedOrderId = Number(orderId)
    let cancelled = false
    const requestVersion = ++orderDetailRequestVersion.current
    setOrderDetailTargetId(parsedOrderId)
    setOrderDetailLoading(true)
    setOrderDetailError('')
    setSelectedOrder(null)
    fetchAdminOrderDetail(API, accessToken, parsedOrderId)
      .then((order) => { if (!cancelled && requestVersion === orderDetailRequestVersion.current) setSelectedOrder(order) })
      .catch((error: unknown) => { if (!cancelled && requestVersion === orderDetailRequestVersion.current) setOrderDetailError(error instanceof Error ? error.message : 'Không thể tải chi tiết đơn hàng.') })
      .finally(() => { if (!cancelled && requestVersion === orderDetailRequestVersion.current) setOrderDetailLoading(false) })
    return () => { cancelled = true }
  }, [accessToken, page, permissions, pathOrderId])
  useEffect(() => {
    if (!accessToken || !permissions.includes('inventory.view') || !movementVariantId) { setInventoryMovements([]); return }
    adminApiFetch(`${API}/admin/inventory/movements?variant_id=${movementVariantId}&per_page=30`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }).then(async (res) => { if (!res.ok) throw new Error(); const json = await res.json() as { data?: InventoryMovement[] }; setInventoryMovements(json.data ?? []) }).catch(() => setInventoryMovements([]))
  }, [accessToken, permissions, movementVariantId])
  const title = pageTitles[page] ?? 'Không tìm thấy trang'
  const sidebarPermissions = rolePreview?.permissions ?? permissions

  const routePermission = location.pathname === '/products/create' || location.pathname === '/collections/create'
    ? 'products.create'
    : pathProductId || pathCollectionId
      ? 'products.update'
      : location.pathname === '/coupons/create' || pathCouponId
        ? 'coupons.manage'
        : currentPage ? adminPages[currentPage].permission : 'public'
  const accessDenied = currentPage !== null && routePermission !== 'authenticated' && permissionsChecked && !permissions.includes(routePermission)
  const activeDashboard = page === 'dashboard' && !accessDenied && currentPage !== null
  useEffect(() => {
    if (activeDashboard) setDashboardVisited(true)
  }, [activeDashboard])
  const fallbackPage = visibleAdminNavGroups.flatMap((group) => group.items).find((item) => item.permission === 'authenticated' || permissions.includes(item.permission))?.page
  const notify = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    publishAdminToast({ message, tone })
  }, [])
  const notifyError = (message: string) => notify(message, 'error')
  const updateAdminPreference = <Key extends keyof AdminPreferences>(key: Key, value: AdminPreferences[Key]) => {
    setAdminPreferences((current) => ({ ...current, [key]: value } as AdminPreferences))
    if (key === 'sidebarCollapsed') setSidebarCollapsed(value as boolean)
    if (key === 'theme') localStorage.setItem(themeLightDefaultMigrationKey, 'done')
  }
  const exportAdminAppearance = async () => {
    const response = await adminApiFetch(`${API}/account/preferences/export`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    if (!response.ok) throw new Error('Không thể tải bản sao lưu cài đặt.')
    const file = new Blob([await response.text()], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `fashion-admin-appearance-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
  const importAdminAppearance = async (file: File) => {
    let contents: string
    try { contents = await file.text(); JSON.parse(contents) }
    catch { throw new Error('Tệp không phải JSON hợp lệ.') }
    const response = await adminApiFetch(`${API}/account/preferences/import`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: contents })
    const body = await response.json().catch(() => ({})) as { message?: string }
    if (!response.ok) throw new Error(body.message ?? 'Tệp không đúng phiên bản hoặc có tùy chọn không hợp lệ.')
    window.location.reload()
  }
  const userName = adminUser?.name || 'Tài khoản quản trị'
  const storeName = storeBranding.store_name?.trim() || 'Sarada'
  const storeLogo = mediaUrl(API, storeBranding.store_logo)
  const userGreetingName = adminUser?.name.trim().split(/\s+/).at(-1) || 'bạn'
  const roleNames: Record<string, string> = { ...adminRoleLabels, manager: 'Quản lý' }
  const userRole = adminRoles.map((role) => roleNames[role] ?? role).join(', ') || 'Nhân viên'
  const changeListPage = (nextPage: number) => {
    const safePage = Math.max(1, nextPage)
    setListPage(safePage)
    const params = new URLSearchParams(location.search)
    const paramName = `${page}_page`
    if (safePage === 1) params.delete(paramName)
    else params.set(paramName, String(safePage))
    history.pushState({}, '', `${location.pathname}?${params.toString()}`)
  }
  const changePageSize = (nextSize: AdminPreferences['pageSize']) => {
    updateAdminPreference('pageSize', nextSize)
    changeListPage(1)
  }
  const updateListFilterParam = (name: string, value: string | boolean) => {
    const params = new URLSearchParams(location.search)
    const paramName = `${page}_${name}`
    if (value === false || value === '') params.delete(paramName)
    else params.set(paramName, typeof value === 'boolean' ? '1' : value)
    params.delete(`${page}_page`)
    setListPage(1)
    const nextUrl = `${location.pathname}?${params.toString()}`
    if (name === 'q') history.replaceState({}, '', nextUrl)
    else history.pushState({}, '', nextUrl)
  }
  const applyListFilterParams = (values: Record<string, string | boolean>) => {
    const params = new URLSearchParams(location.search)
    for (const [name, value] of Object.entries(values)) {
      const paramName = `${page}_${name}`
      if (value === false || value === '') params.delete(paramName)
      else params.set(paramName, typeof value === 'boolean' ? '1' : value)
    }
    params.delete(`${page}_page`)
    setListPage(1)
    history.pushState({}, '', `${location.pathname}?${params.toString()}`)
  }
  const clearListFilters = (names: string[]) => {
    const params = new URLSearchParams(location.search)
    names.forEach((name) => params.delete(`${page}_${name}`))
    params.delete(`${page}_page`)
    setListPage(1)
    history.pushState({}, '', `${location.pathname}?${params.toString()}`)
  }
  const retryList = () => { setApiDown(false); setListRefresh((revision) => revision + 1) }

  useEffect(() => {
    if (new URLSearchParams(location.search).get('page') === 'login') { setAuthChecked(true); return }
    if (refreshStarted.current) return
    refreshStarted.current = true
    adminApiFetch(`${API}/admin/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (res) => { if (!res.ok) throw new Error(); const body = await res.json() as { data?: { access_token?: string } }; setAccessToken(body.data?.access_token ?? '') })
      .catch(() => setAccessToken(''))
      .finally(() => setAuthChecked(true))
  }, [])

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthError(''); setLoginFieldErrors({}); setLoginBusy(true)
    try {
      if (rememberLogin) localStorage.setItem('fashion-admin-remember-email', email)
      else localStorage.removeItem('fashion-admin-remember-email')
      localStorage.setItem('fashion-admin-remember', String(rememberLogin))
      const res = await adminApiFetch(`${API}/admin/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ email, password }) })
      const body = await res.json() as { data?: { access_token?: string; two_factor_required?: boolean; challenge_token?: string; locked_until?: string; lock_type?: string }; message?: string; errors?: Record<string, string[]> }
      if (!res.ok) {
        if (res.status === 423) {
          const params = new URLSearchParams()
          if (body.data?.locked_until) params.set('until', body.data.locked_until)
          if (body.data?.lock_type === 'account') params.set('type', 'account')
          if (loginReturnTo !== '/') params.set('returnTo', loginReturnTo)
          const query = params.toString()
          const lockedUntil = query ? `?${query}` : ''
          history.pushState({}, '', `/locked${lockedUntil}`)
          setRouteVersion((version) => version + 1)
          return
        }
        const fieldErrors = { email: body.errors?.email?.[0], password: body.errors?.password?.[0] }
        if (res.status === 422 && (fieldErrors.email || fieldErrors.password)) {
          setLoginFieldErrors(fieldErrors)
          return
        }
        throw new Error(body.message ?? 'Không thể đăng nhập. Vui lòng thử lại.')
      }
      if (res.status === 202 && body.data?.two_factor_required && body.data.challenge_token) {
        setTwoFactorChallenge(body.data.challenge_token); setTwoFactorCode(''); setRecoveryCode(''); setAuthError(''); setPassword('')
        return
      }
      if (!body.data?.access_token) throw new Error(body.message ?? 'API không trả về access token.')
      setPermissionsChecked(false); setPermissions([]); setAccessToken(body.data.access_token); history.pushState({}, '', loginReturnTo); setRouteVersion((version) => version + 1)
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Không thể đăng nhập. Hãy kiểm tra kết nối API.') } finally { setLoginBusy(false) }
  }

  const verifyTwoFactorLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthError(''); setLoginBusy(true)
    try {
      const res = await adminApiFetch(`${API}/admin/auth/two-factor/verify`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ challenge_token: twoFactorChallenge, ...(useRecoveryCode ? { recovery_code: recoveryCode } : { code: twoFactorCode }) }) })
      const body = await res.json() as { data?: { access_token?: string }; message?: string; errors?: Record<string, string[]> }
      if (!res.ok || !body.data?.access_token) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? 'Mã xác thực không hợp lệ.')
      setTwoFactorChallenge(''); setPermissionsChecked(false); setPermissions([]); setAccessToken(body.data.access_token); history.pushState({}, '', loginReturnTo); setRouteVersion((version) => version + 1)
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Không thể xác thực mã.') }
    finally { setLoginBusy(false) }
  }

  const logout = async (switchToEmail?: string) => {
    await adminApiFetch(`${API}/admin/auth/logout`, { method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }).catch(() => undefined)
    setAccessToken(''); unlockAdminScreen(); setAdminUser(null); setAdminRoles([]); setPermissions([]); setPermissionsChecked(false); setRolePreview(null)
    const loginUrl = switchToEmail ? `/login?email=${encodeURIComponent(switchToEmail)}` : '/login'
    history.pushState({}, '', loginUrl)
    if (switchToEmail !== undefined) setEmail(switchToEmail)
    setPassword('')
    setRouteVersion((version) => version + 1)
  }

  useEffect(() => {
    if (!accessToken || !adminPreferences.shortcutsEnabled) return
    const onLockShortcut = (event: KeyboardEvent) => {
      if (!adminScreenLocked && !isKeyboardEditableTarget(event.target) && matchesKeyboardShortcut(event, adminPreferences.shortcuts.lock)) {
        event.preventDefault()
        lockAdminScreen()
      }
    }
    window.addEventListener('keydown', onLockShortcut)
    return () => window.removeEventListener('keydown', onLockShortcut)
  }, [accessToken, adminPreferences.shortcutsEnabled, adminPreferences.shortcuts.lock, adminScreenLocked, lockAdminScreen])
  useEffect(() => {
    if (!accessToken || !adminPreferences.shortcutsEnabled || adminScreenLocked) return
    const onSidebarShortcut = (event: KeyboardEvent) => {
      if (isKeyboardEditableTarget(event.target) || !matchesKeyboardShortcut(event, adminPreferences.shortcuts.sidebar)) return
      event.preventDefault()
      const next = !sidebarCollapsed
      setSidebarCollapsed(next)
      setAdminPreferences((current) => ({ ...current, sidebarCollapsed: next }))
    }
    window.addEventListener('keydown', onSidebarShortcut)
    return () => window.removeEventListener('keydown', onSidebarShortcut)
  }, [accessToken, adminPreferences.shortcutsEnabled, adminPreferences.shortcuts.sidebar, adminScreenLocked, sidebarCollapsed])
  useEffect(() => {
    const syncLockedState = (event: StorageEvent) => {
      if (event.key === 'fashion-admin-screen-locked') setAdminScreenLocked(event.newValue === 'true')
    }
    window.addEventListener('storage', syncLockedState)
    return () => window.removeEventListener('storage', syncLockedState)
  }, [])

  const persistOrderStatus = async (order: Order, status: string, paymentCollected: boolean, note = '') => {
    setDeliveryUpdateBusy(true)
    try {
      const response = await adminApiFetch(`${API}/admin/orders/${order.id}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ status, note: note.trim() || null, payment_collected: paymentCollected }) })
      const body = await response.json() as { data?: Order; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) throw createApiResponseError(body, response.status, 'Không thể cập nhật đơn hàng.')
      setOrders((current) => current.map((item) => item.id === order.id ? body.data! : item)); setSelectedOrder((current) => current?.id === order.id ? { ...current, ...body.data! } : current); notify('Đã cập nhật trạng thái đơn hàng')
      return true
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể cập nhật đơn hàng'); return false }
    finally { setDeliveryUpdateBusy(false) }
  }

  const updateOrder = async (order: Order, status: string) => {
    if (status === 'cancelled') {
      setOrderAction({ mode: 'cancel', order })
      return
    }
    if (status === 'delivered') { setDeliveryConfirmation(order); return }
    setOrderAction({ mode: 'status', order, status })
  }

  const confirmOrderDelivery = async (paymentCollected: boolean, note: string): Promise<boolean> => {
    if (!deliveryConfirmation) return false
    const saved = await persistOrderStatus(deliveryConfirmation, 'delivered', paymentCollected, note)
    if (saved) setDeliveryConfirmation(null)
    return saved
  }

  const bulkOrderStatus = async (status: 'confirmed' | 'processing' | 'cancelled') => {
    if (!selectedOrderIds.length) return
    if (status === 'cancelled') {
      setOrderAction({ mode: 'bulk-cancel', orderIds: [...selectedOrderIds] })
      return
    }
    setOrderAction({ mode: 'bulk-status', orderIds: [...selectedOrderIds], status })
  }

  const updatePaymentStatus = async (order: OrderDetail, paymentStatus: 'paid', note: string) => {
    const response = await adminApiFetch(API + '/admin/orders/' + order.id + '/payment-status', { method: 'PATCH', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ payment_status: paymentStatus, note }) })
    const body = await response.json() as { data?: OrderDetail; message?: string; errors?: Record<string, string[]> }
    if (!response.ok || !body.data) throw createApiResponseError(body, response.status, 'Không thể cập nhật thanh toán.')
    setSelectedOrder(body.data); setOrders((items) => items.map((item) => item.id === order.id ? { ...item, payment_status: body.data!.payment_status } : item)); notify('Đã ghi nhận thu tiền COD')
  }

  const updateOrderAddress = (order: OrderDetail) => setOrderAction({ mode: 'address', order })
  const refundOrder = (order: OrderDetail) => setOrderAction({ mode: 'refund', order })

  const submitOrderAction = async (values: OrderDialogValues) => {
    const action = orderAction
    if (!action) return
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }
    let url: string
    let method: 'PATCH' | 'POST'
    let payload: Record<string, unknown>
    let fallback: string
    if (action.mode === 'bulk-cancel' || action.mode === 'bulk-status') {
      url = `${API}/admin/orders/bulk-status`; method = 'PATCH'
      payload = { order_ids: action.orderIds, status: action.mode === 'bulk-cancel' ? 'cancelled' : action.status, note: values.note.trim() || null }; fallback = action.mode === 'bulk-cancel' ? 'Không thể hủy các đơn đã chọn.' : 'Không thể cập nhật hàng loạt đơn hàng.'
    } else if (action.mode === 'cancel') {
      url = `${API}/admin/orders/${action.order.id}/status`; method = 'PATCH'
      payload = { status: 'cancelled', note: values.note }; fallback = 'Không thể hủy đơn hàng.'
    } else if (action.mode === 'status') {
      url = `${API}/admin/orders/${action.order.id}/status`; method = 'PATCH'
      payload = { status: action.status, note: values.note.trim() || null }; fallback = 'Không thể cập nhật trạng thái đơn hàng.'
    } else if (action.mode === 'address') {
      url = `${API}/admin/orders/${action.order.id}/address`; method = 'PATCH'
      payload = { customer_name: values.customer_name, customer_phone: values.customer_phone, customer_email: action.order.customer_email, shipping_address: { ...action.order.shipping_address, province: values.province, province_code: values.province_code, district: values.district || null, ward: values.ward, ward_code: values.ward_code, street: values.street } }; fallback = 'Không thể cập nhật địa chỉ.'
    } else {
      url = `${API}/admin/orders/${action.order.id}/refund`; method = 'POST'
      payload = { amount: Number(values.refund_amount), reason: values.reason }; fallback = 'Không thể ghi nhận hoàn tiền.'
    }
    const response = await adminApiFetch(url, { method, headers, body: JSON.stringify(payload) })
    const body = await response.json() as { data?: Order | OrderDetail | { count: number }; message?: string; errors?: Record<string, string[]> }
    if (!response.ok || !body.data) throw createApiResponseError(body, response.status, fallback)
    if (action.mode === 'bulk-cancel' || action.mode === 'bulk-status') {
      const result = body.data as { count: number }
      setSelectedOrderIds((ids) => ids.filter((id) => !action.orderIds.includes(id)))
      setListRefresh((revision) => revision + 1); notify(action.mode === 'bulk-cancel' ? `Đã hủy ${result.count} đơn hàng` : `Đã cập nhật trạng thái ${result.count} đơn hàng`)
    } else if (action.mode === 'cancel') {
      const result = body.data as Order
      setOrders((items) => items.map((item) => item.id === action.order.id ? result : item))
      setSelectedOrder((current) => current?.id === action.order.id ? { ...current, ...result } : current)
      notify('Đã hủy đơn hàng')
    } else if (action.mode === 'status') {
      const result = body.data as Order
      setOrders((items) => items.map((item) => item.id === action.order.id ? result : item))
      setSelectedOrder((current) => current?.id === action.order.id ? { ...current, ...result } : current)
      notify('Đã cập nhật trạng thái đơn hàng')
    } else {
      const result = body.data as OrderDetail
      setSelectedOrder(result)
      setOrders((items) => items.map((item) => item.id === action.order.id ? { ...item, ...(action.mode === 'address' ? { customer_name: result.customer_name, customer_phone: result.customer_phone } : { payment_status: result.payment_status }) } : item))
      notify(action.mode === 'address' ? 'Đã cập nhật địa chỉ giao hàng' : 'Đã ghi nhận hoàn tiền')
    }
  }

  const loadOrderDetail = async (orderId: number) => {
    const requestVersion = ++orderDetailRequestVersion.current
    setOrderDetailTargetId(orderId)
    setOrderDetailLoading(true)
    setOrderDetailError('')
    setSelectedOrder(null)
    try {
      const order = await fetchAdminOrderDetail(API, accessToken, orderId)
      if (requestVersion === orderDetailRequestVersion.current) { setSelectedOrder(order); return order }
    } catch (error) {
      if (requestVersion === orderDetailRequestVersion.current) setOrderDetailError(error instanceof Error ? error.message : 'Không thể tải chi tiết đơn hàng.')
    } finally {
      if (requestVersion === orderDetailRequestVersion.current) setOrderDetailLoading(false)
    }
    return null
  }

  const openOrderDetail = (order: Order) => { void loadOrderDetail(order.id) }
  const reviewOrderChangeRequest = async (requestId: number, decision: 'approved' | 'rejected', note: string) => {
    if (!selectedOrder) return
    const orderId = selectedOrder.id
    const response = await adminApiFetch(`${API}/admin/orders/${orderId}/change-requests/${requestId}/review`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ decision, resolution_note: note || null }),
    })
    const body = await response.json() as { data?: OrderDetail; message?: string; errors?: Record<string, string[]> }
    if (!response.ok || !body.data) throw createApiResponseError(body, response.status, 'Không thể xử lý yêu cầu hủy/trả.')
    setSelectedOrder(body.data)
    setOrders((current) => current.map((item) => item.id === orderId ? { ...item, status: body.data!.status } : item))
    setListRefresh((current) => current + 1)
    notify(decision === 'approved' ? 'Đã chấp thuận yêu cầu.' : 'Đã từ chối yêu cầu.')
  }
  const setOrderStatusTab = (status: string) => {
    setOrderStatus(status)
    setOrderQueue('')
    updateListFilterParam('status', status)
    if (orderQueue) updateListFilterParam('queue', '')
  }
  const printOrderFromList = async (orderId: number) => {
    const order = await loadOrderDetail(orderId)
    if (order) printOrderDocument('invoice', [order])
  }
  const printOrderDocument = (mode: 'invoice' | 'delivery', orders: OrderDetail[] = selectedOrder ? [selectedOrder] : []) => {
    if (orders.length === 0) return
    setOrderPrintOrders(orders)
    setOrderPrintMode(mode)
    window.setTimeout(() => window.print(), 120)
  }
  const printSelectedOrders = async (mode: 'invoice' | 'delivery') => {
    if (!selectedOrderIds.length || orderPrintLoading) return
    if (selectedOrderIds.length > 100) {
      notify('Chỉ có thể in tối đa 100 đơn mỗi lần.')
      return
    }
    setOrderPrintLoading(true)
    try {
      const details: OrderDetail[] = []
      for (let index = 0; index < selectedOrderIds.length; index += 5) {
        const batch = selectedOrderIds.slice(index, index + 5)
        details.push(...await Promise.all(batch.map((id) => fetchAdminOrderDetail(API, accessToken, id))))
      }
      printOrderDocument(mode, details)
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Không thể tải chi tiết các đơn đã chọn để in.')
    } finally {
      setOrderPrintLoading(false)
    }
  }

  const moderateReview = async (review: Review, status: 'approved' | 'rejected', reason?: string) => {
      const response = await adminApiFetch(`${API}/admin/reviews/${review.id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ status, ...(reason ? { reason } : {}) }) })
      const body = await response.json() as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(body, response.status, 'Không thể cập nhật đánh giá.')
      setReviews((current) => current.filter((item) => item.id !== review.id))
      setSelectedReviewIds((ids) => ids.filter((id) => id !== review.id))
      if (reviewDetail?.id === review.id) setReviewDetail(null)
      notify(status === 'approved' ? 'Đã duyệt đánh giá' : 'Đã ẩn đánh giá')
  }

  const bulkModerateReviews = async (reviewIds: number[], status: 'approved' | 'rejected', reason?: string) => {
    if (!reviewIds.length) return
      const response = await adminApiFetch(`${API}/admin/reviews/bulk-status`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ review_ids: reviewIds, status, ...(reason ? { reason } : {}) }) })
      const body = await response.json() as { data?: { count: number }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(body, response.status, 'Không thể cập nhật đánh giá hàng loạt.')
      if (!body.data) throw new Error(body.message ?? 'Không thể cập nhật đánh giá hàng loạt.')
      setSelectedReviewIds([]); setReviews((items) => items.filter((item) => !reviewIds.includes(item.id))); notify(status === 'approved' ? `Đã duyệt ${body.data.count} đánh giá` : `Đã ẩn ${body.data.count} đánh giá`)
  }

  const deleteReview = async () => {
    if (!reviewToDelete) return
    try {
      const response = await adminApiFetch(`${API}/admin/reviews/${reviewToDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { message?: string }
      if (!response.ok) throw new Error(body.message ?? 'Không thể xóa đánh giá.')
      setReviews((items) => items.filter((item) => item.id !== reviewToDelete.id))
      setSelectedReviewIds((ids) => ids.filter((id) => id !== reviewToDelete.id))
      if (reviewDetail?.id === reviewToDelete.id) setReviewDetail(null)
      notify('Đã xóa đánh giá')
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể xóa đánh giá.') }
    finally { setReviewToDelete(null) }
  }

  const openReviewDetail = async (review: Review) => {
    try {
      const response = await adminApiFetch(`${API}/admin/reviews/${review.id}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { data?: ReviewDetail; message?: string }
      if (!response.ok || !body.data) throw new Error(body.message ?? 'Không thể tải chi tiết đánh giá.')
      setReviewDetail(body.data)
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể tải chi tiết đánh giá.') }
  }

  const saveReviewResponse = async (review: ReviewDetail, storeResponse: string | null) => {
    const response = await adminApiFetch(`${API}/admin/reviews/${review.id}/response`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ response: storeResponse }) })
    const body = await response.json() as { data?: ReviewDetail; message?: string; errors?: Record<string, string[]> }
    if (!response.ok || !body.data) throw createApiResponseError(body, response.status, 'Không thể lưu phản hồi của cửa hàng.')
    setReviewDetail(body.data)
    notify(storeResponse ? 'Đã lưu phản hồi của cửa hàng' : 'Đã xóa phản hồi của cửa hàng')
  }

  const adjustInventory = (item: InventoryItem) => setAdjustingInventory(item)

  const saveInventoryThreshold = async () => {
    const threshold = Number(inventoryThreshold)
    if (!selectedInventoryVariantIds.length || !Number.isInteger(threshold) || threshold < 0 || threshold > 1000000) {
      notifyError('Chọn ít nhất một biến thể và nhập ngưỡng nguyên từ 0 đến 1.000.000.')
      return
    }
    setInventoryThresholdUpdating(true)
    try {
      const response = await adminApiFetch(`${API}/admin/inventory/threshold`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ variant_ids: selectedInventoryVariantIds.map(Number), low_stock_threshold: threshold }) })
      const body = await response.json() as { data?: { updated: number; low_stock_threshold: number }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? 'Không thể cập nhật ngưỡng cảnh báo.')
      const updatedIds = new Set(selectedInventoryVariantIds.map(Number))
      setInventory((items) => items.map((item) => updatedIds.has(item.variant_id) ? { ...item, low_stock_threshold: body.data!.low_stock_threshold } : item))
      setSelectedInventoryVariantIds([])
      setInventoryThreshold('')
      notify(body.message ?? `Đã cập nhật ngưỡng cho ${body.data.updated} biến thể.`)
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể cập nhật ngưỡng cảnh báo.') } finally { setInventoryThresholdUpdating(false) }
  }

  const bulkProductAction = async (action: 'activate' | 'hide' | 'archive' | 'feature' | 'unfeature' | 'assign_category' | 'assign_collections' | 'assign_tags', values: Record<string, unknown> = {}) => {
    if (!selectedProductIds.length) return
    try {
      const response = await adminApiFetch(`${API}/admin/products/bulk`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ids: selectedProductIds, action, ...values }) })
      const body = await response.json() as { data?: { count: number }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? 'Không thể cập nhật sản phẩm.')
      setSelectedProductIds([]); setBulkProductCategoryId(''); setBulkProductCollectionIds([]); setBulkProductTagIds([]); setListRefresh((revision) => revision + 1); notify(body.message ?? 'Đã cập nhật sản phẩm.')
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể cập nhật sản phẩm.') }
  }

  const exportProducts = async () => {
    const params = new URLSearchParams()
    if (debouncedProductSearch.trim()) params.set('q', debouncedProductSearch.trim())
    if (productStatusFilter) params.set('status', productStatusFilter)
    if (productFeaturedFilter) params.set('is_featured', productFeaturedFilter)
    if (productNewFilter) params.set('is_new', productNewFilter)
    if (productStockFilter) params.set('stock_status', productStockFilter)
    if (productSort) params.set('sort', productSort)
    productCategoryFilters.forEach((id) => params.append('category_ids[]', id))
    productBrandFilters.forEach((id) => params.append('brand_ids[]', id))
    productCollectionFilters.forEach((id) => params.append('collection_ids[]', id))
    if (productGenderFilter) params.set('target_gender', productGenderFilter)
    if (productMinPrice) params.set('min_price', productMinPrice)
    if (productMaxPrice) params.set('max_price', productMaxPrice)
    if (productSaleFilter) params.set('has_sale', productSaleFilter)
    if (productImageFilter) params.set('has_image', productImageFilter)
    if (productCreatedFrom) params.set('created_from', productCreatedFrom)
    if (productCreatedTo) params.set('created_to', productCreatedTo)
    try {
      if (await enqueueAdminExportWhenLarge({ apiUrl: API, accessToken, type: 'products', rowCount: productsMeta.total, filters: params })) {
        notify('Đã đưa tệp sản phẩm vào Trung tâm tải xuống.'); return
      }
      const response = await adminApiFetch(`${API}/admin/products/export?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/csv' } })
      if (!response.ok) throw new Error('Không thể xuất danh sách sản phẩm.')
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `products-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể xuất danh sách sản phẩm.') }
  }

  const setProductStatus = async (product: Product, active: boolean) => {
    if (!permissions.includes('products.update') || productStatusUpdatingIds.includes(product.id)) return
    const status = active ? 'active' : 'hidden'
    setProductStatusUpdatingIds((ids) => [...ids, product.id])
    try {
      const response = await adminApiFetch(`${API}/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status }),
      })
      const body = await response.json() as { data?: Product; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? 'Không thể cập nhật trạng thái sản phẩm.')
      setProducts((items) => items.map((item) => item.id === product.id ? { ...item, status: body.data?.status ?? status } : item))
      setListRefresh((revision) => revision + 1)
      notify(status === 'active' ? `Đã bật bán sản phẩm “${product.name}”.` : `Đã ẩn sản phẩm “${product.name}”.`)
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái sản phẩm.')
    } finally {
      setProductStatusUpdatingIds((ids) => ids.filter((id) => id !== product.id))
    }
  }

  const exportOrders = async () => {
    const params = new URLSearchParams({ ...(orderSearch ? { q: orderSearch } : {}), ...(orderStatus ? { status: orderStatus } : {}), ...(orderQueue ? { queue: orderQueue } : {}), ...(orderPaymentStatus ? { payment_status: orderPaymentStatus } : {}), ...(orderPaymentMethod ? { payment_method: orderPaymentMethod } : {}), ...(orderShippingMethodId ? { shipping_method_ids: orderShippingMethodId } : {}), ...(orderCouponCode ? { coupon_code: orderCouponCode } : {}), ...(orderProvinceCodes ? { province_codes: orderProvinceCodes } : {}), ...(orderHasNote ? { has_note: orderHasNote } : {}), ...(orderFrom ? { from: orderFrom } : {}), ...(orderTo ? { to: orderTo } : {}), ...(orderMinTotal ? { min_total: orderMinTotal } : {}), ...(orderMaxTotal ? { max_total: orderMaxTotal } : {}), ...(orderSort ? { sort: orderSort } : {}) })
    try {
      if (await enqueueAdminExportWhenLarge({ apiUrl: API, accessToken, type: 'orders', rowCount: ordersMeta.total, filters: params })) {
        notify('Đã đưa tệp đơn hàng vào Trung tâm tải xuống.'); return
      }
      const response = await adminApiFetch(`${API}/admin/orders/export?${params.toString()}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/csv' } })
      if (!response.ok) throw new Error('Không thể xuất CSV.')
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể xuất CSV.') }
  }

  const exportInventory = async () => {
    const params = new URLSearchParams({ ...(inventorySearch ? { q: inventorySearch } : {}), ...(lowStockOnly ? { low_stock: '1' } : {}), ...(inventoryStockStatus ? { stock_status: inventoryStockStatus } : {}), ...(inventoryCategoryId ? { category_id: inventoryCategoryId } : {}), ...(inventoryBrandId ? { brand_id: inventoryBrandId } : {}), ...(inventoryColorId ? { color_value_id: inventoryColorId } : {}), ...(inventorySizeId ? { size_value_id: inventorySizeId } : {}), ...(inventorySort ? { sort: inventorySort } : {}) })
    try {
      if (await enqueueAdminExportWhenLarge({ apiUrl: API, accessToken, type: 'inventory', rowCount: inventoryMeta.total, filters: params })) {
        notify('Đã đưa tệp tồn kho vào Trung tâm tải xuống.'); return
      }
      const response = await adminApiFetch(`${API}/admin/inventory/export?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/csv' } })
      if (!response.ok) throw new Error('Không thể xuất CSV tồn kho.')
      const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể xuất CSV tồn kho.') }
  }

  const archiveProduct = async (product: Product) => {
    try {
      const response = await adminApiFetch(`${API}/admin/products/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { message?: string }
      if (!response.ok) throw new Error(body.message ?? 'Không thể lưu trữ sản phẩm.')
      setProducts((items) => items.filter((item) => item.id !== product.id))
      notify(body.message ?? 'Đã lưu trữ sản phẩm')
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể lưu trữ sản phẩm.') }
  }

  const duplicateProduct = async (product: Product) => {
    try {
      const response = await adminApiFetch(`${API}/admin/products/${product.id}/duplicate`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { data?: Product; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? 'Không thể nhân bản sản phẩm.')
      setProducts((items) => [body.data!, ...items]); notify('Đã nhân bản sản phẩm')
    } catch (error) { notifyError(error instanceof Error ? error.message : 'Không thể nhân bản sản phẩm.') }
  }

  useEffect(() => {
    const syncRoute = () => {
      const nextRouteKey = routeGuardKey()
      if (nextRouteKey !== routeGuardKeyRef.current && !confirmUnsavedForms()) {
        history.pushState({}, '', routeHrefRef.current)
        return
      }
      routeGuardKeyRef.current = nextRouteKey
      routeHrefRef.current = `${location.pathname}${location.search}${location.hash}`
      const params = new URLSearchParams(window.location.search)
       const route = params.get('page') ?? directPathMap[window.location.pathname] ?? 'dashboard'
      const value = (key: string, fallback = '') => params.get(`${route}_${key}`) ?? fallback
      setListPage(Math.max(1, Number(value('page', '1')) || 1))
      setProductSearch(value('q'))
      setProductStatusFilter(value('status'))
      setProductFeaturedFilter(value('is_featured', params.get(`${route}_featured`) ?? ''))
      setProductNewFilter(value('is_new'))
      setProductStockFilter(value('stock_status', params.get(`${route}_in_stock`) === '1' ? 'in_stock' : params.get(`${route}_in_stock`) === '0' ? 'out_of_stock' : ''))
      setProductSort(value('sort', '-updated_at'))
      setProductCategoryFilters((value('category_ids', value('category_id')).split(',').filter(Boolean)))
      setProductBrandFilters((value('brand_ids', value('brand_id')).split(',').filter(Boolean)))
      setProductCollectionFilters(value('collection_ids').split(',').filter(Boolean))
      setProductGenderFilter(value('target_gender'))
      setProductMinPrice(value('min_price'))
      setProductMaxPrice(value('max_price'))
      setProductSaleFilter(value('has_sale'))
      setProductImageFilter(value('has_image'))
      setProductCreatedFrom(value('created_from'))
      setProductCreatedTo(value('created_to'))
      setOrderSearch(value('q'))
      setOrderStatus(value('status', params.get('status') ?? ''))
      setOrderQueue(value('queue'))
      setOrderPaymentStatus(value('payment_status', params.get('payment_status') ?? ''))
      setOrderPaymentMethod(value('payment_method', params.get('payment_method') ?? ''))
      setOrderShippingMethodId(value('shipping_method_ids', value('shipping_method_id')))
      setOrderCouponCode(value('coupon_code'))
      setOrderProvinceCodes(value('province_codes'))
      setOrderHasNote(value('has_note'))
      setOrderMinTotal(value('min_total'))
      setOrderMaxTotal(value('max_total'))
      setOrderSort(value('sort', '-placed_at'))
      setOrderFrom(value('from', params.get('from') ?? ''))
      setOrderTo(value('to', params.get('to') ?? ''))
      setInventorySearch(value('q'))
      setLowStockOnly(value('low_stock') === '1')
      setInventoryStockStatus(value('stock_status', params.get('stock') === 'low' ? 'low' : ''))
      setInventoryCategoryId(value('category_id'))
      setInventoryBrandId(value('brand_id'))
      setInventoryColorId(value('color_value_id'))
      setInventorySizeId(value('size_value_id'))
      setInventorySort(value('sort', 'product_name'))
      setReviewStatus(value('status', 'pending'))
      setReviewSearch(value('q'))
      setReviewRating(value('rating'))
      setReviewHasImages(value('has_images'))
      setReviewVerifiedPurchase(value('verified_purchase'))
      setReviewFit(value('fit'))
      setReviewFrom(value('from'))
      setReviewTo(value('to'))
      setReviewSort(value('sort', '-created_at'))
      setSelectedProductIds([])
      setSelectedOrderIds([])
      setSelectedReviewIds([])
      setRouteVersion((version) => version + 1)
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  useEffect(() => {
    routeHrefRef.current = `${location.pathname}${location.search}${location.hash}`
    routeGuardKeyRef.current = routeGuardKey()
  }, [routeVersion])

  const navigate = (href: string) => {
    if (!confirmUnsavedForms()) return
    history.pushState({}, '', href)
    window.dispatchEvent(new Event('popstate'))
  }

  useEffect(() => {
    if (!adminUser?.must_change_password || location.pathname === '/account/security') return
    history.replaceState({}, '', '/account/security')
    window.dispatchEvent(new Event('popstate'))
  }, [adminUser?.must_change_password, routeVersion])

  if (page === 'login' || (authChecked && !accessToken && !recoveryPath)) return <AdminAuthLayout><section className="login-card"><a className="admin-brand login-brand" href="/" aria-label="NÉT Studio"><img className="login-brand-mark" src="/branding/net-studio-mark.png" alt="" /></a><p className="eyebrow">{t("KHU QUẢN TRỊ")}</p><h1>{twoFactorChallenge ? t("Xác thực đăng nhập") : t("Chào mừng trở lại")}</h1><p className="login-lede">{twoFactorChallenge ? t("Nhập mã từ ứng dụng xác thực để tiếp tục.") : t("Đăng nhập để quản lý cửa hàng NÉT.")}</p>{twoFactorChallenge ? <form onSubmit={verifyTwoFactorLogin}>{useRecoveryCode ? <FormField id="admin-login-recovery-code" label={t("Mã khôi phục")} required><input autoComplete="one-time-code" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 14))} required /></FormField> : <FormField id="admin-login-two-factor-code" label={t("Mã xác thực 6 số")} required><AdminOtpInput id="admin-login-two-factor-code" label={t("Mã OTP")} value={twoFactorCode} onChange={setTwoFactorCode} autoFocus /></FormField>}{authError && <p className="auth-error" role="alert">{authError}</p>}<button className="primary login-submit" type="submit" disabled={loginBusy || (useRecoveryCode ? recoveryCode.length !== 14 : twoFactorCode.length !== 6)}>{loginBusy ? t("Đang xác thực…") : t("Xác thực và đăng nhập")}</button><button className="link-button" type="button" onClick={() => { setUseRecoveryCode((value) => !value); setAuthError('') }}>{useRecoveryCode ? t("Dùng mã từ ứng dụng xác thực") : t("Dùng mã khôi phục")}</button><button className="link-button" type="button" onClick={() => { setTwoFactorChallenge(''); setUseRecoveryCode(false); setTwoFactorCode(''); setRecoveryCode(''); setAuthError('') }}>{t("Quay lại đăng nhập")}</button></form> : <><form onSubmit={login}><FormField id="admin-login-email" label={t("Email")} required error={loginFieldErrors.email}><input type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setLoginFieldErrors((current) => ({ ...current, email: undefined })) }} placeholder="you@netstudio.vn" /></FormField><label className="login-remember"><input type="checkbox" checked={rememberLogin} onChange={(event) => setRememberLogin(event.target.checked)} /> <span>{t("Ghi nhớ đăng nhập")}</span></label><div className="login-password-row"><FormField id="admin-login-password" showPasswordToggle={false} label={t("Mật khẩu")} required error={loginFieldErrors.password}><input type={loginPasswordVisible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setLoginFieldErrors((current) => ({ ...current, password: undefined })) }} placeholder={t("Nhập mật khẩu")} /></FormField><button className="login-password-toggle" type="button" aria-label={loginPasswordVisible ? t("Ẩn mật khẩu") : t("Hiện mật khẩu")} aria-pressed={loginPasswordVisible} onClick={() => setLoginPasswordVisible((visible) => !visible)}>{loginPasswordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>{authError && <p className="auth-error" role="alert">{authError}</p>}<button className="primary login-submit" type="submit" disabled={loginBusy}>{loginBusy ? <><LoaderCircle className="login-spinner" aria-hidden="true" />  {t("Đang đăng nhập…")}</> : <>{t("Đăng nhập")} <span aria-hidden="true">↗</span></>}</button><a className="login-forgot-link" href="/forgot-password">{t("Quên mật khẩu?")}</a></form></>}<small className="login-help">{t("Tài khoản quản trị được cấp bởi chủ cửa hàng.")}</small></section></AdminAuthLayout>
  if (page === 'acceptInvite' && pathInviteToken) return <Suspense fallback={<p role="status">{t('Đang tải trang…')}</p>}><StaffInvitationPage apiUrl={API} token={pathInviteToken} onAuthenticated={(token) => { setAccessToken(token); history.replaceState({}, '', '/') }} /></Suspense>
  if (recoveryPath) return <Suspense fallback={<p role="status">{t('Đang tải trang khôi phục…')}</p>}><PasswordRecoveryPage apiUrl={API} token={recoveryToken} mode={recoveryPath} /></Suspense>
  if (errorCode) return <Suspense fallback={<p role="status">{t('Đang tải trang lỗi…')}</p>}><AdminErrorPage code={errorCode} /></Suspense>
  if (location.pathname === '/locked') return <Suspense fallback={<p role="status">{t('Đang tải trang khóa tài khoản…')}</p>}><AdminLockedPage /></Suspense>
  if (!authChecked) return <main className="auth-loading">{t("Đang khôi phục phiên làm việc…")}</main>
  const productFilterChips: ActiveFilterChip[] = []
  const addProductChip = (id: string, label: string, remove: () => void) => productFilterChips.push({ id, label, onRemove: remove })
  if (productSearch) addProductChip('q', t('Tìm: {{query}}', { query: productSearch }), () => { setProductSearch(''); updateListFilterParam('q', '') })
  if (productStatusFilter) addProductChip('status', t('Trạng thái: {{status}}', { status: t(getStatusLabel('product', productStatusFilter)) }), () => { setProductStatusFilter(''); updateListFilterParam('status', '') })
  if (productFeaturedFilter) addProductChip('is_featured', productFeaturedFilter === '1' ? t('Nổi bật') : t('Không nổi bật'), () => { setProductFeaturedFilter(''); updateListFilterParam('is_featured', '') })
  if (productNewFilter) addProductChip('is_new', productNewFilter === '1' ? t('Hàng mới') : t('Không phải hàng mới'), () => { setProductNewFilter(''); updateListFilterParam('is_new', '') })
  if (productStockFilter) addProductChip('stock_status', t('Tồn kho: {{status}}', { status: ({ in_stock: t('Còn hàng'), low_stock: t('Sắp hết'), out_of_stock: t('Hết hàng') } as Record<string, string>)[productStockFilter] ?? productStockFilter }), () => { setProductStockFilter(''); updateListFilterParam('stock_status', '') })
  if (productCategoryFilters.length) addProductChip('category_ids', t('Danh mục ({{count}})', { count: formatNumber(productCategoryFilters.length) }), () => { setProductCategoryFilters([]); updateListFilterParam('category_ids', '') })
  if (productBrandFilters.length) addProductChip('brand_ids', t('Thương hiệu ({{count}})', { count: formatNumber(productBrandFilters.length) }), () => { setProductBrandFilters([]); updateListFilterParam('brand_ids', '') })
  if (productCollectionFilters.length) addProductChip('collection_ids', t('Bộ sưu tập ({{count}})', { count: formatNumber(productCollectionFilters.length) }), () => { setProductCollectionFilters([]); updateListFilterParam('collection_ids', '') })
  if (productGenderFilter) addProductChip('target_gender', t('Đối tượng: {{gender}}', { gender: ({ male: t('Nam'), female: t('Nữ'), unisex: t('Unisex'), kids: t('Trẻ em') } as Record<string, string>)[productGenderFilter] ?? productGenderFilter }), () => { setProductGenderFilter(''); updateListFilterParam('target_gender', '') })
  if (productMinPrice) addProductChip('min_price', t('Giá từ {{price}}', { price: fmt(Number(productMinPrice)) }), () => { setProductMinPrice(''); updateListFilterParam('min_price', '') })
  if (productMaxPrice) addProductChip('max_price', t('Giá đến {{price}}', { price: fmt(Number(productMaxPrice)) }), () => { setProductMaxPrice(''); updateListFilterParam('max_price', '') })
  if (productSaleFilter) addProductChip('has_sale', productSaleFilter === '1' ? t('Có giảm giá') : t('Không giảm giá'), () => { setProductSaleFilter(''); updateListFilterParam('has_sale', '') })
  if (productImageFilter) addProductChip('has_image', productImageFilter === '1' ? t('Có ảnh') : t('Không có ảnh'), () => { setProductImageFilter(''); updateListFilterParam('has_image', '') })
  if (productCreatedFrom) addProductChip('created_from', t('Tạo từ {{date}}', { date: formatDate(productCreatedFrom) }), () => { setProductCreatedFrom(''); updateListFilterParam('created_from', '') })
  if (productCreatedTo) addProductChip('created_to', t('Tạo đến {{date}}', { date: formatDate(productCreatedTo) }), () => { setProductCreatedTo(''); updateListFilterParam('created_to', '') })
  const orderFilterChips: ActiveFilterChip[] = []
  const addOrderChip = (id: string, label: string, remove: () => void) => orderFilterChips.push({ id, label, onRemove: remove })
  if (orderSearch) addOrderChip('q', t('Tìm: {{query}}', { query: orderSearch }), () => { setOrderSearch(''); updateListFilterParam('q', '') })
  if (orderStatus) addOrderChip('status', t('Đơn: {{status}}', { status: t(getStatusLabel('order', orderStatus)) }), () => setOrderStatusTab(''))
  if (orderQueue) addOrderChip('queue', orderQueue === 'overdue' ? t('Đơn quá hạn xử lý (>24 giờ)') : t('Đơn hủy/hoàn trong 7 ngày'), () => { setOrderQueue(''); updateListFilterParam('queue', '') })
  if (orderPaymentStatus) addOrderChip('payment_status', t('Thanh toán: {{status}}', { status: t(getStatusLabel('payment', orderPaymentStatus)) }), () => { setOrderPaymentStatus(''); updateListFilterParam('payment_status', '') })
  if (orderPaymentMethod) addOrderChip('payment_method', t('Phương thức: {{method}}', { method: orderPaymentMethod === 'cod' ? 'COD' : orderPaymentMethod === 'bank_transfer' ? t('Chuyển khoản') : orderPaymentMethod === 'other' ? t('Phương thức khác') : orderPaymentMethod }), () => { setOrderPaymentMethod(''); updateListFilterParam('payment_method', '') })
  if (orderShippingMethodId) addOrderChip('shipping_method_ids', t('Vận chuyển ({{count}})', { count: formatNumber(orderShippingMethodId.split(',').length) }), () => { setOrderShippingMethodId(''); updateListFilterParam('shipping_method_ids', '') })
  if (orderCouponCode) addOrderChip('coupon_code', t('Mã giảm giá: {{code}}', { code: orderCouponCode }), () => { setOrderCouponCode(''); updateListFilterParam('coupon_code', '') })
  if (orderProvinceCodes) addOrderChip('province_codes', t('Tỉnh/thành ({{count}})', { count: formatNumber(orderProvinceCodes.split(',').length) }), () => { setOrderProvinceCodes(''); updateListFilterParam('province_codes', '') })
  if (orderHasNote) addOrderChip('has_note', orderHasNote === '1' ? t('Có ghi chú') : t('Không có ghi chú'), () => { setOrderHasNote(''); updateListFilterParam('has_note', '') })
  if (orderMinTotal) addOrderChip('min_total', t('Tổng từ {{amount}}', { amount: fmt(Number(orderMinTotal)) }), () => { setOrderMinTotal(''); updateListFilterParam('min_total', '') })
  if (orderMaxTotal) addOrderChip('max_total', t('Tổng đến {{amount}}', { amount: fmt(Number(orderMaxTotal)) }), () => { setOrderMaxTotal(''); updateListFilterParam('max_total', '') })
  if (orderFrom) addOrderChip('from', t('Đặt từ {{date}}', { date: formatDate(orderFrom) }), () => { setOrderFrom(''); updateListFilterParam('from', '') })
  if (orderTo) addOrderChip('to', t('Đặt đến {{date}}', { date: formatDate(orderTo) }), () => { setOrderTo(''); updateListFilterParam('to', '') })
  const inventoryFilterChips: ActiveFilterChip[] = []
  const addInventoryChip = (id: string, label: string, remove: () => void) => inventoryFilterChips.push({ id, label, onRemove: remove })
  if (inventorySearch) addInventoryChip('q', t('Tìm: {{query}}', { query: inventorySearch }), () => { setInventorySearch(''); updateListFilterParam('q', '') })
  if (lowStockOnly) addInventoryChip('low_stock', t('Chỉ hàng sắp hết'), () => { setLowStockOnly(false); updateListFilterParam('low_stock', false) })
  if (inventoryStockStatus) addInventoryChip('stock_status', t('Tồn kho: {{status}}', { status: ({ available: t('Còn nhiều'), low: t('Sắp hết'), out: t('Hết hàng') } as Record<string, string>)[inventoryStockStatus] ?? inventoryStockStatus }), () => { setInventoryStockStatus(''); updateListFilterParam('stock_status', '') })
  if (inventoryCategoryId) addInventoryChip('category_id', t('Danh mục #{{id}}', { id: inventoryCategoryId }), () => { setInventoryCategoryId(''); updateListFilterParam('category_id', '') })
  if (inventoryBrandId) addInventoryChip('brand_id', t('Thương hiệu #{{id}}', { id: inventoryBrandId }), () => { setInventoryBrandId(''); updateListFilterParam('brand_id', '') })
  if (inventoryColorId) addInventoryChip('color_value_id', t('Màu #{{id}}', { id: inventoryColorId }), () => { setInventoryColorId(''); updateListFilterParam('color_value_id', '') })
  if (inventorySizeId) addInventoryChip('size_value_id', t('Kích cỡ #{{id}}', { id: inventorySizeId }), () => { setInventorySizeId(''); updateListFilterParam('size_value_id', '') })
  const reviewFilterChips: ActiveFilterChip[] = []
  const addReviewChip = (id: string, label: string, remove: () => void) => reviewFilterChips.push({ id, label, onRemove: remove })
  if (reviewSearch) addReviewChip('q', `Tìm: ${reviewSearch}`, () => { setReviewSearch(''); updateListFilterParam('q', '') })
  if (reviewStatus && reviewStatus !== 'pending') addReviewChip('status', `Trạng thái: ${reviewStatus}`, () => { setReviewStatus('pending'); updateListFilterParam('status', 'pending') })
  if (reviewRating) addReviewChip('rating', `${reviewRating} sao`, () => { setReviewRating(''); updateListFilterParam('rating', '') })
  if (reviewHasImages) addReviewChip('has_images', reviewHasImages === '1' ? 'Có ảnh' : 'Không có ảnh', () => { setReviewHasImages(''); updateListFilterParam('has_images', '') })
  if (reviewVerifiedPurchase) addReviewChip('verified_purchase', reviewVerifiedPurchase === '1' ? 'Đã mua hàng' : 'Chưa xác thực mua', () => { setReviewVerifiedPurchase(''); updateListFilterParam('verified_purchase', '') })
  if (reviewFit) addReviewChip('fit', `Độ vừa vặn: ${reviewFit}`, () => { setReviewFit(''); updateListFilterParam('fit', '') })
  if (reviewFrom) addReviewChip('from', `Từ ${reviewFrom}`, () => { setReviewFrom(''); updateListFilterParam('from', '') })
  if (reviewTo) addReviewChip('to', `Đến ${reviewTo}`, () => { setReviewTo(''); updateListFilterParam('to', '') })
  const openSidebarNavPopover = (group: string) => {
    if (sidebarNavPopoverCloseTimer.current !== null) window.clearTimeout(sidebarNavPopoverCloseTimer.current)
    sidebarNavPopoverCloseTimer.current = null
    setHoveredSidebarNavGroup(group)
  }
  const scheduleSidebarNavPopoverClose = () => {
    if (sidebarNavPopoverCloseTimer.current !== null) window.clearTimeout(sidebarNavPopoverCloseTimer.current)
    sidebarNavPopoverCloseTimer.current = window.setTimeout(() => {
      setHoveredSidebarNavGroup(null)
      sidebarNavPopoverCloseTimer.current = null
    }, 180)
  }
  const pinnedSidebarItems = adminPreferences.pinnedPages.flatMap((id) => {
    const option = sidebarDestinationOptions.find((destination) => destination.id === id)
    if (!option || (option.permission !== 'authenticated' && !sidebarPermissions.includes(option.permission))) return []
    const existing = adminNavGroups.flatMap((group) => group.items).find((item) => item.href === option.href)
    return [existing ?? { page: option.page, label: option.label, permission: option.permission, icon: Activity, href: option.href } as NavItem]
  })
  return <SidebarProvider
    open={!sidebarCollapsed}
    onOpenChange={(open) => { const collapsed = !open; setSidebarCollapsed(collapsed); setAdminPreferences((current) => ({ ...current, sidebarCollapsed: collapsed })) }}
    className="admin-shell"
    keyboardShortcut={false}
    data-admin-focus-mode={focusMode ? 'true' : 'false'}
    style={{ '--sidebar-width': '260px', '--sidebar-width-icon': '72px' } as React.CSSProperties}
  >
    <a className="skip-link" href="#admin-main-content">{t("Bỏ qua tới nội dung chính")}</a>
    <Sidebar collapsible="icon" className="admin-app-sidebar">
      <SidebarHeader className="admin-sidebar-header">
        <a className="admin-sidebar-brand" href={`/?page=${fallbackPage ?? 'dashboard'}`} aria-label={`${storeName} · Trang chủ quản trị`} title={sidebarCollapsed ? storeName : undefined}>
          <span className="sidebar-store-mark" aria-hidden="true">{storeLogo ? <img src={storeLogo} alt="" onError={(event) => event.currentTarget.remove()} /> : <i>{storeName.slice(0, 2).toUpperCase()}</i>}</span>
          <strong>{storeName}</strong>
        </a>
      </SidebarHeader>
      <SidebarContent className="admin-sidebar-content">
        <nav id="admin-sidebar-navigation" className="admin-sidebar-navigation" aria-label={t("Các màn hình admin")}>
          {pinnedSidebarItems.length > 0 && <SidebarGroup className="admin-sidebar-group admin-sidebar-pinned-group"><SidebarGroupLabel>{t("Mục ghim")}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{pinnedSidebarItems.map((item) => <AdminSidebarNavLink key={`pinned-${item.page}`} item={item} href={item.href ?? '/'} active={page === item.page} collapsed={sidebarCollapsed} onNavigate={navigate} />)}</SidebarMenu></SidebarGroupContent></SidebarGroup>}
          {visibleAdminNavGroups.map((group) => {
            const visibleItems = group.items.filter((item) => item.permission === 'authenticated' || sidebarPermissions.includes(item.permission))
            if (!visibleItems.length) return null
            const isDirectLink = group.items.length === 1
            const isExpanded = !collapsedNavGroups.includes(group.label)
            const routeParams = new URLSearchParams(location.search)
            const renderLink = (item: NavItem, sub = false) => {
              const hasSelectedFilterSibling = group.items.some((candidate) => candidate.page === item.page && candidate.filter
                && [routeParams.get(candidate.filter.param), routeParams.get(`${item.page}_${candidate.filter.param}`)].includes(candidate.filter.value))
              const isSelectedFilter = Boolean(item.filter
                && [routeParams.get(item.filter.param), routeParams.get(`${item.page}_${item.filter.param}`)].includes(item.filter.value))
              const hasSelectedPathSibling = group.items.some((candidate) => candidate.page === item.page && candidate.activePath === location.pathname)
              const isActive = (page === item.page && (item.filter ? isSelectedFilter : !hasSelectedFilterSibling && (!item.activePath || location.pathname === item.activePath) && !hasSelectedPathSibling)
                || (item.activePath === location.pathname && page === item.page))
                || (!item.activePath && item.page === 'products' && ['productDetail', 'productImages', 'collectionProducts'].includes(page))
                || (!item.activePath && item.page === 'inventoryAdjust' && page === 'inventoryAdjustmentBatch')
              const href = item.href ?? `/?page=${item.page}`
              const counts = alertsQuery.data?.counts
              const count = item.key === 'orders-pending' ? counts?.pending_orders
                : item.key === 'orders-failed' ? counts?.delivery_failed_orders
                  : item.key === 'inventory-low-stock' ? counts?.low_stock
                    : item.page === 'reviews' ? counts?.pending_reviews
                      : item.page === 'staff' ? counts?.pending_staff_approvals
                        : undefined
              return <AdminSidebarNavLink key={item.key ?? item.page} item={item} href={href} active={isActive} collapsed={sidebarCollapsed} sub={sub} count={count} onNavigate={navigate} />
            }

            const translatedGroupLabel = t(group.label)
            return <SidebarGroup key={group.label} className="admin-sidebar-group">
              <SidebarGroupContent>
                <SidebarMenu>
                   {isDirectLink ? renderLink(visibleItems[0]) : sidebarCollapsed ? <Popover open={hoveredSidebarNavGroup === group.label} onOpenChange={(open) => open ? openSidebarNavPopover(group.label) : setHoveredSidebarNavGroup(null)}>
                     <SidebarMenuItem onMouseEnter={() => openSidebarNavPopover(group.label)} onMouseLeave={scheduleSidebarNavPopoverClose}>
                      <PopoverTrigger asChild>
                        <SidebarMenuButton tooltip={sidebarCollapsed ? translatedGroupLabel : undefined} className="sidebar-group-toggle">
                          <group.icon size={17} aria-hidden="true" /><span>{translatedGroupLabel}</span>
                        </SidebarMenuButton>
                      </PopoverTrigger>
                      <PopoverContent side="right" align="start" className="admin-topbar-popover sidebar-collapsed-group-popover" onMouseEnter={() => openSidebarNavPopover(group.label)} onMouseLeave={scheduleSidebarNavPopoverClose}>
                        <strong>{translatedGroupLabel}</strong>
                        <SidebarMenu>{visibleItems.map((item) => renderLink(item))}</SidebarMenu>
                      </PopoverContent>
                    </SidebarMenuItem>
                  </Popover> : <Collapsible open={isExpanded} onOpenChange={(open) => updateCollapsedNavGroups((collapsed) => open ? collapsed.filter((label) => label !== group.label) : [...collapsed.filter((label) => label !== group.label), group.label])}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={sidebarCollapsed ? translatedGroupLabel : undefined} className="sidebar-group-toggle">
                          <group.icon size={17} aria-hidden="true" /><span>{translatedGroupLabel}</span>{!sidebarCollapsed && <ChevronDown className="sidebar-group-chevron" size={15} aria-hidden="true" />}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>{visibleItems.map((item) => renderLink(item, true))}</SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          })}
        </nav>
      </SidebarContent>
      <SidebarFooter className="admin-sidebar-footer" aria-label={t("Thông tin tài khoản đang đăng nhập")}>
        <div className="sidebar-identity-card">
          <span className="avatar sidebar-user-avatar" aria-hidden="true">
            {adminUser?.avatar ? <img src={mediaUrl(API, adminUser.avatar)} alt="" onError={(event) => event.currentTarget.remove()} /> : userName.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toLocaleUpperCase('vi-VN') ?? '').join('') || 'AD'}
            <i className="profile-presence" title={t("Phiên đang hoạt động")} />
          </span>
          <span className="sidebar-profile-copy"><strong>{userName}</strong><small>{userRole}</small></span>
        </div>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="admin-main" id="admin-main-content" tabIndex={-1}><AppHeader
      apiUrl={API}
      accessToken={accessToken}
      userId={adminUser?.id}
      userName={userName}
      email={adminUser?.email}
      avatar={mediaUrl(API, adminUser?.avatar)}
      userRole={userRole}
      permissions={sidebarPermissions}
       navigationGroups={visibleAdminNavGroups}
      searchPages={visibleAdminNavGroups.flatMap((group) => group.items.filter((item) => item.permission === 'authenticated' || sidebarPermissions.includes(item.permission)).map((item) => ({ id: item.key ?? item.page, label: item.label, detail: group.label, url: item.href ?? `/?page=${item.page}` })))}
      title={t(title)}
      fallbackPage={fallbackPage}
      theme={adminPreferences.theme}
      menuLayout={adminPreferences.menuLayout}
      locale={adminPreferences.locale}
      showBreadcrumbs={adminPreferences.showBreadcrumbs}
      onLocaleChange={(locale) => updateAdminPreference('locale', locale)}
      shortcuts={adminPreferences.shortcuts}
      shortcutsEnabled={adminPreferences.shortcutsEnabled && !adminScreenLocked}
      onNavigate={navigate}
      onToggleTheme={() => updateAdminPreference('theme', adminPreferences.theme === 'system' ? 'light' : adminPreferences.theme === 'light' ? 'dark' : 'system')}
      onLogout={() => void logout()}
      onSwitchAccount={(targetEmail) => void logout(targetEmail)}
      onToggleFocusMode={() => setFocusMode((current) => !current)}
      focusModeActive={focusMode}
      onLockScreen={lockAdminScreen}
      previewRoleName={rolePreview?.name}
      onRolePreview={(name, rolePermissions) => setRolePreview(name && rolePermissions ? { name, permissions: rolePermissions } : null)}
      onActionNotice={notify}
    />
    {focusMode && <button className="admin-focus-exit" type="button" onClick={() => setFocusMode(false)}>{t('Thoát chế độ tập trung')} <kbd>Esc</kbd></button>}
      <div className="content-wrap"><Suspense fallback={<p className="shared-loading" role="status">{t('Đang tải trang quản trị…')}</p>}>{page === "products" && productFilterOptionsQuery.isError && <p className="reference-error" role="alert">{productFilterOptionsQuery.error instanceof Error ? t(productFilterOptionsQuery.error.message) : t("Không tải được danh mục và thương hiệu.")} <button className="secondary" type="button" onClick={() => void productFilterOptionsQuery.refetch()}>{t("Thử lại")}</button></p>}{!showProductForm && page !== 'productDetail' && <PageHeader title={page === 'dashboard' ? t('Chào bạn, {{name}} 👋', { name: userGreetingName }) : title} description={page === 'dashboard' ? t('Đây là những gì đang diễn ra tại cửa hàng của bạn.') : currentPage ? t('Quản lý {{title}} của cửa hàng.', { title: t(title).toLocaleLowerCase() }) : t("Đường dẫn này không tồn tại trong khu vực quản trị.")} actions={page === 'products' && permissions.includes('products.create') ? <button className="primary" onClick={() => setShowProductForm(true)}>{t("Thêm sản phẩm")}</button> : null} />}
      {accessDenied ? <section className="panel admin-state-card" role="alert"><span className="admin-state-code">403</span><h2>{t("Không có quyền truy cập")}</h2><p>{t('Tài khoản {{name}} chưa được cấp quyền xem mục “{{section}}”. Nếu cần truy cập, hãy liên hệ quản trị viên.', { name: adminUser?.name ?? userName, section: t(title) })}</p>{fallbackPage && <a className="primary" href={`/?page=${fallbackPage}`}>{t("Quay lại")}{' '}{pageTitles[fallbackPage]}</a>}</section> : !currentPage ? <section className="panel admin-state-card"><span className="admin-state-code">404</span><h2>{t("Không tìm thấy trang")}</h2><p>{t("Trang quản trị này chưa tồn tại hoặc đường dẫn đã thay đổi.")}</p>{fallbackPage && <a className="primary" href={`/?page=${fallbackPage}`}>{t("Về")}{' '}{pageTitles[fallbackPage]}</a>}</section> : <>
      {adminUser && <Suspense fallback={null}><AccountOnboardingTour userId={adminUser.id} roles={adminRoles} permissions={permissions} forceOpen={page === 'helpTour'} /></Suspense>}
      {apiDown && page !== 'dashboard' && <div className="connection-note">{t("API chưa kết nối — các số liệu và thao tác đang ở chế độ xem trước.")}</div>}
      {page === 'products' && showProductForm && <ProductCreatePage apiUrl={API} accessToken={accessToken} onCancel={() => navigate('/products')} onCreated={(id) => { location.href = `/products/${id}/edit` }} />}
      {page === 'manualOrder' && <ManualOrderPage apiUrl={API} accessToken={accessToken} onBack={() => navigate('/orders')} onCreated={(id) => { notify(t("Đã tạo đơn hàng")); navigate(`/orders/${id}`) }} />}
      

      {dashboardVisited && !accessDenied && currentPage !== null && <AdminDashboardPage
        key={`${adminPreferences.dashboardDefaultPeriod}:${adminPreferences.dashboardComparePrevious}`}
        active={activeDashboard}
        apiUrl={API}
        accessToken={accessToken}
        userId={adminUser?.id}
        timezone={adminUser?.timezone}
        permissions={permissions}
        widgets={adminPreferences.dashboardWidgets}
        defaultPeriod={adminPreferences.dashboardDefaultPeriod}
        defaultComparePrevious={adminPreferences.dashboardComparePrevious}
        alertCounts={alertsQuery.data?.counts}
        alertsLoading={alertsQuery.isLoading}
        alertsError={alertsQuery.error instanceof Error ? alertsQuery.error.message : null}
        onRetryAlerts={() => void alertsQuery.refetch()}
        onNavigate={navigate}
      />}

       {['account', 'accountNotifications', 'accountActivity', 'accountPrivacy', 'accountTokens', 'preferences'].includes(page) && <AccountAreaLayout active={page === 'account' ? location.pathname.endsWith('/security') ? 'security' : location.pathname.endsWith('/sessions') ? 'sessions' : 'profile' : page === 'accountNotifications' ? 'notifications' : page === 'accountActivity' ? 'activity' : page === 'accountPrivacy' ? 'privacy' : page === 'accountTokens' ? 'tokens' : 'appearance'} onNavigate={navigate} canManageTokens={permissions.includes('api_tokens.manage')}>
         {page === 'preferences' && <AdminPreferencesPage value={adminPreferences} userId={adminUser?.id ?? 'guest'} permissions={sidebarPermissions} onChange={updateAdminPreference} onExportSettings={exportAdminAppearance} onImportSettings={importAdminAppearance} onReset={() => { setAdminPreferences(defaultAdminPreferences); setSidebarCollapsed(false) }} />}
         {page === 'account' && <Suspense fallback={<p role="status">{t("Đang tải cài đặt tài khoản…")}</p>}><AccountSettingsPage initialTab={location.pathname.endsWith('/security') ? 'security' : location.pathname.endsWith('/sessions') ? 'sessions' : 'profile'} apiUrl={API} accessToken={accessToken} mustChangePassword={adminUser?.must_change_password} onAccountUpdated={(data) => setAdminUser((old) => old ? { ...old, ...data } : old)} /></Suspense>}
         {page === 'accountNotifications' && adminUser && <Suspense fallback={<p role="status">{t("Đang tải thông báo…")}</p>}><AccountNotificationsPage apiUrl={API} accessToken={accessToken} accountId={adminUser.id} /></Suspense>}
         {page === 'accountActivity' && adminUser && <Suspense fallback={<p role="status">{t("Đang tải hoạt động…")}</p>}><AccountActivityPage apiUrl={API} accessToken={accessToken} accountId={adminUser.id} /></Suspense>}
         {page === 'accountPrivacy' && adminUser && <Suspense fallback={<p role="status">{t("Đang tải quyền riêng tư…")}</p>}><AccountPrivacyPage apiUrl={API} accessToken={accessToken} userId={adminUser.id} /></Suspense>}
         {page === 'accountTokens' && <Suspense fallback={<p role="status">{t("Đang tải API token…")}</p>}><AccountApiTokensPage apiUrl={API} accessToken={accessToken} /></Suspense>}
       </AccountAreaLayout>}
       {page === 'personalTasks' && <Suspense fallback={<p role="status">{t("Đang tải việc cần làm…")}</p>}><PersonalWorkspacePage kind="tasks" apiUrl={API} accessToken={accessToken} userId={adminUser?.id} permissions={permissions} onNavigate={navigate} /></Suspense>}
      {page === 'personalReminders' && <Suspense fallback={<p role="status">{t("Đang tải nhắc việc…")}</p>}><PersonalRemindersPage apiUrl={API} accessToken={accessToken} userId={adminUser?.id} onNavigate={navigate} /></Suspense>}
      {page === 'personalPerformance' && <Suspense fallback={<p role="status">{t("Đang tải hiệu suất cá nhân…")}</p>}><PersonalPerformancePage apiUrl={API} accessToken={accessToken} userId={adminUser?.id} /></Suspense>}
      {page === 'staffPerformance' && pathStaffPerformanceId && <Suspense fallback={<p role="status">{t("Đang tải hiệu suất nhân viên…")}</p>}><PersonalPerformancePage apiUrl={API} accessToken={accessToken} userId={adminUser?.id} targetUserId={Number(pathStaffPerformanceId)} /></Suspense>}
      {page === 'systemHealth' && <Suspense fallback={<p role="status">{t("Đang tải trạng thái hệ thống…")}</p>}><SystemHealthPage /></Suspense>}
      {page === 'systemBackups' && <Suspense fallback={<p role="status">{t("Đang tải danh sách sao lưu…")}</p>}><SystemBackupsPage /></Suspense>}
      {(page === 'helpCenter' || page === 'helpPolicy' || page === 'helpPrivacy') && <Suspense fallback={<p role="status">{t("Đang tải hướng dẫn…")}</p>}><AccountHelpPage page={page === 'helpCenter' ? 'guide' : page === 'helpPolicy' ? 'policy' : 'privacy'} userId={adminUser?.id} /></Suspense>}
      {page === 'helpDiagnostics' && <Suspense fallback={<p role="status">{t("Đang tải chẩn đoán…")}</p>}><HelpDiagnosticsPage apiUrl={API} accessToken={accessToken} userId={adminUser?.id} /></Suspense>}
      {page === 'helpChangelog' && <Suspense fallback={<p role="status">{t("Đang tải lịch sử cập nhật…")}</p>}><ChangelogPage userId={adminUser?.id} /></Suspense>}
      {page === 'helpLicenses' && <Suspense fallback={<p role="status">{t("Đang tải danh sách giấy phép…")}</p>}><LicensesPage /></Suspense>}
      {page === 'notificationsCenter' && adminUser && <Suspense fallback={<p role="status">{t("Đang tải trung tâm thông báo…")}</p>}><NotificationCenterPage apiUrl={API} accessToken={accessToken} accountId={adminUser.id} permissions={permissions} isSuperAdmin={adminRoles.includes('super_admin')} /></Suspense>}
      {page === 'accountLoginHistory' && <Suspense fallback={<p role="status">{t("Đang tải bảo mật tài khoản…")}</p>}><AccountLoginHistoryPage apiUrl={API} accessToken={accessToken} userId={adminUser?.id} /></Suspense>}
      {referenceKinds.includes(page as ReferenceKind) && <ReferenceDataPage kind={page as ReferenceKind} apiUrl={API} accessToken={accessToken} permissions={permissions} initialItemId={pathCollectionId ? Number(pathCollectionId) : undefined} onNavigate={navigate} />}
      {page === 'tags' && <TagsPage apiUrl={API} accessToken={accessToken} permissions={permissions} />}
      {operationsSections.includes(page as OperationsSection) && <OperationsPage section={page as OperationsSection} apiUrl={API} accessToken={accessToken} permissions={permissions} />}
      {campaignKinds.includes(page as CampaignKind) && <CampaignPage kind={page as CampaignKind} apiUrl={API} accessToken={accessToken} canManage={page === 'coupons' ? permissions.includes('coupons.manage') : permissions.includes('content.manage')} initialItemId={pathCouponId ? Number(pathCouponId) : undefined} onNavigate={navigate} />}
      {page === 'promotionNotifications' && <PromotionNotificationsPage apiUrl={API} accessToken={accessToken} />}
      {page === 'contentPages' && <ContentPagesPage apiUrl={API} accessToken={accessToken} />}
      {page === 'blogPosts' && <BlogPostsPage apiUrl={API} accessToken={accessToken} />}
      {page === 'faqs' && <FaqsPage apiUrl={API} accessToken={accessToken} />}
      {page === 'storeLocations' && <StoreLocationsPage apiUrl={API} accessToken={accessToken} permissions={permissions} />}
      {page === 'careerOpenings' && <CareerOpeningsPage apiUrl={API} accessToken={accessToken} />}
      {page === 'settings' && <StoreSettingsPage apiUrl={API} accessToken={accessToken} isOwner={adminRoles.includes('super_admin')} section="general" />}
      {page === 'settingsPayments' && <StoreSettingsPage apiUrl={API} accessToken={accessToken} isOwner={adminRoles.includes('super_admin')} section="payments" />}
      {page === 'settingsSecurity' && <StoreSettingsPage apiUrl={API} accessToken={accessToken} isOwner={adminRoles.includes('super_admin')} section="security" />}
      {page === 'settingsEmail' && <StoreSettingsPage apiUrl={API} accessToken={accessToken} isOwner={adminRoles.includes('super_admin')} section="email" />}
      {page === 'settingsSeo' && <StoreSettingsPage apiUrl={API} accessToken={accessToken} isOwner={adminRoles.includes('super_admin')} section="seo" />}
      {page === 'settingsMaintenance' && <StoreSettingsPage apiUrl={API} accessToken={accessToken} isOwner={adminRoles.includes('super_admin')} section="maintenance" />}
      {page === 'shippingMethods' && <ShippingMethodsPage apiUrl={API} accessToken={accessToken} canManage={permissions.includes('settings.manage')} />}
      {reportSections[page as AdminPage] && <ReportsPage apiUrl={API} accessToken={accessToken} section={reportSections[page as AdminPage]!} />}
      {page === 'reportSchedules' && <ReportSchedulesPage apiUrl={API} accessToken={accessToken} />}
      {page === 'downloads' && <DownloadsPage apiUrl={API} accessToken={accessToken} canViewAll={permissions.includes('exports.view_all')} currentUserId={adminUser?.id} />}
      {page === 'activityLogs' && <ActivityLogsPage apiUrl={API} accessToken={accessToken} />}
      {page === 'staff' && <StaffPage apiUrl={API} accessToken={accessToken} currentUserId={adminUser?.id} canManageAdminRole={adminRoles.includes('super_admin')} canManageSecurity={permissions.includes('staff.security')} canViewActivityLogs={permissions.includes('settings.manage')} canViewPerformance={permissions.includes('staff.view_performance')} />}
      {page === 'roles' && <RolePermissionMatrix apiUrl={API} accessToken={accessToken} canEdit={adminRoles.includes('super_admin')} />}
       {page === 'customers' && <CustomersPage apiUrl={API} accessToken={accessToken} canManage={permissions.includes('users.manage')} initialCustomerId={pathCustomerId ? Number(pathCustomerId) : undefined} />}
      {page === 'orders' && selectedOrder && permissions.includes('orders.update_status') && <OrderNoteEditor key={selectedOrder.id} orderId={selectedOrder.id} initialNote="" apiUrl={API} accessToken={accessToken} onSaved={(updated) => { if (updated && typeof updated === 'object' && 'id' in updated) setSelectedOrder(updated as OrderDetail) }} />}
      {page === 'productDetail' && Number(pathProductId) > 0 && <p><a className="secondary" href={`/products/${pathProductId}/images`}>{t("Quản lý ảnh sản phẩm")}</a></p>}
      {page === 'productDetail' && Number(pathProductId ?? new URLSearchParams(location.search).get('id')) > 0 && <ProductDetailsPage productId={Number(pathProductId ?? new URLSearchParams(location.search).get('id'))} apiUrl={API} accessToken={accessToken} permissions={permissions} />}
      {page === 'productImages' && Number(pathProductImagesId) > 0 && <ProductImagesPage productId={Number(pathProductImagesId)} apiUrl={API} accessToken={accessToken} />}
      {page === 'collectionProducts' && Number(pathCollectionProductsId) > 0 && <CollectionProductsPage collectionId={Number(pathCollectionProductsId)} apiUrl={API} accessToken={accessToken} permissions={permissions} />}
      {page === 'inventoryImport' && <InventoryImportPage apiUrl={API} accessToken={accessToken} />}
      {page === 'imports' && <ImportHistoryPage apiUrl={API} accessToken={accessToken} />}
      {page === 'inventoryAdjust' && <InventoryAdjustmentVoucherPage apiUrl={API} accessToken={accessToken} />}
      {page === 'inventoryAdjustmentBatch' && pathInventoryAdjustmentBatchId && <InventoryAdjustmentVoucherPage apiUrl={API} accessToken={accessToken} batchId={Number(pathInventoryAdjustmentBatchId)} />}
      {page === 'movements' && <InventoryMovementsPage apiUrl={API} accessToken={accessToken} />}

      {page === 'products' && <section className="panel listing"><div className="product-status-tabs" role="group" aria-label={t("Lọc nhanh sản phẩm")}>{[['', t("Tất cả")], ['active', t("Đang bán")], ['draft', t("Bản nháp")], ['out_of_stock', t("Hết hàng")], ['archived', t("Lưu trữ")]].map(([value, label]) => <button key={value || 'all'} type="button" aria-pressed={value === 'out_of_stock' ? productStockFilter === value : productStatusFilter === value && !productStockFilter} onClick={() => { const status = ['active', 'draft', 'archived'].includes(value) ? value : ''; const stock = value === 'out_of_stock' ? value : ''; setProductStatusFilter(status); setProductStockFilter(stock); applyListFilterParams({ status, stock_status: stock }) }}>{label} <b>{productStatusCounts?.[value === "" ? "all" : value] ?? "—"}</b></button>)}</div><FilterBar hasFilters={Boolean(productSearch || productStatusFilter || productFeaturedFilter || productNewFilter || productStockFilter || productCategoryFilters.length || productBrandFilters.length || productCollectionFilters.length || productGenderFilter || productMinPrice || productMaxPrice || productSaleFilter || productImageFilter || productCreatedFrom || productCreatedTo)} onClear={() => { setProductSearch(''); setProductStatusFilter(''); setProductFeaturedFilter(''); setProductNewFilter(''); setProductStockFilter(''); setProductCategoryFilters([]); setProductBrandFilters([]); setProductCollectionFilters([]); setProductGenderFilter(''); setProductMinPrice(''); setProductMaxPrice(''); setProductSaleFilter(''); setProductImageFilter(''); setProductCreatedFrom(''); setProductCreatedTo(''); setProductSort('-updated_at'); clearListFilters(['q', 'status', 'is_featured', 'is_new', 'stock_status', 'category_ids', 'brand_ids', 'collection_ids', 'target_gender', 'min_price', 'max_price', 'has_sale', 'has_image', 'created_from', 'created_to', 'sort']) }} activeFilters={productFilterChips}><input aria-label={t("Tìm sản phẩm")} placeholder={t("Tìm tên, đường dẫn hoặc SKU")} value={productSearch} onChange={(event) => { setProductSearch(event.target.value); updateListFilterParam('q', event.target.value) }} /><select aria-label={t("Lọc trạng thái sản phẩm")} value={productStatusFilter} onChange={(event) => { setProductStatusFilter(event.target.value); updateListFilterParam('status', event.target.value) }}><option value="">{t("Tất cả trạng thái")}</option><option value="active">{t("Đang bán")}</option><option value="draft">{t("Bản nháp")}</option><option value="hidden">{t("Ẩn")}</option><option value="archived">{t("Lưu trữ")}</option></select></FilterBar>
                <ProductAdvancedFilters
          filters={{ q: productSearch, status: productStatusFilter, is_featured: productFeaturedFilter, is_new: productNewFilter, stock_status: productStockFilter, sort: productSort, category_ids: productCategoryFilters.join(","), brand_ids: productBrandFilters.join(","), collection_ids: productCollectionFilters.join(","), target_gender: productGenderFilter, min_price: productMinPrice, max_price: productMaxPrice, has_sale: productSaleFilter, has_image: productImageFilter, created_from: productCreatedFrom, created_to: productCreatedTo }}
          options={productFilterOptionsQuery.data}
          onApplyAdvanced={(values) => {
            setProductFeaturedFilter(values.is_featured); setProductNewFilter(values.is_new); setProductStockFilter(values.stock_status); setProductSort(values.sort || "-updated_at");
            setProductCategoryFilters(values.category_ids.split(",").filter(Boolean)); setProductBrandFilters(values.brand_ids.split(",").filter(Boolean)); setProductCollectionFilters(values.collection_ids.split(",").filter(Boolean));
            setProductGenderFilter(values.target_gender); setProductMinPrice(values.min_price); setProductMaxPrice(values.max_price); setProductSaleFilter(values.has_sale); setProductImageFilter(values.has_image); setProductCreatedFrom(values.created_from); setProductCreatedTo(values.created_to);
            applyListFilterParams(values)
          }}
        />
<div className="list-actions"><button className="secondary" type="button" aria-pressed={productViewMode === 'table'} onClick={() => setProductViewMode('table')}>{t("Bảng")}</button><button className="secondary" type="button" aria-pressed={productViewMode === 'grid'} onClick={() => setProductViewMode('grid')}>{t("Lưới thẻ")}</button><button className="secondary" type="button" disabled={Boolean(productMinPrice && productMaxPrice && Number(productMinPrice) > Number(productMaxPrice) || productCreatedFrom && productCreatedTo && productCreatedFrom > productCreatedTo)} onClick={() => void exportProducts()}>{t("Xuất CSV")}</button></div>{permissions.includes('products.update') && selectedProductIds.length > 0 && <div className="bulk-action-bar" role="toolbar" aria-label={t("Thao tác sản phẩm đã chọn")}><strong>{selectedProductIds.length} {t("sản phẩm đã chọn")}</strong><button className="secondary" type="button" onClick={() => void bulkProductAction('activate')}>{t("Hiện bán")}</button><button className="secondary" type="button" onClick={() => void bulkProductAction('hide')}>{t("Ẩn")}</button><button className="secondary" type="button" onClick={() => void bulkProductAction('feature')}>{t("Đặt nổi bật")}</button>{permissions.includes('products.delete') && <button className="secondary" type="button" onClick={() => setConfirmBulkArchive(true)}>{t("Lưu trữ")}</button>}<label>{t("Gán danh mục")}<select aria-label={t("Danh mục cần gán hàng loạt")} value={bulkProductCategoryId} onChange={(event) => setBulkProductCategoryId(event.target.value)}><option value="">{t("Chọn danh mục")}</option>{productFilterOptionsQuery.data?.categories.map((item) => <option key={item.id} value={item.id}>{item.parent_name ? item.parent_name + ' / ' + item.name : item.name}</option>)}</select></label><button className="secondary" type="button" disabled={!bulkProductCategoryId} onClick={() => void bulkProductAction('assign_category', { category_id: Number(bulkProductCategoryId) })}>{t("Gán danh mục")}</button><label>{t("Gán bộ sưu tập")}<select multiple size={2} aria-label={t("Bộ sưu tập cần gán")} value={bulkProductCollectionIds} onChange={(event) => setBulkProductCollectionIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{productFilterOptionsQuery.data?.collections.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</select></label><button className="secondary" type="button" disabled={!bulkProductCollectionIds.length} onClick={() => void bulkProductAction('assign_collections', { collection_ids: bulkProductCollectionIds.map(Number) })}>{t("Gán bộ sưu tập")}</button><label>{t("Gắn thẻ")}<select multiple size={2} aria-label={t("Thẻ cần gắn")} value={bulkProductTagIds} onChange={(event) => setBulkProductTagIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{productFilterOptionsQuery.data?.tags.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</select></label><button className="secondary" type="button" disabled={!bulkProductTagIds.length} onClick={() => void bulkProductAction('assign_tags', { tag_ids: bulkProductTagIds.map(Number) })}>{t("Gắn thẻ")}</button></div>}{<ProductListPanel apiUrl={API} products={products} viewMode={productViewMode} loading={productsLoading} error={apiDown ? t("Không tải được dữ liệu từ API.") : null} hasFilters={Boolean(productSearch || productStatusFilter || productFeaturedFilter || productNewFilter || productStockFilter || productCategoryFilters.length || productBrandFilters.length || productCollectionFilters.length || productGenderFilter || productMinPrice || productMaxPrice || productSaleFilter || productImageFilter || productCreatedFrom || productCreatedTo)} meta={productsMeta} selectedIds={selectedProductIds} onSelectionChange={setSelectedProductIds} permissions={permissions} updatingIds={productStatusUpdatingIds} onStatusChange={(product, active) => void setProductStatus(product, active)} onDuplicate={(product) => void duplicateProduct(product)} onArchive={setProductToArchive} onRetry={retryList} onPageChange={changeListPage} pageSize={adminPreferences.pageSize} onPageSizeChange={changePageSize} sort={productSort} onSortChange={(field, direction) => { const next = direction === 'none' ? '-updated_at' : direction === 'desc' ? '-' + field : field; setProductSort(next); updateListFilterParam('sort', next) }} />}</section>}

      {page === 'orders' && <><section className="panel listing"><div className="order-status-tabs" role="group" aria-label={t("Lọc nhanh theo trạng thái đơn hàng")}>
        {orderStatusTabs.map(([status, label]) => <button key={status || "all"} className="order-status-tab" type="button" aria-pressed={orderStatus === status} onClick={() => setOrderStatusTab(status)}><span>{t(label)}</span><b>{orderStatusCounts === null ? "—" : formatNumber(status ? orderStatusCounts[status] ?? 0 : Object.values(orderStatusCounts).reduce((total, count) => total + count, 0))}</b></button>)}
      </div><FilterBar hasFilters={Boolean(orderSearch || orderStatus || orderQueue || orderPaymentStatus || orderPaymentMethod || orderShippingMethodId || orderCouponCode || orderProvinceCodes || orderHasNote || orderMinTotal || orderMaxTotal || orderFrom || orderTo)} onClear={() => { setOrderSearch(''); setOrderStatus(''); setOrderQueue(''); setOrderPaymentStatus(''); setOrderPaymentMethod(''); setOrderShippingMethodId(''); setOrderCouponCode(''); setOrderProvinceCodes(''); setOrderHasNote(''); setOrderMinTotal(''); setOrderMaxTotal(''); setOrderSort('-placed_at'); setOrderFrom(''); setOrderTo(''); clearListFilters(['q', 'status', 'queue', 'payment_status', 'payment_method', 'shipping_method_ids', 'coupon_code', 'province_codes', 'has_note', 'shipping_method_id', 'min_total', 'max_total', 'from', 'to', 'sort']) }} activeFilters={orderFilterChips}><input aria-label={t("Tìm mã đơn hoặc khách hàng")} placeholder={t("Tìm mã đơn, tên, email hoặc số điện thoại")} value={orderSearch} onChange={(event) => { setOrderSearch(event.target.value); updateListFilterParam('q', event.target.value) }} /><select aria-label={t("Lọc thanh toán")} value={orderPaymentStatus} onChange={(event) => { setOrderPaymentStatus(event.target.value); updateListFilterParam('payment_status', event.target.value) }}><option value="">{t("Tất cả thanh toán")}</option><option value="unpaid">{t("Chưa thu")}</option><option value="paid">{t("Đã thu")}</option><option value="failed">{t("Giao dịch thất bại")}</option><option value="refunded">{t("Đã hoàn")}</option></select></FilterBar>
        <AdvancedFilterSheet filters={{ queue: orderQueue, payment_method: orderPaymentMethod, from: orderFrom, to: orderTo, shipping_method_ids: orderShippingMethodId, coupon_code: orderCouponCode, province_codes: orderProvinceCodes, has_note: orderHasNote, min_total: orderMinTotal, max_total: orderMaxTotal, sort: orderSort }} defaults={{ queue: '', payment_method: '', from: '', to: '', shipping_method_ids: '', coupon_code: '', province_codes: '', has_note: '', min_total: '', max_total: '', sort: '-placed_at' }} activeCount={[orderPaymentMethod, orderFrom, orderTo, orderShippingMethodId, orderCouponCode, orderProvinceCodes, orderHasNote, orderMinTotal, orderMaxTotal].filter(Boolean).length} onApply={(values) => { setOrderPaymentMethod(values.payment_method); setOrderFrom(values.from); setOrderTo(values.to); setOrderShippingMethodId(values.shipping_method_ids || values.shipping_method_id); setOrderCouponCode(values.coupon_code); setOrderProvinceCodes(values.province_codes); setOrderHasNote(values.has_note); setOrderMinTotal(values.min_total); setOrderMaxTotal(values.max_total); setOrderSort(values.sort || '-placed_at'); applyListFilterParams(values) }}>
          {(draft, setDraft) => <><label>{t("Phương thức thanh toán")}<select value={draft.payment_method} onChange={(event) => setDraft('payment_method', event.target.value)}><option value="">{t("Tất cả phương thức")}</option><option value="cod">{t("Thanh toán khi nhận hàng (COD)")}</option><option value="bank_transfer">{t("Chuyển khoản")}</option><option value="other">{t("Phương thức khác")}</option></select></label><label>{t("Từ ngày")}<input type="date" value={draft.from} onChange={(event) => setDraft('from', event.target.value)} /></label><label>{t("Đến ngày")}<input type="date" value={draft.to} onChange={(event) => setDraft('to', event.target.value)} /></label><label>{t("Phương thức vận chuyển")}<select multiple size={4} aria-describedby="order-shipping-filter-hint" value={draft.shipping_method_ids ? draft.shipping_method_ids.split(',') : []} onChange={(event) => setDraft('shipping_method_ids', Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(','))}>{shippingMethodOptions.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select><small id="order-shipping-filter-hint">{t("Có thể chọn nhiều phương thức.")}</small></label><label>{t("Mã giảm giá")}<input list="order-coupon-codes" maxLength={64} value={draft.coupon_code} onChange={(event) => setDraft('coupon_code', event.target.value.toUpperCase())} placeholder={t("Chọn hoặc nhập mã")} /><datalist id="order-coupon-codes">{orderCouponOptions.map((code) => <option key={code} value={code} />)}</datalist></label><label>{t("Tỉnh/thành")}<select multiple size={5} aria-describedby="order-province-filter-hint" value={draft.province_codes ? draft.province_codes.split(',') : []} onChange={(event) => setDraft('province_codes', Array.from(event.currentTarget.selectedOptions, (option) => option.value).join(','))}>{orderProvinceOptions.map((province) => <option key={province.province_code} value={province.province_code}>{province.province_name}</option>)}</select><small id="order-province-filter-hint">{t("Có thể chọn nhiều tỉnh/thành.")}</small></label><label>{t("Ghi chú")}<select value={draft.has_note} onChange={(event) => setDraft('has_note', event.target.value)}><option value="">{t("Có và không phân biệt")}</option><option value="1">{t("Có ghi chú")}</option><option value="0">{t("Không có ghi chú")}</option></select></label><label>{t("Tổng tiền tối thiểu (VND)")}<input aria-label={t("Tổng tiền tối thiểu")} type="number" min="0" max={draft.max_total || undefined} value={draft.min_total} onChange={(event) => setDraft('min_total', event.target.value)} /></label><label>{t("Tổng tiền tối đa (VND)")}<input aria-label={t("Tổng tiền tối đa")} type="number" min={draft.min_total || '0'} value={draft.max_total} onChange={(event) => setDraft('max_total', event.target.value)} /></label><label>{t("Sắp xếp")}<select value={draft.sort} onChange={(event) => setDraft('sort', event.target.value)}><option value="-placed_at">{t("Ngày đặt mới nhất")}</option><option value="placed_at">{t("Ngày đặt cũ nhất")}</option><option value="-grand_total">{t("Tổng tiền cao nhất")}</option><option value="grand_total">{t("Tổng tiền thấp nhất")}</option></select></label></>}
        </AdvancedFilterSheet>{orderMinTotal && orderMaxTotal && Number(orderMinTotal) > Number(orderMaxTotal) && <p className="reference-error" role="alert">{t("Tổng tiền tối đa phải lớn hơn hoặc bằng tổng tiền tối thiểu.")}</p>}<div className="list-actions"><button className="secondary" type="button" onClick={() => void exportOrders()}>{t("Xuất CSV")}</button></div>{permissions.includes('orders.view') && selectedOrderIds.length > 0 && <div className="bulk-action-bar" role="toolbar" aria-label={t("Thao tác hàng loạt với đơn hàng")}><strong>{selectedOrderIds.length} {t("đơn đã chọn")}</strong><button className="secondary" type="button" disabled={orderPrintLoading} onClick={() => void printSelectedOrders("delivery")}>{orderPrintLoading ? t("Đang chuẩn bị phiếu…") : t("In phiếu giao hàng")}</button><button className="secondary" type="button" disabled={orderPrintLoading} onClick={() => void printSelectedOrders("invoice")}>{t("In hóa đơn")}</button>{permissions.includes('orders.update_status') && <><button className="secondary" type="button" onClick={() => void bulkOrderStatus("confirmed")}>{t("Xác nhận")}</button><button className="secondary" type="button" onClick={() => void bulkOrderStatus("processing")}>{t("Xử lý")}</button><button className="secondary" type="button" onClick={() => void bulkOrderStatus("cancelled")}>{t("Hủy")}</button></>}</div>}<OrderManagementTable
          orders={orders} selectedIds={selectedOrderIds} permissions={permissions} transitions={orderTransitions}
          loading={ordersLoading} error={apiDown ? t("Kh?ng t?i ???c d? li?u t? API.") : null}
          noResults={Boolean(orderSearch || orderStatus || orderQueue || orderPaymentStatus || orderPaymentMethod || orderShippingMethodId || orderCouponCode || orderProvinceCodes || orderHasNote || orderFrom || orderTo || orderMinTotal || orderMaxTotal)}
          meta={ordersMeta} sort={orderSort} pageSize={adminPreferences.pageSize}
          onOpen={openOrderDetail} onUpdate={updateOrder} onPrint={(order) => void printOrderFromList(order.id)}
          onSelectionChange={setSelectedOrderIds} onSelectionLimit={() => notify(t("Ch? c? th? ch?n t?i ?a 100 ??n m?i l?n."))} onRetry={retryList}
          onSortChange={(field, direction) => { const next = direction === "none" ? "-placed_at" : direction === "desc" ? "-" + field : field; setOrderSort(next); updateListFilterParam("sort", next) }}
          onPageChange={changeListPage} onPageSizeChange={changePageSize}
        /></section>{orderDetailLoading && <section className="panel order-detail-loading" role="status" aria-label={t("Đang tải chi tiết đơn hàng")} aria-busy="true"><div className="shared-skeleton"><span /><span /><span /></div></section>}{orderDetailError && <div className="connection-note" role="alert"><span>{orderDetailError}</span><button className="secondary" type="button" disabled={orderDetailLoading || orderDetailTargetId === null} onClick={() => { if (orderDetailTargetId !== null) void loadOrderDetail(orderDetailTargetId) }}>{t("Thử tải lại")}</button></div>} {selectedOrder && <OrderDetailPanel order={selectedOrder} apiUrl={API} permissions={permissions} onClose={() => setSelectedOrder(null)} onPrint={printOrderDocument} onStatusChange={(order, status) => void updateOrder(order, status)} onPaymentChange={updatePaymentStatus} onEditAddress={updateOrderAddress} onRefund={refundOrder} onEditShipment={setShipmentOrder} onReviewChangeRequest={reviewOrderChangeRequest} />}{orderPrintOrders.length > 0 && <OrderPrintDocument orders={orderPrintOrders} mode={orderPrintMode} storeName={storeBranding.store_name} storeLogo={mediaUrl(API, storeBranding.store_logo)} />}</>}

      {page === 'inventory' && <><section className="panel listing"><div className="panel-heading"><div><h2>{t("Tồn kho theo biến thể")}</h2><p>{t("Hàng khả dụng bằng tồn thực tế trừ lượng đang giữ cho đơn.")}</p></div></div>{selectedInventoryVariantIds.length > 0 && permissions.includes('inventory.adjust') && <div className="bulk-action-bar" role="toolbar" aria-label={t("Cập nhật ngưỡng cảnh báo cho tồn kho đã chọn")}><strong>{formatNumber(selectedInventoryVariantIds.length)} {t("biến thể đã chọn")}</strong><label>{t("Ngưỡng mới")} <input type="number" min="0" max="1000000" step="1" value={inventoryThreshold} onChange={(event) => setInventoryThreshold(event.target.value)} /></label><button className="secondary" type="button" disabled={inventoryThresholdUpdating} onClick={() => void saveInventoryThreshold()}>{inventoryThresholdUpdating ? t('Đang cập nhật ngưỡng…') : t("Cập nhật ngưỡng")}</button><button className="secondary" type="button" onClick={() => setSelectedInventoryVariantIds([])}>{t("Bỏ chọn")}</button></div>}<div className="inventory-stock-tabs" role="tablist" aria-label={t("Lọc theo tình trạng tồn kho")}>{[{ value: "", label: t("Tất cả") }, { value: "available", label: t("Còn nhiều") }, { value: "low", label: t("Sắp hết") }, { value: "out", label: t("Hết hàng") }].map((tab) => <button key={tab.value || "all"} type="button" role="tab" aria-selected={inventoryStockStatus === tab.value} className={inventoryStockStatus === tab.value ? "active" : ""} onClick={() => { setInventoryStockStatus(tab.value); updateListFilterParam("stock_status", tab.value) }}>{tab.label} <b>{inventoryStatusCounts?.[tab.value || "all"] ?? "—"}</b></button>)}</div><FilterBar hasFilters={Boolean(inventorySearch || lowStockOnly || inventoryStockStatus || inventoryCategoryId || inventoryBrandId || inventoryColorId || inventorySizeId)} onClear={() => { setInventorySearch(''); setLowStockOnly(false); setInventoryStockStatus(''); setInventoryCategoryId(''); setInventoryBrandId(''); setInventoryColorId(''); setInventorySizeId(''); setInventorySort('product_name'); clearListFilters(['q', 'low_stock', 'stock_status', 'category_id', 'brand_id', 'color_value_id', 'size_value_id', 'sort']) }} activeFilters={inventoryFilterChips}><input aria-label={t("Tìm tên sản phẩm, SKU hoặc mã vạch")} placeholder={t("Tìm tên, SKU hoặc mã vạch")} value={inventorySearch} onChange={(event) => { setInventorySearch(event.target.value); updateListFilterParam('q', event.target.value) }} /><label><input type="checkbox" checked={lowStockOnly} onChange={(event) => { setLowStockOnly(event.target.checked); updateListFilterParam('low_stock', event.target.checked) }} /> {t("Chỉ hàng sắp hết")}</label></FilterBar><AdvancedFilterSheet filters={{ category_id: inventoryCategoryId, brand_id: inventoryBrandId, color_value_id: inventoryColorId, size_value_id: inventorySizeId, sort: inventorySort }} defaults={{ category_id: '', brand_id: '', color_value_id: '', size_value_id: '', sort: 'product_name' }} activeCount={[inventoryCategoryId, inventoryBrandId, inventoryColorId, inventorySizeId].filter(Boolean).length} onApply={(values) => { setInventoryCategoryId(values.category_id); setInventoryBrandId(values.brand_id); setInventoryColorId(values.color_value_id); setInventorySizeId(values.size_value_id); setInventorySort(values.sort || 'product_name'); applyListFilterParams(values) }}>{(draft, setDraft) => <><label>{t("Danh mục")}<select value={draft.category_id} onChange={(event) => setDraft('category_id', event.target.value)}><option value="">{t("Tất cả danh mục")}</option>{inventoryCategories.map((category) => <option key={category.id} value={category.id}>{inventoryCategoryLabel(category)}</option>)}</select></label><label>{t("Thương hiệu")}<select value={draft.brand_id} onChange={(event) => setDraft('brand_id', event.target.value)}><option value="">{t("Tất cả thương hiệu")}</option>{inventoryBrands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>{t("Màu sắc")}<select value={draft.color_value_id} onChange={(event) => setDraft('color_value_id', event.target.value)}><option value="">{t("Tất cả màu")}</option>{inventoryColors.map((item) => <option key={item.id} value={item.id}>{item.value}</option>)}</select></label><label>{t("Kích cỡ")}<select value={draft.size_value_id} onChange={(event) => setDraft('size_value_id', event.target.value)}><option value="">{t("Tất cả kích cỡ")}</option>{inventorySizes.map((item) => <option key={item.id} value={item.id}>{item.group_name ? item.group_name + ' · ' + item.value : item.value}</option>)}</select></label><label>{t("Sắp xếp")}<select value={draft.sort} onChange={(event) => setDraft('sort', event.target.value)}><option value="product_name">{t("Tên sản phẩm A–Z")}</option><option value="-product_name">{t("Tên sản phẩm Z–A")}</option><option value="sku">SKU A–Z</option><option value="-sku">SKU Z–A</option><option value="available">{t("Khả dụng tăng dần")}</option><option value="-available">{t("Khả dụng giảm dần")}</option><option value="quantity">{t("Tồn tăng dần")}</option><option value="-quantity">{t("Tồn giảm dần")}</option></select></label></>}</AdvancedFilterSheet><div className="list-actions"><button className="secondary" type="button" onClick={() => void exportInventory()}>{t("Xuất CSV")}</button></div><InventoryTable
          apiUrl={API} items={inventory} permissions={permissions} selectedIds={selectedInventoryVariantIds}
          loading={inventoryLoading} error={apiDown ? t("Kh?ng t?i ???c d? li?u t? API.") : null}
          noResults={Boolean(inventorySearch || lowStockOnly || inventoryStockStatus || inventoryCategoryId || inventoryBrandId || inventoryColorId || inventorySizeId)}
          meta={inventoryMeta} pageSize={adminPreferences.pageSize} sort={inventorySort} movementLabel={inventoryMovementLabel}
          onMovement={(item) => setMovementVariantId(item.variant_id)} onThreshold={setThresholdEditingInventory} onAdjust={adjustInventory}
          onSelectionChange={(ids) => setSelectedInventoryVariantIds(ids.slice(-100))} onRetry={retryList}
          onSortChange={(field, direction) => { const next = direction === "none" ? "product_name" : direction === "desc" ? "-" + field : field; setInventorySort(next); updateListFilterParam("sort", next) }}
          onPageChange={changeListPage} onPageSizeChange={changePageSize}
        /></section>{movementVariantId && <section className="panel listing movement-panel"><div className="panel-heading"><div><h2>{t("Lịch sử biến động tồn")}</h2><p>{inventory.find((item) => item.variant_id === movementVariantId)?.product_name} · {inventory.find((item) => item.variant_id === movementVariantId)?.sku}</p></div><button className="secondary" onClick={() => setMovementVariantId(null)}>{t("Đóng")}</button></div>{inventoryMovements.length ? <div className="table-wrap"><table><thead><tr><th>{t("THỜI GIAN")}</th><th>{t("LOẠI")}</th><th>{t("THAY ĐỔI")}</th><th>{t("NGƯỜI THỰC HIỆN")}</th><th>{t("THAM CHIẾU")}</th><th>{t("LÝ DO")}</th></tr></thead><tbody>{inventoryMovements.map((movement) => <tr key={movement.id}><td>{formatDateTime(movement.created_at)}</td><td>{inventoryMovementLabel(movement.type)}</td><td>{movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}</td><td>{movement.actor_name ?? t("Hệ thống")}</td><td>{inventoryReferenceLabel(movement.reference_type)}{movement.reference_id ? ' #' + movement.reference_id : ''}</td><td>{movement.note ?? '—'}</td></tr>)}</tbody></table></div> : <div className="no-orders compact">{t("Chưa có lịch sử hoặc không tải được dữ liệu.")}</div>}</section>}</>}

      {page === 'reviews' && permissions.includes('reviews.moderate') && <section className="panel listing">
        <div className="panel-heading"><div><h2>{t("Đánh giá sản phẩm")}</h2><p>{t("Duyệt nội dung khách hàng gửi trước khi hiển thị công khai.")}</p></div></div>
        <div className="review-status-tabs" role="tablist" aria-label={t("Trạng thái đánh giá")}>{[{ value: 'pending', label: t("Chờ duyệt") }, { value: 'approved', label: t("Đã duyệt") }, { value: 'rejected', label: t("Đã ẩn") }].map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={reviewStatus === tab.value} className={reviewStatus === tab.value ? 'active' : ''} onClick={() => { setReviewStatus(tab.value); updateListFilterParam('status', tab.value) }}>{tab.label} <b>{reviewStatusCounts?.[tab.value] ?? '—'}</b></button>)}</div>
        {selectedReviewIds.length > 0 && <div className="bulk-action-bar" role="toolbar" aria-label={t("Thao tác hàng loạt với đánh giá")}><strong>{t('{{count}} đánh giá đã chọn', { count: formatNumber(selectedReviewIds.length) })}</strong><button className="secondary" type="button" onClick={() => void bulkModerateReviews(selectedReviewIds, 'approved').catch((error) => notifyError(error instanceof Error ? error.message : t("Không thể duyệt đánh giá.")))}>{t("Duyệt")}</button><button className="secondary" type="button" onClick={() => setReviewModerationTarget({ reviewIds: [...selectedReviewIds], status: 'rejected', subject: t('{{count}} đánh giá đã chọn', { count: formatNumber(selectedReviewIds.length) }) })}>{t("Ẩn")}</button><button className="secondary" type="button" onClick={() => setSelectedReviewIds([])}>{t("Bỏ chọn")}</button></div>}
         <FilterBar hasFilters={Boolean(reviewSearch || reviewRating || reviewHasImages || reviewVerifiedPurchase || reviewFit || reviewFrom || reviewTo || reviewStatus !== 'pending')} onClear={() => { setReviewSearch(''); setReviewStatus('pending'); setReviewRating(''); setReviewHasImages(''); setReviewVerifiedPurchase(''); setReviewFit(''); setReviewFrom(''); setReviewTo(''); setReviewSort('-created_at'); clearListFilters(['q', 'status', 'rating', 'has_images', 'verified_purchase', 'fit', 'from', 'to', 'sort']) }} activeFilters={reviewFilterChips}>
          <input aria-label={t("Tìm đánh giá")} placeholder={t("Tìm nội dung, khách hàng hoặc sản phẩm")} value={reviewSearch} onChange={(event) => { setReviewSearch(event.target.value); updateListFilterParam('q', event.target.value) }} />
        </FilterBar>
         <AdvancedFilterSheet filters={{ rating: reviewRating, has_images: reviewHasImages, verified_purchase: reviewVerifiedPurchase, fit: reviewFit, from: reviewFrom, to: reviewTo }} defaults={{ rating: '', has_images: '', verified_purchase: '', fit: '', from: '', to: '' }} activeCount={[reviewRating, reviewHasImages, reviewVerifiedPurchase, reviewFit, reviewFrom, reviewTo].filter(Boolean).length} onApply={(values) => { setReviewRating(values.rating); setReviewHasImages(values.has_images); setReviewVerifiedPurchase(values.verified_purchase); setReviewFit(values.fit); setReviewFrom(values.from); setReviewTo(values.to); applyListFilterParams(values) }}>
           {(draft, setDraft) => <><label>{t("Số sao")}<select value={draft.rating} onChange={(event) => setDraft('rating', event.target.value)}><option value="">{t("Tất cả số sao")}</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{t("{{count}} sao", { count: rating })}</option>)}</select></label><label>{t("Ảnh đánh giá")}<select value={draft.has_images} onChange={(event) => setDraft('has_images', event.target.value)}><option value="">{t("Tất cả")}</option><option value="1">{t("Có ảnh")}</option><option value="0">{t("Không có ảnh")}</option></select></label><label>{t("Xác thực mua hàng")}<select value={draft.verified_purchase} onChange={(event) => setDraft('verified_purchase', event.target.value)}><option value="">{t("Tất cả")}</option><option value="1">{t("Đã mua hàng")}</option><option value="0">{t("Chưa xác thực mua")}</option></select></label><label>{t("Độ vừa vặn")}<select value={draft.fit} onChange={(event) => setDraft('fit', event.target.value)}><option value="">{t("Tất cả")}</option><option value="small">{t("Chật")}</option><option value="true_to_size">{t("Vừa")}</option><option value="large">{t("Rộng")}</option></select></label><label>{t("Từ ngày")}<input type="date" value={draft.from} onChange={(event) => setDraft('from', event.target.value)} /></label><label>{t("Đến ngày")}<input type="date" value={draft.to} onChange={(event) => setDraft('to', event.target.value)} /></label></>}
         </AdvancedFilterSheet>
        
        {reviewFrom && reviewTo && reviewFrom > reviewTo && <p role="alert" className="reference-error">{t("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.")}</p>}
        <ReviewManagementTable
          reviews={reviews} selectedIds={selectedReviewIds} status={reviewStatus} sort={reviewSort} meta={reviewsMeta} pageSize={adminPreferences.pageSize}
          loading={reviewsLoading} error={apiDown ? t("Kh?ng t?i ???c danh s?ch ??nh gi?.") : null}
          noResults={Boolean(reviewSearch || reviewRating || reviewHasImages || reviewVerifiedPurchase || reviewFit || reviewFrom || reviewTo)}
          onOpen={(review) => void openReviewDetail(review)}
          onApprove={(review) => void moderateReview(review, "approved").catch((error) => notifyError(error instanceof Error ? error.message : t("Kh?ng th? duy?t ??nh gi?.")))}
          onHide={(review) => setReviewModerationTarget({ reviewIds: [review.id], status: "rejected", subject: t("??nh gi? c?a {{name}}", { name: review.customer?.name ?? t("kh?ch h?ng") }) })}
          onDelete={setReviewToDelete} onSelectionChange={setSelectedReviewIds}
          onSelectionLimit={() => notify(t("Ch? c? th? ch?n t?i ?a 100 ??nh gi? m?i l?n."))} onRetry={retryList}
          onSortChange={(field, direction) => { const next = direction === "none" ? "-created_at" : direction === "desc" ? "-" + field : field; setReviewSort(next); updateListFilterParam("sort", next) }}
          onPageChange={changeListPage} onPageSizeChange={changePageSize}
        />
      </section>}
      {reviewDetail && <ReviewDetailDrawer key={reviewDetail.id} review={reviewDetail} apiUrl={API} onClose={() => setReviewDetail(null)} onOpenOrder={(orderId) => navigate('/?page=orders&order=' + orderId)} onSaveResponse={(storeResponse) => saveReviewResponse(reviewDetail, storeResponse)} />}
      {page === 'productQuestions' && permissions.includes('reviews.moderate') && <AdminProductQuestionsPage apiUrl={API} accessToken={accessToken} pageSize={adminPreferences.pageSize} />}
</>}</Suspense>
      </div>
    </SidebarInset>
    <Suspense fallback={null}>
    {adjustingInventory && <InventoryAdjustmentDialog apiUrl={API} accessToken={accessToken} item={adjustingInventory} onClose={() => setAdjustingInventory(null)} onAdjusted={(item, updated) => { setInventory((rows) => rows.map((row) => row.variant_id === item.variant_id ? { ...row, ...updated } : row)) }} onViewMovement={(variantId) => setMovementVariantId(variantId)} />}
    {thresholdEditingInventory && <InventoryThresholdDialog apiUrl={API} accessToken={accessToken} variantId={thresholdEditingInventory.variant_id} sku={thresholdEditingInventory.sku} threshold={thresholdEditingInventory.low_stock_threshold} onClose={() => setThresholdEditingInventory(null)} onSaved={(low_stock_threshold) => { setInventory((rows) => rows.map((row) => row.variant_id === thresholdEditingInventory.variant_id ? { ...row, low_stock_threshold } : row)); setThresholdEditingInventory(null); notify(`Đã cập nhật ngưỡng cho SKU ${thresholdEditingInventory.sku}.`) }} />}
    {orderAction && <OrderActionDialog key={'order' in orderAction ? `${orderAction.mode}-${orderAction.order.id}` : `${orderAction.mode}-${orderAction.orderIds.join('-')}`} mode={orderAction.mode} orderCode={'order' in orderAction ? orderAction.order.code : undefined} selectionCount={'orderIds' in orderAction ? orderAction.orderIds.length : undefined} statusLabel={'status' in orderAction ? getStatusLabel('order', orderAction.status) : undefined} refundLimit={orderAction.mode === 'refund' ? latestRefundableAmount(orderAction.order) : undefined} address={orderAction.mode === 'address' ? { customer_name: orderAction.order.customer_name, customer_phone: orderAction.order.customer_phone, province: orderAction.order.shipping_address?.province, province_code: orderAction.order.shipping_address?.province_code, district: orderAction.order.shipping_address?.district, ward: orderAction.order.shipping_address?.ward, ward_code: orderAction.order.shipping_address?.ward_code, street: orderAction.order.shipping_address?.street ?? '' } : undefined} onClose={() => setOrderAction(null)} onSubmit={submitOrderAction} />}
    {shipmentOrder && (() => { const latest = shipmentOrder.shipments[0]; return <ShipmentEditorDialog orderId={shipmentOrder.id} carrier={latest?.carrier ?? ''} trackingCode={latest?.tracking_code ?? ''} trackingUrl={latest?.tracking_url ?? ''} status={latest?.status ?? 'pending'} apiUrl={API} accessToken={accessToken} onClose={() => setShipmentOrder(null)} onSaved={(updated) => { setShipmentOrder(null); if (updated && typeof updated === 'object' && 'id' in updated) setSelectedOrder(updated as OrderDetail) }} /> })()}
    {deliveryConfirmation && <OrderDeliveryDialog orderCode={deliveryConfirmation.code} busy={deliveryUpdateBusy} onChoose={(paymentCollected, note) => confirmOrderDelivery(paymentCollected, note)} onClose={() => setDeliveryConfirmation(null)} />}
    {reviewModerationTarget && <ReviewModerationDialog title={reviewModerationTarget.reviewIds.length > 1 ? t("Ẩn nhiều đánh giá") : t("Ẩn đánh giá")} subject={reviewModerationTarget.subject} onClose={() => setReviewModerationTarget(null)} onSubmit={async (reason) => { if (reviewModerationTarget.reviewIds.length === 1) await moderateReview({ id: reviewModerationTarget.reviewIds[0] } as Review, 'rejected', reason); else { await bulkModerateReviews(reviewModerationTarget.reviewIds, 'rejected', reason); setSelectedReviewIds([]) } }} />}
    <ConfirmDialog open={Boolean(reviewToDelete)} title={t('Xóa đánh giá?')} description={reviewToDelete ? t('Đánh giá #{{id}} của {{customer}} và ảnh đính kèm sẽ bị xóa.', { id: reviewToDelete.id, customer: reviewToDelete.customer?.name ?? t('khách hàng') }) : ''} confirmLabel={t('Xóa đánh giá')} onConfirm={() => void deleteReview()} onOpenChange={(open) => { if (!open) setReviewToDelete(null) }} />
    <ConfirmDialog open={Boolean(productToArchive)} title={t("Lưu trữ sản phẩm?")} description={productToArchive ? t('Sản phẩm {{name}} sẽ được chuyển sang trạng thái lưu trữ.', { name: productToArchive.name }) : ''} confirmLabel={t("Lưu trữ sản phẩm")} onConfirm={() => { if (productToArchive) void archiveProduct(productToArchive); setProductToArchive(null) }} onOpenChange={(open) => { if (!open) setProductToArchive(null) }} />
    <ConfirmDialog open={confirmBulkArchive} title={t("Lưu trữ sản phẩm đã chọn?")} description={t('Bạn sắp lưu trữ {{count}} sản phẩm đã chọn.', { count: formatNumber(selectedProductIds.length) })} confirmLabel={t("Lưu trữ sản phẩm")} onConfirm={() => { setConfirmBulkArchive(false); void bulkProductAction('archive') }} onOpenChange={setConfirmBulkArchive} />
    <SessionReauthDialog apiUrl={API} email={adminUser?.email ?? email} open={sessionExpired} onAuthenticated={(token) => { sessionExpiredRef.current = false; reauthRestorePendingRef.current = true; setAccessToken(token); setSessionExpired(false); setPermissionsChecked(false); setListRefresh((revision) => revision + 1) }} />
    {accessToken && <AdminIdleSessionGuard apiUrl={API} accessToken={accessToken} locked={adminScreenLocked} onLock={markAdminScreenLocked} onLogout={logout} />}
    {accessToken && adminScreenLocked && <AdminLockScreen apiUrl={API} accessToken={accessToken} name={adminUser?.name ?? userName} email={adminUser?.email ?? email} onUnlock={unlockAdminScreen} onLogout={logout} />}
    </Suspense>
  </SidebarProvider>
}

export default function RootApp() { return <AdminErrorBoundary><App /></AdminErrorBoundary> }

