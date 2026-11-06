import { useTranslation } from 'react-i18next'
import '../../ProductList.css'
import { formatDateTime, formatNumber, formatVnd } from '../../lib/date-format'
import { ADMIN_STOREFRONT_URL } from '../../lib/storefront-base'
import { StatusBadge } from '../../components/shared/status-badge'
import { LazyDataTable } from '../../components/shared/lazy-data-table'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { ProductStatusSwitch } from './ProductStatusSwitch'
import { ProductThumbnail } from './ProductThumbnail'
import { ProductCardGrid } from './ProductCardGrid'
import type { AdminPreferences } from '../preferences/AdminPreferencesPage'
import type { ProductListMeta, ProductRow } from './product-list-types'

type ProductListPanelProps = {
  apiUrl: string
  products: ProductRow[]
  viewMode: 'table' | 'grid'
  loading: boolean
  error: string | null
  hasFilters: boolean
  meta: ProductListMeta
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
  permissions: string[]
  updatingIds: number[]
  onStatusChange: (product: ProductRow, active: boolean) => void
  onDuplicate: (product: ProductRow) => void
  onArchive: (product: ProductRow) => void
  onRetry: () => void
  onPageChange: (page: number) => void
  pageSize: AdminPreferences['pageSize']
  onPageSizeChange: (pageSize: AdminPreferences['pageSize']) => void
  sort: string
  onSortChange: (field: string, direction: 'asc' | 'desc' | 'none') => void
}

export function ProductListPanel({ apiUrl, products, viewMode, loading, error, hasFilters, meta, selectedIds, onSelectionChange, permissions, updatingIds, onStatusChange, onDuplicate, onArchive, onRetry, onPageChange, pageSize, onPageSizeChange, sort, onSortChange }: ProductListPanelProps) {
  const { t } = useTranslation()
  const canUpdate = permissions.includes('products.update')
  const canCreate = permissions.includes('products.create')
  const canDelete = permissions.includes('products.delete')

  if (viewMode === 'grid') {
    return <ProductCardGrid apiUrl={apiUrl} products={products} loading={loading} error={error} hasFilters={hasFilters} meta={meta} selectedIds={selectedIds} onSelectionChange={onSelectionChange} canUpdate={canUpdate} canDelete={canDelete} canCreate={canCreate} updatingIds={updatingIds} onStatusChange={onStatusChange} onDuplicate={onDuplicate} onArchive={onArchive} onRetry={onRetry} onPageChange={onPageChange} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
  }

  return <LazyDataTable columns={[
    { id: 'product', header: t('SẢN PHẨM'), sortable: true, sortKey: 'name', cell: (p: ProductRow) => <a className="table-product" href={`/products/${p.id}/edit`}><ProductThumbnail product={p} apiUrl={apiUrl} /><b>{p.name}</b></a> },
    { id: 'sku', header: 'SKU', cell: (p: ProductRow) => p.sku ?? '—' },
    { id: 'classification', header: t('DANH MỤC / THƯƠNG HIỆU'), cell: (p: ProductRow) => <span>{p.category?.name ?? '—'}<br /><small>{p.brand?.name ?? t('Chưa có thương hiệu')}</small></span> },
    { id: 'price', header: t('GIÁ TỪ'), sortable: true, sortKey: 'price', cell: (p: ProductRow) => { const originalPrice = p.compare_at_price ?? p.base_price ?? p.price; const salePrice = p.sale_price !== null && p.sale_price !== undefined && p.sale_price < originalPrice ? p.sale_price : null; return <span className="product-price-cell">{salePrice !== null && <del>{formatVnd(originalPrice)}</del>}<strong>{formatVnd(salePrice ?? p.price)}</strong></span> } },
    { id: 'variants', header: t('BIẾN THỂ'), cell: (p: ProductRow) => `${formatNumber(p.active_variants_count ?? 0)}/${formatNumber(p.variants_count ?? 0)} ${t('đang bật')}` },
    { id: 'stock', header: t('TỒN / KHẢ DỤNG'), cell: (p: ProductRow) => `${formatNumber(p.stock_quantity ?? 0)} / ${formatNumber(p.available_stock ?? 0)}` },
    { id: 'featured', header: t('NỔI BẬT'), cell: (p: ProductRow) => p.is_featured ? t('Có') : '—' },
    { id: 'sold', header: t('ĐÃ BÁN'), cell: (p: ProductRow) => formatNumber(p.sold_count ?? 0) },
    { id: 'rating', header: t('ĐÁNH GIÁ'), cell: (p: ProductRow) => `${Number(p.rating_avg ?? 0).toFixed(1)} ★ (${formatNumber(p.rating_count ?? 0)})` },
    { id: 'status', header: t('TRẠNG THÁI'), cell: (p: ProductRow) => <span className="product-status-cell"><StatusBadge kind="product" status={p.status ?? 'draft'} />{canUpdate && p.status !== 'archived' && <ProductStatusSwitch name={p.name} status={p.status ?? 'draft'} disabled={updatingIds.includes(p.id)} onChange={(active) => onStatusChange(p, active)} />}</span> },
    { id: 'updated_at', header: t('CẬP NHẬT'), sortable: true, sortKey: 'updated_at', cell: (p: ProductRow) => p.updated_at ? formatDateTime(p.updated_at) : '—' },
    { id: 'actions', header: t('THAO TÁC'), cell: (p: ProductRow) => <RowActionsMenu label={t('Thao tác sản phẩm {{name}}', { name: p.name })} actions={[{ id: 'details', label: t('Sửa'), href: `/products/${p.id}/edit` }, ...(p.status === 'active' ? [{ id: 'storefront', label: t('Xem trên shop'), href: `${ADMIN_STOREFRONT_URL}/products/${p.slug}`, target: '_blank' as const }] : []), ...(canCreate ? [{ id: 'duplicate', label: t('Nhân bản'), onSelect: () => onDuplicate(p) }] : []), ...(canDelete && p.status !== 'archived' ? [{ id: 'archive', label: t('Lưu trữ'), onSelect: () => onArchive(p), destructive: true }] : [])]} /> },
  ]} rows={products} rowKey={(p) => p.id} selectedRowKeys={selectedIds} onSelectionChange={(keys) => onSelectionChange(keys.map(Number))} selectionLabel={(p) => p.name} loading={loading} error={error} onRetry={onRetry} noResults={hasFilters} emptyTitle={t('Chưa có sản phẩm')} emptyDescription={t('Thêm sản phẩm đầu tiên để bắt đầu quản lý catalog.')} totalRows={meta.total} page={meta.current_page} pageCount={meta.last_page} sortBy={sort.replace(/^-/, '')} sortDirection={sort.startsWith('-') ? 'desc' : 'asc'} onSortChange={onSortChange} onPageChange={onPageChange} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
}
