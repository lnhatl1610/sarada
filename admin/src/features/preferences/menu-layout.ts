export const menuGroupOptions = [
  { id: 'profile', label: 'Thông tin & trạng thái' },
  { id: 'frequent', label: 'Hay dùng' },
  { id: 'account', label: 'Tài khoản & bảo mật' },
  { id: 'notifications', label: 'Thông báo' },
  { id: 'workspace', label: 'Công việc cá nhân' },
  { id: 'appearance', label: 'Giao diện' },
  { id: 'data', label: 'Dữ liệu & tải xuống' },
  { id: 'quick_navigation', label: 'Chuyển nhanh tới' },
  { id: 'quick_create', label: 'Tạo nhanh' },
  { id: 'system', label: 'Quản trị hệ thống' },
  { id: 'store', label: 'Cửa hàng' },
  { id: 'help', label: 'Trợ giúp' },
] as const

export type MenuGroupId = (typeof menuGroupOptions)[number]['id']
export type MenuLayout = { hidden: MenuGroupId[]; order: MenuGroupId[] }
export const defaultMenuLayout: MenuLayout = { hidden: [], order: menuGroupOptions.map((group) => group.id) }
