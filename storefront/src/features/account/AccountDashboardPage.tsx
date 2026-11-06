import { Link } from 'react-router'
import type { CustomerAddress } from './account-api'
import type { CustomerOrderSummary } from '../orders/order-types'
import { formatOrderStatus } from '../orders/order-status'
import type { MembershipSummaryData } from './membership-api'
import { MembershipSummaryCard } from './MembershipSummaryCard'
import './AccountDashboardPage.css'

type AccountDashboardPageProps = {
  orders: CustomerOrderSummary[]
  ordersLoading: boolean
  ordersError: string
  onRetryOrders: () => void
  addresses: CustomerAddress[]
  addressesLoading: boolean
  addressesError: string
  onRetryAddresses: () => void
  formatMoney: (amount: number) => string
  membershipSummary?: MembershipSummaryData
}

export function AccountDashboardPage({ orders, ordersLoading, ordersError, onRetryOrders, addresses, addressesLoading, addressesError, onRetryAddresses, formatMoney, membershipSummary }: AccountDashboardPageProps) {
  const latestOrder = orders[0]
  const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0]

  return (
    <div className="container subpage account-page account-dashboard">
      <p className="eyebrow">TỔNG QUAN TÀI KHOẢN</p>
      <h1>Tổng quan</h1>
      <p className="account-dashboard-intro">Theo dõi đơn hàng và quản lý thông tin mua sắm của bạn tại đây.</p>
      <MembershipSummaryCard summary={membershipSummary} compact />

      <div className="account-dashboard-grid">
        <section className="account-dashboard-card" aria-labelledby="account-dashboard-order-title">
          <div className="account-dashboard-card-heading"><h2 id="account-dashboard-order-title">Đơn hàng gần nhất</h2><Link to="/account/orders">Tất cả đơn hàng</Link></div>
          {ordersLoading ? <p role="status">Đang tải đơn hàng…</p> : ordersError ? <div role="alert"><p>{ordersError}</p><button className="account-dashboard-retry" type="button" onClick={onRetryOrders}>Thử lại</button></div> : latestOrder ? (
            <Link className="account-dashboard-order" to={`/account/orders/${encodeURIComponent(latestOrder.code)}`}>
              <span><strong>{latestOrder.code}</strong><small>{latestOrder.placed_at ? new Date(latestOrder.placed_at).toLocaleDateString('vi-VN') : 'Ngày đặt đang cập nhật'}</small></span>
              <span><strong>{formatMoney(latestOrder.grand_total)}</strong><small>{formatOrderStatus(latestOrder.status)}</small></span>
            </Link>
          ) : <div className="account-dashboard-empty"><p>Bạn chưa có đơn hàng.</p><Link to="/products">Khám phá sản phẩm</Link></div>}
        </section>

        <section className="account-dashboard-card" aria-labelledby="account-dashboard-address-title">
          <div className="account-dashboard-card-heading"><h2 id="account-dashboard-address-title">Địa chỉ giao hàng</h2><Link to="/account/addresses">Quản lý</Link></div>
          {addressesLoading ? <p role="status">Đang tải địa chỉ…</p> : addressesError ? <div role="alert"><p>{addressesError}</p><button className="account-dashboard-retry" type="button" onClick={onRetryAddresses}>Thử lại</button></div> : defaultAddress ? <address><strong>{defaultAddress.label === 'company' ? 'Công ty' : defaultAddress.label === 'other' ? 'Khác' : 'Nhà'} · {defaultAddress.recipient_name}</strong><span>{defaultAddress.phone}</span><span>{defaultAddress.street}</span><span>{[defaultAddress.ward_name, defaultAddress.province_name].filter(Boolean).join(', ')}</span></address> : <div className="account-dashboard-empty"><p>Chưa có địa chỉ giao hàng được lưu.</p><Link to="/account/addresses">Thêm địa chỉ</Link></div>}
        </section>

        <section className="account-dashboard-card account-dashboard-shortcuts" aria-labelledby="account-dashboard-shortcuts-title">
          <h2 id="account-dashboard-shortcuts-title">Lối tắt</h2>
          <Link to="/account/settings">Hồ sơ và bảo mật</Link>
          <Link to="/account/wishlist">Danh sách yêu thích</Link>
          <Link to="/track-order">Tra cứu đơn hàng</Link>
        </section>
      </div>
    </div>
  )
}
