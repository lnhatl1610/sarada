import type { ProductDetailProduct } from './ProductDetailPage'
import type { components } from '../../types/api'
import type { CatalogReviewFilters, CatalogReviewSort } from './catalog-api'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { ReviewHelpfulButton } from './ReviewHelpfulButton'

type Review = components['schemas']['StorefrontReview']

const fitLabels: Record<NonNullable<Review['fit']>, string> = {
  small: 'Hơi nhỏ so với chuẩn',
  true_to_size: 'Đúng kích cỡ thường mặc',
  large: 'Hơi rộng so với chuẩn',
}

export function ProductReviewList({ product, reviews, reviewMeta, reviewFilterOptions, reviewSort, reviewFilters, onPageChange, onSortChange, onFiltersChange, loading, error, onRetry }: {
  product: ProductDetailProduct
  reviews: Review[]
  reviewMeta?: components['schemas']['StorefrontReviewPage']['meta']
  reviewFilterOptions?: components['schemas']['StorefrontReviewPage']['filters']
  reviewSort?: CatalogReviewSort
  reviewFilters?: CatalogReviewFilters
  onPageChange?: (page: number) => void
  onSortChange?: (sort: CatalogReviewSort) => void
  onFiltersChange?: (filters: CatalogReviewFilters) => void
  loading: boolean
  error: boolean
  onRetry: () => void
}) {
  const distribution = product.rating?.distribution
  const distributionTotal = distribution?.reduce((total, row) => total + row.count, 0) ?? 0
  const activeFilters = reviewFilters ?? { rating: null, withImages: false, size: null }
  const hasActiveFilters = activeFilters.rating !== null || activeFilters.withImages || activeFilters.size !== null

  function updateFilters(next: Partial<CatalogReviewFilters>) {
    onFiltersChange?.({ ...activeFilters, ...next })
  }

  return (
    <section className="product-reviews">
      <div className="section-title"><div><p className="eyebrow">KHÁCH HÀNG CHIA SẺ</p><h2>Đánh giá sản phẩm</h2></div>{product.rating && product.rating.count > 0 && <strong>★ {product.rating.average.toFixed(1)} / 5 · {product.rating.count} đánh giá</strong>}</div>
      {distribution && distributionTotal > 0 && <div className="review-rating-distribution" aria-label="Phân bố đánh giá theo số sao">{[...distribution].sort((a, b) => b.stars - a.stars).map(({ stars, count }) => {
        const percent = Math.round((count / distributionTotal) * 100)
        return <div className="review-rating-row" key={stars}><span>{stars} sao</span><div className="review-rating-track" role="progressbar" aria-label={`${stars} sao`} aria-valuemin={0} aria-valuemax={distributionTotal} aria-valuenow={count}><span style={{ width: `${percent}%` }} /></div><span>{count}</span></div>
      })}</div>}
      {product.rating && product.rating.count > 0 && onSortChange && <label className="review-sort">Sắp xếp đánh giá<select value={reviewSort ?? 'latest'} onChange={(event) => onSortChange(event.target.value as CatalogReviewSort)}><option value="latest">Mới nhất</option><option value="rating_desc">Điểm cao trước</option><option value="rating_asc">Điểm thấp trước</option></select></label>}
      {onFiltersChange && product.rating && product.rating.count > 0 && <div className="review-filters" role="group" aria-label="Lọc đánh giá">
        <label>Số sao<select value={activeFilters.rating ?? ''} onChange={(event) => updateFilters({ rating: event.target.value ? Number(event.target.value) as CatalogReviewFilters['rating'] : null })}><option value="">Tất cả</option><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option><option value="2">2 sao</option><option value="1">1 sao</option></select></label>
        <label className="review-image-filter"><input type="checkbox" checked={activeFilters.withImages} onChange={(event) => updateFilters({ withImages: event.target.checked })} /> Chỉ xem đánh giá có ảnh</label>
        {reviewFilterOptions?.sizes.length ? <label>Size đã mua<select value={activeFilters.size ?? ''} onChange={(event) => updateFilters({ size: event.target.value || null })}><option value="">Tất cả size</option>{reviewFilterOptions.sizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label> : null}
      </div>}
      {loading ? <p className="state" role="status">Đang tải đánh giá…</p> : error ? <div className="catalog-stale-error" role="alert"><span>Không tải được đánh giá.</span><button type="button" onClick={onRetry}>Thử lại</button></div> : reviews.length ? <><div className="review-list">{reviews.map((review) => <article key={review.id}><div><strong>{review.customer?.name ?? 'Khách hàng'}</strong><span aria-label={`${review.rating} trên 5`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>{review.title && <h3>{review.title}</h3>}<p>{review.content}</p>{review.fit && <small>{fitLabels[review.fit]}</small>}{review.purchased_variant && <small>Đã mua: {review.purchased_variant}</small>}{review.store_response && <aside className="store-review-response"><strong>Phản hồi từ cửa hàng</strong><p>{review.store_response}</p></aside>}{review.images?.length ? <div className="review-public-images">{review.images.map((image) => {
        const disclosureLabel = getMediaDisclosureLabel(image.alt)

        return <figure key={image.id}>{image.media_type === 'video' ? <video controls playsInline preload="metadata" aria-label={image.alt} src={image.url} /> : <a href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={image.alt ?? 'Ảnh khách hàng gửi kèm đánh giá'} loading="lazy" /></a>}{disclosureLabel && <small className="review-image-disclosure">{disclosureLabel}</small>}</figure>
      })}</div> : null}{review.verified_purchase && <small className="verified-purchase">✓ Đã mua hàng</small>}{review.purchased_size && <small>Size đã mua: {review.purchased_size}</small>}<small>{new Date(review.created_at).toLocaleDateString('vi-VN')}</small><ReviewHelpfulButton reviewId={review.id} helpfulCount={review.helpful_count} /></article>)}</div>{reviewMeta && onPageChange && reviewMeta.last_page > 1 && <nav className="review-pagination" aria-label="Phân trang đánh giá"><button type="button" disabled={loading || reviewMeta.current_page <= 1} onClick={() => onPageChange(reviewMeta.current_page - 1)}>Đánh giá trước</button><span aria-live="polite">Trang {reviewMeta.current_page} / {reviewMeta.last_page} · {reviewMeta.total} đánh giá</span><button type="button" disabled={loading || reviewMeta.current_page >= reviewMeta.last_page} onClick={() => onPageChange(reviewMeta.current_page + 1)}>Đánh giá tiếp</button></nav>}</> : <div className="review-empty-state"><p className="state">{hasActiveFilters ? 'Không có đánh giá nào khớp với bộ lọc.' : 'Chưa có đánh giá được công khai cho sản phẩm này.'}</p>{hasActiveFilters && onFiltersChange && <button type="button" onClick={() => onFiltersChange({ rating: null, withImages: false, size: null })}>Xóa bộ lọc</button>}</div>}
      <p className="review-hint">Bạn đã mua sản phẩm? Hãy gửi đánh giá trong trang chi tiết đơn hàng sau khi nhận hàng.</p>
    </section>
  )
}
