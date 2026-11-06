import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { getSharedWishlist } from './account-api'

export function SharedWishlistPage({ token }: { token: string }) {
  const query = useQuery({
    queryKey: ['shared-wishlist', token],
    queryFn: () => getSharedWishlist(token),
    enabled: Boolean(token),
  })

  if (query.isPending) return <main className="container subpage"><p className="state" aria-live="polite">Đang tải danh sách được chia sẻ…</p></main>
  if (query.isError) return <main className="container subpage"><section className="empty" role="alert"><h1>Không mở được danh sách</h1><p>Liên kết có thể đã bị thu hồi hoặc không còn tồn tại.</p><Link className="button dark" to="/products">Khám phá sản phẩm</Link></section></main>

  const { name, products } = query.data
  return (
    <main className="container subpage account-page">
      <p className="eyebrow">DANH SÁCH ĐƯỢC CHIA SẺ</p>
      <h1>{name}</h1>
      {products.data.length ? <div className="grid">
        {products.data.map((product) => {
          const image = product.images?.[0]
          return <article className="card" key={product.id}>
            <Link className="art wishlist-product-art" to={`/products/${product.slug}`}>
              <ResponsiveImage className="catalog-product-image" src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, product.name)} width={800} height={1000} sizes="(max-width: 620px) 50vw, 25vw" />
            </Link>
            <div className="card-info"><Link to={`/products/${product.slug}`}>{product.name}</Link><b>{new Intl.NumberFormat('vi-VN').format(product.price)} ₫</b></div>
          </article>
        })}
      </div> : <section className="empty"><h2>Danh sách hiện chưa có sản phẩm</h2><Link className="button dark" to="/products">Khám phá sản phẩm</Link></section>}
    </main>
  )
}
