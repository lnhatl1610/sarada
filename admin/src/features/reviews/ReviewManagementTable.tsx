import { useTranslation } from 'react-i18next'
import { formatDateTime, formatNumber } from '../../lib/date-format'
import { LazyDataTable } from '../../components/shared/lazy-data-table'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { StatusBadge } from '../../components/shared/status-badge'
import type { AdminPreferences } from '../preferences/AdminPreferencesPage'

export type Review = {
  id: number
  rating: number
  title: string | null
  content: string | null
  status: string
  verified_purchase: boolean
  image_count?: number
  media_count?: number
  created_at: string
  customer?: { name: string; email?: string }
  product?: { name: string; slug: string }
}

type PaginationMeta = { current_page: number; last_page: number; per_page: number; total: number }
type Props = {
  reviews: Review[]
  selectedIds: number[]
  status: string
  sort: string
  meta: PaginationMeta
  pageSize: AdminPreferences['pageSize']
  loading: boolean
  error: string | null
  noResults: boolean
  onOpen: (review: Review) => void
  onApprove: (review: Review) => void
  onHide: (review: Review) => void
  onDelete: (review: Review) => void
  onSelectionChange: (ids: number[]) => void
  onSelectionLimit: () => void
  onRetry: () => void
  onSortChange: (field: string, direction: 'asc' | 'desc' | 'none') => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: AdminPreferences['pageSize']) => void
}

export function ReviewManagementTable({ reviews, selectedIds, status, sort, meta, pageSize, loading, error, noResults, onOpen, onApprove, onHide, onDelete, onSelectionChange, onSelectionLimit, onRetry, onSortChange, onPageChange, onPageSizeChange }: Props) {
  const { t } = useTranslation()

  return <LazyDataTable columns={[
    { id: 'product', header: t('SẢN PHẨM'), sortable: true, sortKey: 'product_name', cell: (review: Review) => review.product?.name ?? t('Sản phẩm') },
    { id: 'customer', header: t('KHÁCH HÀNG'), sortable: true, sortKey: 'customer_name', cell: (review: Review) => <>{review.customer?.name ?? t('Khách hàng')}{review.customer?.email && <small className="review-customer-email">{review.customer.email}</small>}</> },
    { id: 'rating', header: 'SAO', sortable: true, sortKey: 'rating', cell: (review: Review) => <span aria-label={t('{{count}} trên 5', { count: review.rating })}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span> },
    { id: 'content', header: t('TIÊU ĐỀ VÀ NỘI DUNG'), sortable: true, sortKey: 'content', cell: (review: Review) => <><b>{review.title ?? t('Không có tiêu đề')}</b><p className="review-content">{review.content ?? t('Không có nội dung.')}</p></> },
    { id: 'images', header: t('ẢNH/VIDEO'), sortable: true, sortKey: 'media_count', cell: (review: Review) => review.media_count ? <button className="link-button" type="button" onClick={() => onOpen(review)}>{t('{{count}} tệp', { count: formatNumber(review.media_count) })}</button> : '—' },
    { id: 'verified', header: t('ĐÃ MUA'), sortable: true, sortKey: 'verified_purchase', cell: (review: Review) => review.verified_purchase ? t('Đã mua') : t('Chưa xác thực') },
    { id: 'status', header: t('TRẠNG THÁI'), sortable: true, sortKey: 'status', cell: (review: Review) => <StatusBadge kind="review" status={review.status} /> },
    { id: 'created_at', header: t('NGÀY'), sortable: true, sortKey: 'created_at', cell: (review: Review) => formatDateTime(review.created_at) },
    { id: 'actions', header: t('THAO TÁC'), cell: (review: Review) => <RowActionsMenu label={t('Thao tác đánh giá của {{name}}', { name: review.customer?.name ?? t('khách hàng') })} actions={[{ id: 'view', label: t('Xem'), onSelect: () => onOpen(review) }, ...(review.status !== 'approved' ? [{ id: 'approve', label: t('Duyệt'), onSelect: () => onApprove(review) }] : []), ...(review.status !== 'rejected' ? [{ id: 'hide', label: t('Ẩn'), onSelect: () => onHide(review) }] : []), { id: 'delete', label: t('Xóa'), onSelect: () => onDelete(review), destructive: true }]} /> },
  ]} rows={reviews} rowKey={(review) => review.id} selectedRowKeys={selectedIds} onSelectionChange={(keys) => { if (keys.length > 100) onSelectionLimit(); onSelectionChange(keys.slice(0, 100).map(Number)) }} selectionLabel={(review) => t('Đánh giá #{{id}}', { id: review.id })} loading={loading} error={error} onRetry={onRetry} noResults={noResults} emptyTitle={status === 'pending' ? t('Không có đánh giá đang chờ') : status === 'approved' ? t('Chưa có đánh giá được duyệt') : t('Chưa có đánh giá bị ẩn')} emptyDescription={t('Thử điều chỉnh bộ lọc hoặc tìm kiếm để xem kết quả.')} totalRows={meta.total} page={meta.current_page} pageCount={meta.last_page} sortBy={sort.replace(/^-/, '')} sortDirection={sort.startsWith('-') ? 'desc' : 'asc'} onSortChange={onSortChange} onPageChange={onPageChange} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
}
