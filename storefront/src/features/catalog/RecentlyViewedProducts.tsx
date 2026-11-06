import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import type { CatalogProduct } from './catalog-api'
import { fetchCatalogProduct } from './catalog-api'
import { fetchAccountRecentlyViewedProductSlugs, syncAccountRecentlyViewedProductSlugs } from './recently-viewed-api'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import '../../ProductDetail.css'

const RECENT_PRODUCTS_KEY = 'storefront.recently-viewed-products'
const MAX_RECENT_PRODUCTS = 12

function readRecentProductSlugs(): string[] {
  try {
    const value: unknown = JSON.parse(readBrowserStorage(RECENT_PRODUCTS_KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0).slice(0, MAX_RECENT_PRODUCTS)
  } catch {
    return []
  }
}

export function RecentlyViewedProducts({ currentSlug, accountId, formatMoney }: {
  currentSlug?: string
  accountId?: number | null
  formatMoney: (amount: number) => string
}) {
  const [slugs, setSlugs] = useState<string[]>([])
  const syncAttemptKey = useRef('')
  const queryClient = useQueryClient()
  const accountQueryKey = ['account', 'recently-viewed-products', accountId] as const
  const accountRecentQuery = useQuery({
    queryKey: accountQueryKey,
    queryFn: ({ signal }) => fetchAccountRecentlyViewedProductSlugs(signal),
    enabled: accountId !== undefined && accountId !== null,
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const syncMutation = useMutation({
    mutationFn: syncAccountRecentlyViewedProductSlugs,
    onSuccess: (savedSlugs) => {
      writeBrowserStorage(RECENT_PRODUCTS_KEY, JSON.stringify(savedSlugs))
      queryClient.setQueryData(accountQueryKey, savedSlugs)
      setSlugs(savedSlugs.filter((slug) => slug !== currentSlug).slice(0, 6))
    },
  })

  useEffect(() => {
    const stored = readRecentProductSlugs()
    if (!currentSlug) {
      setSlugs(stored.slice(0, 6))
      return
    }

    const recent = [currentSlug, ...stored.filter((slug) => slug !== currentSlug)].slice(0, MAX_RECENT_PRODUCTS)
    writeBrowserStorage(RECENT_PRODUCTS_KEY, JSON.stringify(recent))
    setSlugs(recent.slice(1, 7))
  }, [currentSlug])

  useEffect(() => {
    if (accountId === undefined || accountId === null || !accountRecentQuery.isSuccess || syncMutation.isPending) return

    const localSlugs = readRecentProductSlugs()
    const mergedSlugs = [...new Set([...localSlugs, ...accountRecentQuery.data])].slice(0, MAX_RECENT_PRODUCTS)
    const sameAsAccount = mergedSlugs.length === accountRecentQuery.data.length
      && mergedSlugs.every((slug, index) => slug === accountRecentQuery.data[index])

    writeBrowserStorage(RECENT_PRODUCTS_KEY, JSON.stringify(mergedSlugs))
    setSlugs(mergedSlugs.filter((slug) => slug !== currentSlug).slice(0, 6))
    if (!sameAsAccount) {
      const signature = `${accountId}:${JSON.stringify(mergedSlugs)}:${JSON.stringify(accountRecentQuery.data)}`
      if (syncAttemptKey.current === signature) return
      syncAttemptKey.current = signature
      syncMutation.mutate(mergedSlugs)
    }
  }, [accountId, accountRecentQuery.data, accountRecentQuery.isSuccess, currentSlug, syncMutation.isPending])

  const productQueries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['catalog', 'recently-viewed', slug],
      queryFn: ({ signal }) => fetchCatalogProduct(slug, signal),
      staleTime: 0,
      refetchOnMount: 'always',
      retry: 1,
    })),
  })
  const products = productQueries
    .filter((query) => query.isSuccess && !query.isFetching)
    .map((query) => query.data)
    .filter((product): product is CatalogProduct => Boolean(product))

  if (slugs.length === 0 || products.length === 0) return null

  return <section className="related-products recently-viewed-products" aria-labelledby="recently-viewed-title">
    <h2 id="recently-viewed-title">Đã xem gần đây</h2>
    <div className="grid">{products.map((product) => {
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
