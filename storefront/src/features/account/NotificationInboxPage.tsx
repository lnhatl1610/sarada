import { useState } from 'react'
import { Link } from 'react-router'
import { useStorefrontNotifications } from './notifications-api'
import './NotificationInboxPage.css'

export function NotificationInboxPage({ enabled }: { enabled: boolean }) {
  const [page, setPage] = useState(1)
  const { query, markRead, markAllRead } = useStorefrontNotifications(enabled, page)
  const notifications = query.data?.data ?? []
  const meta = query.data?.meta

  return <section className="container subpage customer-notifications" aria-labelledby="customer-notifications-title">
    <div className="customer-notifications__heading">
      <div><p className="eyebrow">TÀI KHOẢN</p><h2 id="customer-notifications-title">Thông báo</h2><p>Thông tin mới nhất về đơn hàng và sản phẩm bạn theo dõi.</p><Link to="/account/notifications/preferences">Cài đặt nhận tin</Link></div>
      <button type="button" onClick={() => markAllRead.mutate()} disabled={!meta?.unread_count || markAllRead.isPending}>Đánh dấu tất cả đã đọc</button>
    </div>
    {!enabled ? <div className="customer-notifications__state"><h3>Đăng nhập để xem thông báo</h3><Link to="/login?returnTo=%2Faccount%2Fnotifications">Đăng nhập</Link></div> : query.isPending ? <p className="customer-notifications__state" role="status">Đang tải thông báo…</p> : query.isError ? <div className="customer-notifications__state" role="alert"><p>Chưa tải được thông báo.</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div> : notifications.length === 0 ? <div className="customer-notifications__state"><h3>Chưa có thông báo</h3><p>Thông tin đơn hàng sẽ xuất hiện tại đây.</p><Link to="/account/orders">Xem đơn hàng</Link></div> : <>
      <ul className="customer-notifications__list">{notifications.map((notification) => <li className={notification.read_at ? '' : 'is-unread'} key={notification.id}>
        <span className="customer-notifications__indicator" aria-hidden="true" />
        <div className="customer-notifications__content"><h3>{notification.title}</h3><p>{notification.message}</p><time dateTime={notification.created_at ?? undefined}>{notification.created_at ? new Date(notification.created_at).toLocaleString('vi-VN') : ''}</time></div>
        <div className="customer-notifications__actions"><Link to={notification.href} onClick={() => { if (!notification.read_at) markRead.mutate(notification.id) }}>{notification.event === 'price_drop' ? 'Xem sản phẩm' : notification.event === 'promotion' ? 'Xem ưu đãi' : 'Mở đơn hàng'}</Link>{!notification.read_at && <button type="button" onClick={() => markRead.mutate(notification.id)} disabled={markRead.isPending}>Đánh dấu đã đọc</button>}</div>
      </li>)}</ul>
      {meta && meta.last_page > 1 && <nav className="customer-notifications__pagination" aria-label="Phân trang thông báo"><button type="button" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>Trước</button><span>Trang {meta.current_page}/{meta.last_page}</span><button type="button" disabled={page >= meta.last_page || query.isFetching} onClick={() => setPage((current) => current + 1)}>Sau</button></nav>}
    </>}
  </section>
}
