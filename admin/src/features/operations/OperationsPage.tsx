import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime, formatVnd } from '../../lib/date-format'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { FilterBar } from '../../components/shared/filter-bar'
import { AdvancedFilterSheet } from '../../components/shared/advanced-filter-sheet'
import { useListUrlState } from '../../lib/use-list-url-state'
import { ShipmentEditorDialog } from './ShipmentEditorDialog'
import { FormField } from '../../components/shared/form-field'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { X } from 'lucide-react'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { useTranslation } from 'react-i18next'

export type OperationsSection = 'payments' | 'shipments' | 'movements' | 'customers' | 'carts' | 'wishlist' | 'staff'
type Row = { id: number; order_id?: number; raw_payload?: string | null; shipping_address?: Record<string, string> | string | null; customer_name?: string | null; customer_phone?: string | null; carrier?: string | null; tracking_code?: string | null; status?: string | null; [key: string]: unknown }
type PaymentSummary = { success_count: number; success_amount: number; pending_count: number; pending_amount: number; failed_count: number; failed_amount: number; refunded_count: number; refunded_amount: number }
type Response = { data: Row[]; meta: { current_page: number; last_page: number; total: number }; summary?: PaymentSummary; status_counts?: Record<string, number>; filters?: { categories?: { id: number; name: string }[] } }
type Props = { section: OperationsSection; apiUrl: string; accessToken: string; permissions: string[] }
const money = (value: unknown) => formatVnd(Number(value ?? 0))
const date = (value: unknown) => value ? formatDateTime(String(value)) : '—'
const text = (row: Row, key: string) => String(row[key] ?? '—')
const movementType = (value: unknown, translate: (key: string) => string) => ({ import: translate('Nhập kho'), sale: translate('Bán hàng'), reserve: translate('Giữ cho đơn'), release: translate('Trả lại lượng giữ'), adjust: translate('Điều chỉnh'), return: translate('Nhập hàng trả'), cancel: translate('Hoàn kho do hủy') }[String(value)] ?? String(value ?? '—'))
const movementReference = (row: Row) => row.reference_type ? `${String(row.reference_type)}${row.reference_id ? ` #${row.reference_id}` : ''}` : '—'
function addressLabel(value: Row['shipping_address']): string {
  if (!value) return ''
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return Object.values(parsed).filter((part): part is string => typeof part === 'string' && Boolean(part.trim())).join(', ')
    } catch { return value }
    return value
  }
  return Object.values(value).filter((part): part is string => typeof part === 'string' && Boolean(part.trim())).join(', ')
}
function printShipmentLabel(row: Row, translate: (key: string) => string, locale: 'vi' | 'en'): void {
  const popup = window.open('', '_blank', 'width=680,height=520')
  if (!popup) return
  const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
  popup.opener = null
  popup.document.open()
  popup.document.write(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${translate('Nhãn vận đơn')} ${escape(row.order_code)}</title><style>body{font:16px Arial,sans-serif;margin:0;padding:24px;color:#111}main{border:2px solid #111;padding:24px;max-width:620px;margin:auto}h1{font-size:22px;margin:0 0 18px}p{margin:8px 0;line-height:1.45}.code{font-size:24px;font-weight:700;letter-spacing:1px;margin:16px 0}.recipient{font-size:20px;font-weight:700}@media print{body{padding:0}main{max-width:none}}</style></head><body><main><h1>${translate('NHÃN VẬN ĐƠN · Sarada')}</h1><p>${translate('Đơn hàng:')} <strong>${escape(row.order_code)}</strong></p><p class="recipient">${escape(row.customer_name)}</p><p>${translate('Điện thoại:')} <strong>${escape(row.customer_phone)}</strong></p><p>${translate('Địa chỉ:')} ${escape(addressLabel(row.shipping_address))}</p><p>${translate('Đơn vị vận chuyển:')} ${escape(row.carrier || translate('Chưa xác định'))}</p><p class="code">${escape(row.tracking_code || translate('CHƯA CÓ MÃ VẬN ĐƠN'))}</p><p>${translate('Ngày in:')} ${escape(new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()))}</p></main><script>window.addEventListener('load',()=>window.print())</script></body></html>`)
  popup.document.close()
}
const sortable = (id: string, header: string, sortKey: string, cell: DataTableColumn<Row>['cell']): DataTableColumn<Row> => ({ id, header, sortKey, sortable: true, cell })
const paymentStatusLabel = (value: unknown, refundedAmount: unknown, translate: (key: string) => string) => Number(refundedAmount ?? 0) > 0 && ['success', 'paid'].includes(String(value)) ? translate('Đã hoàn một phần') : ({ pending: translate('Chờ thanh toán'), success: translate('Đã thanh toán'), paid: translate('Đã thanh toán'), failed: translate('Thất bại'), refunded: translate('Đã hoàn tiền') }[String(value)] ?? String(value ?? '—'))
const buildColumns = (t: (key: string) => string): Record<OperationsSection, DataTableColumn<Row>[]> => ({
  payments: [sortable('order', t("ĐƠN HÀNG"), 'order_code', (row) => <a href={`/orders/${row.order_id}`}>{text(row, 'order_code')}</a>), { id: 'customer', header: t("KHÁCH HÀNG"), cell: (row) => <span>{text(row, 'customer_name')}<small>{text(row, 'customer_email')} · {text(row, 'customer_phone')}</small></span> }, sortable('transaction', t("MÃ GIAO DỊCH"), 'transaction_ref', (row) => text(row, 'transaction_ref')), sortable('method', t("PHƯƠNG THỨC"), 'method', (row) => text(row, 'method')), sortable('amount', t("SỐ TIỀN"), 'amount', (row) => <span>{money(row.amount)}{Number(row.refunded_amount ?? 0) > 0 && <small>{t("Đã hoàn")}{' '}{money(row.refunded_amount)}</small>}</span>), sortable('status', t("TRẠNG THÁI"), 'status', (row) => paymentStatusLabel(row.status, row.refunded_amount, t)), sortable('date', t("THỜI GIAN"), 'created_at', (row) => date(row.paid_at ?? row.created_at)), { id: 'actions', header: t("THAO TÁC"), cell: () => null }],
  shipments: [sortable('order', t("ĐƠN HÀNG"), 'order_code', (row) => <a href={`/orders/${row.order_id}`}>{text(row, 'order_code')}</a>), sortable('recipient', t("NGƯỜI NHẬN"), 'order_code', (row) => <span>{text(row, 'customer_name')}<small>{text(row, 'customer_phone')}</small></span>), { id: 'address', header: t("ĐỊA CHỈ"), cell: (row) => addressLabel(row.shipping_address) || '—' }, sortable('carrier', t("ĐƠN VỊ"), 'carrier', (row) => text(row, 'carrier')), sortable('tracking', t("MÃ VẬN ĐƠN"), 'tracking_code', (row) => text(row, 'tracking_code')), sortable('status', t("TRẠNG THÁI"), 'status', (row) => text(row, 'status')), sortable('shipped', t("NGÀY GỬI"), 'shipped_at', (row) => date(row.shipped_at)), sortable('delivered', t("NGÀY GIAO"), 'delivered_at', (row) => date(row.delivered_at))],
  movements: [sortable('date', t("THỜI GIAN"), 'created_at', (row) => date(row.created_at)), sortable('product', t("SẢN PHẨM"), 'product_name', (row) => <span>{text(row, 'product_name')}<small>{text(row, 'sku')}</small></span>), sortable('type', t("LOẠI"), 'type', (row) => movementType(row.type, t)), sortable('quantity', t("THAY ĐỔI"), 'quantity_change', (row) => text(row, 'quantity_change')), sortable('after', t("TỒN SAU"), 'stock_after', (row) => text(row, 'stock_after')), { id: 'reference', header: t("THAM CHIẾU"), cell: (row) => movementReference(row) }, { id: 'note', header: t("LÝ DO"), cell: (row) => text(row, 'note') }, sortable('actor', t("NGƯỜI THỰC HIỆN"), 'creator_name', (row) => text(row, 'creator_name'))],
  customers: [sortable('name', t("KHÁCH HÀNG"), 'name', (row) => text(row, 'name')), sortable('email', 'EMAIL', 'email', (row) => text(row, 'email')), sortable('orders', t("SỐ ĐƠN"), 'order_count', (row) => text(row, 'order_count')), sortable('spent', t("ĐÃ CHI"), 'total_spent', (row) => money(row.total_spent)), sortable('status', t("TRẠNG THÁI"), 'status', (row) => text(row, 'status'))],
  carts: [sortable('id', t("GIỎ HÀNG"), 'id', (row) => `#${row.id}`), sortable('customer', t("KHÁCH HÀNG"), 'customer_name', (row) => <span>{row.customer_name ? text(row, 'customer_name') : t("Khách vãng lai")}<small>{text(row, 'customer_email')} · {text(row, 'customer_phone')}</small></span>), sortable('items', t("SỐ SẢN PHẨM"), 'item_count', (row) => text(row, 'item_count')), sortable('value', t("GIÁ TRỊ"), 'cart_value', (row) => money(row.cart_value)), sortable('updated', t("CẬP NHẬT CUỐI"), 'created_at', (row) => date(row.created_at)), { id: 'actions', header: t("LIÊN HỆ"), cell: (row) => <>{row.customer_email ? <a href={`mailto:${encodeURIComponent(String(row.customer_email))}`} aria-label={t("Gửi email đến ") + row.customer_email}>Email</a> : row.customer_phone ? <a href={`tel:${encodeURIComponent(String(row.customer_phone))}`}>{t("Gọi")}</a> : '—'}</> }],
  wishlist: [sortable('name', t("SẢN PHẨM"), 'name', (row) => <span>{text(row, 'name')}<small>{text(row, 'category_name')}</small></span>), sortable('slug', 'SLUG', 'slug', (row) => text(row, 'slug')), sortable('count', t("LƯỢT YÊU THÍCH"), 'wishlist_count', (row) => text(row, 'wishlist_count')), sortable('stock', t("TỒN KHO"), 'stock_quantity', (row) => text(row, 'stock_quantity')), sortable('date', t("YÊU THÍCH GẦN NHẤT"), 'created_at', (row) => date(row.created_at))],
  staff: [sortable('name', t("HỌ TÊN"), 'name', (row) => text(row, 'name')), sortable('email', 'EMAIL', 'email', (row) => text(row, 'email')), sortable('role', t("VAI TRÒ"), 'role', (row) => text(row, 'role')), sortable('status', t("TRẠNG THÁI"), 'status', (row) => text(row, 'status'))],
})

function PaymentPayloadButton({ row }: { row: Row }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  let formattedPayload = t("Không thể đọc dữ liệu JSON.")
  try {
    formattedPayload = JSON.stringify(JSON.parse(row.raw_payload ?? ''), null, 2)
  } catch {
    // The API normally omits invalid payloads; keep this UI resilient to legacy rows.
  }

  return <>
    <button className="secondary" type="button" onClick={() => setOpen(true)} aria-label={t("Xem dữ liệu thanh toán của đơn {{order}}", { order: text(row, 'order_code') })}>{t("Xem payload")}</button>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" showCloseButton={false} className="payment-payload-sheet">
        <SheetHeader className="payment-payload-sheet-header">
          <div>
            <SheetTitle>{t("Payload thanh toán")}</SheetTitle>
            <SheetDescription>{t("Đơn")}{' '}{text(row, 'order_code')} {t("· Các trường nhạy cảm đã được che trước khi gửi tới trình duyệt.")}</SheetDescription>
          </div>
          <SheetClose asChild><button type="button" className="secondary payment-payload-close" aria-label={t("Đóng payload")}><X size={16} aria-hidden="true" /></button></SheetClose>
        </SheetHeader>
        <pre className="payment-payload-json" aria-label={t("Payload JSON đã được che dữ liệu nhạy cảm")}>{formattedPayload}</pre>
      </SheetContent>
    </Sheet>
  </>
}

export function OperationsPage({ section, apiUrl, accessToken, permissions }: Props) {
  const { t, i18n } = useTranslation()
  const columnsData = buildColumns(t)
  const columns = columnsData
  const pageSize = useAdminPageSize()
  const defaultSort = section === 'wishlist' ? '-wishlist_count' : '-created_at'
  const legacyStatus = new URLSearchParams(window.location.search).get('status') ?? ''
  const { state: urlState, queryState, setValue: setUrlValue, clearFilters } = useListUrlState(`operations_${section}`, { q: '', status: legacyStatus, method: '', carrier: '', from: '', to: '', min_amount: '', max_amount: '', inactive_hours: '3', min_value: '', max_value: '', customer_type: '', view: 'products', category_id: '', page: '1', sort: defaultSort })
  const q = urlState.q
  const queryQ = queryState.q
  const status = urlState.status
  const method = urlState.method
  const carrier = urlState.carrier
  const from = urlState.from
  const to = urlState.to
  const minAmount = urlState.min_amount
  const maxAmount = urlState.max_amount
  const inactiveHours = urlState.inactive_hours || '3'
  const minCartValue = urlState.min_value
  const maxCartValue = urlState.max_value
  const customerType = urlState.customer_type
  const wishlistView = urlState.view || 'products'
  const wishlistCategoryId = urlState.category_id
  const page = Math.max(1, Number.parseInt(urlState.page, 10) || 1)
  const sort = urlState.sort || defaultSort
  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc'
  const [exporting, setExporting] = useState(false); const [exportError, setExportError] = useState('')
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null)
  const [selectedCartId, setSelectedCartId] = useState<number | null>(null)
  const [selectedShipment, setSelectedShipment] = useState<Row | null>(null)
  const [paymentAction, setPaymentAction] = useState<'collect' | 'refund' | null>(null)
  const [paymentReason, setPaymentReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [paymentActionBusy, setPaymentActionBusy] = useState(false)
  const [paymentActionError, setPaymentActionError] = useState('')
  const [paymentActionFieldErrors, setPaymentActionFieldErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('status')) return
    params.delete('status')
    const query = params.toString()
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [section])
  const list = useQuery({ queryKey: ['admin', 'operations', section, queryQ, status, method, carrier, from, to, minAmount, maxAmount, inactiveHours, minCartValue, maxCartValue, customerType, wishlistView, wishlistCategoryId, sort, page, pageSize], queryFn: async () => { const params = new URLSearchParams({ page: String(page), per_page: String(pageSize), sort }); if (queryQ) params.set('q', queryQ); if (status) params.set('status', status); if (method) params.set('method', method); if (section === 'shipments' && carrier) params.set('carrier', carrier); if (from) params.set('from', from); if (to) params.set('to', to); if (section === 'payments' && minAmount) params.set('min_amount', minAmount); if (section === 'payments' && maxAmount) params.set('max_amount', maxAmount); if (section === 'carts') { params.set('inactive_hours', inactiveHours); if (minCartValue) params.set('min_value', minCartValue); if (maxCartValue) params.set('max_value', maxCartValue); if (customerType) params.set('customer_type', customerType) } if (section === 'wishlist') { params.set('view', wishlistView); if (wishlistCategoryId && wishlistView === 'products') params.set('category_id', wishlistCategoryId) } const response = await adminApiFetch(`${apiUrl}/admin/operations/${section}?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); const body = await response.json() as Response & { message?: string }; if (!response.ok) throw new Error(body.message ?? t("Không thể tải dữ liệu.")); return body }, enabled: Boolean(accessToken) })
  const paymentDetail = useQuery({ queryKey: ['admin', 'payment', selectedPaymentId], queryFn: async () => { const response = await adminApiFetch(`${apiUrl}/admin/payments/${selectedPaymentId}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); const body = await response.json() as { data?: Row; message?: string }; if (!response.ok || !body.data) throw new Error(body.message ?? t("Không thể tải chi tiết giao dịch.")); return body.data }, enabled: section === 'payments' && selectedPaymentId !== null })
  const paymentDraftDirty = Boolean(paymentAction && (paymentReason.trim() || (paymentAction === 'refund' && refundAmount !== String(paymentDetail.data?.refundable_amount ?? ''))))
  const confirmPaymentDiscard = useUnsavedFormGuard(paymentDraftDirty)
  const cartDetail = useQuery({ queryKey: ['admin', 'cart', selectedCartId], queryFn: async () => { const response = await adminApiFetch(`${apiUrl}/admin/operations/carts/${selectedCartId}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); const body = await response.json() as { data?: Row; message?: string }; if (!response.ok || !body.data) throw new Error(body.message ?? t("Không thể tải chi tiết giỏ hàng.")); return body.data }, enabled: section === 'carts' && selectedCartId !== null })
  const title = section === 'shipments' ? t("Vận đơn") : section === 'payments' ? t("Thanh toán") : section === 'movements' ? t("Lịch sử nhập/xuất kho") : section === 'customers' ? t("Khách hàng") : section === 'staff' ? t("Nhân viên") : section === 'carts' ? t("Giỏ hàng bị bỏ quên") : t("Sản phẩm được yêu thích")
  const shipmentColumns = section === 'shipments' ? [...columnsData.shipments, { id: 'actions', header: t("THAO TÁC"), cell: (row: Row) => <RowActionsMenu label={`Thao tác vận đơn ${row.tracking_code ?? row.id}`} actions={[{ id: 'edit', label: t("Cập nhật"), onSelect: () => setSelectedShipment(row) }, { id: 'print', label: t("In nhãn"), onSelect: () => printShipmentLabel(row, t, i18n.resolvedLanguage === 'en' ? 'en' : 'vi') }]} /> } as DataTableColumn<Row>] : columns[section]
  const canUpdatePayments = permissions.includes('orders.update_status')
  const activeColumns = section === 'payments' ? columnsData.payments.map((column) => column.id === 'actions' ? { ...column, cell: (row: Row) => <RowActionsMenu label={`Thao tác thanh toán ${text(row, 'transaction_ref')}`} actions={[{ id: 'details', label: t("Chi tiết"), onSelect: () => setSelectedPaymentId(row.id) }]} /> } : column) : section === 'carts' ? columnsData.carts.map((column) => column.id === 'id' ? { ...column, cell: (row: Row) => <button className="link-button" type="button" onClick={() => setSelectedCartId(row.id)}>#{row.id}</button> } : column) : section === 'wishlist' && wishlistView === 'customers' ? [sortable('customer_name', t("KHÁCH HÀNG"), 'customer_name', (row) => <span>{text(row, 'customer_name')}<small>{text(row, 'email')}</small></span>), sortable('wishlist_count', t("SẢN PHẨM YÊU THÍCH"), 'wishlist_count', (row) => text(row, 'wishlist_count')), sortable('created_at', t("LƯỢT MỚI NHẤT"), 'created_at', (row) => date(row.created_at))] : section === 'wishlist' ? columnsData.wishlist : shipmentColumns
  const statusOptions: [string, string][] = section === 'payments'
    ? [['pending', t("Đang chờ")], ['success', t("Thành công")], ['failed', t("Thất bại")], ['refunded', t("Đã hoàn")]]
    : section === 'shipments'
      ? [['waiting', t("Chờ lấy hàng")], ['in_transit', t("Đang giao")], ['delivered', t("Đã giao")], ['failed', t("Thất bại / hoàn hàng")]]
      : section === 'movements'
        ? [['import', t("Nhập kho")], ['sale', t("Bán hàng")], ['reserve', t("Giữ cho đơn")], ['release', t("Trả lại lượng giữ")], ['adjust', t("Điều chỉnh")], ['return', t("Nhập hàng trả")], ['cancel', t("Hoàn kho do hủy")]]
        : section === 'customers' || section === 'staff'
          ? [['active', t("Hoạt động")], ['blocked', t("Đã khóa")]]
          : []
  const exportCsv = async () => {
    setExporting(true)
    setExportError('')
    try {
      const params = new URLSearchParams({ per_page: '100', sort })
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      if (method) params.set('method', method)
      if (section === 'shipments' && carrier) params.set('carrier', carrier)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (section === 'payments' && minAmount) params.set('min_amount', minAmount)
      if (section === 'payments' && maxAmount) params.set('max_amount', maxAmount)
      if (section === 'carts') { params.set('inactive_hours', inactiveHours); if (minCartValue) params.set('min_value', minCartValue); if (maxCartValue) params.set('max_value', maxCartValue); if (customerType) params.set('customer_type', customerType) }
      if (section === 'wishlist') { params.set('view', wishlistView); if (wishlistCategoryId && wishlistView === 'products') params.set('category_id', wishlistCategoryId) }
      const rows: Row[] = []
      let currentPage = 1
      let lastPage = 1
      do {
        params.set('page', String(currentPage))
        if (currentPage === 1) params.set('export', '1')
        else params.delete('export')
        const response = await adminApiFetch(`${apiUrl}/admin/operations/${section}?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
        const body = await response.json().catch(() => ({})) as Response & { message?: string }
        if (!response.ok) throw new Error(body.message ?? t("Không thể xuất dữ liệu."))
        rows.push(...body.data)
        lastPage = body.meta.last_page
        currentPage += 1
      } while (currentPage <= lastPage)

      const fields: Record<OperationsSection, [string, (row: Row) => unknown][]> = {
        payments: [[t("Mã"), (row) => row.id], [t("Đơn hàng"), (row) => row.order_code], [t("Khách hàng"), (row) => row.customer_name], ['Email', (row) => row.customer_email], [t("Điện thoại"), (row) => row.customer_phone], [t("Phương thức"), (row) => row.method], [t("Số tiền"), (row) => row.amount], [t("Đã hoàn"), (row) => row.refunded_amount], [t("Còn hoàn"), (row) => row.refundable_amount], [t("Trạng thái"), (row) => paymentStatusLabel(row.status, row.refunded_amount, t)], [t("Mã giao dịch"), (row) => row.transaction_ref], [t("Thời gian"), (row) => row.paid_at ?? row.created_at]],
        shipments: [[t("Mã"), (row) => row.id], [t("Đơn hàng"), (row) => row.order_code], [t("Người nhận"), (row) => row.customer_name], [t("Điện thoại"), (row) => row.customer_phone], [t("Địa chỉ"), (row) => addressLabel(row.shipping_address as Row['shipping_address'])], [t("Đơn vị vận chuyển"), (row) => row.carrier], [t("Mã vận đơn"), (row) => row.tracking_code], [t("Trạng thái"), (row) => row.status], [t("Ngày gửi"), (row) => row.shipped_at], [t("Ngày giao"), (row) => row.delivered_at]],
        movements: [[t("Mã"), (row) => row.id], [t("Thời gian"), (row) => row.created_at], [t("Sản phẩm"), (row) => row.product_name], ['SKU', (row) => row.sku], [t("Loại"), (row) => movementType(row.type, t)], [t("Thay đổi"), (row) => row.quantity_change], [t("Tồn sau"), (row) => row.stock_after], [t("Tham chiếu"), movementReference], [t("Lý do"), (row) => row.note], [t("Người thực hiện"), (row) => row.creator_name]],
        customers: [[t("Mã"), (row) => row.id], [t("Họ tên"), (row) => row.name], ['Email', (row) => row.email], [t("Điện thoại"), (row) => row.phone], [t("Số đơn"), (row) => row.order_count], [t("Đã chi"), (row) => row.total_spent], [t("Trạng thái"), (row) => row.status], [t("Ngày tạo"), (row) => row.created_at]],
        carts: [[t("Mã giỏ"), (row) => row.id], [t("Loại khách"), (row) => row.user_id ? t("Đã đăng nhập") : t("Khách vãng lai")], [t("Khách hàng"), (row) => row.customer_name ?? t("Khách vãng lai")], ['Email', (row) => row.customer_email], [t("Điện thoại"), (row) => row.customer_phone], [t("Số sản phẩm"), (row) => row.item_count], [t("Giá trị VND"), (row) => row.cart_value], [t("Cập nhật lúc"), (row) => row.created_at], [t("Hết hạn lúc"), (row) => row.expires_at]],
        wishlist: [[t("Mã"), (row) => row.id], [t("Sản phẩm"), (row) => row.name], ['Slug', (row) => row.slug], [t("Danh mục"), (row) => row.category_name], [t("Lượt yêu thích"), (row) => row.wishlist_count], [t("Tồn kho"), (row) => row.stock_quantity], [t("Lần yêu thích gần nhất"), (row) => row.created_at]],
        staff: [[t("Mã"), (row) => row.id], [t("Họ tên"), (row) => row.name], ['Email', (row) => row.email], [t("Điện thoại"), (row) => row.phone], [t("Vai trò"), (row) => row.role], [t("Trạng thái"), (row) => row.status], [t("Đăng nhập gần nhất"), (row) => row.last_login_at], [t("Ngày tạo"), (row) => row.created_at]],
      }
      const csvValue = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
      const wishlistFields: [string, (row: Row) => unknown][] = wishlistView === 'customers'
        ? [[t("Mã khách"), (row) => row.id], [t("Khách hàng"), (row) => row.customer_name], ['Email', (row) => row.email], [t("Số sản phẩm yêu thích"), (row) => row.wishlist_count], [t("Yêu thích gần nhất"), (row) => row.created_at]]
        : [[t("Mã sản phẩm"), (row) => row.id], [t("Sản phẩm"), (row) => row.name], ['Slug', (row) => row.slug], [t("Danh mục"), (row) => row.category_name], [t("Lượt yêu thích"), (row) => row.wishlist_count], [t("Tồn kho"), (row) => row.stock_quantity], [t("Yêu thích gần nhất"), (row) => row.created_at]]
      const exportFields = section === 'wishlist' ? wishlistFields : fields[section]
      const csv = [exportFields.map(([header]) => csvValue(header)).join(','), ...rows.map((row) => exportFields.map(([, value]) => csvValue(value(row))).join(','))].join('\r\n')
      const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a'); link.href = url; link.download = `admin-${section}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : t("Không thể xuất dữ liệu."))
    } finally {
      setExporting(false)
    }
  }
  const submitPaymentAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payment = paymentDetail.data
    if (!payment || !paymentAction) return
    const reason = paymentReason.trim()
    if (reason.length < 3) { setPaymentActionFieldErrors({ reason: t("Nhập ít nhất 3 ký tự.") }); return }
    if (paymentAction === 'refund' && (!Number.isSafeInteger(Number(refundAmount)) || Number(refundAmount) < 1 || Number(refundAmount) > Number(payment.refundable_amount ?? 0))) { setPaymentActionFieldErrors({ amount: t("Nhập số nguyên dương không vượt quá số tiền còn có thể hoàn.") }); return }
    setPaymentActionBusy(true); setPaymentActionError(''); setPaymentActionFieldErrors({})
    try {
      const collect = paymentAction === 'collect'
      const endpoint = collect ? `${apiUrl}/admin/orders/${payment.order_id}/payment-status` : `${apiUrl}/admin/payments/${payment.id}/refund`
      const response = await adminApiFetch(endpoint, {
        method: collect ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(collect ? { payment_status: 'paid', note: reason } : { amount: Number(refundAmount), reason }),
      })
      const result = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) {
        const fieldErrors = Object.fromEntries(Object.entries(result.errors ?? {}).map(([key, messages]) => [key === 'note' ? 'reason' : key, messages?.[0] ?? t("Giá trị không hợp lệ.")]))
        if (Object.keys(fieldErrors).length) { setPaymentActionFieldErrors(fieldErrors); return }
        throw new Error(result.message ?? t("Không thể cập nhật giao dịch."))
      }
      confirmPaymentDiscard.clear()
      setPaymentAction(null); setPaymentReason(''); setSelectedPaymentId(null)
      await list.refetch()
    } catch (cause) {
      setPaymentActionError(cause instanceof Error ? cause.message : t("Không thể cập nhật giao dịch."))
    } finally { setPaymentActionBusy(false) }
  }
  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = []
  const addFilterChip = (id: string, label: string, key: string) => activeFilterChips.push({ id, label, onRemove: () => setUrlValue(key, '') })
  if (q) addFilterChip('q', `Tìm: ${q}`, 'q')
  if (status) addFilterChip('status', `Trạng thái: ${statusOptions.find(([value]) => value === status)?.[1] ?? status}`, 'status')
  if (method) addFilterChip('method', `Phương thức: ${method}`, 'method')
  if (section === 'shipments' && carrier) addFilterChip('carrier', `Đơn vị vận chuyển: ${carrier}`, 'carrier')
  if (from) addFilterChip('from', `Từ ${from}`, 'from')
  if (to) addFilterChip('to', `Đến ${to}`, 'to')
  if (minAmount) addFilterChip('min_amount', `Số tiền từ ${money(minAmount)}`, 'min_amount')
  if (maxAmount) addFilterChip('max_amount', `Số tiền đến ${money(maxAmount)}`, 'max_amount')
  if (section === 'carts' && inactiveHours !== '3') addFilterChip('inactive_hours', `Không hoạt động từ ${inactiveHours} giờ`, 'inactive_hours')
  if (section === 'carts' && minCartValue) addFilterChip('min_value', `Giá trị giỏ từ ${money(minCartValue)}`, 'min_value')
  if (section === 'carts' && maxCartValue) addFilterChip('max_value', `Giá trị giỏ đến ${money(maxCartValue)}`, 'max_value')
  if (section === 'carts' && customerType) addFilterChip('customer_type', customerType === 'guest' ? t("Khách vãng lai") : t("Đã đăng nhập"), 'customer_type')
  if (section === 'wishlist' && wishlistCategoryId) addFilterChip('category_id', `Danh mục #${wishlistCategoryId}`, 'category_id')
  return <section className="panel listing">
    <div className="panel-heading"><div><h2>{title}</h2><p>{t("Nhấn tiêu đề cột để sắp xếp dữ liệu từ máy chủ.")}</p></div><button className="secondary" type="button" onClick={() => void exportCsv()} disabled={exporting || !list.data?.meta.total}>{exporting ? t("Đang xuất...") : t("Xuất CSV")}</button></div>
    {section === 'shipments' && <div className="order-status-tabs" role="group" aria-label={t("Lọc nhanh theo trạng thái vận chuyển")}>{[['', t("Tất cả")], ['waiting', t("Chờ lấy hàng")], ['in_transit', t("Đang giao")], ['delivered', t("Đã giao")], ['failed', t("Thất bại / hoàn hàng")]].map(([value, label]) => <button key={value || 'all'} className="order-status-tab" type="button" aria-pressed={status === value} onClick={() => setUrlValue('status', value)}>{label} <span>{list.data?.status_counts?.[value || "all"] ?? "—"}</span></button>)}</div>}
    {section === 'payments' && <div className="order-status-tabs" role="group" aria-label={t("Lọc nhanh theo trạng thái thanh toán")}>{[['', t("Tất cả"), 'all'], ['pending', t("Chờ thanh toán"), 'pending'], ['success', t("Đã thanh toán"), 'success'], ['failed', t("Thất bại"), 'failed'], ['refunded', t("Hoàn tiền"), 'refunded']].map(([value, label, countKey]) => <button key={countKey} className="order-status-tab" type="button" aria-pressed={status === value} onClick={() => setUrlValue('status', value)}>{label} <span>{list.data?.status_counts?.[countKey] ?? '—'}</span></button>)}</div>}
    {section === 'payments' && list.data?.summary && <div className="report-metrics payment-summary" aria-label={t("Tổng hợp thanh toán theo bộ lọc")}><article><span>{t("THÀNH CÔNG")}</span><strong>{money(list.data.summary.success_amount)}</strong><small>{list.data.summary.success_count} {t("giao dịch")}</small></article><article><span>{t("ĐANG CHỜ")}</span><strong>{money(list.data.summary.pending_amount)}</strong><small>{list.data.summary.pending_count} {t("giao dịch")}</small></article><article><span>{t("THẤT BẠI")}</span><strong>{money(list.data.summary.failed_amount)}</strong><small>{list.data.summary.failed_count} {t("giao dịch")}</small></article><article><span>{t("ĐÃ HOÀN")}</span><strong>{money(list.data.summary.refunded_amount)}</strong><small>{list.data.summary.refunded_count} {t("giao dịch")}</small></article></div>}
    {section === 'wishlist' && <div className="order-status-tabs" role="group" aria-label={t("Chế độ xem sản phẩm yêu thích")}><button className="order-status-tab" type="button" aria-pressed={wishlistView === 'products'} onClick={() => setUrlValue('view', 'products')}>{t("Theo sản phẩm")}</button><button className="order-status-tab" type="button" aria-pressed={wishlistView === 'customers'} onClick={() => setUrlValue('view', 'customers')}>{t("Theo khách")}</button></div>}
    <FilterBar hasFilters={Boolean(q || status || method || from || to || (section === 'payments' && (minAmount || maxAmount)) || (section === 'carts' && (minCartValue || maxCartValue || customerType || inactiveHours !== '3')) || (section === 'wishlist' && wishlistCategoryId) || sort !== defaultSort)} onClear={() => clearFilters(['q', 'status', 'method', 'from', 'to', 'min_amount', 'max_amount', 'inactive_hours', 'min_value', 'max_value', 'customer_type', 'category_id', 'sort'])} activeFilters={activeFilterChips}>
      <input aria-label={t("Tìm theo từ khóa")} placeholder={section === 'movements' ? t("Tìm sản phẩm, SKU, người thao tác hoặc lý do") : section === 'wishlist' ? wishlistView === 'customers' ? t("Tìm tên hoặc email khách hàng") : t("Tìm tên sản phẩm") : t("Tìm theo từ khóa...")} value={q} onChange={(event) => setUrlValue('q', event.target.value)} />
    </FilterBar>
    <AdvancedFilterSheet filters={{ status, method, carrier, from, to, min_amount: minAmount, max_amount: maxAmount, inactive_hours: inactiveHours, min_value: minCartValue, max_value: maxCartValue, customer_type: customerType, category_id: wishlistCategoryId }} defaults={{ status: '', method: '', carrier: '', from: '', to: '', min_amount: '', max_amount: '', inactive_hours: '3', min_value: '', max_value: '', customer_type: '', category_id: '' }} activeCount={(section === 'payments' ? [method, from, to, minAmount, maxAmount] : section === 'shipments' ? [carrier, from, to] : section === 'movements' ? [status, from, to] : section === 'customers' || section === 'staff' ? [status, from, to] : section === 'carts' ? [inactiveHours !== '3' ? inactiveHours : '', minCartValue, maxCartValue, customerType, from, to] : [from, to, ...(wishlistView === 'products' ? [wishlistCategoryId] : [])]).filter(Boolean).length} onApply={(values) => { setUrlValue('status', values.status); setUrlValue('method', values.method); setUrlValue('carrier', values.carrier); setUrlValue('from', values.from); setUrlValue('to', values.to); setUrlValue('min_amount', values.min_amount); setUrlValue('max_amount', values.max_amount); setUrlValue('inactive_hours', values.inactive_hours || '3'); setUrlValue('min_value', values.min_value); setUrlValue('max_value', values.max_value); setUrlValue('customer_type', values.customer_type); setUrlValue('category_id', values.category_id); setUrlValue('page', '1') }}>
      {(draft, setValue) => <>
        {section === 'payments' && <><label>{t("Phương thức thanh toán")}<select value={draft.method} onChange={(event) => setValue('method', event.target.value)}><option value="">{t("Tất cả phương thức")}</option><option value="cod">COD</option><option value="bank_transfer">{t("Chuyển khoản")}</option><option value="vnpay">VNPay</option><option value="momo">MoMo</option><option value="stripe">Stripe</option></select></label><label>{t("Số tiền từ (₫)")}<input aria-label={t("Số tiền thanh toán tối thiểu")} type="number" min="0" step="1" value={draft.min_amount} onChange={(event) => setValue('min_amount', event.target.value)} /></label><label>{t("Số tiền đến (₫)")}<input aria-label={t("Số tiền thanh toán tối đa")} type="number" min={draft.min_amount || '0'} step="1" value={draft.max_amount} onChange={(event) => setValue('max_amount', event.target.value)} /></label></>}
        {section === 'shipments' && <label>{t("Đơn vị vận chuyển")}<input type="search" maxLength={120} value={draft.carrier} onChange={(event) => setValue('carrier', event.target.value)} placeholder={t("Nhập tên đơn vị")} /></label>}
        {statusOptions.length > 0 && !['payments', 'shipments'].includes(section) && <label>{section === 'movements' ? t("Loại biến động") : t("Trạng thái")}<select value={draft.status} onChange={(event) => setValue('status', event.target.value)}><option value="">{section === 'movements' ? t("Tất cả loại biến động") : t("Tất cả trạng thái")}</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
        {section === 'carts' && <><label>{t("Không hoạt động từ (giờ)")}<input aria-label={t("Thời gian không hoạt động tối thiểu (giờ)")} type="number" min="1" max="8760" step="1" value={draft.inactive_hours} onChange={(event) => setValue('inactive_hours', event.target.value)} /></label><label>{t("Giá trị giỏ từ (₫)")}<input aria-label={t("Giá trị giỏ tối thiểu (VND)")} type="number" min="0" step="1" value={draft.min_value} onChange={(event) => setValue('min_value', event.target.value)} /></label><label>{t("Giá trị giỏ đến (₫)")}<input aria-label={t("Giá trị giỏ tối đa (VND)")} type="number" min={draft.min_value || '0'} step="1" value={draft.max_value} onChange={(event) => setValue('max_value', event.target.value)} /></label><label>{t("Loại khách")}<select value={draft.customer_type} onChange={(event) => setValue('customer_type', event.target.value)}><option value="">{t("Tất cả khách")}</option><option value="registered">{t("Đã đăng nhập")}</option><option value="guest">{t("Khách vãng lai")}</option></select></label></>}
        {section === 'wishlist' && wishlistView === 'products' && <label>{t("Danh mục sản phẩm")}<select value={draft.category_id} onChange={(event) => setValue('category_id', event.target.value)}><option value="">{t("Tất cả danh mục")}</option>{list.data?.filters?.categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>}
        {(section === 'payments' || section === 'shipments' || section === 'movements' || section === 'customers' || section === 'staff' || section === 'carts' || section === 'wishlist') && <><label>{t("Từ ngày")}<input type="date" value={draft.from} max={draft.to || undefined} onChange={(event) => setValue('from', event.target.value)} /></label><label>{t("Đến ngày")}<input type="date" value={draft.to} min={draft.from || undefined} onChange={(event) => setValue('to', event.target.value)} /></label></>}
      </>}
    </AdvancedFilterSheet>
    {section === 'payments' && minAmount && maxAmount && Number(minAmount) > Number(maxAmount) && <p className="reference-error" role="alert">{t("Số tiền tối đa phải lớn hơn hoặc bằng số tiền tối thiểu.")}</p>}
    {section === 'carts' && minCartValue && maxCartValue && Number(minCartValue) > Number(maxCartValue) && <p className="reference-error" role="alert">{t("Giá trị tối đa phải lớn hơn hoặc bằng giá trị tối thiểu.")}</p>}
    {exportError && <p className="reference-error" role="alert">{exportError}</p>}
    <DataTable columns={activeColumns} rows={list.data?.data ?? []} rowKey={(row) => row.id} loading={list.isLoading} error={list.error instanceof Error ? list.error.message : null} onRetry={() => void list.refetch()} noResults={Boolean(q || status || method || carrier || from || to || minAmount || maxAmount || (section === 'carts' && (minCartValue || maxCartValue || customerType || inactiveHours !== '3')) || (section === 'wishlist' && wishlistCategoryId))} emptyTitle={t("Chưa có dữ liệu")} emptyDescription={t("Dữ liệu sẽ xuất hiện khi cửa hàng có hoạt động tương ứng.")} page={list.data?.meta.current_page ?? page} pageCount={list.data?.meta.last_page ?? 1} totalRows={list.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUrlValue('page', String(nextPage))} sortBy={sortBy} sortDirection={sortDirection} onSortChange={(field, direction) => setUrlValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${field}` : field)} />
    {section === 'carts' && <Sheet open={selectedCartId !== null} onOpenChange={(open) => { if (!open) setSelectedCartId(null) }}>
      <SheetContent side="right" showCloseButton className="payment-payload-sheet">
        <SheetHeader><SheetTitle>{t("Chi tiết giỏ hàng")}{' '}{selectedCartId ? `#${selectedCartId}` : ''}</SheetTitle><SheetDescription>{t("Chỉ xem thông tin. Giỏ được xếp vào nhóm bỏ quên khi không hoạt động đủ số giờ đã chọn.")}</SheetDescription></SheetHeader>
        {cartDetail.isLoading ? <p role="status">{t("Đang tải nội dung giỏ hàng…")}</p> : cartDetail.error ? <div role="alert"><p>{cartDetail.error.message}</p><button className="secondary" type="button" onClick={() => void cartDetail.refetch()}>{t("Thử lại")}</button></div> : cartDetail.data && <div className="payment-detail-content cart-detail-content">
          <dl><dt>{t("Khách hàng")}</dt><dd>{cartDetail.data.customer && typeof cartDetail.data.customer === 'object' ? String((cartDetail.data.customer as Record<string, unknown>).name ?? t("Khách hàng")) : t("Khách vãng lai")}</dd><dt>Email</dt><dd>{cartDetail.data.customer && typeof cartDetail.data.customer === 'object' ? String((cartDetail.data.customer as Record<string, unknown>).email ?? '—') : '—'}</dd><dt>{t("Điện thoại")}</dt><dd>{cartDetail.data.customer && typeof cartDetail.data.customer === 'object' ? String((cartDetail.data.customer as Record<string, unknown>).phone ?? '—') : '—'}</dd><dt>{t("Cập nhật cuối")}</dt><dd>{date(cartDetail.data.updated_at)}</dd><dt>{t("Hết hạn")}</dt><dd>{date(cartDetail.data.expires_at)}</dd><dt>{t("Số sản phẩm")}</dt><dd>{text(cartDetail.data, 'item_count')}</dd><dt>{t("Tổng giá trị")}</dt><dd><strong>{money(cartDetail.data.cart_value)}</strong></dd></dl>
          <h3>{t("Sản phẩm trong giỏ")}</h3>{Array.isArray(cartDetail.data.items) && cartDetail.data.items.length > 0 ? <div className="table-wrap"><table><thead><tr><th>{t("SẢN PHẨM")}</th><th>SKU</th><th>{t("MÀU / SIZE")}</th><th>SL</th><th>{t("ĐƠN GIÁ LÚC THÊM")}</th><th>{t("TẠM TÍNH")}</th><th>{t("TỒN HIỆN TẠI")}</th></tr></thead><tbody>{(cartDetail.data.items as Record<string, unknown>[]).map((item) => <tr key={String(item.id)}><td>{String(item.product_name ?? t("Sản phẩm"))}</td><td>{String(item.sku ?? '—')}</td><td>{[item.color, item.size].filter(Boolean).map(String).join(' / ') || '—'}</td><td>{String(item.quantity ?? 0)}</td><td>{money(item.unit_price_snapshot)}</td><td>{money(item.line_total)}</td><td>{String(item.stock_quantity ?? 0)}</td></tr>)}</tbody></table></div> : <p>{t("Giỏ hàng không còn sản phẩm.")}</p>}
        </div>}
      </SheetContent>
    </Sheet>}
    {section === 'shipments' && selectedShipment && <ShipmentEditor row={selectedShipment} apiUrl={apiUrl} accessToken={accessToken} onClose={() => setSelectedShipment(null)} onSaved={() => void list.refetch()} />}
    {section === 'payments' && <Sheet open={selectedPaymentId !== null} onOpenChange={(open) => { if (!open && confirmPaymentDiscard()) { setSelectedPaymentId(null); setPaymentAction(null); setPaymentReason(''); setPaymentActionError('') } }}>
      <SheetContent side="right" showCloseButton className="payment-payload-sheet">
        <SheetHeader><SheetTitle>{t("Chi tiết thanh toán")}</SheetTitle><SheetDescription>{t("Thông tin giao dịch, đơn hàng và dữ liệu gốc đã được lọc trường nhạy cảm.")}</SheetDescription></SheetHeader>
        {paymentDetail.isLoading ? <p role="status">{t("Đang tải chi tiết giao dịch…")}</p> : paymentDetail.error ? <div role="alert"><p>{paymentDetail.error.message}</p><button className="secondary" type="button" onClick={() => void paymentDetail.refetch()}>{t("Thử lại")}</button></div> : paymentDetail.data && <div className="payment-detail-content">
          <dl><dt>{t("Mã giao dịch")}</dt><dd>{text(paymentDetail.data, 'transaction_ref')}</dd><dt>{t("Đơn hàng")}</dt><dd><a href={`/orders/${paymentDetail.data.order_id}`}>{text(paymentDetail.data, 'order_code')}</a></dd><dt>{t("Khách hàng")}</dt><dd>{text(paymentDetail.data, 'customer_name')}<small>{text(paymentDetail.data, 'customer_email')} · {text(paymentDetail.data, 'customer_phone')}</small></dd><dt>{t("Phương thức")}</dt><dd>{text(paymentDetail.data, 'method')}</dd><dt>{t("Số tiền giao dịch")}</dt><dd>{money(paymentDetail.data.amount)}</dd><dt>{t("Đã hoàn")}</dt><dd>{money(paymentDetail.data.refunded_amount)}</dd><dt>{t("Còn có thể hoàn")}</dt><dd>{money(paymentDetail.data.refundable_amount)}</dd><dt>{t("Trạng thái giao dịch")}</dt><dd>{paymentStatusLabel(paymentDetail.data.status, paymentDetail.data.refunded_amount, t)}</dd><dt>{t("Đơn hàng")}</dt><dd>{text(paymentDetail.data, 'order_status')} · {text(paymentDetail.data, 'order_payment_status')}</dd><dt>{t("Thời gian")}</dt><dd>{date(paymentDetail.data.paid_at ?? paymentDetail.data.created_at)}</dd></dl>
          {Array.isArray(paymentDetail.data.refunds) && paymentDetail.data.refunds.length > 0 && <section><h3>{t("Lịch sử hoàn tiền")}</h3><ul className="payment-refund-list">{(paymentDetail.data.refunds as { id: number; amount: number; reason: string; recorded_by_name: string | null; created_at: string }[]).map((refund) => <li key={refund.id}><strong>{money(refund.amount)}</strong><span>{refund.reason}</span><small>{refund.recorded_by_name ?? t("Quản trị viên")} · {date(refund.created_at)}</small></li>)}</ul></section>}
          {paymentDetail.data.raw_payload && <PaymentPayloadButton row={paymentDetail.data} />}
          {canUpdatePayments && paymentDetail.data.method === 'cod' && paymentDetail.data.status === 'pending' && paymentDetail.data.order_payment_status === 'unpaid' && <button className="primary" type="button" onClick={() => { setPaymentAction('collect'); setPaymentReason(''); setPaymentActionError(''); setPaymentActionFieldErrors({}) }}>{t("Đánh dấu đã thu COD")}</button>}
          {canUpdatePayments && ['success', 'paid'].includes(String(paymentDetail.data.status)) && paymentDetail.data.order_payment_status === 'paid' && Number(paymentDetail.data.refundable_amount ?? 0) > 0 && ['delivered', 'returned'].includes(String(paymentDetail.data.order_status)) && <button className="secondary" type="button" onClick={() => { setPaymentAction('refund'); setRefundAmount(String(paymentDetail.data?.refundable_amount ?? '')); setPaymentReason(''); setPaymentActionError(''); setPaymentActionFieldErrors({}) }}>{t("Hoàn tiền")}</button>}
        </div>}
      </SheetContent>
    </Sheet>}
    {section === 'payments' && canUpdatePayments && paymentAction && paymentDetail.data && <dialog className="account-dialog" open aria-labelledby="payment-action-title"><div className="account-dialog-heading"><h2 id="payment-action-title">{paymentAction === 'collect' ? t("Xác nhận đã thu COD") : t("Hoàn tiền giao dịch")}</h2><button className="icon-button" type="button" aria-label={t("Đóng")} onClick={() => { if (confirmPaymentDiscard()) setPaymentAction(null) }}>{t("×")}</button></div><form className="account-password-form" onSubmit={(event) => void submitPaymentAction(event)}>{paymentAction === 'refund' && <FormField id="payment-refund-amount" label={t("Số tiền hoàn (VND)")} error={paymentActionFieldErrors.amount} required hint={`Còn có thể hoàn tối đa ${money(paymentDetail.data.refundable_amount)}.`}><input type="number" required min="1" max={Number(paymentDetail.data.refundable_amount ?? 0)} step="1" value={refundAmount} onChange={(event) => { setRefundAmount(event.target.value); setPaymentActionFieldErrors((errors) => ({ ...errors, amount: '' })) }} /></FormField>}<FormField id="payment-action-reason" label={paymentAction === 'collect' ? t("Ghi chú thu tiền") : t("Lý do hoàn tiền")} error={paymentActionFieldErrors.reason} required><textarea required minLength={3} maxLength={1000} value={paymentReason} onChange={(event) => { setPaymentReason(event.target.value); setPaymentActionFieldErrors((errors) => ({ ...errors, reason: '' })) }} /></FormField>{paymentActionError && <p role="alert" className="account-form-error">{paymentActionError}</p>}<div className="account-dialog-actions"><button className="secondary" type="button" disabled={paymentActionBusy} onClick={() => { if (confirmPaymentDiscard()) setPaymentAction(null) }}>{t("Hủy")}</button><button className="primary" type="submit" disabled={paymentActionBusy || paymentReason.trim().length < 3}>{paymentActionBusy ? t("Đang lưu…") : paymentAction === 'collect' ? t("Xác nhận đã thu") : t("Ghi nhận hoàn tiền")}</button></div></form></dialog>}
  </section>
}

function ShipmentEditor({ row, apiUrl, accessToken, onClose, onSaved }: { row: Row; apiUrl: string; accessToken: string; onClose: () => void; onSaved: () => void }) {
  return <ShipmentEditorDialog
      orderId={Number(row.order_id)}
      carrier={String(row.carrier ?? '')}
      trackingCode={String(row.tracking_code ?? '')}
      trackingUrl={String(row.tracking_url ?? '')}
      status={String(row.status ?? 'pending')}
      apiUrl={apiUrl}
      accessToken={accessToken}
      onClose={onClose}
      onSaved={onSaved}
    />
}
