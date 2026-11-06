import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { Award, Bell, Heart, LogOut, MapPin, PackageCheck, Ticket, UserRound } from 'lucide-react'
import './CustomerAccountLayout.css'

type AccountSection = 'overview' | 'profile' | 'orders' | 'addresses' | 'wishlist' | 'membership' | 'vouchers' | 'notifications'

type CustomerAccountLayoutProps = {
  activeSection: AccountSection
  customerName: string
  customerEmail: string
  onLogout: () => void
  children: ReactNode
}

const accountSections = [
  { id: 'overview', label: 'Tổng quan', to: '/account', icon: UserRound },
  { id: 'profile', label: 'Hồ sơ và bảo mật', to: '/account/settings', icon: UserRound },
  { id: 'orders', label: 'Đơn hàng', to: '/account/orders', icon: PackageCheck },
  { id: 'addresses', label: 'Sổ địa chỉ', to: '/account/addresses', icon: MapPin },
  { id: 'wishlist', label: 'Yêu thích', to: '/account/wishlist', icon: Heart },
  { id: 'membership', label: 'Điểm và quyền lợi', to: '/account/membership', icon: Award },
{ id: 'vouchers', label: 'Ví voucher', to: '/account/vouchers', icon: Ticket },
  { id: 'notifications', label: 'Thông báo', to: '/account/notifications', icon: Bell },
] as const

export function CustomerAccountLayout({ activeSection, customerName, customerEmail, onLogout, children }: CustomerAccountLayoutProps) {
  const displayName = customerName.trim() || 'Khách hàng'

  return (
    <div className="customer-account">
      <header className="customer-account-header">
        <div className="customer-account-heading">
          <p className="eyebrow">TÀI KHOẢN KHÁCH HÀNG</p>
          <h1>Xin chào, {displayName}</h1>
          <p>Quản lý hồ sơ, đơn hàng và thông tin giao hàng của bạn.</p>
        </div>
        <div className="customer-account-identity">
          <div className="customer-account-identity-copy">
            <strong>{displayName}</strong>
            {customerEmail && <span>{customerEmail}</span>}
          </div>
          <button className="customer-account-logout" type="button" onClick={onLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      <div className="customer-account-layout">
        <aside className="customer-account-sidebar">
          <p className="customer-account-nav-label">TÀI KHOẢN CỦA TÔI</p>
          <nav aria-label="Các mục tài khoản">
            {accountSections.map(({ id, label, to, icon: Icon }) => (
              <Link key={id} to={to} className="customer-account-nav-link" aria-current={activeSection === id ? 'page' : undefined}>
                <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className="customer-account-content">{children}</div>
      </div>
    </div>
  )
}
