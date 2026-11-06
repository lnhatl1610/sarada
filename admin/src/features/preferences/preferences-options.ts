export const sidebarDestinationOptions = [
  { id: 'dashboard', label: 'Tổng quan', permission: 'orders.view', href: '/', page: 'dashboard' },
  { id: 'orders', label: 'Đơn hàng', permission: 'orders.view', href: '/orders', page: 'orders' },
  { id: 'products', label: 'Sản phẩm', permission: 'products.view', href: '/products', page: 'products' },
  { id: 'inventory', label: 'Kho hàng', permission: 'inventory.view', href: '/inventory', page: 'inventory' },
  { id: 'personalTasks', label: 'Việc của tôi', permission: 'authenticated', href: '/me/tasks', page: 'personalTasks' },
] as const
export type SidebarDestinationId = typeof sidebarDestinationOptions[number]['id']

export const dashboardWidgetOptions = [
  { id: 'metrics', label: 'Thẻ chỉ số', permission: 'orders.view' },
  { id: 'alerts', label: 'Cảnh báo cần xử lý' },
  { id: 'revenue', label: 'Doanh thu theo thời gian', permission: 'orders.view' },
  { id: 'recent_orders', label: 'Đơn hàng gần đây', permission: 'orders.view' },
  { id: 'breakdown', label: 'Phân tích trạng thái và tồn kho', permission: 'orders.view' },
  { id: 'top_products', label: 'Sản phẩm bán chạy', permission: 'products.view' },
  { id: 'recent_activity', label: 'Hoạt động gần đây', permission: 'settings.manage' },
] as const
export type DashboardWidgetId = typeof dashboardWidgetOptions[number]['id']
