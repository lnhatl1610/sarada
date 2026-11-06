import { useTranslation } from 'react-i18next'
import { LazyDataTable } from '../../components/shared/lazy-data-table'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { StatusBadge, getStatusLabel } from '../../components/shared/status-badge'
import { formatDateTime, formatNumber, formatVnd } from '../../lib/date-format'
import type { AdminPreferences } from '../preferences/AdminPreferencesPage'

export type OrderRow = {
  id: number
  code: string
  customer_name: string
  customer_phone: string
  item_count?: number
  payment_method: string
  grand_total: number
  status: string
  payment_status: string
  failed_payment_count?: number
  placed_at: string | null
  created_at?: string
}

type PaginationMeta = { current_page: number; last_page: number; per_page: number; total: number }
type Props = {
  orders: OrderRow[]
  selectedIds: number[]
  permissions: string[]
  transitions: Record<string, string[]>
  loading: boolean
  error: string | null
  noResults: boolean
  meta: PaginationMeta
  sort: string
  pageSize: AdminPreferences['pageSize']
  onOpen: (order: OrderRow) => void
  onUpdate: (order: OrderRow, status: string) => void
  onPrint: (order: OrderRow) => void
  onSelectionChange: (ids: number[]) => void
  onSelectionLimit: () => void
  onRetry: () => void
  onSortChange: (field: string, direction: 'asc' | 'desc' | 'none') => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: AdminPreferences['pageSize']) => void
}

export function OrderManagementTable({ orders, selectedIds, permissions, transitions, loading, error, noResults, meta, sort, pageSize, onOpen, onUpdate, onPrint, onSelectionChange, onSelectionLimit, onRetry, onSortChange, onPageChange, onPageSizeChange }: Props) {
  const { t } = useTranslation()

  return <LazyDataTable columns={[
    { id: 'code', header: t('MÃ ĐƠN'), cell: (order: OrderRow) => <button className="order-detail-trigger" type="button" onClick={() => onOpen(order)}>{order.code}</button> },
    { id: 'customer', header: t('KHÁCH HÀNG'), cell: (order: OrderRow) => <>{order.customer_name}<br /><small>{order.customer_phone}</small></> },
    { id: 'item_count', header: t('SẢN PHẨM'), cell: (order: OrderRow) => t('{{count}} sản phẩm', { count: formatNumber(order.item_count ?? 0) }) },
    { id: 'placed_at', header: t('NGÀY ĐẶT'), sortable: true, sortKey: 'placed_at', cell: (order: OrderRow) => { const placedAt = order.placed_at ?? order.created_at; return placedAt ? formatDateTime(placedAt) : '—' } },
    { id: 'total', header: t('TỔNG TIỀN'), sortable: true, sortKey: 'grand_total', cell: (order: OrderRow) => formatVnd(order.grand_total) },
    { id: 'payment', header: t('THANH TOÁN'), cell: (order: OrderRow) => <span>{order.payment_method === 'cod' ? 'COD' : order.payment_method === 'bank_transfer' ? t('Chuyển khoản') : order.payment_method === 'other' ? t('Phương thức khác') : order.payment_method}<small><StatusBadge kind="payment" status={order.payment_status} />{Number(order.failed_payment_count ?? 0) > 0 && <><StatusBadge kind="payment" status="failed" /><span className="payment-failure-count" aria-label={t('{{count}} giao dịch thất bại', { count: formatNumber(order.failed_payment_count ?? 0) })} title={t('{{count}} giao dịch thất bại', { count: formatNumber(order.failed_payment_count ?? 0) })}>×{formatNumber(order.failed_payment_count ?? 0)}</span></>}</small></span> },
    { id: 'status', header: t('TRẠNG THÁI'), cell: (order: OrderRow) => permissions.includes('orders.update_status') ? <select className="status-select" aria-label={t('Cập nhật trạng thái đơn {{code}}', { code: order.code })} value={order.status} onChange={(event) => onUpdate(order, event.target.value)}><option value={order.status}>{t(getStatusLabel('order', order.status))}</option>{(transitions[order.status] ?? []).map((nextStatus) => <option key={nextStatus} value={nextStatus}>{t(getStatusLabel('order', nextStatus))}</option>)}</select> : <StatusBadge kind="order" status={order.status} /> },
    { id: 'actions', header: t('THAO TÁC'), cell: (order: OrderRow) => <RowActionsMenu label={t('Thao tác đơn {{code}}', { code: order.code })} actions={[{ id: 'view', label: t('Xem'), onSelect: () => onOpen(order) }, { id: 'print', label: t('In'), onSelect: () => onPrint(order) }]} /> },
  ]} rows={orders} rowKey={(order) => order.id} selectedRowKeys={selectedIds} onSelectionChange={(keys) => { if (keys.length > 100) onSelectionLimit(); onSelectionChange(keys.slice(0, 100).map(Number)) }} selectionLabel={(order) => order.code} loading={loading} error={error} onRetry={onRetry} noResults={noResults} emptyTitle={t('Chưa có đơn hàng')} emptyDescription={t('Đơn hàng sẽ xuất hiện tại đây khi khách đặt.')} totalRows={meta.total} page={meta.current_page} pageCount={meta.last_page} sortBy={sort.replace(/^-/, '')} sortDirection={sort.startsWith('-') ? 'desc' : 'asc'} onSortChange={onSortChange} onPageChange={onPageChange} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
}
