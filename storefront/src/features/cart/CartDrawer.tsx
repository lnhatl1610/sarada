import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { CartLineItem } from './CartLineItem'
import type { CartLine, CartProduct } from './cart-types'
import { fetchCatalogProducts, fetchRelatedCatalogProducts, type CatalogProduct } from '../catalog/catalog-api'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import './CartDrawer.css'

type CartDrawerProps<TProduct extends CartProduct> = {
  open: boolean
  cart: CartLine<TProduct>[]
  syncStatus: 'loading' | 'ready' | 'error'
  syncError: string
  cartExpired: boolean
  busyItemIds: number[]
  total: number | null
  freeShippingThreshold?: number | null
  addBusy: boolean
  addError: string
  formatMoney: (amount: number) => string
  onClose: () => void
  onRetry: () => void
  onChangeQuantity: (line: CartLine<TProduct>, quantity: number) => Promise<boolean>
  onRemoveLine: (line: CartLine<TProduct>) => void
  onAddRecommended: (product: CatalogProduct, variantId: number) => Promise<boolean>
}

export function CartDrawer<TProduct extends CartProduct>({ open, cart, syncStatus, syncError, cartExpired, busyItemIds, total, freeShippingThreshold, addBusy, addError, formatMoney, onClose, onRetry, onChangeQuantity, onRemoveLine, onAddRecommended }: CartDrawerProps<TProduct>) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const itemCount = cart.reduce((count, line) => count + line.quantity, 0)
  const hasUnavailableItems = cart.some((line) => line.availableQuantity !== undefined && line.quantity > line.availableQuantity)
  const recommendationSlug = cart[0]?.product.slug ?? ''
  const cartIsEmpty = cart.length === 0
  const recommendationsQuery = useQuery({
    queryKey: cartIsEmpty ? ['cart', 'drawer-empty-bestsellers'] : ['cart', 'drawer-recommendations', recommendationSlug],
    queryFn: ({ signal }) => recommendationSlug
      ? fetchRelatedCatalogProducts(recommendationSlug, signal)
      : fetchCatalogProducts('?sort=bestseller&best_seller=1&per_page=6', signal),
    enabled: open && (cartIsEmpty ? syncStatus === 'ready' : Boolean(recommendationSlug)),
    staleTime: 60_000,
    retry: 1,
  })
  const recommendedProducts = (recommendationsQuery.data ?? [])
    .filter((product) => (product.variants ?? []).some((variant) => variant.available_quantity > 0))
    .filter((product) => !cart.some((line) => (line.productId ?? line.product.id) === product.id))
    .slice(0, 2)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const close = () => {
    if (dialogRef.current?.open) dialogRef.current.close()
    onClose()
  }

  return <dialog ref={dialogRef} id="storefront-cart-drawer" className="storefront-cart-drawer" aria-labelledby="storefront-cart-title" onCancel={(event) => { event.preventDefault(); close() }} onClose={onClose} onClick={(event) => { if (event.target === dialogRef.current) close() }}>
    <div className="cart-drawer-shell">
      <header className="cart-drawer-heading">
        <div><p className="eyebrow">TÚI HÀNG</p><h2 id="storefront-cart-title">Những món bạn đã chọn <span>({itemCount})</span></h2></div>
        <button type="button" className="cart-drawer-close" aria-label="Đóng túi hàng" onClick={close}>×</button>
      </header>
      <div className="cart-drawer-content" aria-busy={syncStatus === 'loading'}>
        {syncStatus === 'loading' && cart.length === 0 && <p className="cart-drawer-state" role="status">Đang đồng bộ giỏ hàng…</p>}
        {syncError && <div className="cart-drawer-error" role="alert"><span>{syncError}</span><button type="button" onClick={onRetry}>Thử lại</button></div>}
        {cartExpired && <p className="cart-drawer-expired" role="status">Giỏ hàng cũ đã hết hạn. Hãy chọn lại sản phẩm để tiếp tục.</p>}
        {cart.length > 0 ? <div className="cart-drawer-lines">
          {cart.map((line) => <CartLineItem key={`${line.product.id}-${line.variantId}`} idPrefix="cart-drawer" line={line} busy={syncStatus !== 'ready' || (line.serverItemId ? busyItemIds.includes(line.serverItemId) : false)} formatMoney={formatMoney} onChangeQuantity={onChangeQuantity} onRemove={onRemoveLine} />)}
        </div> : syncStatus === 'ready' && <div className="cart-drawer-empty"><span aria-hidden="true">N</span><h3>Túi hàng đang chờ món đầu tiên</h3><p>Khám phá những thiết kế mới từ Sarada.</p><Link className="button dark" to="/products" onClick={close}>Khám phá sản phẩm</Link></div>}
        {(cart.length > 0 || syncStatus === 'ready') && <section className="cart-drawer-recommendations" aria-labelledby="cart-drawer-recommendations-title" aria-busy={recommendationsQuery.isFetching}>
          <h3 id="cart-drawer-recommendations-title">{cartIsEmpty ? 'Có thể bạn sẽ thích' : 'Mua kèm'}</h3>
          {recommendationsQuery.isPending && <p className="cart-drawer-state" role="status">Đang tìm sản phẩm phù hợp…</p>}
          {recommendationsQuery.isError && <p className="cart-drawer-recommendation-error" role="alert">Chưa tải được gợi ý. <button type="button" onClick={() => void recommendationsQuery.refetch()}>Thử lại</button></p>}
          {recommendationsQuery.isSuccess && recommendedProducts.length === 0 && <p className="cart-drawer-state">{cartIsEmpty ? 'Chưa có sản phẩm bán chạy còn hàng để gợi ý.' : 'Chưa có sản phẩm liên quan còn hàng để gợi ý.'}</p>}
          {addError && <p className="cart-drawer-recommendation-error" role="alert">{addError}</p>}
          {recommendedProducts.map((product) => <CartDrawerRecommendation key={product.id} product={product} busy={addBusy || syncStatus !== 'ready'} formatMoney={formatMoney} onAdd={onAddRecommended} />)}
        </section>}
      </div>
      {cart.length > 0 && <footer className="cart-drawer-footer">
        {total !== null && freeShippingThreshold != null && freeShippingThreshold > 0 && (() => {
          const remaining = Math.max(0, freeShippingThreshold - total)
          const progress = Math.min(100, Math.round((total / freeShippingThreshold) * 100))
          return <div className="cart-drawer-free-shipping">
            <div className="cart-drawer-free-shipping-track" role="progressbar" aria-label="Tiến trình miễn phí giao hàng" aria-valuemin={0} aria-valuemax={freeShippingThreshold} aria-valuenow={Math.min(total, freeShippingThreshold)}><span style={{ width: `${progress}%` }} /></div>
            <p role="status">{remaining > 0 ? `Mua thêm ${formatMoney(remaining)} để đạt ngưỡng miễn phí giao hàng đang áp dụng.` : 'Giỏ hàng đã đạt ngưỡng miễn phí giao hàng đang áp dụng.'}</p>
          </div>
        })()}
        {total !== null && freeShippingThreshold === 0 && <p className="cart-drawer-free-shipping-message" role="status">Đơn hàng hiện được miễn phí giao hàng theo cấu hình cửa hàng.</p>}
        <div className="cart-drawer-subtotal"><span>Tạm tính</span><strong>{total === null ? 'Đang đồng bộ giá…' : formatMoney(total)}</strong></div>
        <p>Phí giao hàng và ưu đãi sẽ được tính trong giỏ hàng.</p>
        {syncStatus !== 'ready' || hasUnavailableItems
          ? <button className="button dark full" type="button" disabled>{syncStatus !== 'ready' ? 'Đang đồng bộ giỏ hàng' : 'Cần cập nhật số lượng'}</button>
          : <Link className="button dark full" to="/checkout" onClick={close}>Tiến hành thanh toán</Link>}
        <Link className="cart-drawer-full-cart" to="/cart" onClick={close}>Xem và chỉnh sửa giỏ hàng</Link>
      </footer>}
    </div>
  </dialog>
}

function CartDrawerRecommendation({ product, busy, formatMoney, onAdd }: {
  product: CatalogProduct
  busy: boolean
  formatMoney: (amount: number) => string
  onAdd: (product: CatalogProduct, variantId: number) => Promise<boolean>
}) {
  const availableVariants = (product.variants ?? []).filter((variant) => variant.available_quantity > 0)
  const [variantId, setVariantId] = useState<number | null>(null)
  const selectedVariant = availableVariants.find((variant) => variant.id === variantId)
  const image = product.images?.[0]
  const mediaLabel = getMediaDisclosureLabel(image?.alt)

  return <article className="cart-drawer-recommendation">
    <Link to={`/products/${product.slug}`} className="cart-drawer-recommendation-image" aria-label={`Xem ${product.name}${mediaLabel ? `, ${mediaLabel}` : ''}`}>
      <ResponsiveImage src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, product.name)} width={240} height={300} loading="lazy" sizes="80px" />
      {mediaLabel && <DemoConceptBadge label={mediaLabel} />}
    </Link>
    <div className="cart-drawer-recommendation-info">
      <Link to={`/products/${product.slug}`}>{product.name}</Link>
      <strong>{formatMoney(selectedVariant?.price ?? product.price)}</strong>
      {availableVariants.length > 0 && <label className="sr-only" htmlFor={`cart-drawer-recommendation-variant-${product.id}`}>Chọn màu và kích cỡ cho {product.name}</label>}
      <select id={`cart-drawer-recommendation-variant-${product.id}`} aria-label={`Chọn màu và kích cỡ cho ${product.name}`} value={variantId ?? ''} disabled={busy || availableVariants.length === 0} onChange={(event) => setVariantId(Number(event.target.value) || null)}>
        {availableVariants.length === 0 ? <option value="">Hết hàng</option> : <><option value="">Chọn phân loại</option>{availableVariants.map((variant) => <option key={variant.id} value={variant.id}>{[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku}</option>)}</>}
      </select>
      <button type="button" disabled={busy || !selectedVariant} onClick={() => selectedVariant && void onAdd(product, selectedVariant.id)}>{busy ? 'Đang thêm…' : 'Thêm'}</button>
    </div>
  </article>
}
