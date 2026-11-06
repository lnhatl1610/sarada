import { useTranslation } from 'react-i18next'
import '../../InventoryControls.css'
import { Package } from 'lucide-react'
import { LazyDataTable } from '../../components/shared/lazy-data-table'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { formatDateTime } from '../../lib/date-format'
import { mediaUrl } from '../../lib/media-url'
import type { AdminPreferences } from '../preferences/AdminPreferencesPage'

export type InventoryItem = {
  id: number
  variant_id: number
  quantity: number
  reserved: number
  low_stock_threshold: number
  sku: string
  barcode: string | null
  color_name: string | null
  size_name: string | null
  thumbnail: string | null
  product_name: string
  product_slug: string
  last_movement_at: string | null
  last_movement_type: string | null
  last_movement_change: number | null
}

type PaginationMeta = { current_page: number; last_page: number; per_page: number; total: number }
type Props = {
  apiUrl: string
  items: InventoryItem[]
  permissions: string[]
  selectedIds: Array<string | number>
  loading: boolean
  error: string | null
  noResults: boolean
  meta: PaginationMeta
  pageSize: AdminPreferences['pageSize']
  sort: string
  movementLabel: (type: string) => string
  onMovement: (item: InventoryItem) => void
  onThreshold: (item: InventoryItem) => void
  onAdjust: (item: InventoryItem) => void
  onSelectionChange: (ids: Array<string | number>) => void
  onRetry: () => void
  onSortChange: (field: string, direction: 'asc' | 'desc' | 'none') => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: AdminPreferences['pageSize']) => void
}

export function InventoryTable({ apiUrl, items, permissions, selectedIds, loading, error, noResults, meta, pageSize, sort, movementLabel, onMovement, onThreshold, onAdjust, onSelectionChange, onRetry, onSortChange, onPageChange, onPageSizeChange }: Props) {
  const { t } = useTranslation()
  const canAdjust = permissions.includes('inventory.adjust')

  return <LazyDataTable columns={[
    { id: 'product', header: t('SẢN PHẨM / BIẾN THỂ'), sortable: true, sortKey: 'product_name', cell: (item: InventoryItem) => <span className="inventory-product-cell"><span className="inventory-product-thumb">{item.thumbnail ? <img src={mediaUrl(apiUrl, item.thumbnail)} alt="" loading="lazy" onError={(event) => event.currentTarget.remove()} /> : <Package size={17} aria-hidden="true" />}</span><span><strong>{item.product_name}</strong><small>{[item.color_name, item.size_name].filter(Boolean).join(' · ') || t('Biến thể mặc định')}</small></span></span> },
    { id: 'sku', header: 'SKU', sortable: true, sortKey: 'sku', cell: (item: InventoryItem) => item.sku },
    { id: 'barcode', header: 'BARCODE', cell: (item: InventoryItem) => item.barcode ?? '—' },
    { id: 'quantity', header: t('TỒN'), sortable: true, sortKey: 'quantity', cell: (item: InventoryItem) => item.quantity },
    { id: 'reserved', header: t('ĐANG GIỮ'), cell: (item: InventoryItem) => item.reserved },
    { id: 'available', header: t('KHẢ DỤNG'), sortable: true, sortKey: 'available', cell: (item: InventoryItem) => Math.max(0, item.quantity - item.reserved) },
    { id: 'threshold', header: t('NGƯỠNG THẤP'), cell: (item: InventoryItem) => item.low_stock_threshold },
    { id: 'last_movement', header: t('LẦN CẬP NHẬT CUỐI'), cell: (item: InventoryItem) => item.last_movement_at ? <span>{formatDateTime(item.last_movement_at)}<small>{movementLabel(item.last_movement_type ?? '')} · {(item.last_movement_change ?? 0) > 0 ? '+' : ''}{item.last_movement_change ?? 0}</small></span> : '—' },
    { id: 'actions', header: t('THAO TÁC'), cell: (item: InventoryItem) => <RowActionsMenu label={t('Thao tác tồn kho {{sku}}', { sku: item.sku })} actions={[{ id: 'history', label: t('Lịch sử'), onSelect: () => onMovement(item) }, ...(canAdjust ? [{ id: 'threshold', label: t('Ngưỡng'), onSelect: () => onThreshold(item) }, { id: 'adjust', label: t('Điều chỉnh'), onSelect: () => onAdjust(item) }] : [])]} /> },
  ]} rows={items} rowKey={(item) => item.variant_id} loading={loading} error={error} onRetry={onRetry} noResults={noResults} emptyTitle={t('Chưa có dữ liệu tồn kho')} emptyDescription={t('Các biến thể có tồn kho sẽ xuất hiện tại đây.')} totalRows={meta.total} page={meta.current_page} pageCount={meta.last_page} sortBy={sort.replace(/^-/, '')} sortDirection={sort.startsWith('-') ? 'desc' : 'asc'} onSortChange={onSortChange} onPageChange={onPageChange} pageSize={pageSize} onPageSizeChange={onPageSizeChange} selectedRowKeys={canAdjust ? selectedIds : undefined} onSelectionChange={canAdjust ? (keys) => onSelectionChange(keys.slice(-100)) : undefined} selectionLabel={(item) => item.sku} />
}
