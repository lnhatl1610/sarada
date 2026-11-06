import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { formatVnd } from '../../lib/money'
import { fetchCatalogProducts } from '../catalog/catalog-api'

export function CartEmptyRecommendations() {
  const query = useQuery({
    queryKey: ['products', 'cart-empty-best-sellers'],
    queryFn: ({ signal }) => fetchCatalogProducts('?sort=bestseller&best_seller=1&per_page=4', signal),
  })

  if (query.isLoading) {
    return <section className="cart-empty-recommendations" aria-labelledby="cart-recommendations-title" aria-busy="true">
      <h2 id="cart-recommendations-title">Sản phẩm bán chạy</h2>
      <div className="cart-recommendation-grid" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <div className="home-product-skeleton" key={index} />)}</div>
      <p className="sr-only" role="status">Đang tải sản phẩm bán chạy…</p>
    </section>
  }

  if (query.isError) {
    return <section className="cart-empty-recommendations" aria-labelledby="cart-recommendations-title">
      <h2 id="cart-recommendations-title">Sản phẩm bán chạy</h2>
      <p role="alert">Chưa tải được sản phẩm gợi ý.</p>
      <button className="button secondary" type="button" onClick={() => void query.refetch()}>Thử tải lại</button>
    </section>
  }

  if (!query.data?.length) return null

  return <section className="cart-empty-recommendations" aria-labelledby="cart-recommendations-title">
    <div className="section-title"><h2 id="cart-recommendations-title">Sản phẩm bán chạy</h2><Link to="/best-sellers">Xem tất cả</Link></div>
    <div className="cart-recommendation-grid">
      {query.data.map((product) => {
        const image = product.images?.[0]
        return <article className="home-product-card" key={product.id}>
          <Link className="home-product-image" to={`/products/${product.slug}`} aria-label={`Xem ${product.name}`}>
            <ResponsiveImage src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, product.name)} width={800} height={1000} sizes="(max-width: 620px) 50vw, 25vw" />
          </Link>
          <div className="card-info"><Link to={`/products/${product.slug}`}>{product.name}</Link><b>{formatVnd(product.price)}</b></div>
        </article>
      })}
    </div>
  </section>
}
