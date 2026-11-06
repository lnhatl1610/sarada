import type { AlertData } from '../notifications/use-admin-alerts'
import { useTranslation } from 'react-i18next'

type Props = {
  counts: AlertData['counts'] | undefined
  permissions: string[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function DashboardActionAlerts({ counts, permissions, loading, error, onRetry }: Props) {
  const { t } = useTranslation()
  const items = [
    { label: t('Đơn chờ xác nhận'), description: t('Cần kiểm tra và xác nhận'), count: counts?.pending_orders ?? 0, href: '/orders?status=pending', permission: 'orders.view' },
    { label: t('Giao hàng thất bại'), description: t('Cần xử lý với đơn vị vận chuyển'), count: counts?.delivery_failed_orders ?? 0, href: '/orders?status=delivery_failed', permission: 'orders.view' },
    { label: t('Sắp hết hàng'), description: t('Biến thể dưới ngưỡng tồn kho'), count: counts?.low_stock ?? 0, href: '/?page=inventory&inventory_low_stock=1', permission: 'inventory.view' },
    { label: t('Đánh giá chờ duyệt'), description: t('Đang chờ kiểm duyệt nội dung'), count: counts?.pending_reviews ?? 0, href: '/?page=reviews&reviews_status=pending', permission: 'reviews.moderate' },
  ].filter((item) => permissions.includes(item.permission))

  if (items.length === 0) return null

  return <section className="panel dashboard-action-alerts" aria-labelledby="dashboard-action-alerts-title">
    <div className="panel-heading"><div><h2 id="dashboard-action-alerts-title">{t('Cần xử lý')}</h2><p>{t('Các công việc đang chờ trong cửa hàng')}</p></div></div>
    {loading ? <div className="shared-skeleton" role="status" aria-label={t('Đang tải cảnh báo vận hành')}><span /><span /><span /></div> : error ? <div className="shared-ui-state" role="alert"><p>{error}</p><button className="secondary" type="button" onClick={onRetry}>{t('Thử tải lại cảnh báo')}</button></div> : <div className="dashboard-action-alert-grid">
      {items.map((item) => <a className="dashboard-action-alert" href={item.href} key={item.label}>
        <span className="dashboard-action-alert-count">{item.count}</span>
        <span className="dashboard-action-alert-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
        <span aria-hidden="true">↗</span>
      </a>)}
      {items.every((item) => item.count === 0) && <p className="dashboard-action-alert-empty">{t('Hiện không có công việc nào cần xử lý.')}</p>}
    </div>}
  </section>
}
