import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { formatDateTime } from '../../lib/date-format'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { useAdminAlerts } from './use-admin-alerts'
import { adminApiFetch } from '../../lib/admin-api'

type AlertItemView = { id: number; title: string; detail: string; timestamp?: string; href: string }
type PersonalNotice = { id: string; event: string; title: string; detail: string; href: string; read_at: string | null; created_at: string }
type PersonalNoticeResponse = { data?: PersonalNotice[]; meta?: { unread_count: number } }

function AlertGroup({ title, count, items, href }: { title: string; count: number; items: AlertItemView[]; href: string }) {
  const { t } = useTranslation()
  if (count === 0) return null
  return <section className="alerts-group" aria-label={title}>
    <div className="alerts-group-heading"><strong>{title}</strong><span>{count}</span></div>
    {items.length > 0
      ? <div className="alerts-items">{items.slice(0, 5).map((item) => <a className="alerts-item" href={item.href} key={`${title}-${item.id}`}><span><strong>{item.title}</strong><small>{item.detail}</small></span>{item.timestamp && <time>{formatDateTime(item.timestamp)}</time>}</a>)}</div>
      : <p className="alerts-group-empty">{t('Không có mục gần đây để hiển thị.')}</p>}
    <a className="alerts-view-all" href={href}>{t('Xem tất cả ({{count}})', { count })}</a>
  </section>
}

export function NotificationBell({ apiUrl, accessToken, userId, permissions }: { apiUrl: string; accessToken: string; userId: number | undefined; permissions: string[] }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const canView = ['orders.view', 'reviews.moderate', 'inventory.view', 'users.manage'].some((permission) => permissions.includes(permission))
  const storageKey = userId ? `fashion-admin-alerts-read:${userId}` : ''
  const [open, setOpen] = useState(false)
  const [readSignature, setReadSignature] = useState(() => storageKey ? localStorage.getItem(storageKey) ?? '' : '')
  const query = useAdminAlerts({ apiUrl, accessToken, userId, permissions })
  const notificationKey = ['admin', 'notifications', userId]
  const notifications = useQuery({
    queryKey: notificationKey,
    enabled: Boolean(accessToken && userId && canView),
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/admin/notifications?per_page=5`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as PersonalNoticeResponse
      if (!response.ok) throw new Error(t('Không tải được lịch sử thông báo.'))
      return body
    },
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
  const markNoticeRead = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApiFetch(`${apiUrl}/admin/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error(t('Không cập nhật được thông báo.'))
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: notificationKey }) },
  })
  const markAllNoticesRead = useMutation({
    mutationFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/admin/notifications/read-all`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error(t('Không đánh dấu được thông báo đã đọc.'))
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: notificationKey }) },
  })
  if (!canView) return null

  const alerts = query.data ?? null
  const signature = alerts ? JSON.stringify(alerts.counts) : ''
  const operationalUnread = Boolean(signature && signature !== readSignature && Object.values(alerts?.counts ?? {}).some((count) => count > 0))
  const persistentUnread = notifications.data?.meta?.unread_count ?? 0
  const operationalCount = operationalUnread ? Object.values(alerts?.counts ?? {}).reduce((sum, count) => sum + count, 0) : 0
  const unreadCount = Math.max(persistentUnread, operationalCount)
  const markRead = () => {
    if (!signature || !storageKey) return
    setReadSignature(signature)
    localStorage.setItem(storageKey, signature)
  }

  return <Popover open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (nextOpen) markRead() }}>
    <PopoverTrigger asChild>
      <button className="icon-button alerts-trigger" type="button" aria-label={t('Thông báo vận hành')} aria-expanded={open}>
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && <span className="alerts-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" className="admin-topbar-popover alerts-popover">
      <div className="popover-heading"><strong>{t('Thông báo')}</strong><a className="text-button" href="/notifications">{t('Xem tất cả')}</a></div>
      {notifications.isError && <p className="alerts-load-error" role="alert">{t('Không tải được lịch sử thông báo.')} <button type="button" className="text-button" onClick={() => void notifications.refetch()}>{t('Thử lại')}</button></p>}
      {notifications.data?.data && <section className="alerts-personal-history" aria-label={t('Lịch sử thông báo')}>
        <div className="alerts-group-heading"><strong>{t('Mới nhất')}</strong><button type="button" className="text-button" disabled={!persistentUnread || markAllNoticesRead.isPending} onClick={() => markAllNoticesRead.mutate()}>{markAllNoticesRead.isPending ? t('Đang cập nhật…') : t('Đánh dấu tất cả đã đọc')}</button></div>
        {markNoticeRead.isError && <p className="alerts-load-error" role="alert">{markNoticeRead.error.message}</p>}
        {markAllNoticesRead.isError && <p className="alerts-load-error" role="alert">{markAllNoticesRead.error.message}</p>}
        {notifications.data.data.length ? notifications.data.data.map((item) => <a className="alerts-item" data-unread={!item.read_at} href={item.href} key={item.id} onClick={(event) => { event.preventDefault(); markNoticeRead.mutate(item.id, { onSuccess: () => window.location.assign(item.href) }) }}><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{formatDateTime(item.created_at)}</time></a>) : <p className="alerts-group-empty">{t('Chưa có thông báo đã lưu.')}</p>}
      </section>}
      <div className="alerts-operational-heading"><strong>{t('Cảnh báo vận hành')}</strong><button type="button" className="text-button" onClick={markRead}>{t('Đánh dấu đã xem')}</button></div>
      {query.isError && <div className="alerts-load-error"><p>{alerts ? t('Không thể cập nhật cảnh báo mới nhất.') : t('Không tải được danh sách cảnh báo.')}</p><button type="button" className="text-button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></div>}
      {!alerts && !query.isError ? <p role="status">{t('Đang tải cảnh báo…')}</p> : alerts && <div className="alerts-groups">
        <AlertGroup title={t('Đơn chờ xác nhận')} count={alerts.counts.pending_orders} href="/orders?status=pending" items={alerts.items.pending_orders.map((order) => ({ id: order.id, title: `${order.code} · ${order.customer_name}`, detail: t('Cần xác nhận đơn hàng'), timestamp: order.created_at, href: `/orders/${order.id}` }))} />
        <AlertGroup title={t('Đơn giao thất bại')} count={alerts.counts.delivery_failed_orders} href="/orders?status=delivery_failed" items={alerts.items.delivery_failed_orders.map((order) => ({ id: order.id, title: `${order.code} · ${order.customer_name}`, detail: t('Cần xử lý giao hàng thất bại'), timestamp: order.updated_at, href: `/orders/${order.id}` }))} />
        <AlertGroup title={t('Thanh toán thất bại')} count={alerts.counts.failed_payments} href="/payments?status=failed" items={alerts.items.failed_payments.map((payment) => ({ id: payment.id, title: `${payment.code} · ${payment.customer_name}`, detail: t('Đơn có giao dịch thanh toán thất bại'), timestamp: payment.updated_at, href: `/orders/${payment.id}` }))} />
        <AlertGroup title={t('Đánh giá chờ duyệt')} count={alerts.counts.pending_reviews} href="/?page=reviews&reviews_status=pending" items={alerts.items.pending_reviews.map((review) => ({ id: review.id, title: review.product_name, detail: t('Đánh giá #{{id}} đang chờ duyệt', { id: review.id }), timestamp: review.created_at, href: '/?page=reviews&reviews_status=pending' }))} />
        <AlertGroup title={t('Sản phẩm sắp hết hàng')} count={alerts.counts.low_stock} href="/?page=inventory&inventory_low_stock=1" items={alerts.items.low_stock.map((stock) => ({ id: stock.id, title: stock.product_name, detail: t('SKU {{sku}} · Khả dụng {{quantity}}', { sku: stock.sku, quantity: Math.max(0, stock.quantity - stock.reserved) }), href: `/?page=inventory&inventory_q=${encodeURIComponent(stock.sku)}` }))} />
        <AlertGroup title={t('Tài khoản chờ duyệt')} count={alerts.counts.pending_staff_approvals} href="/staff" items={alerts.items.pending_staff_approvals.map((user) => ({ id: user.id, title: user.name, detail: user.email, timestamp: user.created_at, href: '/staff' }))} />
        {!Object.values(alerts.counts).some((count) => count > 0) && <p className="alerts-empty">{t('Không có thông báo mới.')}</p>}
      </div>}
    </PopoverContent>
  </Popover>
}
