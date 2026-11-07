import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { formatVnd } from '../../lib/money'
import { fetchCatalogProducts } from './catalog-api'

export function NotFoundProductSuggestions({ title = 'Có thể bạn sẽ thích' }: { title?: string } = {}) {
  const products = useQuery({
    queryKey: ['products', 'bestseller-suggestions'],
    queryFn: ({ signal }) => fetchCatalogProducts('?sort=bestseller&best_seller=1&per_page=4', signal),
  })

  if (products.isPending) {
    return <section className="mt-10" aria-labelledby="product-suggestions-title" aria-busy="true">
      <h2 id="product-suggestions-title" className="text-xl font-medium text-foreground">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground" role="status">Đang tìm sản phẩm gợi ý…</p>
    </section>
  }

  if (products.isError) {
    return <section className="mt-10" aria-labelledby="product-suggestions-title">
      <h2 id="product-suggestions-title" className="text-xl font-medium text-foreground">{title}</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3" role="status">
        <p className="text-sm text-muted-foreground">Chưa tải được sản phẩm gợi ý.</p>
        <button className="button light" type="button" onClick={() => void products.refetch()}>Thử lại</button>
      </div>
    </section>
  }

  if (!products.data.length) return null

  return <section className="mt-10" aria-labelledby="product-suggestions-title">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h2 id="product-suggestions-title" className="text-xl font-medium text-foreground">{title}</h2>
      <Link className="text-sm text-primary underline underline-offset-4" to="/best-sellers">Xem sản phẩm bán chạy</Link>
    </div>
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
      {products.data.map((product) => {
        const image = product.images?.[0]
        return <li className="min-w-0" key={product.id}>
          <Link className="group block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" to={`/products/${product.slug}`}>
            <div className="aspect-[3/4] overflow-hidden bg-muted">
              <ResponsiveImage className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, product.name)} width={800} height={1000} sizes="(max-width: 767px) 50vw, 25vw" />
            </div>
            <p className="mt-3 line-clamp-2 text-sm font-medium text-foreground">{product.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatVnd(product.price)}</p>
          </Link>
        </li>
      })}
    </ul>
  </section>
}
