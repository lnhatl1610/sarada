import { useTranslation } from 'react-i18next'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDateTime, formatNumber, formatVnd } from '../../lib/date-format'
import { getStatusLabel, StatusBadge } from '../../components/shared/status-badge'
import { mediaUrl } from '../../lib/media-url'
import type { AdminDashboardRecentOrder, AdminDashboardRevenuePoint, AdminDashboardSummary, AdminDashboardTopProduct, DashboardGroupBy } from './use-admin-dashboard'

type Summary = AdminDashboardSummary
type RevenuePoint = AdminDashboardRevenuePoint
type TopProduct = AdminDashboardTopProduct
const fmt = (amount: number) => formatVnd(amount)

export function DashboardBreakdown({ summary, canViewInventory }: { summary: Summary | null; canViewInventory: boolean }) {
  const { t } = useTranslation()
  if (!summary) return null
  const orderTotal = summary.status_breakdown.reduce((total, row) => total + row.count, 0)
  const statusColors = ['#7f2638', '#385f72', '#5f8064', '#b58a4e', '#7b6c8d', '#a45b43', '#6b7774']
  const maxPaymentRevenue = Math.max(1, ...summary.payment_breakdown.map((row) => row.revenue))
  const categoryColors = ['#7f2638', '#385f72', '#5f8064', '#b58a4e', '#7b6c8d', '#9a7860']
  const allCategoryRevenue = summary.category_breakdown.filter((row) => row.revenue > 0)
  const topCategoryRevenue = allCategoryRevenue.slice(0, 5)
  const otherCategoryRevenue = allCategoryRevenue.slice(5).reduce((total, row) => total + row.revenue, 0)
  const categoryRevenue = [...topCategoryRevenue, ...(otherCategoryRevenue > 0 ? [{ category_id: null, category_name: t('Khác'), revenue: otherCategoryRevenue }] : [])]
  const categoryLabel = (categoryName: string, categoryId: number | null) => categoryId === null && categoryName === 'Chưa phân loại' ? t('Chưa phân loại') : categoryName
  const categoryRevenueTotal = categoryRevenue.reduce((total, row) => total + row.revenue, 0)
  const categoryCircumference = 2 * Math.PI * 34
  return <div className="dashboard-breakdown-grid">
    <article className="panel"><h2>{t('Đơn theo trạng thái')}</h2>{summary.status_breakdown.length ? <div className="dashboard-status-chart"><svg className="dashboard-status-donut" viewBox="0 0 100 100" role="group" aria-label={t('Phân bổ {{count}} đơn hàng theo trạng thái', { count: formatNumber(orderTotal) })}>{summary.status_breakdown.map((row, index) => {
      const circumference = 2 * Math.PI * 34
      const segmentLength = orderTotal ? row.count / orderTotal * circumference : 0
      const previousCount = summary.status_breakdown.slice(0, index).reduce((total, item) => total + item.count, 0)
      const offset = orderTotal ? previousCount / orderTotal * circumference : 0
      const label = t(getStatusLabel('order', row.status))
      return <a href={`/orders?status=${encodeURIComponent(row.status)}`} key={row.status} aria-label={t('{{status}}: {{count}} đơn', { status: label, count: formatNumber(row.count) })}><circle cx="50" cy="50" r="34" fill="none" stroke={statusColors[index % statusColors.length]} strokeWidth="18" strokeDasharray={`${segmentLength} ${circumference - segmentLength}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)"><title>{t('{{status}}: {{count}} đơn', { status: label, count: formatNumber(row.count) })}</title></circle></a>
    })}<circle cx="50" cy="50" r="23" fill="var(--shell-surface, #fff)" pointerEvents="none" /><text x="50" y="47" textAnchor="middle" className="dashboard-donut-total">{formatNumber(orderTotal)}</text><text x="50" y="58" textAnchor="middle" className="dashboard-donut-caption">{t('đơn hàng')}</text></svg><ul className="dashboard-breakdown-list">{summary.status_breakdown.map((row, index) => <li key={row.status}><a href={`/orders?status=${encodeURIComponent(row.status)}`}><i style={{ background: statusColors[index % statusColors.length] }} />{t(getStatusLabel('order', row.status))}</a><strong>{formatNumber(row.count)}</strong></li>)}</ul></div> : <p>{t('Chưa có dữ liệu.')}</p>}</article>
    <article className="panel"><h2>{t('Doanh thu theo danh mục')}</h2>{categoryRevenue.length ? <><div className="dashboard-category-chart"><svg className="dashboard-status-donut" viewBox="0 0 100 100" role="img" aria-label={t('Doanh thu theo danh mục: {{total}}', { total: fmt(categoryRevenueTotal) })}><title>{t('Doanh thu đơn đã thu tiền và giao xong, theo danh mục hiện tại; hoàn tiền được trừ theo tỷ trọng.')}</title>{categoryRevenue.map((row, index) => {
      const previousRevenue = categoryRevenue.slice(0, index).reduce((total, item) => total + item.revenue, 0)
      const segmentLength = row.revenue / categoryRevenueTotal * categoryCircumference
      const offset = previousRevenue / categoryRevenueTotal * categoryCircumference
      return <circle key={`${row.category_id ?? 'uncategorized'}-${row.category_name}`} cx="50" cy="50" r="34" fill="none" stroke={categoryColors[index % categoryColors.length]} strokeWidth="18" strokeDasharray={`${segmentLength} ${categoryCircumference - segmentLength}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />
    })}<circle cx="50" cy="50" r="23" fill="var(--shell-surface, #fff)" /></svg><ul className="dashboard-category-legend">{categoryRevenue.map((row, index) => <li key={`${row.category_id ?? 'uncategorized'}-${row.category_name}`}><span><i style={{ background: categoryColors[index % categoryColors.length] }} />{categoryLabel(row.category_name, row.category_id)}</span><strong>{fmt(row.revenue)}</strong></li>)}</ul></div><p className="dashboard-category-note">{t('Đơn đã thu tiền và giao xong; theo danh mục hiện tại, đã trừ hoàn tiền theo tỷ trọng.')}</p></> : <p>{t('Chưa có doanh thu theo danh mục trong kỳ này.')}</p>}</article>
    <article className="panel"><h2>{t('Doanh thu theo phương thức')}</h2>{summary.payment_breakdown.length ? <ul className="dashboard-payment-list">{summary.payment_breakdown.map((row) => <li key={row.payment_method}><div><span>{t(row.payment_method)}</span><strong>{fmt(row.revenue)}</strong></div><i><b style={{ width: `${row.revenue / maxPaymentRevenue * 100}%` }} /></i></li>)}</ul> : <p>{t('Chưa có dữ liệu.')}</p>}</article>
    <article className="panel"><h2>{canViewInventory ? <a href="/?page=inventory&inventory_low_stock=1">{t('Sắp hết hàng')} ↗</a> : t('Sắp hết hàng')}</h2>{summary.low_stock_products.length ? <ul className="dashboard-breakdown-list">{summary.low_stock_products.map((row, index) => <li key={`${row.product_id}-${row.sku}-${index}`}>{canViewInventory ? <a href="/?page=inventory&inventory_low_stock=1">{row.product_name}<small>{row.sku} · {[row.color_name, row.size_name].filter(Boolean).join(' / ') || t('Mặc định')}</small></a> : <span>{row.product_name}<small>{row.sku} · {[row.color_name, row.size_name].filter(Boolean).join(' / ') || t('Mặc định')}</small></span>}<strong>{formatNumber(Math.max(0, row.quantity - row.reserved))}</strong></li>)}</ul> : <p>{t('Không có sản phẩm sắp hết.')}</p>}</article>
  </div>
}

export function DashboardRevenueWidget({ period, groupBy, series, previousSeries, comparePrevious, previousLoading, previousError, loading, error, onRetry }: {
  period: string
  groupBy: DashboardGroupBy
  series: RevenuePoint[]
  previousSeries: RevenuePoint[]
  comparePrevious: boolean
  previousLoading: boolean
  previousError: string
  loading: boolean
  error: string
  onRetry: () => void
}) {
  const { t, i18n } = useTranslation()
  const chartData = series.map((point, index) => ({ ...point, previousRevenue: previousSeries[index]?.revenue ?? null }))
  const totalOrders = series.reduce((sum, point) => sum + point.orders, 0)
  const totalRevenue = series.reduce((sum, point) => sum + point.revenue, 0)
  const previousTotalRevenue = previousSeries.reduce((sum, point) => sum + point.revenue, 0)
  const groupLabel = groupBy === 'week' ? t('tuần') : groupBy === 'month' ? t('tháng') : t('ngày')
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN'
  const dateLabel = (value: string) => new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00`))
  const moneyTick = (value: number) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  return <article className="panel revenue"><div className="panel-heading"><div><h2>{t('Doanh thu')}</h2><p>{t('Đơn đã giao và thanh toán')} · {period} · {t('theo {{group}}', { group: groupLabel })}</p></div></div>
    {loading ? <div className="shared-skeleton" role="status" aria-label={t('Đang tải biểu đồ doanh thu')}><span /><span /><span /></div> : error ? <div className="shared-ui-state" role="alert"><p>{error}</p><button className="secondary" type="button" onClick={onRetry}>{t('Thử tải lại biểu đồ')}</button></div> : series.length ? <div className="revenue-chart">
      <div className="chart-legend" aria-label={t('Chú giải biểu đồ')}><span><i className="legend-revenue" />{t('Doanh thu kỳ này')}</span><span><i className="legend-orders" />{t('Số đơn')}</span>{comparePrevious && <span><i className="legend-previous-revenue" />{t('Doanh thu kỳ trước')}</span>}</div>
      <div className="dashboard-recharts-chart" role="img" aria-label={t('Biểu đồ doanh thu đã thu từ đơn giao thành công và số đơn được tạo, {{period}}, nhóm theo {{group}}. Doanh thu kỳ này {{revenue}}; {{count}} đơn.{{previous}}', { period, group: groupLabel, revenue: fmt(totalRevenue), count: formatNumber(totalOrders), previous: comparePrevious && previousSeries.length ? ` ${t('Doanh thu kỳ trước {{revenue}}.', { revenue: fmt(previousTotalRevenue) })}` : '' })}>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={chartData} accessibilityLayer margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--shell-border-subtle, #e5e1db)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={dateLabel} minTickGap={28} tick={{ fill: 'var(--shell-muted, #716e68)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--shell-border-subtle, #e5e1db)' }} />
            <YAxis yAxisId="revenue" tickFormatter={moneyTick} width={54} tick={{ fill: 'var(--shell-muted, #716e68)', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="orders" orientation="right" hide domain={[0, 'dataMax']} />
            <Tooltip
              labelFormatter={(label) => dateLabel(String(label))}
              formatter={(value, name) => [String(name) === 'orders' ? formatNumber(Number(value)) : fmt(Number(value)), String(name) === 'orders' ? t('Số đơn') : String(name) === 'previousRevenue' ? t('Doanh thu kỳ trước') : t('Doanh thu kỳ này')]}
              contentStyle={{ background: 'var(--shell-surface, #fff)', border: '1px solid var(--shell-border-subtle, #e5e1db)', borderRadius: 4, fontSize: 12 }}
            />
            <Line yAxisId="revenue" dataKey="revenue" name="revenue" type="monotone" stroke="#7f2638" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            <Line yAxisId="orders" dataKey="orders" name="orders" type="monotone" stroke="#385f72" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            {comparePrevious && previousSeries.length > 0 && <Line yAxisId="revenue" dataKey="previousRevenue" name="previousRevenue" type="monotone" stroke="#b87936" strokeWidth={1.5} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-summary">{t('Kỳ này')}: {fmt(totalRevenue)} · {t('{{count}} đơn', { count: formatNumber(totalOrders) })}{comparePrevious && previousLoading ? ` · ${t('Đang tải kỳ trước…')}` : comparePrevious && previousError ? ` · ${previousError}` : comparePrevious && previousSeries.length ? ` · ${t('Kỳ trước')}: ${fmt(previousTotalRevenue)}` : ''}</p>
      {comparePrevious && previousError && <button className="text-button" type="button" onClick={onRetry}>{t('Thử tải lại so sánh kỳ trước')}</button>}
    </div> : <div className="no-orders compact">{t('Chưa có doanh thu từ đơn đã giao, đã thanh toán trong khoảng thời gian này.')}</div>}
  </article>
}

export function DashboardRecentOrdersWidget({ orders, loading, error, onRetry }: { orders: AdminDashboardRecentOrder[]; loading: boolean; error: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return <article className="panel status-panel"><div className="panel-heading"><div><h2 id="dashboard-recent-orders-title">{t('Đơn hàng gần đây')}</h2><p>{t('Theo dõi 8 đơn mới nhất')}</p></div><a href="/?page=orders">{t('Tất cả')} ↗</a></div>
    {loading ? <div className="shared-skeleton" role="status" aria-label={t('Đang tải đơn hàng')}><span /><span /><span /></div> : error ? <div className="shared-ui-state" role="alert"><p>{error}</p><button className="secondary" type="button" onClick={onRetry}>{t('Thử tải lại đơn hàng')}</button></div> : orders.length ? <div className="table-wrap dashboard-recent-orders-wrap"><table className="dashboard-recent-orders-table" aria-labelledby="dashboard-recent-orders-title"><thead><tr><th scope="col">{t('MÃ ĐƠN')}</th><th scope="col">{t('KHÁCH HÀNG')}</th><th scope="col">{t('NGÀY ĐẶT')}</th><th scope="col">{t('TỔNG TIỀN')}</th><th scope="col">{t('TRẠNG THÁI')}</th></tr></thead><tbody>{orders.slice(0, 8).map((order) => { const placedAt = order.placed_at ?? order.created_at; return <tr key={order.id}><td><a href={`/?page=orders&order=${order.id}`}>{order.code}</a></td><td>{order.customer_name}</td><td>{placedAt ? formatDateTime(placedAt) : t('Chưa rõ ngày đặt')}</td><td className="dashboard-recent-orders-total">{fmt(order.grand_total)}</td><td><StatusBadge kind="order" status={order.status} /></td></tr> })}</tbody></table></div> : <div className="no-orders"><span>▣</span><b>{t('Chưa có đơn hàng mới')}</b><p>{t('Đơn hàng sẽ hiển thị tại đây khi khách đặt.')}</p></div>}
  </article>
}

export function DashboardTopProductsWidget({ apiUrl, products, loading, error, canViewProducts, onRetry }: { apiUrl: string; products: TopProduct[]; loading: boolean; error: string; canViewProducts: boolean; onRetry: () => void }) {
  const { t, i18n } = useTranslation()
  return <section className="panel product-panel"><div className="panel-heading"><div><h2>{t('Sản phẩm bán chạy')}</h2><p>{t('Số lượng đã bán trên các đơn đã giao và thanh toán trong kỳ')}</p></div>{canViewProducts && <a href="/?page=products">{t('Quản lý sản phẩm')} ↗</a>}</div>
    {loading ? <div className="shared-skeleton" role="status" aria-label={t('Đang tải sản phẩm bán chạy')}><span /><span /><span /></div> : error ? <div className="shared-ui-state" role="alert"><p>{error}</p><button className="secondary" type="button" onClick={onRetry}>{t('Thử tải lại sản phẩm')}</button></div> : products.length ? <div className="table-wrap"><table><thead><tr><th>{t('SẢN PHẨM')}</th><th>{t('ĐÃ BÁN')}</th><th>{t('DOANH THU')}</th></tr></thead><tbody>{products.slice(0, 5).map((item, index) => <tr key={`${item.product_id ?? item.product_name}-${index}`}><td><span className="dashboard-product-cell">{item.thumbnail ? <img src={mediaUrl(apiUrl, item.thumbnail)} alt="" loading="lazy" onError={(event) => event.currentTarget.remove()} /> : <span className="dashboard-product-placeholder" aria-hidden="true">{item.product_name.slice(0, 1).toLocaleUpperCase(i18n.language === 'en' ? 'en-US' : 'vi-VN')}</span>}{canViewProducts && item.product_id ? <a href={`/products/${item.product_id}/edit`}>{item.product_name}</a> : item.product_name}</span></td><td>{formatNumber(item.units_sold)}</td><td>{fmt(item.revenue)}</td></tr>)}</tbody></table></div> : <div className="no-orders compact">{t('Chưa có sản phẩm đã bán trong khoảng thời gian này.')}</div>}
  </section>
}

