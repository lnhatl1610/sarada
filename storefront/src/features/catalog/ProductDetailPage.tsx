import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type TouchEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { Minus, Plus } from 'lucide-react'
import '../../ProductDetail.css'
import type { components } from '../../types/api'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { sanitizePageContent } from '../../lib/sanitize-page-content'
import { StorefrontContentPageError, useStorefrontContentPage } from '../content/content-api'
import { findProductVariant, getProductColorOptions, getVariantsForColor } from './variant-selection'
import { subscribeToProductStockAlert, type CatalogReviewFilters, type CatalogReviewSort } from './catalog-api'
import { getAccountProfile } from '../account/account-settings-api'
import { trackStorefrontEvent } from '../privacy/cookie-consent'
import { useAddressLocations } from '../checkout/useAddressLocations'

export type ProductDetailProduct = components['schemas']['Product']
type Review = components['schemas']['StorefrontReview']
type ProductTab = 'description' | 'materials' | 'specifications' | 'shipping' | 'reviews' | 'questions'

function ZaloShareWidget({ href, oaId }: { href: string; oaId: string }) {
  useEffect(() => {
    const sdkWindow = window as Window & { ZaloSocialSDK?: { reload: () => void } }
    let script = document.getElementById('zalo-social-plugin-sdk') as HTMLScriptElement | null
    const reload = () => window.setTimeout(() => sdkWindow.ZaloSocialSDK?.reload(), 50)
    const handleLoad = () => {
      if (script) script.dataset.loaded = 'true'
      reload()
    }

    if (!script) {
      script = document.createElement('script')
      script.id = 'zalo-social-plugin-sdk'
      script.src = 'https://sp.zalo.me/plugins/sdk.js'
      script.async = true
      script.addEventListener('load', handleLoad, { once: true })
      document.body.append(script)
    } else if (script.dataset.loaded === 'true' || sdkWindow.ZaloSocialSDK) {
      reload()
    } else {
      script.addEventListener('load', handleLoad, { once: true })
    }

    return () => script?.removeEventListener('load', handleLoad)
  }, [href, oaId])

  return <div className="zalo-share-button" data-href={href} data-oaid={oaId} data-layout="1" data-color="blue" data-customize="false" />
}

const productTabs: { id: ProductTab; label: string }[] = [
  { id: 'description', label: 'Chi tiết' },
  { id: 'materials', label: 'Chất liệu & bảo quản' },
  { id: 'specifications', label: 'Thông số' },
  { id: 'shipping', label: 'Giao hàng & đổi trả' },
  { id: 'reviews', label: 'Đánh giá' },
  { id: 'questions', label: 'Hỏi đáp' },
]

type ProductDetailPageProps = {
  accessToken: string
  product: ProductDetailProduct | null
  codEnabled: boolean
  bankTransferEnabled: boolean
  loading: boolean
  error: boolean
  relatedProducts: ProductDetailProduct[]
  relatedLoading: boolean
  relatedError: boolean
  reviews: Review[]
  reviewMeta: components['schemas']['StorefrontReviewPage']['meta'] | undefined
  reviewFilterOptions: components['schemas']['StorefrontReviewPage']['filters'] | undefined
  reviewSort: CatalogReviewSort
  reviewFilters: CatalogReviewFilters
  onChangeReviewPage: (page: number) => void
  onChangeReviewSort: (sort: CatalogReviewSort) => void
  onChangeReviewFilters: (filters: CatalogReviewFilters) => void
  reviewsLoading: boolean
  reviewsError: boolean
  wishlisted: boolean
  compareSelected: boolean
  compareLimitReached: boolean
  priceAlertEnabled: boolean
  priceAlertLoading: boolean
  priceAlertError: string
  priceAlertBusy: boolean
  onRetryPriceAlerts: () => void
  onTogglePriceAlert: () => void
  onNotifyWhenRestocked: (variantId: number) => void
  restockBusyVariantId: number | null
  cartAddBusy: boolean
  cartAddError: string
  cartSyncLoading: boolean
  cartReady: boolean
  accountId?: number | null
  socialZaloOaId?: string | null
  smsStockAlertsEnabled?: boolean
  formatMoney: (amount: number) => string
  onRetryProduct: () => void
  onRetryRelated: () => void
  onRetryReviews: () => void
  onToggleWishlist: () => void
  onToggleCompare: () => boolean
  onAddToCart: (product: ProductDetailProduct, variantId: number | null, quantity: number) => Promise<boolean>
  onBuyNow: (product: ProductDetailProduct, variantId: number | null, quantity: number) => void
}

const ReviewList = lazy(() => import('./ProductReviewList').then((module) => ({ default: module.ProductReviewList })))
const ProductQuestionList = lazy(() => import('./ProductQuestionList').then((module) => ({ default: module.ProductQuestionList })))
const RelatedProducts = lazy(() => import('./RelatedProducts').then((module) => ({ default: module.RelatedProducts })))
const OutfitBuilder = lazy(() => import('./OutfitBuilder').then((module) => ({ default: module.OutfitBuilder })))
const RecentlyViewedProducts = lazy(() => import('./RecentlyViewedProducts').then((module) => ({ default: module.RecentlyViewedProducts })))

export function ProductDetailPage({
  accessToken,
  product,
  codEnabled,
  bankTransferEnabled,
  loading,
  error,
  relatedProducts,
  relatedLoading,
  relatedError,
  reviews,
  reviewMeta,
  reviewFilterOptions,
  reviewSort,
  reviewFilters,
  onChangeReviewPage,
  onChangeReviewSort,
  onChangeReviewFilters,
  reviewsLoading,
  reviewsError,
  wishlisted,
  compareSelected,
  compareLimitReached,
  priceAlertEnabled,
  priceAlertLoading,
  priceAlertError,
  priceAlertBusy,
  onRetryPriceAlerts,
  onTogglePriceAlert,
  onNotifyWhenRestocked,
  restockBusyVariantId,
  cartAddBusy,
  cartAddError,
  cartSyncLoading,
  cartReady,
  accountId,
  socialZaloOaId,
  smsStockAlertsEnabled = false,
  formatMoney,
  onRetryProduct,
  onRetryRelated,
  onRetryReviews,
  onToggleWishlist,
  onToggleCompare,
  onAddToCart,
  onBuyNow,
}: ProductDetailPageProps) {
  const prefersReducedMotion = useReducedMotion()
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [selected360Frame, setSelected360Frame] = useState(0)
  const [is360Open, setIs360Open] = useState(false)
  const [is360Dragging, setIs360Dragging] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [restockVariantId, setRestockVariantId] = useState<number | null>(null)
  const [restockEmail, setRestockEmail] = useState('')
  const [restockPhone, setRestockPhone] = useState('')
  const [restockChannel, setRestockChannel] = useState<'email' | 'phone'>('email')
  const [activeProductTab, setActiveProductTab] = useState<ProductTab>('description')
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [sizeHeight, setSizeHeight] = useState<string | null>(null)
  const [sizeWeight, setSizeWeight] = useState<string | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [shippingEstimateOpen, setShippingEstimateOpen] = useState(false)
  const [shippingProvinceCode, setShippingProvinceCode] = useState('')
  const [shippingWardCode, setShippingWardCode] = useState('')
  const [stickyAddBarVisible, setStickyAddBarVisible] = useState(false)
  const [productDetailHasFocus, setProductDetailHasFocus] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [zaloShareOpen, setZaloShareOpen] = useState(false)
  const restockMutation = useMutation({ mutationFn: ({ slug, variantId, contact }: { slug: string; variantId: number; contact: { email?: string; phone?: string } }) => subscribeToProductStockAlert(slug, variantId, contact) })
  const sizeGuideDialogRef = useRef<HTMLDialogElement>(null)
  const galleryDialogRef = useRef<HTMLDialogElement>(null)
  const galleryTouchStartX = useRef<number | null>(null)
  const frameDrag = useRef<{ pointerId: number; lastX: number; remainder: number } | null>(null)
  const productId = product?.id
  const viewTrackedProductId = useRef<number | null>(null)
  const sizeGuideQuery = useStorefrontContentPage('size-guide', Boolean(product) && sizeGuideOpen)
  const bodyMeasurements = useQuery({ queryKey: ['account', 'size-profile', accountId], queryFn: () => getAccountProfile(accessToken), enabled: Boolean(accessToken && accountId), staleTime: 60_000 })
  const sizeHeightValue = sizeHeight ?? bodyMeasurements.data?.height_cm?.toString() ?? ''
  const sizeWeightValue = sizeWeight ?? bodyMeasurements.data?.weight_kg?.toString() ?? ''
  const shippingPolicyQuery = useStorefrontContentPage('shipping', Boolean(product) && activeProductTab === 'shipping')
  const shippingEstimate = useAddressLocations({
    enabled: shippingEstimateOpen,
    provinceCode: shippingProvinceCode,
    wardCode: shippingWardCode,
    shippingFeeEnabled: true,
  })

  useEffect(() => {
    if (!product || viewTrackedProductId.current === product.id) return
    viewTrackedProductId.current = product.id
    trackStorefrontEvent('view_item', {
      currency: 'VND',
      value: product.price,
      items: [{ item_id: String(product.id), item_name: product.name, price: product.price, quantity: 1 }],
    })
  }, [product])

  useEffect(() => {
    const dialog = sizeGuideDialogRef.current
    if (!dialog) return
    if (sizeGuideOpen && !dialog.open) dialog.showModal()
    else if (!sizeGuideOpen && dialog.open) dialog.close()
  }, [sizeGuideOpen])

  useEffect(() => {
    const dialog = galleryDialogRef.current
    if (!dialog) return
    if (galleryOpen && !dialog.open) dialog.showModal()
    else if (!galleryOpen && dialog.open) dialog.close()
  }, [galleryOpen])

  useEffect(() => {
    if (productId === undefined || typeof IntersectionObserver === 'undefined') return
    const button = document.querySelector<HTMLElement>('[data-product-add-button]')
    if (!button) return
    const media = window.matchMedia('(max-width: 620px)')
    const footer = document.querySelector<HTMLElement>('footer')
    let mainButtonWasVisible = false
    let mainButtonIsVisible = false
    let footerIsVisible = false
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === button) {
          mainButtonIsVisible = entry.isIntersecting
          if (entry.isIntersecting) mainButtonWasVisible = true
        }
        if (entry.target === footer) footerIsVisible = entry.isIntersecting
      }
      setStickyAddBarVisible(media.matches && mainButtonWasVisible && !mainButtonIsVisible && !footerIsVisible)
    }, { threshold: 0.1 })
    const observeViewport = () => {
      if (media.matches) {
        observer.observe(button)
        if (footer) observer.observe(footer)
      } else {
        observer.unobserve(button)
        if (footer) observer.unobserve(footer)
        mainButtonWasVisible = false
        mainButtonIsVisible = false
        footerIsVisible = false
        setStickyAddBarVisible(false)
      }
    }
    observeViewport()
    media.addEventListener('change', observeViewport)
    return () => { observer.disconnect(); media.removeEventListener('change', observeViewport) }
  }, [productId])

  if (!product) {
    if (loading) return <div className="container detail"><p className="state" role="status">Đang tải sản phẩm…</p></div>
    if (error) return <div className="container detail"><div className="empty" role="alert"><img className="storefront-state-illustration" src="/illustrations/connection-error.svg" alt="" aria-hidden="true" /><h1>Chưa tải được sản phẩm</h1><p>Kiểm tra kết nối rồi thử lại.</p><button className="button dark" type="button" onClick={onRetryProduct}>Thử lại</button></div></div>
    return <div className="container detail"><div className="empty" role="alert"><img className="storefront-state-illustration" src="/illustrations/not-found.svg" alt="" aria-hidden="true" /><h1>Không tìm thấy sản phẩm</h1><p>Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không còn tồn tại.</p><Link className="button dark" to="/products">Xem sản phẩm</Link></div></div>
  }

  const productVariants = product.variants ?? []
  const selectedVariant = findProductVariant(productVariants, selectedVariantId)
  const displayedPrice = selectedVariant?.price ?? product.price
  const displayedCompareAtPrice = selectedVariant?.compare_at_price ?? product.compare_at_price
  const displayedSku = selectedVariant?.sku ?? product.variants?.[0]?.sku
  const productColors = getProductColorOptions(productVariants)
  const colorFilteredVariants = getVariantsForColor(productVariants, selectedColor)
  const quantityLimit = selectedVariant ? selectedVariant.available_quantity : 20
  const selectedColorValueId = productVariants.find((variant) => variant.color === selectedColor)?.color_value_id ?? null
  const regularImages = product.images?.filter((image) => !image.is_360_frame) ?? []
  const hasColorSpecificImages = regularImages.some((image) => image.color_value_id != null)
  const detailImages = regularImages.filter((image) => !selectedColor || !hasColorSpecificImages || image.color_value_id == null || image.color_value_id === selectedColorValueId)
  const all360Frames = product.images?.filter((image) => image.is_360_frame) ?? []
  const hasColorSpecific360Frames = all360Frames.some((image) => image.color_value_id != null)
  const detail360Frames = all360Frames.filter((image) => !selectedColor || !hasColorSpecific360Frames || image.color_value_id == null || image.color_value_id === selectedColorValueId)
  const canView360 = detail360Frames.length >= 24
  const hasColorSpecificVideos = product.videos?.some((video) => video.color_value_id != null) ?? false
  const detailVideos = product.videos?.filter((video) => !selectedColor || !hasColorSpecificVideos || video.color_value_id == null || video.color_value_id === selectedColorValueId) ?? []
  const detailImageLabel = getMediaDisclosureLabel(detailImages[selectedImage]?.alt)
  const currentGalleryImage = detailImages[selectedImage] ?? detailImages[0]
  const currentGalleryImageLayoutId = currentGalleryImage?.url ? `product-image-${product.id}-${encodeURIComponent(currentGalleryImage.url)}` : undefined
  const addSelectedProduct = () => onAddToCart(product, selectedVariantId, quantity)
  const copyProductLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable')
      await navigator.clipboard.writeText(window.location.href)
      setShareMessage('Đã sao chép liên kết sản phẩm.')
    } catch {
      setShareMessage('Không thể sao chép tự động. Hãy sao chép địa chỉ trên thanh trình duyệt.')
    }
  }
  const shareProduct = async () => {
    if (!navigator.share) {
      await copyProductLink()
      return
    }
    try {
      await navigator.share({ title: product.name, text: product.short_description ?? undefined, url: window.location.href })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareMessage('Không thể mở bảng chia sẻ. Hãy sao chép liên kết sản phẩm.')
    }
  }
  const onGalleryTouchStart = (event: TouchEvent<HTMLElement>) => {
    galleryTouchStartX.current = event.touches.length === 1 ? event.touches[0]?.clientX ?? null : null
  }
  const onGalleryTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const startX = galleryTouchStartX.current
    galleryTouchStartX.current = null
    const endX = event.changedTouches[0]?.clientX
    if (startX === null || endX === undefined || detailImages.length < 2) return
    const delta = endX - startX
    if (Math.abs(delta) < 44) return
    setSelectedImage((index) => (index + (delta < 0 ? 1 : -1) + detailImages.length) % detailImages.length)
  }
  const onGalleryLightboxKeyDown = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
    if (detailImages.length < 2) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setSelectedImage((index) => (index - 1 + detailImages.length) % detailImages.length)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setSelectedImage((index) => (index + 1) % detailImages.length)
    }
  }
  const on360PointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || frameDrag.current) return
    frameDrag.current = { pointerId: event.pointerId, lastX: event.clientX, remainder: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIs360Dragging(true)
  }
  const on360PointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = frameDrag.current
    if (!drag || drag.pointerId !== event.pointerId || detail360Frames.length < 2) return
    drag.remainder += event.clientX - drag.lastX
    drag.lastX = event.clientX
    const pixelsPerFrame = Math.max(5, event.currentTarget.clientWidth / detail360Frames.length)
    const framesMoved = Math.trunc(drag.remainder / pixelsPerFrame)
    if (!framesMoved) return
    drag.remainder -= framesMoved * pixelsPerFrame
    setSelected360Frame((current) => ((current - framesMoved) % detail360Frames.length + detail360Frames.length) % detail360Frames.length)
  }
  const on360PointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (frameDrag.current?.pointerId !== event.pointerId) return
    frameDrag.current = null
    setIs360Dragging(false)
  }

  return (
    <>
      <div
        className="container detail"
        onFocusCapture={() => setProductDetailHasFocus(true)}
        onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setProductDetailHasFocus(false) }}
      >
        <p className="crumb"><Link to="/">Trang chủ</Link> / <Link to="/products">Sản phẩm</Link> / {product.name}</p>
        <div className="detail-grid">
          <div className="product-gallery">
            {detailImages.length ? (
              <>
                <div className="gallery-main" onTouchStart={onGalleryTouchStart} onTouchEnd={onGalleryTouchEnd}>
                  <motion.div layoutId={!prefersReducedMotion ? currentGalleryImageLayoutId : undefined} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="storefront-shared-product-media">
                    <ResponsiveImage src={currentGalleryImage?.url} srcSet={currentGalleryImage?.srcset ?? undefined} alt={getProductImageAlt(currentGalleryImage?.url, currentGalleryImage?.alt, product.name)} width={800} height={1000} loading="eager" fetchPriority="high" sizes="(max-width: 860px) 100vw, 55vw" />
                  </motion.div>
                  <button className="gallery-open-button" type="button" onClick={() => setGalleryOpen(true)}>Phóng to ảnh</button>
                  {detailImageLabel && <DemoConceptBadge label={detailImageLabel} />}
                  {detailImages.length > 1 && <div className="gallery-navigation"><button type="button" aria-label="Ảnh trước" onClick={() => setSelectedImage((index) => (index - 1 + detailImages.length) % detailImages.length)}>‹</button><span>{selectedImage + 1} / {detailImages.length}</span><button type="button" aria-label="Ảnh tiếp theo" onClick={() => setSelectedImage((index) => (index + 1) % detailImages.length)}>›</button></div>}
                </div>
                <div className="gallery-thumbnails" role="group" aria-label="Ảnh sản phẩm">
                  {detailImages.map((image, index) => <button type="button" key={image.url} aria-label={`Xem ảnh ${index + 1}`} aria-pressed={selectedImage === index} onClick={() => setSelectedImage(index)}><ResponsiveImage src={image.url} alt="" width={120} height={160} /></button>)}
                </div>
                <dialog ref={galleryDialogRef} className="gallery-lightbox" aria-labelledby="gallery-lightbox-title" onCancel={(event) => { event.preventDefault(); setGalleryOpen(false) }} onClose={() => setGalleryOpen(false)} onClick={(event) => { if (event.target === galleryDialogRef.current) setGalleryOpen(false) }} onKeyDown={onGalleryLightboxKeyDown}>
                  <header className="gallery-lightbox-header"><h2 id="gallery-lightbox-title">{product.name} · Ảnh {selectedImage + 1} / {detailImages.length}</h2><button type="button" aria-label="Đóng ảnh toàn màn hình" onClick={() => setGalleryOpen(false)}>×</button></header>
                  <div className="gallery-lightbox-media" onTouchStart={onGalleryTouchStart} onTouchEnd={onGalleryTouchEnd}>
                    <ResponsiveImage src={detailImages[selectedImage]?.url ?? detailImages[0].url} srcSet={detailImages[selectedImage]?.srcset ?? detailImages[0].srcset ?? undefined} alt={getProductImageAlt(detailImages[selectedImage]?.url ?? detailImages[0].url, detailImages[selectedImage]?.alt, product.name)} width={1200} height={1600} loading="eager" sizes="100vw" />
                    {detailImageLabel && <DemoConceptBadge label={detailImageLabel} />}
                  </div>
                  {detailImages.length > 1 && <nav className="gallery-lightbox-navigation" aria-label="Điều hướng ảnh sản phẩm"><button type="button" onClick={() => setSelectedImage((index) => (index - 1 + detailImages.length) % detailImages.length)}>Ảnh trước</button><button type="button" onClick={() => setSelectedImage((index) => (index + 1) % detailImages.length)}>Ảnh tiếp theo</button></nav>}
                </dialog>
              </>
            ) : (
              <div className="gallery-placeholder" role="img" aria-label={`Ảnh ${product.name} chưa được cập nhật cho màu ${selectedColor}`}><span>{selectedColor ? `ẢNH MÀU ${selectedColor.toLocaleUpperCase('vi-VN')} ĐANG ĐƯỢC CẬP NHẬT` : 'ẢNH SẢN PHẨM ĐANG ĐƯỢC CẬP NHẬT'}</span></div>
            )}
            {detailVideos.map((video) => <figure className="product-detail-video" key={video.id}><video controls preload="metadata" src={video.url} aria-label={video.caption || `Video ${product.name}`} /><figcaption>{video.caption || `Video sản phẩm ${product.name}`}</figcaption></figure>)}
            {canView360 && <section className="product-360-viewer" aria-label={`Xem ${product.name} ở góc 360 độ`}>
              {!is360Open ? <button type="button" className="secondary" onClick={() => { setSelected360Frame(0); setIs360Open(true) }}>Xem 360°</button> : <>
                <h3>{product.name} · Xem 360°</h3>
                <div className={`product-360-stage${is360Dragging ? ' is-dragging' : ''}`} onPointerDown={on360PointerDown} onPointerMove={on360PointerMove} onPointerUp={on360PointerEnd} onPointerCancel={on360PointerEnd} onLostPointerCapture={on360PointerEnd} aria-label="Kéo ngang ảnh để xoay sản phẩm">
                  <ResponsiveImage src={detail360Frames[selected360Frame]?.url ?? detail360Frames[0].url} alt={`${product.name}, góc ${selected360Frame + 1} trên ${detail360Frames.length}`} width={800} height={1000} loading="lazy" sizes="(max-width: 860px) 100vw, 55vw" draggable={false} />
                </div>
                <p className="product-360-hint">Kéo ngang trên ảnh hoặc dùng thanh trượt để xoay.</p>
                <label>{`Góc nhìn ${selected360Frame + 1} / ${detail360Frames.length}`}<input type="range" min={0} max={detail360Frames.length - 1} step={1} value={selected360Frame} onChange={(event) => setSelected360Frame(Number(event.currentTarget.value))} aria-label="Xoay sản phẩm 360 độ" /></label>
                <div className="product-360-controls"><button className="secondary" type="button" onClick={() => setSelected360Frame((current) => (current - 1 + detail360Frames.length) % detail360Frames.length)}>Góc trước</button><button className="secondary" type="button" onClick={() => setSelected360Frame((current) => (current + 1) % detail360Frames.length)}>Góc tiếp</button><button className="secondary" type="button" onClick={() => setIs360Open(false)}>Đóng</button></div>
              </>}
            </section>}
          </div>
          <section className="product-info">
            {product.category?.name && <p className="eyebrow">{product.category.name}</p>}
            <h1>{product.name}</h1>
            <div className="product-brand-sku">{product.brand?.slug && product.brand.name && <Link to={`/brands/${encodeURIComponent(product.brand.slug)}`}>{product.brand.name}</Link>}{displayedSku && <span>Mã SKU: {displayedSku}</span>}</div>
            <button className="wishlist-toggle-detail" type="button" aria-pressed={wishlisted} onClick={onToggleWishlist}>{wishlisted ? '♥ Đã yêu thích' : '♡ Thêm vào yêu thích'}</button>
            <button className="wishlist-toggle-detail" type="button" aria-pressed={compareSelected} onClick={onToggleCompare}>{compareSelected ? 'Bỏ khỏi so sánh' : '＋ So sánh sản phẩm'}</button>
            {compareSelected && <Link className="product-compare-detail-link" to="/compare">Xem danh sách so sánh</Link>}
            {compareLimitReached && <p className="stock-status" role="status">Bạn có thể so sánh tối đa bốn sản phẩm. Hãy bỏ bớt một sản phẩm trước.</p>}
            <button className="wishlist-toggle-detail" type="button" aria-pressed={priceAlertEnabled} disabled={priceAlertLoading || priceAlertBusy || Boolean(priceAlertError)} onClick={onTogglePriceAlert}>{priceAlertBusy ? 'Đang cập nhật…' : priceAlertEnabled ? 'Tắt báo giảm giá' : accountId ? 'Báo khi giảm giá' : 'Đăng nhập để nhận báo giảm giá'}</button>
            {priceAlertError && <p className="auth-error" role="alert">Chưa tải được trạng thái báo giảm giá. <button className="link-button" type="button" onClick={onRetryPriceAlerts}>Thử lại</button></p>}
            {product.rating && product.rating.count > 0 && <button className="product-rating product-rating-link" type="button" aria-label={`Đánh giá trung bình ${product.rating.average} trên 5, ${product.rating.count} lượt. Xem đánh giá`} onClick={() => { setActiveProductTab('reviews'); document.getElementById('product-tab-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>★ {product.rating.average.toFixed(1)} · {product.rating.count} đánh giá</button>}
            <p className="price">{formatMoney(displayedPrice)} {displayedCompareAtPrice && displayedCompareAtPrice > displayedPrice && <><del>{formatMoney(displayedCompareAtPrice)}</del><span className="product-savings">Tiết kiệm {formatMoney(displayedCompareAtPrice - displayedPrice)}</span></>}</p>
            {(product.short_description || product.description) ? <p className="description">{product.short_description || product.description}</p> : <p className="description">Mô tả sản phẩm chưa được cửa hàng cập nhật.</p>}
            {productColors.length > 0 && <fieldset className="color-options"><legend>Màu sắc{selectedColor && <span> · {selectedColor}</span>}</legend><div>{productColors.map((color) => <button type="button" key={color.name} className="color-swatch" aria-label={`Chọn màu ${color.name}`} aria-pressed={selectedColor === color.name} onClick={() => { setSelectedColor(color.name); setSelectedVariantId(null); setSelectedImage(0); setSelected360Frame(0); setIs360Open(false); frameDrag.current = null; setIs360Dragging(false); setQuantity(1) }}><span style={color.hex ? { backgroundColor: color.hex } : undefined} aria-hidden="true" />{color.name}</button>)}</div></fieldset>}
            {productColors.length > 0 && !selectedColor && <p className="stock-status" role="status">Chọn màu để xem các kích cỡ còn hàng.</p>}
            {product.variants?.length ? <fieldset className="size-options" disabled={productColors.length > 0 && !selectedColor}><legend>Kích cỡ</legend><div>{colorFilteredVariants.map((variant) => {
              const soldOut = variant.available_quantity < 1
              const label = variant.size ?? `SKU ${variant.id}`
              return <button key={variant.id} type="button" className={`size-option${soldOut ? ' is-sold-out' : ''}`} aria-label={soldOut ? `${label}, hết hàng. Báo khi có hàng` : label} aria-pressed={soldOut ? undefined : selectedVariantId === variant.id} aria-expanded={soldOut && !accountId ? restockVariantId === variant.id : undefined} aria-controls={soldOut && !accountId ? 'restock-alert-form' : undefined} onClick={() => { if (soldOut) { if (accountId) { onNotifyWhenRestocked(variant.id); return }; restockMutation.reset(); setRestockVariantId(variant.id); return }; setRestockVariantId(null); setSelectedVariantId(variant.id); setQuantity(1) }}><span>{label}</span>{soldOut && <small>{restockBusyVariantId === variant.id ? 'Đang đăng ký…' : restockVariantId === variant.id ? 'Đang chọn báo hàng' : 'Hết hàng · Báo khi có hàng'}</small>}</button>
            })}</div>{productColors.length > 0 && !selectedColor && <small>Chọn màu trước để xem kích cỡ có sẵn.</small>}</fieldset> : <p className="stock-status">Liên hệ cửa hàng để kiểm tra phiên bản sản phẩm.</p>}
            {restockVariantId !== null && <form id="restock-alert-form" className="restock-alert-form" onSubmit={(event) => { event.preventDefault(); if (!product || restockVariantId === null) return; const contact = restockChannel === 'email' ? { email: restockEmail.trim() } : { phone: restockPhone.trim() }; restockMutation.mutate({ slug: product.slug, variantId: restockVariantId, contact }) }}>
              {smsStockAlertsEnabled && <fieldset className="restock-alert-channel"><legend>Nhận thông báo qua</legend><label><input type="radio" name="restock-alert-channel" value="email" checked={restockChannel === 'email'} onChange={() => setRestockChannel('email')} />Email</label><label><input type="radio" name="restock-alert-channel" value="phone" checked={restockChannel === 'phone'} onChange={() => setRestockChannel('phone')} />SMS</label></fieldset>}
              {restockChannel === 'email' ? <><label htmlFor="restock-alert-email">Email nhận báo khi có hàng</label><input id="restock-alert-email" type="email" autoComplete="email" required maxLength={254} value={restockEmail} onChange={(event) => setRestockEmail(event.target.value)} /></> : <><label htmlFor="restock-alert-phone">Số điện thoại nhận SMS khi có hàng</label><input id="restock-alert-phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={16} pattern="(0|\+84)[0-9]{9}" aria-describedby="restock-alert-phone-hint" value={restockPhone} onChange={(event) => setRestockPhone(event.target.value)} /><small id="restock-alert-phone-hint">Nhập số Việt Nam dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.</small></>}
              <button type="submit" className="button light" disabled={restockMutation.isPending}>{restockMutation.isPending ? 'Đang đăng ký…' : 'Báo khi có hàng'}</button>
              {restockMutation.isSuccess && <p role="status">Đã đăng ký. Cửa hàng sẽ gửi {restockChannel === 'email' ? 'email' : 'tin nhắn SMS'} khi sản phẩm có hàng trở lại.</p>}
              {restockMutation.isError && <p role="alert" className="auth-error">Chưa đăng ký được. Hãy kiểm tra thông tin và thử lại.</p>}
            </form>}
            {selectedVariant && <p className="stock-status" role="status">{selectedVariant.available_quantity < 1 ? 'Tạm hết hàng' : selectedVariant.is_low_stock ? `Còn ${selectedVariant.available_quantity} sản phẩm` : 'Còn hàng'}</p>}
            <div className="product-quantity"><label htmlFor="product-quantity">Số lượng</label><div className="quantity-control" role="group" aria-label="Chọn số lượng"><button type="button" aria-label="Giảm số lượng" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus aria-hidden="true" size={16} /></button><input id="product-quantity" type="number" min="1" max={quantityLimit || 1} step="1" value={quantity} disabled={Boolean(selectedVariant && selectedVariant.available_quantity < 1)} onChange={(event) => { const next = Number(event.target.value); if (Number.isInteger(next) && next > 0) setQuantity(Math.min(quantityLimit || 1, next)) }} aria-label="Số lượng sản phẩm" /><button type="button" aria-label="Tăng số lượng" disabled={quantity >= quantityLimit || (product.variants?.length ? !selectedVariant : false)} onClick={() => setQuantity((value) => Math.min(quantityLimit, value + 1))}><Plus aria-hidden="true" size={16} /></button></div></div>
            <button className="button dark full" data-product-add-button disabled={cartAddBusy || cartSyncLoading || !product.variants?.length || Boolean(product.variants?.length && (!selectedVariant || selectedVariant.available_quantity < quantity))} onClick={addSelectedProduct}>{cartAddBusy ? 'Đang thêm…' : 'Thêm vào túi'}</button>
            <button className="button light full" disabled={cartAddBusy || cartSyncLoading || !product.variants?.length || Boolean(product.variants?.length && (!selectedVariant || selectedVariant.available_quantity < quantity))} onClick={() => onBuyNow(product, selectedVariantId, quantity)}>{cartAddBusy ? 'Đang xử lý…' : 'Mua ngay'}</button>
            {cartAddError && <p className="auth-error" role="alert">{cartAddError}</p>}
            <div className="product-share-actions" aria-label="Chia sẻ sản phẩm">
              <button type="button" onClick={() => void copyProductLink()}>Sao chép liên kết</button>
              <button type="button" onClick={() => void shareProduct()}>Chia sẻ qua ứng dụng</button>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">Facebook</a>
              {socialZaloOaId && <button type="button" aria-expanded={zaloShareOpen} onClick={() => setZaloShareOpen((open) => !open)}>Chia sẻ qua Zalo</button>}
            </div>
            {zaloShareOpen && socialZaloOaId && <ZaloShareWidget href={window.location.href} oaId={socialZaloOaId} />}
            {shareMessage && <p className="sr-only" role="status">{shareMessage}</p>}
            <button className="size-guide-link" type="button" onClick={() => setSizeGuideOpen(true)}>Hướng dẫn chọn kích cỡ</button>
            <dialog ref={sizeGuideDialogRef} className="size-guide-dialog" aria-labelledby="size-guide-title" onCancel={(event) => { event.preventDefault(); setSizeGuideOpen(false) }}><div className="size-guide-dialog-header"><h2 id="size-guide-title">Hướng dẫn chọn kích cỡ</h2><button type="button" aria-label="Đóng hướng dẫn" onClick={() => setSizeGuideOpen(false)}>×</button></div><section className="size-recommendation-tool"><h3>Gợi ý size theo chiều cao và cân nặng</h3><div><label>Chiều cao (cm)<input type="number" min="50" max="250" value={sizeHeightValue} onChange={(event) => setSizeHeight(event.target.value)} /></label><label>Cân nặng (kg)<input type="number" min="10" max="300" value={sizeWeightValue} onChange={(event) => setSizeWeight(event.target.value)} /></label></div>{sizeHeightValue && sizeWeightValue ? (() => { const height = Number(sizeHeightValue); const weight = Number(sizeWeightValue); const matches = (product.size_recommendations ?? []).filter((item) => height >= item.height_min_cm && height <= item.height_max_cm && weight >= item.weight_min_kg && weight <= item.weight_max_kg); return matches.length ? <p role="status">Size gợi ý: <strong>{matches.map((item) => item.size).filter(Boolean).join(String.fromCharCode(44,32))}</strong></p> : <p role="status">Chưa có gợi ý phù hợp. Vui lòng tham khảo bảng size bên dưới hoặc liên hệ cửa hàng.</p> })() : <p>Nhập chiều cao và cân nặng để xem gợi ý đã được cửa hàng cấu hình.</p>}</section>{sizeGuideQuery.isPending ? <p role="status">Đang tải bảng hướng dẫn…</p> : sizeGuideQuery.isError ? sizeGuideQuery.error instanceof StorefrontContentPageError && sizeGuideQuery.error.status === 404 ? <p>Hướng dẫn chọn kích cỡ chưa được cửa hàng công khai.</p> : <div role="alert"><p>Chưa tải được hướng dẫn chọn kích cỡ.</p><button className="button dark" type="button" onClick={() => void sizeGuideQuery.refetch()}>Thử lại</button></div> : sizeGuideQuery.data ? <article className="content-page-body" dangerouslySetInnerHTML={{ __html: sanitizePageContent(sizeGuideQuery.data.content) }} /> : null}</dialog>
            <div className="perks"><p>✓ Phí giao hàng hiển thị trước khi đặt hàng</p><p>✓ Theo dõi trạng thái đơn sau khi đặt</p>{codEnabled && <p>✓ Thanh toán khi nhận hàng (COD)</p>}{bankTransferEnabled && <p>✓ Chuyển khoản ngân hàng / VietQR</p>}</div>
            <details className="product-delivery-estimator" onToggle={(event) => setShippingEstimateOpen(event.currentTarget.open)}>
              <summary>Kiểm tra phí và thời gian giao hàng</summary>
              <div className="product-delivery-estimator-content">
                <label htmlFor="product-shipping-province">Tỉnh/thành phố</label>
                <select id="product-shipping-province" value={shippingProvinceCode} onChange={(event) => { setShippingProvinceCode(event.target.value); setShippingWardCode('') }}>
                  <option value="">Chọn tỉnh/thành phố</option>
                  {shippingEstimate.provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
                </select>
                {shippingProvinceCode && <>
                  <label htmlFor="product-shipping-ward">Xã/phường <span>(không bắt buộc)</span></label>
                  <select id="product-shipping-ward" value={shippingWardCode} disabled={shippingEstimate.locationsLoading || shippingEstimate.wards.length === 0} onChange={(event) => setShippingWardCode(event.target.value)}>
                    <option value="">Tất cả xã/phường trong tỉnh</option>
                    {shippingEstimate.wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
                  </select>
                </>}
                {shippingEstimate.locationsError && <div role="alert"><p>Chưa tải được khu vực giao hàng.</p><button className="text-button" type="button" onClick={() => shippingEstimate.retry()}>Thử tải lại khu vực</button></div>}
                {shippingProvinceCode && shippingEstimate.shippingFeeLoading && <p role="status">Đang tải phí và lựa chọn giao hàng…</p>}
                {shippingProvinceCode && shippingEstimate.shippingFeeError && <div role="alert"><p>Chưa tải được ước tính giao hàng.</p><button className="text-button" type="button" onClick={() => void shippingEstimate.retryShippingFee()}>Thử lại</button></div>}
                {shippingEstimate.shippingFee && <>
                  <p className="product-delivery-estimator-label">Mức phí tham khảo theo tỉnh: <strong>{formatMoney(shippingEstimate.shippingFee.fee)}</strong></p>
                  <ul aria-label="Phương thức giao hàng khả dụng">
                    {shippingEstimate.shippingFee.shipping_methods.map((method) => <li key={method.id ?? 'province-rate'}><div><strong>{method.name}</strong>{method.est_days && <span>Dự kiến {method.est_days}</span>}</div><b>{formatMoney(method.fee)}</b></li>)}
                  </ul>
                  {shippingEstimate.shippingFee.free_shipping_threshold !== null && shippingEstimate.shippingFee.free_shipping_threshold > 0 && <p>Ngưỡng miễn phí vận chuyển: {formatMoney(shippingEstimate.shippingFee.free_shipping_threshold)}.</p>}
                  <small>Phí cuối cùng có thể thay đổi theo giá trị giỏ hàng và mã giảm giá; hệ thống xác nhận tại bước thanh toán.</small>
                </>}
                {!shippingProvinceCode && <p>Chọn tỉnh/thành để xem phí tham khảo và phương thức đang áp dụng.</p>}
              </div>
            </details>
            <div className="product-tabs">
              <div className="product-tab-list" role="tablist" aria-label="Thông tin sản phẩm" onKeyDown={(event) => {
                const currentIndex = productTabs.findIndex((tab) => tab.id === activeProductTab)
                const nextIndex = event.key === 'ArrowRight' ? (currentIndex + 1) % productTabs.length : event.key === 'ArrowLeft' ? (currentIndex - 1 + productTabs.length) % productTabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? productTabs.length - 1 : -1
                if (nextIndex < 0) return
                event.preventDefault()
                const nextTab = productTabs[nextIndex]!
                setActiveProductTab(nextTab.id)
                event.currentTarget.querySelector<HTMLElement>(`[data-product-tab="${nextTab.id}"]`)?.focus()
              }}>
                {productTabs.map((tab) => <button key={tab.id} id={`product-tab-${tab.id}`} className="product-tab" type="button" role="tab" data-product-tab={tab.id} aria-controls="product-tab-panel" aria-selected={activeProductTab === tab.id} tabIndex={activeProductTab === tab.id ? 0 : -1} onClick={() => setActiveProductTab(tab.id)}>{tab.label}</button>)}
              </div>
              <section id="product-tab-panel" className="product-tab-panel" role="tabpanel" aria-labelledby={`product-tab-${activeProductTab}`} tabIndex={0}>
                {activeProductTab === 'description' && <p>{product.description || product.short_description || 'Thông tin chi tiết chưa được cửa hàng cập nhật.'}</p>}
                {activeProductTab === 'materials' && <><p>{product.material || 'Chất liệu chưa được cửa hàng cập nhật.'}</p><p>{product.care_instruction || 'Hướng dẫn bảo quản chưa được cửa hàng cập nhật.'}</p></>}
                {activeProductTab === 'specifications' && (() => {
                  const specifications = [
                    ['Danh mục', product.category?.name],
                    ['Thương hiệu', product.brand?.name],
                    ['Dáng sản phẩm', product.fit],
                    ['Chất liệu', product.material],
                    ['Mã SKU', selectedVariant?.sku],
                    ['Màu sắc', selectedColor || selectedVariant?.color],
                    ['Kích cỡ', selectedVariant?.size],
                  ].filter((item): item is [string, string] => Boolean(item[1]?.trim()))
                  return specifications.length > 0
                    ? <dl className="product-specification-list">{specifications.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                    : <p>Thông số sản phẩm chưa được cửa hàng cập nhật.</p>
                })()}
                {activeProductTab === 'shipping' && (shippingPolicyQuery.isPending ? <p role="status">Đang tải chính sách…</p> : shippingPolicyQuery.isError ? shippingPolicyQuery.error instanceof StorefrontContentPageError && shippingPolicyQuery.error.status === 404 ? <p>Chính sách giao hàng và đổi trả chưa được cửa hàng công khai.</p> : <div role="alert"><p>Chưa tải được chính sách giao hàng và đổi trả.</p><button className="text-button" type="button" onClick={() => void shippingPolicyQuery.refetch()}>Thử lại</button></div> : shippingPolicyQuery.data ? <article className="content-page-body" dangerouslySetInnerHTML={{ __html: sanitizePageContent(shippingPolicyQuery.data.content) }} /> : null)}
                {activeProductTab === 'reviews' && <Suspense fallback={<p className="state" role="status">Đang tải đánh giá…</p>}><ReviewList product={product} reviews={reviews} reviewMeta={reviewMeta} reviewFilterOptions={reviewFilterOptions} reviewSort={reviewSort} reviewFilters={reviewFilters} onPageChange={onChangeReviewPage} onSortChange={onChangeReviewSort} onFiltersChange={onChangeReviewFilters} loading={reviewsLoading} error={reviewsError} onRetry={onRetryReviews} /></Suspense>}
                {activeProductTab === 'questions' && <Suspense fallback={<p className="state" role="status">Đang tải hỏi đáp…</p>}><ProductQuestionList slug={product.slug} accessToken={accessToken} authenticated={Boolean(accountId)} enabled /></Suspense>}
              </section>
            </div>
          </section>
        </div>
        <Suspense fallback={<section className="outfit-builder"><p className="state" role="status">Đang tải gợi ý phối đồ…</p></section>}>
          <OutfitBuilder products={relatedProducts} loading={relatedLoading} error={relatedError} retry={onRetryRelated} adding={cartAddBusy} cartReady={cartReady} formatMoney={formatMoney} onAdd={onAddToCart} />
        </Suspense>
        <Suspense fallback={<section className="related-products"><p className="state" role="status">Đang tải sản phẩm liên quan…</p></section>}>
          <RelatedProducts products={relatedProducts} loading={relatedLoading} error={relatedError} onRetry={onRetryRelated} formatMoney={formatMoney} />
        </Suspense>
        <Suspense fallback={null}>
          <RecentlyViewedProducts currentSlug={product.slug} accountId={accountId} formatMoney={formatMoney} />
        </Suspense>
      </div>
      {stickyAddBarVisible && !productDetailHasFocus && <aside className="sticky-buy-bar" aria-label="Thêm sản phẩm vào túi"><div><strong>{formatMoney(displayedPrice)}</strong><span>{selectedVariant ? [selectedColor, selectedVariant.size].filter(Boolean).join(' · ') : 'Chọn màu và kích cỡ'}</span></div><button type="button" className="button dark" disabled={cartAddBusy || cartSyncLoading || Boolean(product.variants?.length && (!selectedVariant || selectedVariant.available_quantity < quantity)) || !product.variants?.length} onClick={addSelectedProduct}>{cartAddBusy ? 'Đang thêm…' : 'Thêm vào túi'}</button></aside>}
    </>
  )
}
