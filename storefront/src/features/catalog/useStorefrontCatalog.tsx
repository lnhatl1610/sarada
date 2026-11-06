import { useQuery } from '@tanstack/react-query'
import { useCatalogUrlState } from './useCatalogUrlState'
import { useCatalogQueries } from './useCatalogQueries'
import { catalogProductQuerySchema, type CatalogFilterValues } from './catalog-schemas'
import { CatalogFilterChips } from './CatalogFilterChips'
import type { StorefrontCategory } from '../home/home-api'
import { fetchStorefrontCollection, StorefrontCollectionError } from '../home/home-api'

const flattenCategories = (nodes: StorefrontCategory[]): StorefrontCategory[] =>
  nodes.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])

export function useStorefrontCatalog({
  path,
  searchParams,
  categories,
}: {
  path: string
  searchParams: string
  categories: StorefrontCategory[]
}) {
  const collectionSlug = path.startsWith('/collections/') || path.startsWith('/lookbook/') ? path.split('/').filter(Boolean).at(-1) : undefined
  const lookbookRoute = path.startsWith('/lookbook/')
  const categorySlug = path.startsWith('/categories/') ? path.split('/').filter(Boolean).at(-1) : undefined
  const brandSlug = path.startsWith('/brands/') ? path.split('/').filter(Boolean).at(-1) : undefined
  const brandsIndexRoute = path === '/brands'
  const collectionQuery = useQuery({
    queryKey: ['collections', 'detail', collectionSlug],
    queryFn: ({ signal }) => fetchStorefrontCollection(collectionSlug ?? '', signal),
    enabled: Boolean(collectionSlug),
    retry: (failureCount, error) => !(error instanceof StorefrontCollectionError && error.status === 404) && failureCount < 2,
  })
  const merchandisingRoute = ['/new-arrivals', '/best-sellers', '/sale'].includes(path)
  const basePath = collectionSlug ? `/${lookbookRoute ? 'lookbook' : 'collections'}/${encodeURIComponent(collectionSlug)}` : categorySlug ? `/categories/${encodeURIComponent(categorySlug)}` : brandSlug ? `/brands/${encodeURIComponent(brandSlug)}` : merchandisingRoute || path === '/search' ? path : '/products'
  const urlState = useCatalogUrlState(basePath, path === '/products' || path === '/search' || Boolean(collectionSlug) || Boolean(categorySlug) || Boolean(brandSlug), categorySlug)
  const detailSlug = path.startsWith('/products/') ? path.split('/').filter(Boolean).at(-1) : undefined
  const fallbackSlug = path.split('/').filter(Boolean).at(-1)
  const isCatalogRoute = path === '/products' || path === '/search' || merchandisingRoute || Boolean(collectionSlug) || Boolean(categorySlug) || Boolean(brandSlug) || brandsIndexRoute
  const sortValue = urlState.query.get('sort')
  const validSorts = ['relevance', 'newest', 'price_asc', 'price_desc', 'bestseller', 'rating_desc', 'discount_desc'] as const
  const filterValues: CatalogFilterValues = {
    category: urlState.query.get('category') ?? '',
    brand: urlState.query.get('brand') ?? '',
    price_min: urlState.query.get('price_min') ?? '',
    price_max: urlState.query.get('price_max') ?? '',
    size: urlState.query.get('size') ?? '',
    color: urlState.query.get('color') ?? '',
    material: urlState.query.get('material') ?? '',
    fit: urlState.query.get('fit') ?? '',
    in_stock: ['1', '0'].includes(urlState.query.get('in_stock') ?? '') ? urlState.query.get('in_stock') as '1' | '0' : '',
    rating_min: ['1', '2', '3', '4', '5'].includes(urlState.query.get('rating_min') ?? '') ? urlState.query.get('rating_min') as '1' | '2' | '3' | '4' | '5' : '',
    discount_min: ['10', '20', '30', '50'].includes(urlState.query.get('discount_min') ?? '') ? urlState.query.get('discount_min') as '10' | '20' | '30' | '50' : '',
    new: ['1', 'true'].includes(urlState.query.get('new') ?? '') || path === '/new-arrivals' ? '1' : '',
    best_seller: ['1', 'true'].includes(urlState.query.get('best_seller') ?? '') || path === '/best-sellers' ? '1' : '',
    sale: ['1', 'true'].includes(urlState.query.get('sale') ?? '') || path === '/sale' ? '1' : '',
    sort: validSorts.find((sort) => sort === sortValue) ?? (urlState.query.get('q') ? 'relevance' : 'newest'),
    q: urlState.query.get('q') ?? '',
  }
  const productSearch = new URLSearchParams(searchParams)
  if (path === '/new-arrivals') productSearch.set('new', '1')
  if (path === '/best-sellers') productSearch.set('best_seller', '1')
  if (path === '/sale') productSearch.set('sale', '1')
  if (collectionSlug) productSearch.set('collection', collectionSlug)
  if (categorySlug) productSearch.set('category', categorySlug)
  if (brandSlug) productSearch.set('brand', brandSlug)
  if (productSearch.has('q') && !productSearch.has('sort')) productSearch.set('sort', 'relevance')
  const productQueryValidation = catalogProductQuerySchema.safeParse(Object.fromEntries(productSearch.entries()))
  const urlFilterError = productQueryValidation.success ? '' : productQueryValidation.error.issues[0]?.message ?? 'Bộ lọc trong đường dẫn không hợp lệ.'
  const queries = useCatalogQueries({
    search: productSearch.toString(),
    enabled: isCatalogRoute,
    productsEnabled: isCatalogRoute && !brandsIndexRoute && !urlFilterError,
    detailSlug,
    fallbackSlug,
  })

  const categoryOptions = flattenCategories(categories)
  const brandOptions = queries.catalogFilterOptions?.brands ?? []
  const filterError = queries.catalogFilterOptionsError
    ? <div className="catalog-stale-error" role="alert"><span>Không tải được đầy đủ tùy chọn thương hiệu, kích cỡ, màu sắc, chất liệu và khoảng giá.</span><button type="button" onClick={() => void queries.refetchCatalogFilterOptions()}>Thử lại</button></div>
    : null
  const filterOptions = queries.catalogFilterOptions ?? { brands: [], sizes: [], colors: [], color_swatches: [], materials: [], fits: [], facet_counts: { brands: {}, sizes: {}, colors: {}, materials: {}, fits: {} }, price_range: { min: null, max: null } }
  const filterChips = <CatalogFilterChips entries={urlState.activeFilters} categories={categoryOptions} brands={brandOptions} onRemove={urlState.removeFilter} onClear={urlState.clearFilters} />
  const pagination = queries.productPage?.meta && queries.productPage.meta.last_page > 1
    ? <nav className="catalog-pagination" aria-label="Phân trang sản phẩm"><button type="button" disabled={queries.productsFetching || queries.productPage.meta.current_page <= 1} onClick={() => urlState.setPage(queries.productPage!.meta!.current_page! - 1)}>Trang trước</button><span aria-live="polite">Trang {queries.productPage.meta.current_page} / {queries.productPage.meta.last_page} · {queries.productPage.meta.total} sản phẩm</span><button type="button" disabled={queries.productsFetching || queries.productPage.meta.current_page >= queries.productPage.meta.last_page} onClick={() => urlState.setPage(queries.productPage!.meta!.current_page! + 1)}>Trang sau</button></nav>
    : null

  return {
    collectionSlug,
    categorySlug,
    brandSlug,
    brandsIndexRoute,
    collection: collectionQuery.data,
    collectionLoading: collectionQuery.isLoading,
    collectionError: collectionQuery.isError,
    collectionNotFound: collectionQuery.error instanceof StorefrontCollectionError && collectionQuery.error.status === 404,
    refetchCollection: collectionQuery.refetch,
    basePath,
    detailSlug,
    fallbackSlug,
    isCatalogRoute,
    urlState,
    queries,
    categoryOptions,
    filterValues,
    lockedMerchandisingFilters: path === '/new-arrivals' ? ['new'] : path === '/best-sellers' ? ['best_seller'] : path === '/sale' ? ['sale'] : [],
    filterOptions,
    urlFilterError,
    filterError,
    filterChips,
    pagination,
    searchProducts: (value: string) => urlState.searchProducts(value),
  }
}
