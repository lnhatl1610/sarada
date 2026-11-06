import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { fetchPersonalizedCatalogProducts } from './catalog-api'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import '../../ProductDetail.css'

export function PersonalizedProducts({ accountId, formatMoney }: {
  accountId: number | null
  formatMoney: (amount: number) => string
}) {
  const query = useQuery({
    queryKey: ['catalog', 'personalized', accountId],
    queryFn: ({ signal }) => fetchPersonalizedCatalogProducts(signal),
    enabled: accountId !== null,
    staleTime: 120_000,
    retry: 1,
  })

  if (accountId === null) return null
  if (query.isPending) return <section className="related-products" aria-labelledby="personalized-products-title" aria-busy="true"><h2 id="personalized-products-title">Gợi ý dành cho bạn</h2><p role="status">Đang tìm sản phẩm phù hợp…</p></section>
  if (query.isError) return <section className="related-products" aria-labelledby="personalized-products-title"><h2 id="personalized-products-title">Gợi ý dành cho bạn</h2><div role="alert"><p>Chưa tải được gợi ý sản phẩm.</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div></section>
  if (query.data.length === 0) return null

  return <section className="related-products personalized-products" aria-labelledby="personalized-products-title">
    <h2 id="personalized-products-title">Gợi ý dành cho bạn</h2>
    <p>Dựa trên sản phẩm bạn đã xem và đơn hàng đã hoàn tất.</p>
    <div className="grid">{query.data.map((product) => {
      const image = product.images?.[0]
      const mediaLabel = getMediaDisclosureLabel(image?.alt)
      return <article className="card" key={product.id}>
        <Link to={`/products/${product.slug}`} className="art related-product-art" aria-label={`${product.name}${mediaLabel ? `, ${mediaLabel}` : ''}`}>
          <ResponsiveImage src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, product.name)} width={800} height={1000} loading="lazy" sizes="(max-width: 620px) 50vw, 25vw" />
          {mediaLabel && <DemoConceptBadge label={mediaLabel} />}
        </Link>
        <div className="card-info"><Link to={`/products/${product.slug}`}>{product.name}</Link><b>{formatMoney(product.price)}</b></div>
      </article>
    })}</div>
  </section>
}
