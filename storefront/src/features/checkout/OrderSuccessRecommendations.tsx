import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { fetchRelatedCatalogProducts } from '../catalog/catalog-api'
import type { CatalogProduct } from '../catalog/catalog-api'
import type { components } from '../../types/api'

type OrderItem = components['schemas']['StorefrontPlacedOrder']['items'][number]

export function OrderSuccessRecommendations({ items, formatMoney }: {
  items: OrderItem[]
  formatMoney: (amount: number) => string
}) {
  const sourceSlugs = [...new Set(items.map((item) => item.product_slug).filter((slug): slug is string => Boolean(slug)))].slice(0, 3)
  const purchasedSlugs = new Set(items.map((item) => item.product_slug).filter((slug): slug is string => Boolean(slug)))
  const query = useQuery({
    queryKey: ['catalog', 'order-success-recommendations', sourceSlugs],
    queryFn: async ({ signal }) => {
      const responses = await Promise.allSettled(sourceSlugs.map((slug) => fetchRelatedCatalogProducts(slug, signal)))
      const fulfilled = responses.flatMap((response) => response.status === 'fulfilled' ? response.value : [])
      if (!fulfilled.length && responses.some((response) => response.status === 'rejected')) {
        throw responses.find((response) => response.status === 'rejected')?.reason ?? new Error('Không tải được gợi ý sản phẩm.')
      }

      const unique = new Map<number, CatalogProduct>()
      for (const product of fulfilled) {
        if (!purchasedSlugs.has(product.slug)) unique.set(product.id, product)
      }
      return [...unique.values()].slice(0, 4)
    },
    enabled: sourceSlugs.length > 0,
    staleTime: 120_000,
    retry: 1,
  })

  if (!sourceSlugs.length || (!query.isPending && !query.isError && !query.data?.length)) return null

  return <section className="mt-12 w-full border-t border-border pt-8 text-left" aria-labelledby="order-success-recommendations-title">
    <h2 id="order-success-recommendations-title" className="text-2xl font-medium tracking-tight text-foreground">Khám phá thêm thiết kế cùng nhóm</h2>
    {query.isPending ? <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Đang tải sản phẩm gợi ý" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => <li key={index} className="aspect-[3/4] animate-pulse bg-muted motion-reduce:animate-none" />)}
      <li className="sr-only" role="status">Đang tải gợi ý sản phẩm…</li>
    </ul> : query.isError ? <div className="mt-4" role="alert"><p className="text-sm text-muted-foreground">Chưa tải được gợi ý sản phẩm.</p><button className="mt-2 text-sm text-primary underline underline-offset-4" type="button" onClick={() => void query.refetch()}>Thử lại</button></div>
      : <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-5">
        {query.data?.map((product) => {
          const image = product.images?.[0]
          const mediaLabel = getMediaDisclosureLabel(image?.alt)
          return <li key={product.id}>
            <Link className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" to={`/products/${product.slug}`} aria-label={`Xem ${product.name}${mediaLabel ? `, ${mediaLabel}` : ''}`}>
              <span className="relative block aspect-[3/4] overflow-hidden bg-muted">
                <ResponsiveImage className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, product.name)} width={800} height={1000} loading="lazy" sizes="(max-width: 640px) 50vw, 25vw" />
                {mediaLabel && <DemoConceptBadge label={mediaLabel} />}
              </span>
              <span className="mt-3 block text-sm leading-5 text-foreground">{product.name}</span>
              <span className="mt-1 block text-sm tabular-nums text-muted-foreground">{formatMoney(product.price)}</span>
            </Link>
          </li>
        })}
      </ul>}
  </section>
}
