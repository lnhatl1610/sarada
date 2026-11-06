import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatCard } from '../../components/shared/stat-card'
import { formatNumber, formatVnd } from '../../lib/date-format'
import type { DashboardWidgetId } from '../preferences/preferences-options'
import { DashboardActionAlerts } from './DashboardActionAlerts'
import { DashboardRecentActivityWidget } from './DashboardRecentActivityWidget'
import { DashboardBreakdown, DashboardRecentOrdersWidget, DashboardRevenueWidget, DashboardTopProductsWidget } from './DashboardWidgets'
import type { AlertData } from '../notifications/use-admin-alerts'
import { useAdminDashboard, type DashboardGroupBy } from './use-admin-dashboard'
import { PeriodComparison } from './PeriodComparison'
import '../../DashboardWidgets.css'

type DashboardPeriod = 'today' | '7' | '30' | '90' | 'month' | 'custom'
type DashboardRange = { from: string; to: string; days: number; valid: boolean; label: string }

function toDateInputValue(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function shiftDateInputValue(value: string, offset: number): string {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + offset))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function getDashboardRange(period: DashboardPeriod, customFrom: string, customTo: string, timezone: string): DashboardRange {
  const today = toDateInputValue(new Date(), timezone)
  let from = today
  let to = today
  let label = 'Hôm nay'

  if (period === '7' || period === '30' || period === '90') {
    const days = Number(period)
    from = shiftDateInputValue(today, -(days - 1))
    label = `${days} ngày qua`
  } else if (period === 'month') {
    from = `${today.slice(0, 7)}-01`
    label = 'Tháng này'
  } else if (period === 'custom') {
    from = customFrom
    to = customTo
    label = 'Tùy chọn'
  }

  const fromTime = Date.parse(`${from}T00:00:00Z`)
  const toTime = Date.parse(`${to}T00:00:00Z`)
  const days = Number.isFinite(fromTime) && Number.isFinite(toTime) ? Math.floor((toTime - fromTime) / 86_400_000) + 1 : 0
  return { from, to, days, label, valid: days > 0 && days <= 366 && to <= today }
}

function formatDashboardDateRange(range: DashboardRange, locale: string, translate: (key: string) => string): string {
  if (!range.valid) return translate('Chọn khoảng ngày hợp lệ (tối đa 366 ngày)')
  const dateFormatter = new Intl.DateTimeFormat(locale, { timeZone: 'UTC' })
  const from = dateFormatter.format(new Date(`${range.from}T00:00:00Z`))
  const to = dateFormatter.format(new Date(`${range.to}T00:00:00Z`))
  return `${translate(range.label)} · ${from} – ${to}`
}

type Props = {
  active: boolean
  apiUrl: string
  accessToken: string
  userId?: number
  timezone?: string | null
  permissions: string[]
  widgets: DashboardWidgetId[]
  defaultPeriod: DashboardPeriod
  defaultComparePrevious: boolean
  alertCounts?: AlertData['counts']
  alertsLoading: boolean
  alertsError: string | null
  onRetryAlerts: () => void
  onNavigate: (href: string) => void
}

export function AdminDashboardPage({ active, apiUrl, accessToken, userId, timezone, permissions, widgets, defaultPeriod, defaultComparePrevious, alertCounts, alertsLoading, alertsError, onRetryAlerts, onNavigate }: Props) {
  const { t, i18n } = useTranslation()
  const [period, setPeriod] = useState<DashboardPeriod>(defaultPeriod)
  const dashboardTimezone = timezone || 'UTC'
  const todayDate = toDateInputValue(new Date(), dashboardTimezone)
  const [customFrom, setCustomFrom] = useState(() => shiftDateInputValue(todayDate, -6))
  const [customTo, setCustomTo] = useState(todayDate)
  const [comparePrevious, setComparePrevious] = useState(defaultComparePrevious)
  const [revenueGroupBy, setRevenueGroupBy] = useState<DashboardGroupBy>('day')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const range = getDashboardRange(period, customFrom, customTo, dashboardTimezone)
  const from = range.valid ? range.from : todayDate
  const to = range.valid ? range.to : todayDate
  const previousTo = shiftDateInputValue(from, -1)
  const previousFrom = shiftDateInputValue(previousTo, -Math.max(0, (range.valid ? range.days : 1) - 1))
  const rangeLabel = formatDashboardDateRange(range, i18n.language === 'en' ? 'en-US' : 'vi-VN', (key) => t(key))
  const dashboard = useAdminDashboard({
    apiUrl,
    accessToken,
    userId,
    from,
    to,
    previousFrom,
    previousTo,
    comparePrevious,
    groupBy: revenueGroupBy,
    enabled: active && permissions.includes('orders.view') && range.valid,
    autoRefresh,
  })

  return <div hidden={!active}>
    <div className="toolbar dashboard-toolbar">
      <span className={`live-dot${dashboard.hasError ? ' offline' : ''}`} />
      <span>{dashboard.hasError ? t('API ĐANG GẶP SỰ CỐ') : dashboard.isFetching && !dashboard.lastUpdated ? t('ĐANG KẾT NỐI API') : t('API ĐÃ KẾT NỐI')}</span>
      <label className="dashboard-period-control">{t('Khoảng thời gian')}<select aria-label={t('Khoảng thời gian tổng quan')} value={period} onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}>
        <option value="today">{t('Hôm nay')}</option><option value="7">{t('7 ngày qua')}</option><option value="30">{t('30 ngày qua')}</option><option value="90">{t('90 ngày qua')}</option><option value="month">{t('Tháng này')}</option><option value="custom">{t('Tùy chọn')}</option>
      </select></label>
      {period === 'custom' && <div className="dashboard-range-fields"><label>{t('Từ ngày')}<input type="date" value={customFrom} max={customTo || todayDate} onChange={(event) => setCustomFrom(event.target.value)} /></label><label>{t('Đến ngày')}<input type="date" value={customTo} min={customFrom || undefined} max={todayDate} onChange={(event) => setCustomTo(event.target.value)} /></label></div>}
      <label className="dashboard-compare-control"><input type="checkbox" checked={comparePrevious} onChange={(event) => setComparePrevious(event.target.checked)} /> {t('So sánh kỳ trước')}</label>
      <label className="dashboard-period-control">{t('Nhóm theo')}<select aria-label={t('Nhóm dữ liệu doanh thu theo')} value={revenueGroupBy} onChange={(event) => setRevenueGroupBy(event.target.value as DashboardGroupBy)}><option value="day">{t('Ngày')}</option><option value="week">{t('Tuần')}</option><option value="month">{t('Tháng')}</option></select></label>
      <span className="dashboard-range-label">{rangeLabel}</span>
      <span className="dashboard-updated">{dashboard.lastUpdated ? t('Cập nhật {{time}}', { time: dashboard.lastUpdated.toLocaleTimeString(i18n.language === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' }) }) : t('Chưa cập nhật')}</span>
      <button className="secondary dashboard-refresh-toggle" type="button" aria-pressed={autoRefresh} onClick={() => setAutoRefresh((enabled) => !enabled)}>{autoRefresh ? t('Tạm dừng cập nhật') : t('Tiếp tục cập nhật')}</button>
      <button className="secondary dashboard-refresh-toggle" type="button" onClick={dashboard.refreshAll} disabled={!range.valid}>{t('Làm mới')}</button>
    </div>
    {!range.valid && <div className="connection-note" role="alert">{rangeLabel}. {t('Ngày kết thúc phải từ ngày bắt đầu đến hôm nay.')}</div>}
    {dashboard.summaryError && <div className="connection-note" role="alert">{dashboard.summaryError} <button className="secondary" type="button" onClick={dashboard.refreshAll}>{t('Thử tải lại số liệu')}</button></div>}
    <div className="dashboard-widget-layout">{widgets.map((widget) => {
      if (widget === 'metrics' && permissions.includes('orders.view')) return <section key={widget} className="stats dashboard-widget-full" aria-busy={dashboard.summaryLoading}>
        <StatCard label={t('DOANH THU')} value={dashboard.summary ? formatVnd(dashboard.summary.revenue) : '—'} description={<>{formatNumber(dashboard.summary?.paid_order_count ?? 0)} {t('đơn đã thu tiền')}{dashboard.summary && comparePrevious && <><br /><PeriodComparison current={dashboard.summary.revenue} previous={dashboard.summary.previous_revenue} /></>}</>} loading={dashboard.summaryLoading} />
        <StatCard label={t('ĐƠN HÀNG')} value={dashboard.summary ? formatNumber(dashboard.summary.order_count) : '—'} description={<>{formatNumber(dashboard.summary?.pending_order_count ?? 0)} {t('đơn chờ xác nhận')}{dashboard.summary && comparePrevious && <><br /><PeriodComparison current={dashboard.summary.order_count} previous={dashboard.summary.previous_order_count} /></>}</>} loading={dashboard.summaryLoading} sparklineTone="warm" />
        <StatCard label={t('KHÁCH HÀNG MỚI')} value={dashboard.summary ? formatNumber(dashboard.summary.new_customer_count) : '—'} description={<>{dashboard.summary ? comparePrevious ? <PeriodComparison current={dashboard.summary.new_customer_count} previous={dashboard.summary.previous_new_customer_count} /> : t('Đăng ký trong kỳ') : t('Đăng ký trong kỳ')}</>} loading={dashboard.summaryLoading} sparklineTone="warm" />
        <StatCard label={t('TỶ LỆ HỦY / TRẢ')} value={dashboard.summary ? `${formatNumber(dashboard.summary.cancellation_return_rate)}%` : '—'} description={<>{dashboard.summary ? comparePrevious ? <PeriodComparison current={dashboard.summary.cancellation_return_rate} previous={dashboard.summary.previous_cancellation_return_rate} unit="percentage-points" lowerIsBetter /> : t('Trên tổng số đơn trong kỳ') : t('Trên tổng số đơn trong kỳ')}</>} loading={dashboard.summaryLoading} sparklineTone="redline" />
        <StatCard label={t('GIÁ TRỊ ĐƠN TB')} value={dashboard.summary && dashboard.summary.average_paid_order_value ? formatVnd(dashboard.summary.average_paid_order_value) : '—'} description={<>{dashboard.summary ? comparePrevious ? <PeriodComparison current={dashboard.summary.average_paid_order_value} previous={dashboard.summary.previous_average_paid_order_value} /> : t('Trên các đơn đã thu tiền') : t('Trên các đơn đã thu tiền')}</>} loading={dashboard.summaryLoading} sparklineTone="darkline" />
      </section>
      if (widget === 'alerts') return <div key={widget} className="dashboard-widget-full"><DashboardActionAlerts counts={alertCounts} permissions={permissions} loading={alertsLoading} error={alertsError} onRetry={onRetryAlerts} /></div>
      if (widget === 'revenue' && permissions.includes('orders.view')) return <div key={widget} className="dashboard-widget-half"><DashboardRevenueWidget period={rangeLabel} groupBy={revenueGroupBy} series={dashboard.revenueSeries} previousSeries={dashboard.previousRevenueSeries} comparePrevious={comparePrevious} previousLoading={dashboard.previousRevenueLoading} previousError={dashboard.previousRevenueError} loading={dashboard.revenueLoading} error={dashboard.revenueError} onRetry={dashboard.refreshAll} /></div>
      if (widget === 'recent_orders' && permissions.includes('orders.view')) return <div key={widget} className="dashboard-widget-half"><DashboardRecentOrdersWidget orders={dashboard.recentOrders} loading={dashboard.recentOrdersLoading} error={dashboard.recentOrdersError} onRetry={dashboard.refreshAll} /></div>
      if (widget === 'breakdown' && (permissions.includes('orders.view') || permissions.includes('inventory.view'))) return <div key={widget} className="dashboard-widget-full"><DashboardBreakdown summary={dashboard.summary} canViewInventory={permissions.includes('inventory.view')} /></div>
      if (widget === 'top_products' && permissions.includes('orders.view') && permissions.includes('products.view')) return <div key={widget} className="dashboard-widget-full"><DashboardTopProductsWidget apiUrl={apiUrl} products={dashboard.topProducts} loading={dashboard.topProductsLoading} error={dashboard.topProductsError} canViewProducts onRetry={dashboard.refreshAll} /></div>
      if (widget === 'recent_activity' && permissions.includes('settings.manage')) return <div key={widget} className="dashboard-widget-full"><DashboardRecentActivityWidget apiUrl={apiUrl} accessToken={accessToken} userId={userId} enabled={active} autoRefresh={autoRefresh} /></div>
      return null
    })}{widgets.length === 0 && <div className="connection-note dashboard-widgets-empty">{t('Bạn đang ẩn tất cả widget.')} <button type="button" className="text-button" onClick={() => onNavigate('/?page=preferences')}>{t('Mở cài đặt dashboard')}</button></div>}</div>
  </div>
}
