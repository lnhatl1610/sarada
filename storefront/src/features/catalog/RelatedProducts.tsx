import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import type { ProductDetailProduct } from './ProductDetailPage'

export function RelatedProducts({ products, loading, error, onRetry, formatMoney }: {
  products: ProductDetailProduct[]
  loading: boolean
  error: boolean
  onRetry: () => void
  formatMoney: (amount: number) => string
}) {
  return (
    <section className="related-products">
      <h2>Có thể bạn cũng thích</h2>
      {loading ? <p className="state">Đang tải sản phẩm liên quan…</p> : error ? <div className="catalog-stale-error" role="alert"><span>Không tải được sản phẩm liên quan.</span><button type="button" onClick={onRetry}>Thử lại</button></div> : products.length ? <div className="grid">{products.map((item) => { const image = item.images?.[0]; const mediaLabel = getMediaDisclosureLabel(image?.alt); return <article className="card" key={item.id}><Link to={`/products/${item.slug}`} className="art related-product-art" aria-label={`${item.name}${mediaLabel ? `, ${mediaLabel}` : ''}`}><ResponsiveImage src={image?.url} srcSet={image?.srcset ?? undefined} alt="" width={800} height={1000} sizes="(max-width: 620px) 50vw, 25vw" />{mediaLabel && <DemoConceptBadge label={mediaLabel} />}</Link><div className="card-info"><Link to={`/products/${item.slug}`}>{item.name}</Link><b>{formatMoney(item.price)}</b></div></article> })}</div> : <p className="state">Chưa có sản phẩm liên quan.</p>}
    </section>
  )
}
