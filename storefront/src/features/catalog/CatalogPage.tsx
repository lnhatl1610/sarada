import { lazy, Suspense, useEffect, useRef, useState, type PointerEventHandler, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formatVnd } from '../../lib/money'
import { catalogFilterSchema, type CatalogFilterValues } from './catalog-schemas'
import { productSearchQuerySchema } from '../../lib/product-search'
import { Link } from 'react-router'
import { ArrowLeftRight, Heart, List, Mic, MicOff } from 'lucide-react'
import '../../Catalog.css'
import '../../CatalogFilters.css'
import type { components } from '../../types/api'
import type { StorefrontBanner, StorefrontCategory } from '../home/home-api'
import { CampaignCountdown } from '../home/CampaignCountdown'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { mediaUrl } from '../../lib/media-url'
import { fetchCatalogProducts } from './catalog-api'
import { fetchSearchPages, fetchTrendingSearchTerms, type StorefrontSearchPageResults } from '../search/search-api'
import '../search/SearchContentResults.css'
import { CatalogQuickView } from './CatalogQuickView'

const ProductSuggestions = lazy(() => import('./NotFoundProductSuggestions').then((module) => ({ default: module.NotFoundProductSuggestions })))

export type CatalogPageProduct = Pick<components['schemas']['Product'], 'id' | 'name' | 'slug' | 'price' | 'compare_at_price' | 'short_description' | 'images' | 'variants' | 'rating' | 'is_new' | 'sold_count'>
type LookbookPin = components['schemas']['LookbookProductPin']

function QuickAddControl({ product, busy, cartSyncLoading, error, onAdd }: {
  product: CatalogPageProduct
  busy: boolean
  cartSyncLoading: boolean
  error: string
  onAdd: (product: CatalogPageProduct, variantId: number) => Promise<boolean>
}) {
  const [variantId, setVariantId] = useState<number | null>(null)
  const variants = product.variants ?? []
  const availableVariants = variants.filter((variant) => variant.available_quantity > 0)

  if (variants.length === 0) return null

  return <details className="catalog-quick-add">
    <summary>Thêm nhanh</summary>
    <label htmlFor={`quick-add-variant-${product.id}`}>Màu sắc / kích cỡ</label>
    <select id={`quick-add-variant-${product.id}`} value={variantId ?? ''} onChange={(event) => setVariantId(Number(event.target.value) || null)} disabled={busy || cartSyncLoading || availableVariants.length === 0}>
      <option value="">Chọn phân loại</option>
      {variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.available_quantity < 1}>
        {[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku}{variant.available_quantity < 1 ? ' · Hết hàng' : ''}
      </option>)}
    </select>
    <button className="button dark full" type="button" disabled={busy || cartSyncLoading || variantId === null || !availableVariants.some((variant) => variant.id === variantId)} onClick={() => variantId !== null && onAdd(product, variantId)}>
      {busy ? 'Đang thêm…' : cartSyncLoading ? 'Đang đồng bộ giỏ…' : 'Thêm vào túi'}
    </button>
    {error && <p className="catalog-quick-add-error" role="alert">{error}</p>}
  </details>
}

const catalogSearchSchema = z.object({
  search: productSearchQuerySchema,
})
type CatalogSearchValues = z.infer<typeof catalogSearchSchema>

type VoiceResult = { transcript: string }
type VoiceResults = ArrayLike<ArrayLike<VoiceResult>>
type VoiceRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: Event & { results: VoiceResults }) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type CatalogFilterOption = components['schemas']['CatalogFilterOptionsEnvelope']['data']
type CatalogBrand = CatalogFilterOption['brands'][number]

const onCatalogCardPointerMove: PointerEventHandler<HTMLElement> = (event) => {
  if (!window.matchMedia('(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)').matches) return
  const card = event.currentTarget
  const rect = card.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5
  card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`
  card.style.setProperty('--gx', `${(x + 0.5) * 100}%`)
  card.style.setProperty('--gy', `${(y + 0.5) * 100}%`)
}

const onCatalogCardPointerLeave: PointerEventHandler<HTMLElement> = (event) => {
  event.currentTarget.style.transform = ''
}

function CatalogFacetSummary({ options, categories }: {
  options: CatalogFilterOption
  categories: Array<{ id: number; name: string; slug: string; product_count?: number }>
}) {
  const groups: Array<{ label: string; values: Array<[string, number]> }> = [
    { label: 'Danh mục', values: categories.map((item): [string, number] => [item.name, item.product_count ?? 0]) },
    { label: 'Thương hiệu', values: options.brands.map((item): [string, number] => [item.name, item.product_count]) },
    { label: 'Kích cỡ', values: options.sizes.map((value): [string, number] => [value, options.facet_counts.sizes[value] ?? 0]) },
    { label: 'Màu sắc', values: options.colors.map((value): [string, number] => [value, options.facet_counts.colors[value] ?? 0]) },
    { label: 'Chất liệu', values: options.materials.map((value): [string, number] => [value, options.facet_counts.materials[value] ?? 0]) },
    { label: 'Kiểu dáng', values: options.fits.map((value): [string, number] => [value, options.facet_counts.fits[value] ?? 0]) },
  ]

  return <details className="catalog-facet-summary">
    <summary>Số sản phẩm theo lựa chọn lọc</summary>
    <div>{groups.filter((group) => group.values.length > 0).map((group) => <section key={group.label}>
      <h3>{group.label}</h3>
      <ul>{group.values.map(([label, count]) => <li key={label}>{label}<span>{count}</span></li>)}</ul>
    </section>)}</div>
  </details>
}

function SearchRecovery({ query, formatMoney }: { query: string; formatMoney: (amount: number) => string }) {
  const trendingQuery = useQuery({
    queryKey: ['storefront-search-recovery-trending'],
    queryFn: ({ signal }) => fetchTrendingSearchTerms(signal),
    staleTime: 60_000,
    retry: false,
  })
  const bestsellerQuery = useQuery({
    queryKey: ['storefront-search-recovery-bestsellers'],
    queryFn: ({ signal }) => fetchCatalogProducts('?best_seller=1&sort=bestseller&per_page=4', signal),
    staleTime: 60_000,
    retry: false,
  })
  const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN')
  const alternatives = (trendingQuery.data ?? []).filter((item) => item.term.toLocaleLowerCase('vi-VN') !== normalizedQuery).slice(0, 5)

  return <section className="search-recovery" aria-label="Gợi ý tìm kiếm">
    {alternatives.length > 0 && <div>
      <h3>Từ khóa được tìm nhiều gần đây</h3>
      <ul className="search-recovery-terms">{alternatives.map((item) => <li key={item.term}><Link to={`/search?q=${encodeURIComponent(item.term)}`}>{item.term}</Link></li>)}</ul>
    </div>}
    {trendingQuery.isError && <p className="catalog-search-recovery-error" role="status">Chưa tải được gợi ý từ khóa. Bạn có thể chỉnh lại từ khóa tìm kiếm.</p>}
    {bestsellerQuery.isPending ? <p className="sr-only" role="status">Đang tải sản phẩm bán chạy…</p> : bestsellerQuery.isError ? <div className="catalog-search-recovery-error" role="status"><span>Chưa tải được sản phẩm bán chạy.</span> <button type="button" onClick={() => void bestsellerQuery.refetch()}>Thử lại</button></div> : (bestsellerQuery.data?.length ?? 0) > 0 && <div>
      <h3>Sản phẩm bán chạy</h3>
      <ul className="search-recovery-products">{bestsellerQuery.data?.map((product) => <li key={product.id}><Link to={`/products/${product.slug}`}>{product.name}<span>{formatMoney(product.price)}</span></Link></li>)}</ul>
    </div>}
  </section>
}

function SearchContentResults({ data, loading, error, onRetry, onPageChange }: {
  data?: StorefrontSearchPageResults
  loading: boolean
  error: boolean
  onRetry: () => void
  onPageChange: (page: number) => void
}) {
  if (loading) return <p className="state" role="status">Đang tìm trang nội dung…</p>
  if (error) return <div className="empty" role="alert"><p>Chưa tải được kết quả trang nội dung.</p><button className="button dark" type="button" onClick={onRetry}>Thử lại</button></div>
  if (!data?.data.length) return <div className="empty"><h2>Không tìm thấy trang phù hợp</h2><p>Hãy thử từ khóa khác hoặc xem kết quả sản phẩm.</p></div>

  return <section className="catalog-search-content" aria-labelledby="catalog-search-content-title">
    <h2 id="catalog-search-content-title">Bài viết và trang ({data.meta.total})</h2>
    <ul className="catalog-search-content-list">
      {data.data.map((page) => <li key={`${page.type}-${page.id}`}>
        <Link to={page.href}>{page.type === 'article' ? `Bài viết: ${page.title}` : page.title}</Link>
        {page.description && <p>{page.description}</p>}
      </li>)}
    </ul>
    {data.meta.last_page > 1 && <nav className="catalog-search-content-pagination" aria-label="Phân trang kết quả trang nội dung">
      <button type="button" disabled={data.meta.current_page <= 1} onClick={() => onPageChange(data.meta.current_page - 1)}>Trang trước</button>
      <span>Trang {data.meta.current_page} / {data.meta.last_page}</span>
      <button type="button" disabled={data.meta.current_page >= data.meta.last_page} onClick={() => onPageChange(data.meta.current_page + 1)}>Trang sau</button>
    </nav>}
  </section>
}

function CatalogFiltersForm({
  className,
  idPrefix,
  values,
  categories,
  options,
  hideBrand = false,
  lockedFilters = [],
  onApply,
  onApplied,
  onClear,
}: {
  className: string
  idPrefix: string
  values: CatalogFilterValues
  categories: Array<{ id: number; name: string; slug: string; product_count?: number }>
  options: CatalogFilterOption
  hideBrand?: boolean
  lockedFilters?: string[]
  onApply: (values: CatalogFilterValues) => boolean | void
  onApplied?: () => void
  onClear: () => void
}) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CatalogFilterValues>({
    resolver: zodResolver(catalogFilterSchema),
    defaultValues: values,
  })
  const submit = (formValues: CatalogFilterValues) => {
    if (onApply(formValues) !== false) onApplied?.()
  }
  const priceFloor = options.price_range.min ?? 0
  const priceCeiling = Math.max(priceFloor, options.price_range.max ?? priceFloor)
  const priceMinDraft = watch('price_min')
  const priceMaxDraft = watch('price_max')
  const selectedColor = watch('color')
  const selectedNew = watch('new')
  const selectedBestSeller = watch('best_seller')
  const selectedSale = watch('sale')
  const selectedPriceMin = priceMinDraft === '' || !Number.isFinite(Number(priceMinDraft)) ? priceFloor : Number(priceMinDraft)
  const selectedPriceMax = priceMaxDraft === '' || !Number.isFinite(Number(priceMaxDraft)) ? priceCeiling : Number(priceMaxDraft)

  return <form className={className} onSubmit={handleSubmit(submit)} noValidate>
    <label>Danh mục<select {...register('category')}><option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category.id} value={category.slug} disabled={category.product_count === 0}>{category.name} ({category.product_count ?? 0})</option>)}</select></label>
    {!hideBrand && <label>Thương hiệu<select {...register('brand')}><option value="">Tất cả thương hiệu</option>{options.brands.map((brand) => <option key={brand.slug} value={brand.slug} disabled={brand.product_count === 0}>{brand.name} ({brand.product_count})</option>)}</select></label>}
    <label htmlFor={`${idPrefix}-price-min`}>Giá từ<input id={`${idPrefix}-price-min`} type="number" min="0" step="1" inputMode="numeric" placeholder="0 ₫" aria-invalid={Boolean(errors.price_min)} aria-describedby={errors.price_min ? `${idPrefix}-price-min-error` : undefined} {...register('price_min')} />{errors.price_min && <small id={`${idPrefix}-price-min-error`} className="field-error" role="alert">{errors.price_min.message}</small>}</label>
    <label htmlFor={`${idPrefix}-price-max`}>Đến giá<input id={`${idPrefix}-price-max`} type="number" min="0" step="1" inputMode="numeric" placeholder="Không giới hạn" aria-invalid={Boolean(errors.price_max)} aria-describedby={errors.price_max ? `${idPrefix}-price-max-error` : undefined} {...register('price_max')} />{errors.price_max && <small id={`${idPrefix}-price-max-error`} className="field-error" role="alert">{errors.price_max.message}</small>}</label>
    <fieldset className="catalog-price-range" disabled={priceFloor === priceCeiling}>
      <legend>Điều chỉnh khoảng giá tham khảo</legend>
      <label htmlFor={`${idPrefix}-price-min-range`}>Từ <output>{formatVnd(selectedPriceMin)}</output><input id={`${idPrefix}-price-min-range`} type="range" min={priceFloor} max={priceCeiling} step="10000" value={Math.max(priceFloor, Math.min(selectedPriceMin, priceCeiling))} aria-label="Giá thấp nhất" onChange={(event) => { const value = Number(event.target.value); if (value <= selectedPriceMax) setValue('price_min', value === priceFloor ? '' : String(value), { shouldDirty: true, shouldValidate: true }) }} /></label>
      <label htmlFor={`${idPrefix}-price-max-range`}>Đến <output>{formatVnd(selectedPriceMax)}</output><input id={`${idPrefix}-price-max-range`} type="range" min={priceFloor} max={priceCeiling} step="10000" value={Math.max(priceFloor, Math.min(selectedPriceMax, priceCeiling))} aria-label="Giá cao nhất" onChange={(event) => { const value = Number(event.target.value); if (value >= selectedPriceMin) setValue('price_max', value === priceCeiling ? '' : String(value), { shouldDirty: true, shouldValidate: true }) }} /></label>
    </fieldset>
    <label>Kích cỡ<select {...register('size')}><option value="">Mọi kích cỡ</option>{options.sizes.map((size) => <option key={size} value={size} disabled={options.facet_counts.sizes[size] === 0}>{size} ({options.facet_counts.sizes[size] ?? 0})</option>)}</select></label>
    <fieldset className="catalog-filter-colors"><legend>Màu sắc</legend><div>{options.color_swatches.map((color) => <button key={color.value} type="button" className="catalog-filter-color" aria-label={`Màu ${color.value}, ${options.facet_counts.colors[color.value] ?? 0} sản phẩm`} aria-pressed={selectedColor === color.value} title={color.value} disabled={options.facet_counts.colors[color.value] === 0} onClick={() => setValue('color', selectedColor === color.value ? '' : color.value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}><span aria-hidden="true" style={{ backgroundColor: color.color_hex ?? '#d7d3cc' }} /><small>{color.value} ({options.facet_counts.colors[color.value] ?? 0})</small></button>)}</div><input type="hidden" {...register('color')} /></fieldset>
    <label>Chất liệu<select {...register('material')}><option value="">Mọi chất liệu</option>{options.materials.map((material) => <option key={material} value={material} disabled={options.facet_counts.materials[material] === 0}>{material} ({options.facet_counts.materials[material] ?? 0})</option>)}</select></label>
    <label>Kiểu dáng / form<select {...register('fit')}><option value="">Mọi kiểu dáng</option>{options.fits.map((fit) => <option key={fit} value={fit} disabled={options.facet_counts.fits[fit] === 0}>{fit} ({options.facet_counts.fits[fit] ?? 0})</option>)}</select></label>
    <fieldset className="catalog-merchandising-filters"><legend>Loại sản phẩm</legend>
      <label><input type="checkbox" checked={selectedNew === '1'} disabled={lockedFilters.includes('new')} onChange={(event) => setValue('new', event.target.checked ? '1' : '', { shouldDirty: true, shouldValidate: true })} /> Hàng mới</label>
      <label><input type="checkbox" checked={selectedBestSeller === '1'} disabled={lockedFilters.includes('best_seller')} onChange={(event) => setValue('best_seller', event.target.checked ? '1' : '', { shouldDirty: true, shouldValidate: true })} /> Bán chạy</label>
      <label><input type="checkbox" checked={selectedSale === '1'} disabled={lockedFilters.includes('sale')} onChange={(event) => setValue('sale', event.target.checked ? '1' : '', { shouldDirty: true, shouldValidate: true })} /> Đang giảm giá</label>
      {lockedFilters.length > 0 && <small>Tiêu chí của trang hiện tại luôn được áp dụng.</small>}
    </fieldset>
    <label>Tình trạng<select {...register('in_stock')}><option value="">Tất cả sản phẩm</option><option value="1">Còn hàng</option><option value="0">Hết hàng</option></select></label>
    <label>Đánh giá từ<select {...register('rating_min')}><option value="">Mọi mức đánh giá</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao trở lên</option>)}</select></label>
    <label>Giảm giá từ<select {...register('discount_min')}><option value="">Mọi mức giảm</option>{[50, 30, 20, 10].map((discount) => <option key={discount} value={discount}>Giảm từ {discount}%</option>)}</select></label>
    <label>Sắp xếp<select {...register('sort')}>{values.q && <option value="relevance">Phù hợp nhất</option>}<option value="newest">Mới nhất</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option><option value="bestseller">Bán chạy</option><option value="rating_desc">Đánh giá cao nhất</option><option value="discount_desc">Giảm giá nhiều nhất</option></select></label>
    <input type="hidden" {...register('q')} />
    <button className="button dark" type="submit">Áp dụng bộ lọc</button>
    <button className="catalog-reset" type="button" onClick={onClear}>Xóa bộ lọc</button>
    {errors.q && <small className="field-error" role="alert">Từ khóa trong URL không hợp lệ.</small>}
  </form>
}

function CatalogSearchForm({ search, onSearchChange, onSearchSubmit }: {
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit: (value: string) => void
}) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CatalogSearchValues>({
    resolver: zodResolver(catalogSearchSchema),
    defaultValues: { search },
  })
  const searchField = register('search')
  const recognitionRef = useRef<VoiceRecognition | null>(null)
  const [voiceListening, setVoiceListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')

  const toggleVoiceSearch = () => {
    if (voiceListening) {
      recognitionRef.current?.stop()
      return
    }
    const speechWindow = window as Window & { SpeechRecognition?: new () => VoiceRecognition; webkitSpeechRecognition?: new () => VoiceRecognition }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) {
      setVoiceError('Trình duyệt này chưa hỗ trợ tìm kiếm bằng giọng nói. Hãy nhập từ khóa.');
      return
    }
    setVoiceError('')
    const recognition = new Recognition()
    recognition.lang = 'vi-VN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const value = event.results[0]?.[0]?.transcript?.trim().slice(0, 120)
      if (!value) return
      setValue('search', value, { shouldDirty: true, shouldValidate: true })
      onSearchChange(value)
      onSearchSubmit(value)
    }
    recognition.onerror = (event) => setVoiceError(event.error === 'not-allowed' ? 'Bạn chưa cấp quyền micro cho tìm kiếm bằng giọng nói.' : 'Không nhận diện được giọng nói. Hãy thử lại hoặc nhập từ khóa.')
    recognition.onend = () => setVoiceListening(false)
    recognitionRef.current = recognition
    setVoiceListening(true)
    try {
      recognition.start()
    } catch {
      setVoiceListening(false)
      setVoiceError('Không thể bắt đầu micro. Hãy thử lại hoặc nhập từ khóa.')
    }
  }

  useEffect(() => () => recognitionRef.current?.stop(), [])

  return <form className="catalog-sort" onSubmit={handleSubmit(({ search: value }) => onSearchSubmit(value))} noValidate>
    <input aria-label="Tìm trong sản phẩm" aria-invalid={Boolean(errors.search)} aria-describedby={errors.search ? 'catalog-search-error' : undefined} maxLength={120} placeholder="Tìm thiết kế" {...searchField} value={search} onChange={(event) => { void searchField.onChange(event); onSearchChange(event.target.value); setVoiceError('') }} />
    <button type="button" className="catalog-voice-search" onClick={toggleVoiceSearch} aria-label={voiceListening ? 'Dừng tìm kiếm bằng giọng nói' : 'Tìm kiếm bằng giọng nói'} aria-pressed={voiceListening}>{voiceListening ? <MicOff aria-hidden="true" size={17} /> : <Mic aria-hidden="true" size={17} />}</button>
    <button className="button dark" type="submit">Tìm</button>
    {errors.search && <small id="catalog-search-error" className="field-error" role="alert">{errors.search.message}</small>}
    {voiceListening && <small className="catalog-voice-status" role="status">Đang nghe tiếng Việt…</small>}
    {voiceError && <small className="field-error catalog-voice-error" role="alert">{voiceError}</small>}
  </form>
}

type CatalogPageProps = {
  searchRoute: boolean
  collectionRoute: boolean
  categoryRoute: boolean
  lockBrandFilter?: boolean
  brand?: CatalogBrand
  routeTitle?: string
  saleCampaign?: StorefrontBanner | null
  collectionName?: string
  collectionDescription?: string
  collectionImage?: string | null
  collectionImageAlt?: string | null
  collectionLookbookPins?: LookbookPin[]
  categoryName?: string
  categoryDescription?: string
  categoryImage?: string | null
  categoryImageAlt?: string | null
  categoryChildren?: StorefrontCategory[]
  total: number | undefined
  loading: boolean
  fetching: boolean
  stale: boolean
  apiUnavailable: boolean
  hasFilters: boolean
  basePath: string
  search: string
  searchKey: string
  products: CatalogPageProduct[]
  activeFilterCount: number
  filterValues: CatalogFilterValues
  lockedMerchandisingFilters?: string[]
  filterOptions: CatalogFilterOption
  categoryOptions: Array<{ id: number; name: string; slug: string; product_count?: number }>
  urlFilterError: string
  filterError: ReactNode
  filterChips: ReactNode
  pagination: ReactNode
  isWishlisted: (productId: number) => boolean
  compareSlugs: string[]
  compareLimitReached: boolean
  onToggleCompare: (slug: string) => boolean
  formatMoney: (amount: number) => string
  onSearchChange: (value: string) => void
  onSearchSubmit: (value: string) => void
  onFilterSubmit: (values: CatalogFilterValues) => boolean | void
  onClearFilters: () => void
  onRetryProducts: () => void
  onToggleWishlist: (product: CatalogPageProduct) => void
  onAddToCart: (product: CatalogPageProduct, variantId: number) => Promise<boolean>
  cartAddBusy: boolean
  cartAddError: string
  cartSyncLoading: boolean
}

export function CatalogPage({
  searchRoute,
  collectionRoute,
  categoryRoute,
  lockBrandFilter = false,
  brand,
  routeTitle,
  saleCampaign,
  collectionName,
  collectionDescription,
  collectionImage,
  collectionImageAlt,
  collectionLookbookPins = [],
  categoryName,
  categoryDescription,
  categoryImage,
  categoryImageAlt,
  categoryChildren = [],
  total,
  loading,
  fetching,
  stale,
  apiUnavailable,
  hasFilters,
  basePath,
  search,
  searchKey,
  products,
  activeFilterCount,
  filterValues,
  lockedMerchandisingFilters = [],
  filterOptions,
  categoryOptions,
  urlFilterError,
  filterError,
  filterChips,
  pagination,
  isWishlisted,
  compareSlugs,
  compareLimitReached,
  onToggleCompare,
  formatMoney,
  onSearchChange,
  onSearchSubmit,
  onFilterSubmit,
  onClearFilters,
  onRetryProducts,
  onToggleWishlist,
  onAddToCart,
  cartAddBusy,
  cartAddError,
  cartSyncLoading,
}: CatalogPageProps) {
  const prefersReducedMotion = useReducedMotion()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(4)
  const [listView, setListView] = useState(false)
  const [selectedColorValueIds, setSelectedColorValueIds] = useState<Record<number, number>>({})
  const [searchResultState, setSearchResultState] = useState<{ searchKey: string; tab: 'products' | 'pages'; page: number }>({ searchKey, tab: 'products', page: 1 })
  const searchResultsTab = searchResultState.searchKey === searchKey ? searchResultState.tab : 'products'
  const contentResultPage = searchResultState.searchKey === searchKey ? searchResultState.page : 1
  const selectSearchResultsTab = (tab: 'products' | 'pages') => setSearchResultState((current) => ({ searchKey, tab, page: current.searchKey === searchKey ? current.page : 1 }))
  const setContentResultPage = (page: number) => setSearchResultState((current) => ({ searchKey, tab: current.searchKey === searchKey ? current.tab : 'products', page }))
  const filterDialogRef = useRef<HTMLDialogElement>(null)
  const filterTitleRef = useRef<HTMLHeadingElement>(null)

  const hasSearchTabs = searchRoute && filterValues.q.trim().length >= 2
  const contentResultsQuery = useQuery({
    queryKey: ['storefront-search-pages', filterValues.q, contentResultPage],
    queryFn: ({ signal }) => fetchSearchPages(filterValues.q, contentResultPage, signal),
    enabled: hasSearchTabs,
    staleTime: 30_000,
    retry: 1,
  })

  useEffect(() => {
    const dialog = filterDialogRef.current
    if (!dialog) return
    if (filtersOpen && !dialog.open) {
      dialog.showModal()
      filterTitleRef.current?.focus()
    }
    if (!filtersOpen && dialog.open) dialog.close()
  }, [filtersOpen])

  const clearFilters = () => {
    setFiltersOpen(false)
    onClearFilters()
  }

  return (
    <div className="container collection catalog-page">
      <nav className="catalog-breadcrumb" aria-label="Điều hướng đường dẫn">
        <Link to="/">Trang chủ</Link>
        <span aria-hidden="true">/</span>
        {searchRoute ? <span aria-current="page">Tìm kiếm</span> : collectionRoute && collectionName ? <><Link to="/products">Sản phẩm</Link><span aria-hidden="true">/</span><span aria-current="page">{collectionName}</span></> : categoryRoute && categoryName ? <><Link to="/products">Sản phẩm</Link><span aria-hidden="true">/</span><span aria-current="page">{categoryName}</span></> : <span aria-current="page">{routeTitle ?? 'Sản phẩm'}</span>}
      </nav>
      {!searchRoute && !collectionRoute && !categoryRoute && routeTitle === 'Khuyến mãi' && saleCampaign?.show_countdown && saleCampaign.ends_at && <section className="sale-campaign-banner" aria-label="Thời gian ưu đãi">
        <div className="sale-campaign-image"><ResponsiveImage src={saleCampaign.image} alt={saleCampaign.alt} width={1200} height={700} sizes="(max-width:620px) 100vw, 40vw" /></div>
        <div className="sale-campaign-copy">
          <p className="eyebrow">ƯU ĐÃI ĐANG DIỄN RA</p>
          <h2>{saleCampaign.title}</h2>
          {saleCampaign.description && <p>{saleCampaign.description}</p>}
          <CampaignCountdown banner={saleCampaign} />
          <a href="#catalog-results" className="sale-campaign-link">Khám phá sản phẩm ưu đãi</a>
        </div>
      </section>}
      {!brand && <p className="eyebrow">{searchRoute ? 'TÌM KIẾM' : collectionRoute ? 'BỘ SƯU TẬP SARADA' : categoryRoute ? 'DANH MỤC SARADA' : routeTitle?.toLocaleUpperCase('vi-VN') ?? 'TẤT CẢ THIẾT KẾ'}</p>}
      {brand && <section className="catalog-brand-editorial" aria-labelledby="catalog-brand-title">
        {brand.banner && <div className="catalog-brand-editorial-image"><ResponsiveImage src={mediaUrl(brand.banner)} alt={brand.banner_alt || `Bìa thương hiệu ${brand.name}`} width={1800} height={640} sizes="100vw" /></div>}
        <div className="catalog-brand-editorial-copy">
          {brand.logo && <img src={mediaUrl(brand.logo)} alt={`Logo ${brand.name}`} loading="lazy" />}
          <div><p className="eyebrow">THƯƠNG HIỆU</p><h1 id="catalog-brand-title">{brand.name}</h1>{brand.description && <p>{brand.description}</p>}</div>
        </div>
      </section>}
      <div className="section-title">
        <div>
          {!brand && <h1>{searchRoute ? filterValues.q ? `Kết quả cho “${filterValues.q}”` : 'Tìm sản phẩm' : collectionName ?? categoryName ?? (collectionRoute ? 'Bộ sưu tập' : routeTitle ?? 'Sản phẩm')}</h1>}
          {brand && <h2 className="catalog-brand-products-title">Thiết kế {brand.name}</h2>}
          <p className="catalog-count">{stale ? '—' : total ?? (loading ? '—' : products.length)} thiết kế được tuyển chọn</p>
        </div>
        <CatalogSearchForm key={searchKey} search={search} onSearchChange={onSearchChange} onSearchSubmit={onSearchSubmit} />
      </div>
      {(collectionRoute && collectionImage || categoryRoute && categoryImage) && <div className={`catalog-route-cover${collectionRoute && collectionLookbookPins.length ? ' has-lookbook-pins' : ''}`}>
        <ResponsiveImage src={collectionRoute ? collectionImage : categoryImage} alt={collectionRoute ? collectionImageAlt?.trim() || `Bộ sưu tập ${collectionName ?? ''}` : categoryImageAlt?.trim() || `Danh mục ${categoryName ?? ''}`} width={1600} height={560} sizes="(max-width: 620px) 100vw, 90vw" />
        {getMediaDisclosureLabel(collectionRoute ? collectionImageAlt : categoryImageAlt) && <DemoConceptBadge label={getMediaDisclosureLabel(collectionRoute ? collectionImageAlt : categoryImageAlt) ?? undefined} />}
        {collectionRoute && collectionLookbookPins.map((pin, index) => <Link key={pin.id} className="catalog-lookbook-pin" to={`/products/${encodeURIComponent(pin.slug)}`} style={{ left: `clamp(24px, ${pin.x}%, calc(100% - 24px))`, top: `clamp(24px, ${pin.y}%, calc(100% - 24px))` }} aria-label={`Xem ${pin.name}`} title={pin.name}><span aria-hidden="true">{index + 1}</span></Link>)}
      </div>}
      {compareSlugs.length > 0 && <div className="catalog-compare-bar"><span>Đang chọn {compareSlugs.length}/4 sản phẩm để so sánh.</span><Link to="/compare">Xem bảng so sánh</Link></div>}
      {compareLimitReached && <p className="catalog-compare-limit" role="status">Bạn có thể so sánh tối đa bốn sản phẩm. Hãy bỏ bớt một sản phẩm trước.</p>}
      {collectionRoute && collectionDescription && <p className="catalog-collection-description">{collectionDescription}</p>}
      {categoryRoute && categoryDescription && <p className="catalog-collection-description">{categoryDescription}</p>}
      {categoryRoute && categoryChildren.length > 0 && <nav className="catalog-subcategory-chips" aria-label={`Danh mục con của ${categoryName ?? 'danh mục này'}`}>
        {categoryChildren.map((child) => <Link key={child.id} to={`/categories/${encodeURIComponent(child.slug)}`}>{child.name}</Link>)}
      </nav>}
      {hasSearchTabs && <div className="catalog-search-result-tabs" role="group" aria-label="Loại kết quả tìm kiếm">
        <button type="button" aria-pressed={searchResultsTab === 'products'} onClick={() => selectSearchResultsTab('products')}>Sản phẩm ({loading ? '…' : total ?? products.length})</button>
        <button type="button" aria-pressed={searchResultsTab === 'pages'} onClick={() => selectSearchResultsTab('pages')}>Trang nội dung ({contentResultsQuery.isPending ? '…' : contentResultsQuery.isError ? '—' : contentResultsQuery.data?.meta.total ?? 0})</button>
      </div>}
      {hasSearchTabs && searchResultsTab === 'pages' ? <SearchContentResults data={contentResultsQuery.data} loading={contentResultsQuery.isPending} error={contentResultsQuery.isError} onRetry={() => void contentResultsQuery.refetch()} onPageChange={setContentResultPage} /> : <>
      {filterError}
      {urlFilterError && <p className="catalog-filter-error" role="alert">{urlFilterError}</p>}
      <details className="catalog-desktop-filter-panel">
        <summary>Lọc &amp; sắp xếp{activeFilterCount > 0 && <span>{activeFilterCount} bộ lọc đang dùng</span>}</summary>
        <CatalogFiltersForm key={`desktop-${searchKey}`} className="catalog-filters" idPrefix="catalog-desktop" values={filterValues} categories={categoryOptions} options={filterOptions} hideBrand={lockBrandFilter} lockedFilters={lockedMerchandisingFilters} onApply={onFilterSubmit} onClear={clearFilters} />
      </details>
      <button className="mobile-catalog-filter-trigger" type="button" aria-haspopup="dialog" aria-expanded={filtersOpen} aria-label={`Lọc & sắp xếp${activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}`} onClick={() => setFiltersOpen(true)}>
        Lọc &amp; sắp xếp{activeFilterCount > 0 && <>{' '}<span>{activeFilterCount}</span></>}
      </button>
      <dialog id="catalog-filter-sheet" ref={filterDialogRef} className="catalog-filter-sheet" aria-labelledby="catalog-filter-sheet-title" aria-describedby="catalog-filter-sheet-description" onClose={() => setFiltersOpen(false)} onClick={(event) => { if (event.target === filterDialogRef.current) filterDialogRef.current?.close() }}>
        <div className="catalog-filter-sheet-heading"><div><h2 id="catalog-filter-sheet-title" ref={filterTitleRef} tabIndex={-1}>Lọc sản phẩm</h2><p id="catalog-filter-sheet-description" className="catalog-filter-sheet-description">Chọn tiêu chí rồi nhấn Áp dụng để cập nhật danh sách.</p></div><button type="button" aria-label="Đóng bộ lọc" onClick={() => filterDialogRef.current?.close()}>×</button></div>
        <CatalogFiltersForm key={`mobile-${searchKey}`} className="catalog-filter-sheet-form" idPrefix="catalog-mobile" values={filterValues} categories={categoryOptions} options={filterOptions} hideBrand={lockBrandFilter} lockedFilters={lockedMerchandisingFilters} onApply={onFilterSubmit} onApplied={() => setFiltersOpen(false)} onClear={clearFilters} />
      </dialog>
      {filterChips}
      <CatalogFacetSummary options={filterOptions} categories={categoryOptions} />
      <div className="catalog-grid-view" role="group" aria-label="Chế độ hiển thị sản phẩm">
        <span>Hiển thị</span>
        {([2, 3, 4] as const).map((columns) => <button key={columns} type="button" aria-pressed={!listView && gridColumns === columns} aria-label={`${columns} cột sản phẩm`} onClick={() => { setListView(false); setGridColumns(columns) }}>{columns}</button>)}
        <button type="button" aria-pressed={listView} aria-label="Hiển thị dạng danh sách" title="Dạng danh sách" onClick={() => setListView(true)}><List aria-hidden="true" size={16} /></button>
      </div>
      {fetching && !loading && <p className="sr-only" role="status">Đang cập nhật kết quả…</p>}
      {apiUnavailable && products.length > 0 && <div className="catalog-stale-error" role="alert"><span>Không tải được kết quả mới. Đang giữ danh sách trước đó.</span><button type="button" onClick={onRetryProducts}>Thử lại</button></div>}
      {loading ? (
        <><div className="product-grid" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <div className="catalog-skeleton-card" key={index}><div className="catalog-skeleton-image" /><div className="catalog-skeleton-line" /><div className="catalog-skeleton-line short" /></div>)}</div><p className="sr-only" role="status">Đang tải sản phẩm…</p></>
      ) : products.length ? (
        <div id="catalog-results" className={`product-grid catalog-grid-columns-${gridColumns}${listView ? ' catalog-list-view' : ''}`} aria-busy={fetching}>
          {products.map((item, index) => {
            const images = item.images ?? []
            const colorOptions = [...new Map((item.variants ?? [])
              .filter((variant) => variant.color_value_id !== null && variant.color && variant.color_hex && images.some((image) => image.color_value_id === variant.color_value_id))
              .map((variant) => [variant.color_value_id!, variant])).values()]
            const selectedColorValueId = selectedColorValueIds[item.id] ?? images.find((image) => image.color_value_id !== null)?.color_value_id ?? null
            const selectedImages = selectedColorValueId === null ? images : images.filter((image) => image.color_value_id === selectedColorValueId || image.color_value_id === null)
            const primaryImage = selectedImages.find((image) => image.color_value_id === selectedColorValueId) ?? images[0]
            const secondaryImage = selectedImages.find((image) => image.url !== primaryImage?.url)

            return <article className="card card-tilt catalog-product-card" key={item.id} onPointerMove={onCatalogCardPointerMove} onPointerLeave={onCatalogCardPointerLeave}>
              {item.compare_at_price != null && item.compare_at_price > item.price && <span className="catalog-sale-badge">-{Math.round((item.compare_at_price - item.price) * 100 / item.compare_at_price)}%</span>}
              {item.is_new && <span className="catalog-new-badge">Mới</span>}
              <Link to={`/products/${item.slug}`} className="art catalog-product-art" aria-label={`Xem sản phẩm ${item.name}${getMediaDisclosureLabel(primaryImage?.alt) ? `, ${getMediaDisclosureLabel(primaryImage?.alt)}` : ''}`}>
                <motion.div layoutId={!prefersReducedMotion && primaryImage?.url ? `product-image-${item.id}-${encodeURIComponent(primaryImage.url)}` : undefined} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="storefront-shared-product-media">
                  <ResponsiveImage className="catalog-product-image" src={primaryImage?.url} srcSet={primaryImage?.srcset ?? undefined} alt={getProductImageAlt(primaryImage?.url, primaryImage?.alt, item.name)} width={800} height={1000} loading={index < 4 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} sizes="(max-width: 620px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                </motion.div>
                {getMediaDisclosureLabel(primaryImage?.alt) && <DemoConceptBadge label={getMediaDisclosureLabel(primaryImage?.alt) ?? undefined} />}
                {secondaryImage?.url && <>
                  <ResponsiveImage className="catalog-product-image catalog-product-image-secondary" src={secondaryImage.url} srcSet={secondaryImage.srcset ?? undefined} alt="" aria-hidden="true" width={800} height={1000} loading="lazy" sizes="(max-width: 620px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                  {getMediaDisclosureLabel(secondaryImage.alt) && <span className="sr-only">{getMediaDisclosureLabel(secondaryImage.alt)}</span>}
                </>}
              </Link>
              <button className="wishlist-toggle" type="button" aria-label={isWishlisted(item.id) ? `Bỏ yêu thích ${item.name}` : `Thêm ${item.name} vào yêu thích`} aria-pressed={isWishlisted(item.id)} onClick={() => onToggleWishlist(item)}><Heart aria-hidden="true" size={20} fill={isWishlisted(item.id) ? 'currentColor' : 'none'} /></button>
              <button className="catalog-compare-toggle" type="button" aria-label={`${compareSlugs.includes(item.slug) ? 'Bỏ' : 'Thêm'} ${item.name} ${compareSlugs.includes(item.slug) ? 'khỏi' : 'vào'} danh sách so sánh`} aria-pressed={compareSlugs.includes(item.slug)} onClick={() => onToggleCompare(item.slug)}><ArrowLeftRight aria-hidden="true" size={16} />{compareSlugs.includes(item.slug) ? 'Đã chọn' : 'So sánh'}</button>
              {colorOptions.length > 1 && <div className="catalog-color-swatches" role="group" aria-label={`Màu ${item.name}`}>{colorOptions.map((variant) => <button key={variant.color_value_id} type="button" className="catalog-color-swatch" style={{ backgroundColor: variant.color_hex! }} aria-label={`Xem ảnh màu ${variant.color}`} aria-pressed={selectedColorValueId === variant.color_value_id} onClick={() => setSelectedColorValueIds((current) => ({ ...current, [item.id]: variant.color_value_id! }))} />)}</div>}
              <div className="card-info"><div><Link to={`/products/${item.slug}`}>{item.name}</Link>{item.sold_count > 0 && <small className="catalog-bestseller-badge">Bán chạy</small>}{item.rating && item.rating.count > 0 && <small className="catalog-card-rating" aria-label={`Đánh giá ${item.rating.average.toFixed(1)} trên 5 từ ${item.rating.count} đánh giá`}><span aria-hidden="true">★ {item.rating.average.toFixed(1)}</span><span>({item.rating.count})</span></small>}{item.short_description && <p>{item.short_description}</p>}{item.variants && <small className={item.variants.some((variant) => variant.available_quantity > 0) ? 'catalog-stock available' : 'catalog-stock unavailable'}>{item.variants.some((variant) => variant.available_quantity > 0) ? 'Còn hàng' : 'Tạm hết hàng'}</small>}</div><div className="catalog-card-prices"><b>{formatMoney(item.price)}</b>{item.compare_at_price != null && item.compare_at_price > item.price && <del>{formatMoney(item.compare_at_price)}</del>}</div></div>
              <QuickAddControl product={item} busy={cartAddBusy} cartSyncLoading={cartSyncLoading} error={cartAddError} onAdd={onAddToCart} />
              <CatalogQuickView product={item} busy={cartAddBusy} cartSyncLoading={cartSyncLoading} error={cartAddError} onAdd={onAddToCart} />
            </article>
          })}
        </div>
      ) : apiUnavailable ? (
        <div className="empty catalog-api-error"><h2>Chưa tải được sản phẩm</h2><p>Kiểm tra kết nối rồi thử lại.</p><button className="button dark" type="button" onClick={onRetryProducts}>Thử lại</button></div>
      ) : (
        <div className="empty"><h2>{hasFilters ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm'}</h2><p>Thử xóa bớt bộ lọc hoặc quay lại xem tất cả thiết kế.</p><Link className="button dark" to={basePath}>Xem tất cả sản phẩm</Link></div>
      )}
      {searchRoute && !loading && !apiUnavailable && products.length === 0 && <SearchRecovery query={filterValues.q} formatMoney={formatMoney} />}
      {!searchRoute && !loading && !fetching && !apiUnavailable && products.length === 0 && <Suspense fallback={<p className="mt-10 text-sm text-muted-foreground" role="status">Đang tải gợi ý sản phẩm…</p>}><ProductSuggestions title="Sản phẩm bán chạy có thể bạn quan tâm" /></Suspense>}
      {pagination}
      </>}
    </div>
  )
}
