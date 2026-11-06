export const adminRoleOptions = [
  { value: 'admin', label: 'Quản trị viên', description: 'Quản lý toàn bộ hoạt động cửa hàng.' },
  { value: 'sales_manager', label: 'Quản lý bán hàng', description: 'Đơn hàng, khách hàng, khuyến mãi và báo cáo.' },
  { value: 'warehouse_staff', label: 'Nhân viên kho', description: 'Sản phẩm, tồn kho và điều chỉnh kho.' },
  { value: 'customer_service', label: 'Chăm sóc khách hàng', description: 'Đơn hàng, khách hàng và đánh giá.' },
  { value: 'content_editor', label: 'Biên tập nội dung', description: 'Danh mục sản phẩm, banner và trang nội dung.' },
  { value: 'accountant', label: 'Kế toán', description: 'Chỉ xem đơn hàng và báo cáo.' },
  { value: 'staff', label: 'Nhân viên', description: 'Vai trò cũ được giữ cho tài khoản hiện hữu.' },
] as const

export type AssignableAdminRole = typeof adminRoleOptions[number]['value']

export const adminRoleLabels: Record<string, string> = {
  super_admin: 'Chủ cửa hàng',
  ...Object.fromEntries(adminRoleOptions.map((role) => [role.value, role.label])),
}

export const adminRoleDescriptions: Record<string, string> = {
  super_admin: 'Toàn quyền quản lý cửa hàng và tài khoản quản trị.',
  ...Object.fromEntries(adminRoleOptions.map((role) => [role.value, role.description])),
}
