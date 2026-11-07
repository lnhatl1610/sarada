import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { formatVnd } from '../../lib/money'
import { fetchCatalogProducts, type CatalogProduct } from '../catalog/catalog-api'
import { CatalogQuickView } from '../catalog/CatalogQuickView'
import '../../Catalog.css'

type HomeProductTab = { key: string; label: string; targetGender?: 'men' | 'women' | 'unisex' | 'kids'; category?: string }
type HomeProductRailProps = {
  eyebrow: string
  title: string
  sort: 'newest' | 'bestseller'
  filter: 'new' | 'best_seller'
  tabs?: HomeProductTab[]
  isWishlisted: (productId: number) => boolean
  onToggleWishlist: (product: CatalogProduct) => void
  onAddToCart: (product: CatalogProduct, variantId: number) => Promise<boolean>
  cartSyncLoading: boolean
  cartAddBusy: boolean
  cartAddError: string
}

function HomeProductActions({ product, wishlisted, onToggleWishlist, onAddToCart, cartSyncLoading, cartAddBusy, cartAddError }: {
  product: CatalogProduct
  wishlisted: boolean
  onToggleWishlist: (product: CatalogProduct) => void
  onAddToCart: (product: CatalogProduct, variantId: number) => Promise<boolean>
  cartSyncLoading: boolean
  cartAddBusy: boolean
  cartAddError: string
}) {
  const [variantId, setVariantId] = useState<number | null>(null)
  const variants = product.variants ?? []
  const availableVariants = variants.filter((variant) => variant.available_quantity > 0)

  return <>
    <button className="home-product-wishlist" type="button" aria-label={wishlisted ? `Bỏ yêu thích ${product.name}` : `Thêm ${product.name} vào yêu thích`} aria-pressed={wishlisted} onClick={() => onToggleWishlist(product)}>
      <Heart aria-hidden="true" size={18} fill={wishlisted ? 'currentColor' : 'none'} />
    </button>
    {variants.length > 0 && <details className="home-product-quick-add">
      <summary>Thêm nhanh</summary>
      <label htmlFor={`home-quick-add-${product.id}`}>Màu sắc / kích cỡ</label>
      <select id={`home-quick-add-${product.id}`} value={variantId ?? ''} onChange={(event) => setVariantId(Number(event.target.value) || null)} disabled={cartAddBusy || cartSyncLoading || availableVariants.length === 0}>
        <option value="">Chọn phân loại</option>
        {variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.available_quantity < 1}>{[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku}{variant.available_quantity < 1 ? ' · Hết hàng' : ''}</option>)}
      </select>
      <button className="button dark full" type="button" disabled={cartAddBusy || cartSyncLoading || variantId === null || !availableVariants.some((variant) => variant.id === variantId)} onClick={() => variantId !== null && void onAddToCart(product, variantId)}>
        {cartAddBusy ? 'Đang thêm…' : cartSyncLoading ? 'Đang đồng bộ giỏ…' : 'Thêm vào túi'}
      </button>
      {cartAddError && <p className="home-product-quick-add-error" role="alert">{cartAddError}</p>}
    </details>}
  </>
}

export function HomeProductRail({ eyebrow, title, sort, filter, tabs, isWishlisted, onToggleWishlist, onAddToCart, cartSyncLoading, cartAddBusy, cartAddError }: HomeProductRailProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const activeTab = tabs?.[activeTabIndex]
  const params = new URLSearchParams({ sort, [filter]: '1', per_page: '8' })
  if (activeTab?.targetGender) params.set('target_gender', activeTab.targetGender)
  if (activeTab?.category) params.set('category', activeTab.category)
  const allProductsParams = new URLSearchParams(params)
  allProductsParams.delete('per_page')
  const allProductsHref = `/products?${allProductsParams.toString()}`
  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current
    if (!rail) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: reducedMotion ? 'auto' : 'smooth' })
  }
  const heading = <>
    <div className="section-title"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><Link to={allProductsHref}>{'Xem tất cả ↗'}</Link></div>
    {tabs && <div className="home-product-tabs" role="group" aria-label="Lọc sản phẩm bán chạy">
      {tabs.map((tab, index) => <button type="button" key={tab.key} className={index === activeTabIndex ? 'is-active' : ''} aria-pressed={index === activeTabIndex} onClick={() => setActiveTabIndex(index)}>{tab.label}</button>)}
    </div>}
  </>
  const query = useQuery({
    queryKey: ['products', 'home-rail', params.toString()],
    queryFn: ({ signal }) => fetchCatalogProducts(`?${params.toString()}`, signal),
  })

  useEffect(() => {
    const rail = railRef.current
    if (!rail || !window.matchMedia('(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)').matches) return

    const onPointerMove = (event: PointerEvent) => {
      const card = (event.target as Element).closest<HTMLElement>('.home-product-card')
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      card.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(0)`
      card.style.setProperty('--gx', `${(x + 0.5) * 100}%`)
      card.style.setProperty('--gy', `${(y + 0.5) * 100}%`)
    }
    const onPointerLeave = (event: PointerEvent) => {
      const card = (event.target as Element).closest<HTMLElement>('.home-product-card')
      if (card) card.style.transform = ''
    }

    rail.addEventListener('pointermove', onPointerMove)
    rail.addEventListener('pointerleave', onPointerLeave, true)
    return () => {
      rail.removeEventListener('pointermove', onPointerMove)
      rail.removeEventListener('pointerleave', onPointerLeave, true)
      rail.querySelectorAll<HTMLElement>('.home-product-card').forEach((card) => { card.style.transform = '' })
    }
  }, [query.data])

  if (query.isLoading) {
    return <section className="container home-product-rail" aria-label={title} aria-busy="true">
      {heading}
      <div className="home-product-grid home-product-carousel" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <div className="home-product-skeleton" key={index} />)}</div>
      <p className="sr-only" role="status">{'Đang tải sản phẩm…'}</p>
    </section>
  }

  if (query.isError) {
    return <section className="container home-product-rail" aria-label={title}>
      {heading}
      <div className="home-product-error" role="alert"><p>{'Chưa tải được mục '}{title.toLocaleLowerCase('vi-VN')}.</p><button className="button dark" type="button" onClick={() => void query.refetch()}>{'Thử lại'}</button></div>
    </section>
  }

  if (!query.data?.length) {
    if (!tabs) return null
    return <section className="container home-product-rail" aria-label={title}>
      {heading}
      <p role="status">{'Chưa có sản phẩm bán chạy trong danh mục này.'}</p>
    </section>
  }

  return <section className="container home-product-rail" aria-label={title}>
    {heading}
    {query.data.length > 1 && <div className="home-product-rail-controls" role="group" aria-label={`Điều khiển mục ${title}`}>
      <button className="home-product-rail-arrow" type="button" aria-label={`Sản phẩm ${title} trước`} onClick={() => scrollRail(-1)}><ChevronLeft aria-hidden="true" /></button>
      <button className="home-product-rail-arrow" type="button" aria-label={`Sản phẩm ${title} tiếp theo`} onClick={() => scrollRail(1)}><ChevronRight aria-hidden="true" /></button>
    </div>}
    <div className="home-product-grid home-product-carousel" ref={railRef} tabIndex={0} aria-label={`Dải ${title.toLocaleLowerCase('vi-VN')}`}>
      {query.data.map((product, index) => {
        const image = product.images?.[0]
        return <motion.article
          className="home-product-card card-tilt"
          key={product.id}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, delay: prefersReducedMotion ? 0 : index * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="home-product-media">
            <Link className="home-product-image" to={`/products/${product.slug}`} aria-label={`Xem ${product.name}${getMediaDisclosureLabel(image?.alt) ? `, ${getMediaDisclosureLabel(image?.alt)}` : ''}`}>
              <motion.div layoutId={!prefersReducedMotion && image?.url ? `product-image-${product.id}-${encodeURIComponent(image.url)}` : undefined} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="storefront-shared-product-media">
                <ResponsiveImage src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, product.name)} width={800} height={1000} sizes="(max-width: 620px) 50vw, 25vw" />
              </motion.div>
              {getMediaDisclosureLabel(image?.alt) && <DemoConceptBadge label={getMediaDisclosureLabel(image?.alt) ?? undefined} />}
            </Link>
            <HomeProductActions product={product} wishlisted={isWishlisted(product.id)} onToggleWishlist={onToggleWishlist} onAddToCart={onAddToCart} cartSyncLoading={cartSyncLoading} cartAddBusy={cartAddBusy} cartAddError={cartAddError} />
          </div>
          <div className="card-info"><div><Link to={`/products/${product.slug}`}>{product.name}</Link>{product.short_description && <p>{product.short_description}</p>}</div><b>{formatVnd(product.price)}</b></div>
          <CatalogQuickView product={product} busy={cartAddBusy} cartSyncLoading={cartSyncLoading} error={cartAddError} onAdd={onAddToCart} />
        </motion.article>
      })}
    </div>
  </section>
}
