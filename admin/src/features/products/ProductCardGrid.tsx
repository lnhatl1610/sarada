import { useTranslation } from 'react-i18next'
import { formatNumber, formatVnd } from '../../lib/date-format'
import { StatusBadge } from '../../components/shared/status-badge'
import { ProductStatusSwitch } from './ProductStatusSwitch'
import { ProductThumbnail } from './ProductThumbnail'
import type { AdminPreferences } from '../preferences/AdminPreferencesPage'
import type { ProductRow } from './product-list-types'

const fmt = (amount: number) => formatVnd(amount)

export function ProductCardGrid({ apiUrl, products, loading, error, hasFilters, meta, selectedIds, onSelectionChange, canUpdate, canDelete, canCreate, updatingIds, onStatusChange, onDuplicate, onArchive, onRetry, onPageChange, pageSize, onPageSizeChange }: {
  apiUrl: string
  products: ProductRow[]
  loading: boolean
  error: string | null
  hasFilters: boolean
  meta: import('./product-list-types').ProductListMeta
  selectedIds: number[]
  onSelectionChange: (ids: number[]) => void
  canUpdate: boolean
  canDelete: boolean
  canCreate: boolean
  updatingIds: number[]
  onStatusChange: (product: ProductRow, active: boolean) => void
  onDuplicate: (product: ProductRow) => void
  onArchive: (product: ProductRow) => void
  onRetry: () => void
  onPageChange: (page: number) => void
  pageSize: AdminPreferences['pageSize']
  onPageSizeChange: (pageSize: AdminPreferences['pageSize']) => void
}) {
  const { t } = useTranslation()
  if (loading) return <div className="shared-skeleton" role="status" aria-label={t('Đang tải sản phẩm')} />
  if (error) return <div className="admin-state-card" role="alert"><p>{error}</p><button className="secondary" type="button" onClick={onRetry}>{t('Thử lại')}</button></div>
  if (!products.length) return <div className="admin-state-card" role="status"><h2>{hasFilters ? t('Không tìm thấy sản phẩm phù hợp') : t('Chưa có sản phẩm')}</h2><p>{hasFilters ? t('Hãy điều chỉnh hoặc xóa bộ lọc để xem thêm sản phẩm.') : t('Thêm sản phẩm đầu tiên để bắt đầu quản lý catalog.')}</p></div>

  return <>
    <div className="product-card-grid">
      {products.map((product) => {
        const selected = selectedIds.includes(product.id)
        const originalPrice = product.compare_at_price ?? product.base_price ?? product.price
        const salePrice = product.sale_price !== null && product.sale_price !== undefined && product.sale_price < originalPrice ? product.sale_price : null
        return <article className="product-card" key={product.id}>
          <label className="product-card-select"><input type="checkbox" aria-label={t('Chọn {{name}}', { name: product.name })} checked={selected} onChange={(event) => onSelectionChange(event.target.checked ? [...selectedIds, product.id] : selectedIds.filter((id) => id !== product.id))} /> {t('Chọn')}</label>
          <a className="product-card-image" href={`/products/${product.id}/edit`} aria-label={t('Sửa {{name}}', { name: product.name })}><ProductThumbnail product={product} apiUrl={apiUrl} /></a>
          <div className="product-card-main"><a href={`/products/${product.id}/edit`}><h3>{product.name}</h3></a><small>SKU: {product.sku ?? '—'}</small><p>{product.category?.name ?? t('Chưa có danh mục')} · {product.brand?.name ?? t('Chưa có thương hiệu')}</p></div>
          <div className="product-card-price">{salePrice !== null && <del>{fmt(originalPrice)}</del>}<strong>{fmt(salePrice ?? product.price)}</strong></div>
          <dl><div><dt>{t('Tồn / khả dụng')}</dt><dd>{formatNumber(product.stock_quantity ?? 0)} / {formatNumber(product.available_stock ?? 0)}</dd></div><div><dt>{t('Đã bán')}</dt><dd>{formatNumber(product.sold_count ?? 0)}</dd></div><div><dt>{t('Đánh giá')}</dt><dd>{Number(product.rating_avg ?? 0).toFixed(1)} ★ ({formatNumber(product.rating_count ?? 0)})</dd></div></dl>
          <div className="product-card-status"><StatusBadge kind="product" status={product.status ?? 'draft'} />{canUpdate && product.status !== 'archived' && <ProductStatusSwitch name={product.name} status={product.status ?? 'draft'} disabled={updatingIds.includes(product.id)} onChange={(active) => onStatusChange(product, active)} />}</div>
          <div className="product-card-actions"><a className="secondary" href={`/products/${product.id}/edit`}>{t('Chi tiết')}</a>{canCreate && <button className="secondary" type="button" onClick={() => onDuplicate(product)}>{t('Nhân bản')}</button>}{canDelete && product.status !== 'archived' && <button className="secondary" type="button" onClick={() => onArchive(product)}>{t('Lưu trữ')}</button>}</div>
        </article>
      })}
    </div>
    <div className="product-grid-pagination"><span>{t('Trang {{page}} / {{pages}} · {{total}} sản phẩm', { page: formatNumber(meta.current_page), pages: formatNumber(meta.last_page), total: formatNumber(meta.total) })}</span><label>{t('Số dòng')} <select aria-label={t('Số dòng sản phẩm mỗi trang')} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value) as AdminPreferences['pageSize'])}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></label><div><button className="secondary" type="button" disabled={meta.current_page <= 1} onClick={() => onPageChange(meta.current_page - 1)}>{t('Trước')}</button><button className="secondary" type="button" disabled={meta.current_page >= meta.last_page} onClick={() => onPageChange(meta.current_page + 1)}>{t('Sau')}</button></div></div>
  </>
}
