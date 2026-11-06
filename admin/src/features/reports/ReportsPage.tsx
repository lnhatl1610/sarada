import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { adminApiFetch } from '../../lib/admin-api'
import { formatDate, formatNumber, formatVnd } from '../../lib/date-format'
import { useListUrlState } from '../../lib/use-list-url-state'
import { enqueueAdminExportWhenLarge } from '../../lib/admin-exports'
import { DateRangePicker } from '../../components/shared/date-range-picker'
import '../../ReferenceData.css'
import './ReportsPage.css'
import '../../Reports.css'

type ReportRow = Record<string, string | number | null>
type InventoryReportItem = ReportRow & {
  product_id: number
  product_name: string
  variant_id: number
  sku: string
  color: string | null
  size: string | null
  quantity: number
  reserved: number
  available_quantity: number
  low_stock_threshold: number
  stock_status: 'out_of_stock' | 'low_stock'
}
type ReportData = {
  current?: { order_count: number; revenue: number; discount_total: number; shipping_total: number }
  previous?: { order_count: number; revenue: number; discount_total: number; shipping_total: number }
  daily?: ReportRow[]
  products?: ReportRow[]
  slow_products?: ReportRow[]
  inventory?: { variants: number; retail_value: number; low_stock_count: number; total_quantity: number; total_available_quantity: number }
  inventory_status?: { out_count: number; low_count: number; available_count: number }
  inventory_items?: InventoryReportItem[]
  new_customers?: number
  new_customers_timeline?: ReportRow[]
  coupons?: ReportRow[]
  payment_methods?: ReportRow[]
  top_customers?: ReportRow[]
  revenue_categories?: ReportRow[]
  revenue_brands?: ReportRow[]
  stagnant_inventory?: ReportRow[]
  inventory_turnover?: { units_sold: number; current_available_quantity: number; sell_through_rate: number }
  product_performance?: ReportRow[]
  customer_repeat?: ReportRow[]
  customer_locations?: ReportRow[]
  filters?: {
    categories: { id: number; name: string }[]
    brands: { id: number; name: string }[]
    payment_methods: string[]
    provinces: string[]
    coupon_codes: string[]
  }
  order_statuses?: ReportRow[]
  order_totals?: { order_count: number; cancelled_or_returned: number; cancellation_return_rate: number; avg_processing_minutes: number }
  order_locations?: ReportRow[]
}
export type ReportSection = 'revenue' | 'orders' | 'products' | 'customers' | 'inventory' | 'coupons'
type Props = { apiUrl: string; accessToken: string; section: ReportSection }

const sectionTitles: Record<ReportSection, string> = {
  revenue: 'Báo cáo doanh thu',
  orders: 'Báo cáo đơn hàng',
  products: 'Báo cáo sản phẩm',
  customers: 'Báo cáo khách hàng',
  inventory: 'Báo cáo tồn kho',
  coupons: 'Báo cáo khuyến mãi',
}
const dateInput = (date: Date) => new Date(date.valueOf() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const money = (value: number | string) => formatVnd(Number(value))
const num = (value: number | string) => formatNumber(Number(value))
const percentChange = (current: number, previous: number, translate: (key: string) => string) => previous === 0 ? (current > 0 ? translate('Mới phát sinh') : '0%') : `${current > previous ? '+' : ''}${(((current - previous) / previous) * 100).toFixed(1)}%`
const reportColumns = (translate: (key: string) => string): Record<'daily' | 'newCustomers' | 'products' | 'payments' | 'coupons' | 'customers' | 'categories' | 'brands' | 'performance' | 'repeat' | 'locations' | 'inventory', DataTableColumn<ReportRow>[]> => ({
  daily: [
    { id: 'date', header: translate("Kỳ"), cell: (row) => /^\d{4}-\d{2}-\d{2}$/.test(String(row.date)) ? formatDate(String(row.date)) : String(row.date ?? '—') },
    { id: 'orders', header: translate("Đơn đã thu"), cell: (row) => num(Number(row.orders ?? 0)) },
    { id: 'revenue', header: 'Doanh thu', cell: (row) => money(Number(row.revenue ?? 0)) },
    { id: 'discount', header: translate("Đã giảm"), cell: (row) => money(Number(row.discount_total ?? 0)) },
    { id: 'shipping', header: translate("Phí giao hàng"), cell: (row) => money(Number(row.shipping_total ?? 0)) },
  ],
  newCustomers: [
    { id: 'date', header: translate("Ngày"), cell: (row) => formatDate(String(row.date ?? '')) },
    { id: 'customers', header: translate("Tài khoản khách tạo mới"), cell: (row) => num(Number(row.customers ?? 0)) },
  ],
  products: [
    { id: 'name', header: translate("Sản phẩm"), cell: (row) => row.product_name },
    { id: 'units', header: translate("Đã bán"), cell: (row) => num(Number(row.units_sold ?? 0)) },
    { id: 'revenue', header: 'Doanh thu', cell: (row) => money(Number(row.revenue ?? 0)) },
  ],
  payments: [
    { id: 'method', header: translate("Phương thức"), cell: (row) => row.payment_method },
    { id: 'orders', header: translate("Đơn"), cell: (row) => num(Number(row.order_count ?? 0)) },
    { id: 'revenue', header: 'Doanh thu', cell: (row) => money(Number(row.revenue ?? 0)) },
  ],
  coupons: [
    { id: 'code', header: translate("Mã"), cell: (row) => row.code },
    { id: 'uses', header: translate("Lượt sử dụng"), cell: (row) => num(Number(row.usage_count ?? 0)) },
    { id: 'discount', header: translate("Đã giảm"), cell: (row) => money(Number(row.discount_total ?? 0)) },
  ],
  customers: [
    { id: 'customer', header: translate("Khách hàng"), cell: (row) => row.customer_name },
    { id: 'orders', header: translate("Đơn"), cell: (row) => num(Number(row.order_count ?? 0)) },
    { id: 'spent', header: translate("Chi tiêu"), cell: (row) => money(Number(row.spent ?? 0)) },
  ],
  categories: [
    { id: 'category', header: translate("Danh mục"), cell: (row) => row.category_name },
    { id: 'units', header: translate("Đã bán"), cell: (row) => num(Number(row.units_sold ?? 0)) },
    { id: 'revenue', header: 'Doanh thu', cell: (row) => money(Number(row.revenue ?? 0)) },
  ],
  brands: [
    { id: 'brand', header: translate("Thương hiệu"), cell: (row) => row.brand_name },
    { id: 'units', header: translate("Đã bán"), cell: (row) => num(Number(row.units_sold ?? 0)) },
    { id: 'revenue', header: 'Doanh thu', cell: (row) => money(Number(row.revenue ?? 0)) },
  ],
  performance: [
    { id: 'product', header: translate("Sản phẩm"), cell: (row) => row.product_name },
    { id: 'views', header: translate("Lượt xem"), cell: (row) => num(Number(row.view_count ?? 0)) },
    { id: 'sold', header: translate("Đã bán"), cell: (row) => num(Number(row.sold_count ?? 0)) },
  ],
  repeat: [
    { id: 'customer', header: translate("Khách hàng"), cell: (row) => row.customer_name },
    { id: 'orders', header: translate("Số đơn"), cell: (row) => num(Number(row.order_count ?? 0)) },
    { id: 'segment', header: translate("Nhóm"), cell: (row) => row.segment === 'returning' ? translate("Quay lại") : translate("Mua lần đầu") },
  ],
  locations: [
    { id: 'province', header: translate("Tỉnh / thành"), cell: (row) => row.province },
    { id: 'orders', header: translate("Đơn"), cell: (row) => num(Number(row.order_count ?? 0)) },
  ],
  inventory: [
    { id: 'product', header: translate("Sản phẩm / SKU"), cell: (row) => <a href={`/products/${row.product_id}/edit`}>{row.product_name} · {row.sku}</a> },
    { id: 'variant', header: translate("Màu / cỡ"), cell: (row) => [row.color, row.size].filter(Boolean).join(' / ') || '—' },
    { id: 'status', header: translate("Trạng thái"), cell: (row) => row.stock_status === 'out_of_stock' ? translate("Hết hàng") : translate("Sắp hết") },
    { id: 'quantity', header: translate("Tồn / giữ / khả dụng"), cell: (row) => `${num(Number(row.quantity ?? 0))} / ${num(Number(row.reserved ?? 0))} / ${num(Number(row.available_quantity ?? 0))}` },
    { id: 'threshold', header: translate("Ngưỡng thấp"), cell: (row) => num(Number(row.low_stock_threshold ?? 0)) },
  ],
})

function ReportChart({ title, rows, labelKey, valueKey, format = num }: { title: string; rows: ReportRow[]; labelKey: string; valueKey: string; format?: (value: number) => string }) {
  const { t } = useTranslation()
  if (!rows.length) return null
  const values = rows.map((row) => Number(row[valueKey] ?? 0))
  const maximum = Math.max(...values, 1)
  return <figure className="report-chart" aria-label={title}>
    <figcaption>{title}</figcaption>
    <ol>{rows.slice(0, 12).map((row, index) => {
      const value = values[index] ?? 0
      return <li key={`${String(row[labelKey] ?? index)}-${index}`}>
        <span className="report-chart-label">{String(row[labelKey] ?? '—')}</span>
        <span className="report-chart-track" role="meter" aria-label={String(row[labelKey] ?? t('Giá trị'))} aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={value}><span style={{ width: `${Math.max(0, Math.min(100, value / maximum * 100))}%` }} /></span>
        <strong>{format(value)}</strong>
      </li>
    })}</ol>
  </figure>
}

export function ReportsPage({ apiUrl, accessToken, section }: Props) {
  const { t } = useTranslation()
  const columns = reportColumns(t)
  const [reportDefaults] = useState(() => {
    const today = new Date()
    return { from: dateInput(new Date(today.valueOf() - 29 * 86400000)), to: dateInput(today), group_by: 'day' }
  })
  const { state: urlState, setValue: setUrlValue, clearFilters } = useListUrlState(`reports_${section}`, { ...reportDefaults, payment_method: '', status: '', province: '', category_id: '', brand_id: '', customer_group: '', threshold: '', coupon_code: '' })
  const to = urlState.to
  const from = urlState.from
  const groupBy = (['day', 'week', 'month'].includes(urlState.group_by) ? urlState.group_by : 'day') as 'day' | 'week' | 'month'
  const reportFilters = {
    payment_method: urlState.payment_method,
    status: urlState.status,
    province: urlState.province,
    category_id: urlState.category_id,
    brand_id: urlState.brand_id,
    customer_group: urlState.customer_group,
    threshold: urlState.threshold,
    coupon_code: urlState.coupon_code,
  }
  const reportFilterQuery = new URLSearchParams(Object.entries(reportFilters).filter((entry): entry is [string, string] => Boolean(entry[1])))
  const [exportError, setExportError] = useState('')
  const [exportNotice, setExportNotice] = useState('')
  const [exporting, setExporting] = useState(false)
  const report = useQuery({
    queryKey: ['admin', 'reports', section, from, to, groupBy, reportFilterQuery.toString()],
    queryFn: async () => {
      const query = new URLSearchParams({ from, to })
      if (section === 'revenue') query.set('group_by', groupBy)
      for (const [key, value] of reportFilterQuery) query.set(key, value)
      const response = await adminApiFetch(`${apiUrl}/admin/reports/${section}?${query}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { data?: ReportData; message?: string }
      if (!response.ok || !body.data) throw new Error(body.message ?? t("Không thể tải báo cáo."))
      return body.data
    },
    enabled: Boolean(accessToken && from && to),
  })

  const exportCsv = async () => {
    setExporting(true)
    setExportError('')
    setExportNotice('')
    try {
      const query = new URLSearchParams({ from, to, export: '1' })
      query.set('report', section)
      if (section === 'revenue') query.set('group_by', groupBy)
      for (const [key, value] of reportFilterQuery) query.set(key, value)
      const estimatedRows = Object.values(report.data ?? {}).reduce<number>((total, value) => total + (Array.isArray(value) ? value.length : 0), 0)
      if (await enqueueAdminExportWhenLarge({ apiUrl, accessToken, type: 'report', rowCount: estimatedRows, filters: query })) {
        setExportNotice(t("Đã đưa báo cáo vào Trung tâm tải xuống."))
        return
      }
      const response = await adminApiFetch(`${apiUrl}/admin/reports/${section}?${query}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/csv' } })
      if (!response.ok) throw new Error(t("Không thể xuất báo cáo. Hãy thử lại."))
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `bao-cao-${section}-${from}-${to}.csv`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : t("Không thể xuất báo cáo."))
    } finally {
      setExporting(false)
    }
  }

  const inventory = report.data?.inventory
  const inventoryStatus = report.data?.inventory_status
  return <div className="reports-page">
    <section className="panel reference-page">
      <div className="panel-heading">
        <div><h2>{t(sectionTitles[section])}</h2><p>{section === 'inventory' ? t("Tồn kho là số liệu hiện tại; giá trị dùng giá bán của biến thể.") : t("Dữ liệu được lọc theo khoảng ngày; doanh thu tính trên đơn đã thanh toán và giao thành công.")}</p></div>
        <div className="report-export-actions"><button className="secondary" type="button" onClick={() => void exportCsv()} disabled={!report.data || exporting}>{exporting ? t("Đang xuất…") : t("Xuất CSV")}</button><button className="secondary" type="button" onClick={() => window.print()} disabled={!report.data}>{t("In / Lưu PDF")}</button></div>
      </div>
      <DateRangePicker from={from} to={to} onChange={(nextFrom, nextTo) => {
        setUrlValue('from', nextFrom)
        setUrlValue('to', nextTo)
      }} />
      <div className="reference-form-grid report-filters">
        {section === 'revenue' && <><label>{t("Gộp theo")}{' '}<select value={groupBy} onChange={(event) => setUrlValue('group_by', event.target.value)}><option value="day">{t("Ngày")}</option><option value="week">{t("Tuần")}</option><option value="month">{t("Tháng")}</option></select></label><label>{t("Phương thức thanh toán")}{' '}<select aria-label={t("Lọc phương thức thanh toán")} value={reportFilters.payment_method} onChange={(event) => setUrlValue('payment_method', event.target.value)}><option value="">{t("Tất cả phương thức")}</option>{report.data?.filters?.payment_methods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label></>}
        {section === 'orders' && <><label>{t("Trạng thái")}{' '}<select aria-label={t("Lọc trạng thái đơn hàng")} value={reportFilters.status} onChange={(event) => setUrlValue('status', event.target.value)}><option value="">{t("Tất cả trạng thái")}</option>{[['pending', t("Chờ xác nhận")], ['confirmed', t("Đã xác nhận")], ['processing', t("Đang xử lý")], ['shipped', t("Đang giao")], ['delivered', t("Đã giao")], ['completed', t("Hoàn tất")], ['cancelled', t("Đã hủy")], ['returned', t("Đã trả")]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>{t("Tỉnh / thành")}{' '}<select aria-label={t("Lọc tỉnh thành đơn hàng")} value={reportFilters.province} onChange={(event) => setUrlValue('province', event.target.value)}><option value="">{t("Tất cả tỉnh thành")}</option>{report.data?.filters?.provinces.map((province) => <option key={province} value={province}>{province}</option>)}</select></label></>}
        {section === 'products' && <><label>{t("Danh mục")}{' '}<select aria-label={t("Lọc danh mục sản phẩm")} value={reportFilters.category_id} onChange={(event) => setUrlValue('category_id', event.target.value)}><option value="">{t("Tất cả danh mục")}</option>{report.data?.filters?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>{t("Thương hiệu")}{' '}<select aria-label={t("Lọc thương hiệu sản phẩm")} value={reportFilters.brand_id} onChange={(event) => setUrlValue('brand_id', event.target.value)}><option value="">{t("Tất cả thương hiệu")}</option>{report.data?.filters?.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label></>}
        {section === 'customers' && <><label>{t("Nhóm khách")}{' '}<select aria-label={t("Lọc nhóm khách hàng")} value={reportFilters.customer_group} onChange={(event) => setUrlValue('customer_group', event.target.value)}><option value="">{t("Tất cả nhóm")}</option><option value="new">{t("Mua lần đầu")}</option><option value="returning">{t("Quay lại")}</option></select></label><label>{t("Tỉnh / thành")}{' '}<select aria-label={t("Lọc tỉnh thành khách hàng")} value={reportFilters.province} onChange={(event) => setUrlValue('province', event.target.value)}><option value="">{t("Tất cả tỉnh thành")}</option>{report.data?.filters?.provinces.map((province) => <option key={province} value={province}>{province}</option>)}</select></label></>}
        {section === 'inventory' && <><label>{t("Danh mục")}{' '}<select aria-label={t("Lọc danh mục tồn kho")} value={reportFilters.category_id} onChange={(event) => setUrlValue('category_id', event.target.value)}><option value="">{t("Tất cả danh mục")}</option>{report.data?.filters?.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>{t("Thương hiệu")}{' '}<select aria-label={t("Lọc thương hiệu tồn kho")} value={reportFilters.brand_id} onChange={(event) => setUrlValue('brand_id', event.target.value)}><option value="">{t("Tất cả thương hiệu")}</option>{report.data?.filters?.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label><label>{t("Tồn khả dụng tối đa")}<input aria-label={t("Ngưỡng tồn khả dụng tối đa")} type="number" min="0" max="1000000" value={reportFilters.threshold} onChange={(event) => setUrlValue('threshold', event.target.value)} placeholder={t("Dùng ngưỡng từng SKU")} /></label></>}
        {section === 'coupons' && <label>{t("Mã giảm giá")}{' '}<select aria-label={t("Lọc mã giảm giá")} value={reportFilters.coupon_code} onChange={(event) => setUrlValue('coupon_code', event.target.value)}><option value="">{t("Tất cả mã")}</option>{report.data?.filters?.coupon_codes.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>}
      </div>
      {Object.values(reportFilters).some(Boolean) && <button className="secondary report-clear-filters" type="button" onClick={() => clearFilters(['payment_method', 'status', 'province', 'category_id', 'brand_id', 'customer_group', 'threshold', 'coupon_code'])}>{t("Xóa bộ lọc riêng")}</button>}
      
      {report.isLoading && <div className="shared-skeleton" role="status" aria-label={t("Đang tải báo cáo")} />}
      {report.error && <p role="alert" className="reference-error">{report.error.message} <button className="secondary" type="button" onClick={() => void report.refetch()}>{t("Thử lại")}</button></p>}
      {exportNotice && <p role="status">{exportNotice}</p>}{exportError && <p role="alert" className="reference-error">{exportError}</p>}
      {section === 'revenue' && report.data?.current && report.data.previous && <div className="report-metrics">
        <article><span>{t("DOANH THU KỲ NÀY")}</span><strong>{money(report.data.current.revenue)}</strong><small>{t("Kỳ trước:")}{' '}{money(report.data.previous.revenue)} · {percentChange(report.data.current.revenue, report.data.previous.revenue, t)}</small></article>
        <article><span>{t("ĐƠN ĐÃ THU")}</span><strong>{num(report.data.current.order_count)}</strong><small>{t("Kỳ trước:")}{' '}{num(report.data.previous.order_count)} · {percentChange(report.data.current.order_count, report.data.previous.order_count, t)}</small></article>
        <article><span>{t("TỔNG GIẢM GIÁ")}</span><strong>{money(report.data.current.discount_total)}</strong><small>{t("Kỳ trước:")}{' '}{money(report.data.previous.discount_total)}</small></article>
        <article><span>{t("PHÍ GIAO HÀNG")}</span><strong>{money(report.data.current.shipping_total)}</strong><small>{t("Kỳ trước:")}{' '}{money(report.data.previous.shipping_total)}</small></article>
      </div>}
      {section === 'orders' && report.data?.order_totals && <div className="report-metrics">
        <article><span>{t("TỔNG ĐƠN")}</span><strong>{num(report.data.order_totals.order_count)}</strong></article>
        <article><span>{t("HỦY / TRẢ")}</span><strong>{num(report.data.order_totals.cancelled_or_returned)}</strong><small>{report.data.order_totals.cancellation_return_rate}{t("% tổng đơn")}</small></article>
        <article><span>{t("THỜI GIAN XỬ LÝ TB")}</span><strong>{num(report.data.order_totals.avg_processing_minutes)} {t("phút")}</strong><small>{t("Từ xác nhận tới gửi hàng")}</small></article>
      </div>}
      {section === 'customers' && report.data && <div className="report-metrics">
        <article><span>{t("TÀI KHOẢN KHÁCH MỚI")}</span><strong>{num(report.data.new_customers ?? 0)}</strong><small>{t("Tạo trong khoảng ngày đã chọn")}</small></article>
        <article><span>{t("KHÁCH MUA LẦN ĐẦU")}</span><strong>{num((report.data.customer_repeat ?? []).filter((row) => row.segment === 'new').length)}</strong><small>{t("Có đơn đã thanh toán trong kỳ")}</small></article>
        <article><span>{t("KHÁCH QUAY LẠI")}</span><strong>{num((report.data.customer_repeat ?? []).filter((row) => row.segment === 'returning').length)}</strong><small>{t("Đã có đơn thanh toán trước kỳ")}</small></article>
      </div>}
      {section === 'inventory' && inventory && inventoryStatus && <div className="report-metrics">
        <article><span>{t("BIẾN THỂ")}</span><strong>{num(inventory.variants)}</strong></article>
        <article><span>{t("TỔNG TỒN")}</span><strong>{num(inventory.total_quantity)}</strong><small>{t("Khả dụng:")}{' '}{num(inventory.total_available_quantity)}</small></article>
        <article><span>{t("GIÁ TRỊ THEO GIÁ BÁN")}</span><strong>{money(inventory.retail_value)}</strong></article>
        <article><span>{t("HẾT / SẮP HẾT")}</span><strong>{num(inventoryStatus.out_count)} / {num(inventoryStatus.low_count)}</strong></article>
      </div>}
    </section>

    {section === 'revenue' && report.data && <>
      <section className="panel reference-page"><h2>{t("Doanh thu theo {{period}}", { period: t(({ day: "ngày", week: "tuần", month: "tháng" } as const)[groupBy]) })}</h2><ReportChart title={t("Doanh thu theo kỳ")} rows={report.data.daily ?? []} labelKey="date" valueKey="revenue" format={money} /><DataTable columns={columns.daily} rows={report.data.daily ?? []} rowKey={(row) => String(row.date)} emptyTitle={t("Chưa có doanh thu trong kỳ")} /></section>
      <section className="panel reference-page"><h2>{t("Doanh thu theo phương thức")}</h2><ReportChart title={t("Doanh thu theo phương thức")} rows={report.data.payment_methods ?? []} labelKey="payment_method" valueKey="revenue" format={money} /><DataTable columns={columns.payments} rows={report.data.payment_methods ?? []} rowKey={(row) => String(row.payment_method)} emptyTitle={t("Chưa có dữ liệu thanh toán")} /></section>
      <section className="panel reference-page"><h2>{t("Doanh thu theo danh mục")}</h2><ReportChart title={t("Doanh thu theo danh mục")} rows={report.data.revenue_categories ?? []} labelKey="category_name" valueKey="revenue" format={money} /><DataTable columns={columns.categories} rows={report.data.revenue_categories ?? []} rowKey={(row) => String(row.category_name)} emptyTitle={t("Chưa có dữ liệu danh mục")} /></section>
      <section className="panel reference-page"><h2>{t("Doanh thu theo thương hiệu")}</h2><ReportChart title={t("Doanh thu theo thương hiệu")} rows={report.data.revenue_brands ?? []} labelKey="brand_name" valueKey="revenue" format={money} /><DataTable columns={columns.brands} rows={report.data.revenue_brands ?? []} rowKey={(row) => String(row.brand_name)} emptyTitle={t("Chưa có dữ liệu thương hiệu")} /></section>
      <section className="panel reference-page"><h2>{t("Hiệu quả mã giảm giá")}</h2><ReportChart title={t("Tổng tiền giảm theo mã")} rows={report.data.coupons ?? []} labelKey="code" valueKey="discount_total" format={money} /><DataTable columns={columns.coupons} rows={report.data.coupons ?? []} rowKey={(row) => String(row.code)} emptyTitle={t("Chưa có mã được sử dụng")} /></section>
    </>}
    {section === 'orders' && report.data && <>
      <section className="panel reference-page"><h2>{t("Đơn hàng theo trạng thái")}</h2><ReportChart title={t("Số đơn theo trạng thái")} rows={report.data.order_statuses ?? []} labelKey="status" valueKey="order_count" /><DataTable columns={[
        { id: 'status', header: t("Trạng thái"), cell: (row) => String(row.status ?? '—') },
        { id: 'count', header: t("Số đơn"), cell: (row) => num(Number(row.order_count ?? 0)) },
      ]} rows={report.data.order_statuses ?? []} rowKey={(row) => String(row.status)} emptyTitle={t("Chưa có đơn hàng trong kỳ")} /></section>
      <section className="panel reference-page"><h2>{t("Đơn hàng theo tỉnh thành")}</h2><ReportChart title={t("Số đơn theo tỉnh thành")} rows={report.data.order_locations ?? []} labelKey="province" valueKey="order_count" /><DataTable columns={columns.locations} rows={report.data.order_locations ?? []} rowKey={(row) => String(row.province)} emptyTitle={t("Chưa có dữ liệu địa chỉ")} /></section>
    </>}
    {section === 'coupons' && report.data && <section className="panel reference-page"><h2>{t("Mã giảm giá được sử dụng")}</h2><ReportChart title={t("Lượt sử dụng theo mã")} rows={report.data.coupons ?? []} labelKey="code" valueKey="usage_count" /><DataTable columns={[...columns.coupons, { id: 'revenue', header: t("Doanh thu đơn đã giao"), cell: (row) => money(Number(row.revenue ?? 0)) }]} rows={report.data.coupons ?? []} rowKey={(row) => String(row.code)} emptyTitle={t("Chưa có mã được sử dụng trong kỳ")} /></section>}
    {section === 'products' && report.data && <>
      <section className="panel reference-page"><h2>{t("Sản phẩm bán chạy")}</h2><ReportChart title={t("Số lượng bán theo sản phẩm")} rows={report.data.products ?? []} labelKey="product_name" valueKey="units_sold" /><DataTable columns={columns.products} rows={report.data.products ?? []} rowKey={(row) => String(row.product_name)} emptyTitle={t("Chưa có sản phẩm đã bán")} /></section>
      <section className="panel reference-page"><h2>{t("Doanh thu theo danh mục")}</h2><ReportChart title={t("Doanh thu theo danh mục")} rows={report.data.revenue_categories ?? []} labelKey="category_name" valueKey="revenue" format={money} /><DataTable columns={columns.categories} rows={report.data.revenue_categories ?? []} rowKey={(row) => String(row.category_name)} emptyTitle={t("Chưa có doanh thu theo danh mục")} /></section>
      <section className="panel reference-page"><h2>{t("Doanh thu theo thương hiệu")}</h2><ReportChart title={t("Doanh thu theo thương hiệu")} rows={report.data.revenue_brands ?? []} labelKey="brand_name" valueKey="revenue" format={money} /><DataTable columns={columns.brands} rows={report.data.revenue_brands ?? []} rowKey={(row) => String(row.brand_name)} emptyTitle={t("Chưa có doanh thu theo thương hiệu")} /></section>
      <section className="panel reference-page"><h2>{t("Sản phẩm chưa bán trong kỳ")}</h2><p>{t("Các sản phẩm không có đơn đã thanh toán trong khoảng thời gian đã chọn.")}</p><ReportChart title={t("Lượt xem của sản phẩm chưa bán")} rows={report.data.slow_products ?? []} labelKey="product_name" valueKey="view_count" /><DataTable columns={columns.performance} rows={report.data.slow_products ?? []} rowKey={(row) => String(row.product_name)} emptyTitle={t("Tất cả sản phẩm đều đã có đơn trong kỳ")} /></section>
      <section className="panel reference-page"><h2>{t("Lượt xem và tổng đã bán tích lũy")}</h2><p>{t("Lượt xem và tổng đã bán là bộ đếm hiện tại; doanh thu sản phẩm phía trên dùng khoảng ngày đã chọn.")}</p><ReportChart title={t("Lượt xem theo sản phẩm")} rows={report.data.product_performance ?? []} labelKey="product_name" valueKey="view_count" /><DataTable columns={columns.performance} rows={report.data.product_performance ?? []} rowKey={(row) => String(row.product_name)} emptyTitle={t("Chưa có dữ liệu sản phẩm")} /></section>
    </>}
    {section === 'customers' && report.data && <>
       <section className="panel reference-page"><h2>{t("Tài khoản khách mới theo ngày")}</h2><p>{t("Số tài khoản có vai trò khách hàng được tạo trong từng ngày của khoảng lọc.")}</p><ReportChart title={t("Khách mới theo ngày")} rows={report.data.new_customers_timeline ?? []} labelKey="date" valueKey="customers" /><DataTable columns={columns.newCustomers} rows={report.data.new_customers_timeline ?? []} rowKey={(row) => String(row.date)} emptyTitle={t("Chưa có tài khoản khách mới trong kỳ")} /></section>
       <section className="panel reference-page"><h2>{t("Khách mua lần đầu và quay lại")}</h2><p>{t("Nhóm quay lại đã có ít nhất một đơn thanh toán trước ngày bắt đầu. Số đơn chỉ tính đơn thanh toán trong khoảng lọc.")}</p><ReportChart title={t("Số đơn theo nhóm khách")} rows={report.data.customer_repeat ?? []} labelKey="customer_name" valueKey="order_count" /><DataTable columns={columns.repeat} rows={report.data.customer_repeat ?? []} rowKey={(row) => String(row.customer_ref ?? row.customer_name)} emptyTitle={t("Chưa có đơn đã thanh toán trong kỳ")} /></section>
       <section className="panel reference-page"><h2>{t("Phân bố theo tỉnh thành")}</h2><ReportChart title={t("Số đơn theo tỉnh thành")} rows={report.data.customer_locations ?? []} labelKey="province" valueKey="order_count" /><DataTable columns={columns.locations} rows={report.data.customer_locations ?? []} rowKey={(row) => String(row.province)} emptyTitle={t("Chưa có dữ liệu địa chỉ")} /></section>
       <section className="panel reference-page"><h2>{t("Khách hàng chi tiêu cao")}</h2><ReportChart title={t("Chi tiêu theo khách hàng")} rows={report.data.top_customers ?? []} labelKey="customer_name" valueKey="spent" format={money} /><DataTable columns={columns.customers} rows={report.data.top_customers ?? []} rowKey={(row) => String(row.customer_ref ?? row.customer_name)} emptyTitle={t("Chưa có dữ liệu chi tiêu")} /></section>
    </>}
    {section === 'inventory' && report.data && <section className="panel reference-page">
      <h2>{t("Biến thể hết hàng và sắp hết hàng")}</h2>
       <ReportChart title={t("Số biến thể theo tình trạng tồn kho")} rows={[{ label: t("Hết hàng"), value: inventoryStatus?.out_count ?? 0 }, { label: t("Sắp hết"), value: inventoryStatus?.low_count ?? 0 }, { label: t("Đủ hàng"), value: inventoryStatus?.available_count ?? 0 }]} labelKey="label" valueKey="value" />
       <ReportChart title={t("Tồn khả dụng theo SKU cần chú ý")} rows={(report.data.inventory_items ?? []).map((row) => ({ ...row, chart_label: `${row.product_name} · ${row.sku}` }))} labelKey="chart_label" valueKey="available_quantity" />
      <DataTable columns={columns.inventory} rows={report.data.inventory_items ?? []} rowKey={(row) => String(row.variant_id)} emptyTitle={t("Không có biến thể hết hoặc sắp hết hàng")} />
      {(report.data.inventory_items?.length ?? 0) === 100 && <p>{t("Đang hiển thị tối đa 100 biến thể cần bổ sung; mở")}{' '}<a href="/?page=inventory&inventory_low_stock=1">{t("Tồn kho đã lọc")}</a> {t("để xem toàn bộ.")}</p>}
    </section>}
    {section === 'inventory' && report.data && <>
      <section className="panel reference-page"><h2>{t("Tồn kho lâu không bán")}</h2><p>{t("Biến thể còn hàng nhưng không có đơn giao thành công trong khoảng ngày đã chọn. Lần bán gần nhất được tính trong toàn bộ lịch sử.")}</p><ReportChart title={t("Số lượng khả dụng đang tồn lâu")} rows={(report.data.stagnant_inventory ?? []).map((row) => ({ ...row, chart_label: `${row.product_name} · ${row.sku}` }))} labelKey="chart_label" valueKey="available_quantity" /><DataTable columns={[
        { id: 'product', header: t("Sản phẩm / SKU"), cell: (row) => `${row.product_name} · ${row.sku}` },
        { id: 'available', header: t("Khả dụng"), cell: (row) => num(Number(row.available_quantity ?? 0)) },
        { id: 'last_sold', header: t("Bán gần nhất"), cell: (row) => row.last_sold_at ? formatDate(String(row.last_sold_at).slice(0, 10)) : t("Chưa từng bán") },
      ]} rows={report.data.stagnant_inventory ?? []} rowKey={(row) => String(row.sku)} emptyTitle={t("Không có hàng tồn lâu trong kỳ")} /></section>
      <section className="panel reference-page"><h2>{t("Tỷ lệ bán hết hàng khả dụng")}</h2><p>{t("Công thức ước tính: số lượng bán trong kỳ / (số lượng bán trong kỳ + tồn khả dụng hiện tại). Đây là chỉ báo tham khảo, không phải vòng quay tồn kho kế toán.")}</p><div className="report-metrics"><article><span>{t("ĐÃ BÁN TRONG KỲ")}</span><strong>{num(report.data.inventory_turnover?.units_sold ?? 0)}</strong></article><article><span>{t("TỒN KHẢ DỤNG HIỆN TẠI")}</span><strong>{num(report.data.inventory_turnover?.current_available_quantity ?? 0)}</strong></article><article><span>{t("TỶ LỆ BÁN HẾT ƯỚC TÍNH")}</span><strong>{num(report.data.inventory_turnover?.sell_through_rate ?? 0)}%</strong></article></div></section>
    </>}
  </div>
}
