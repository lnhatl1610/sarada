import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import '../../Cart.css'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import type { CartLine as CartLineData, CartProduct } from './cart-types'

type CartLineItemProps<TProduct extends CartProduct> = {
  line: CartLineData<TProduct>
  busy: boolean
  formatMoney: (amount: number) => string
  idPrefix: string
  onChangeQuantity: (line: CartLineData<TProduct>, quantity: number) => Promise<boolean>
  onChangeVariant?: (line: CartLineData<TProduct>, variantId: number) => Promise<boolean>
  onRemove: (line: CartLineData<TProduct>) => void
  onMoveToWishlist?: (line: CartLineData<TProduct>) => Promise<boolean>
}

export function CartLineItem<TProduct extends CartProduct>({ line, busy, formatMoney, idPrefix, onChangeQuantity, onChangeVariant, onRemove, onMoveToWishlist }: CartLineItemProps<TProduct>) {
  const [draft, setDraft] = useState(String(line.quantity))
  const [error, setError] = useState('')
  const [wishlistBusy, setWishlistBusy] = useState(false)
  const [wishlistError, setWishlistError] = useState('')
  const [variantBusy, setVariantBusy] = useState(false)
  const [variantError, setVariantError] = useState('')
  const timer = useRef<number | null>(null)
  const maxQuantity = Math.min(20, line.availableQuantity ?? 20)
  const draftQuantity = Number(draft)
  const hasValidDraft = Boolean(draft) && Number.isInteger(draftQuantity) && draftQuantity >= 1 && draftQuantity <= maxQuantity
  const pendingDraft = hasValidDraft && draftQuantity !== line.quantity
  const overStock = line.availableQuantity !== undefined && line.quantity > line.availableQuantity
  const quantityErrorId = `${idPrefix}-quantity-error-${line.serverItemId ?? line.product.id}`

  useEffect(() => {
    // Reconcile the local input draft after a canonical cart response arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(String(line.quantity))
    setError('')
  }, [line.quantity])

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  const updateDraft = (value: string) => {
    setDraft(value)
    if (timer.current !== null) window.clearTimeout(timer.current)
    const quantity = Number(value)
    if (!value || !Number.isInteger(quantity) || quantity < 1) {
      setError('Nhập số lượng nguyên lớn hơn 0.')
      return
    }
    if (quantity > maxQuantity) {
      setError(maxQuantity > 0 ? `Tồn kho hiện tại tối đa ${maxQuantity} sản phẩm.` : 'Sản phẩm hiện đã hết hàng.')
      return
    }
    setError('')
    if (quantity === line.quantity) return

    timer.current = window.setTimeout(() => {
      void onChangeQuantity(line, quantity).then((saved) => {
        if (!saved) setDraft(String(line.quantity))
      })
    }, 500)
  }

  const adjust = (quantity: number) => updateDraft(String(quantity))
  const moveToWishlist = async () => {
    if (!onMoveToWishlist || line.productId == null || wishlistBusy) return
    setWishlistBusy(true)
    setWishlistError('')
    try {
      if (!await onMoveToWishlist(line)) setWishlistError('Chưa hoàn tất thao tác. Hãy kiểm tra giỏ và danh sách yêu thích rồi thử lại.')
    } catch {
      setWishlistError('Chưa hoàn tất thao tác. Hãy kiểm tra giỏ và danh sách yêu thích rồi thử lại.')
    } finally {
      setWishlistBusy(false)
    }
  }
  const changeVariant = async (variantId: number) => {
    if (!onChangeVariant || variantBusy) return
    setVariantBusy(true)
    setVariantError('')
    try {
      if (!await onChangeVariant(line, variantId)) setVariantError('Không thể đổi biến thể. Hãy kiểm tra tồn kho rồi thử lại.')
    } catch {
      setVariantError('Không thể đổi biến thể. Hãy kiểm tra tồn kho rồi thử lại.')
    } finally {
      setVariantBusy(false)
    }
  }
  const hasAlternateVariant = line.variantOptions?.some((variant) => variant.id !== line.variantId) ?? false
  const currentVariantIsListed = line.variantOptions?.some((variant) => variant.id === line.variantId) ?? false
  const buttonBaseQuantity = hasValidDraft ? draftQuantity : line.quantity
  const imageAlt = getProductImageAlt(line.image, line.imageAlt, line.product.name)
  const lineTotal = line.pricedQuantity === line.quantity && line.lineTotal !== undefined
    ? formatMoney(line.lineTotal)
    : 'Đang đồng bộ giá…'

  return <article className="cart-line-item">
    <Link className="cart-line-image" to={`/products/${line.product.slug}`} aria-label={`Xem ${line.product.name}`}>
      <ResponsiveImage src={line.image} alt={imageAlt} width={300} height={375} sizes="(max-width: 620px) 75px, 105px" />
    </Link>
    <div className="cart-line-item-details">
      <Link to={`/products/${line.product.slug}`}>{line.product.name}</Link>
      {line.variantLabel && <p>{line.variantLabel}</p>}
      {onChangeVariant && hasAlternateVariant && <div className="cart-variant-selector">
        <label htmlFor={`${idPrefix}-variant-${line.serverItemId ?? line.product.id}`}>Màu / kích cỡ</label>
        <select id={`${idPrefix}-variant-${line.serverItemId ?? line.product.id}`} value={line.variantId ?? ''} disabled={busy || variantBusy} onChange={(event) => void changeVariant(Number(event.target.value))}>
          {!currentVariantIsListed && line.variantId != null && <option value={line.variantId}>{line.variantLabel || 'Biến thể hiện tại'} · ngừng bán</option>}
          {line.variantOptions?.map((variant) => {
            const label = [variant.color, variant.size].filter(Boolean).join(' / ') || variant.sku || `Biến thể ${variant.id}`
            const stockLabel = variant.availableQuantity > 0 ? ` · còn ${variant.availableQuantity}` : ' · hết hàng'
            return <option key={variant.id} value={variant.id} disabled={variant.availableQuantity < 1 && variant.id !== line.variantId}>{label} · {formatMoney(variant.unitPrice)}{stockLabel}</option>
          })}
        </select>
        {variantError && <small className="cart-quantity-error" role="alert">{variantError}</small>}
      </div>}
      {overStock && <p className="cart-stock-error" role="alert">Giỏ có {line.quantity}, nhưng hiện chỉ còn {line.availableQuantity}. Hãy giảm số lượng hoặc xóa sản phẩm.</p>}
      <div className="quantity-control" role="group" aria-label={`Số lượng ${line.product.name}`}>
        <button type="button" aria-label={`Giảm số lượng ${line.product.name}`} disabled={busy || (buttonBaseQuantity <= 1 && !overStock) || (overStock && line.availableQuantity === 0)} onClick={() => adjust(overStock ? line.availableQuantity! : buttonBaseQuantity - 1)}>−</button>
        <input type="number" inputMode="numeric" min={1} max={maxQuantity} step={1} aria-label={`Số lượng ${line.product.name}`} aria-invalid={Boolean(error)} aria-describedby={error ? quantityErrorId : undefined} value={draft} disabled={busy} onChange={(event) => updateDraft(event.target.value)} onBlur={() => { if (error) { setDraft(String(line.quantity)); setError('') } }} />
        <button type="button" aria-label={`Tăng số lượng ${line.product.name}`} disabled={busy || buttonBaseQuantity >= maxQuantity} onClick={() => adjust(buttonBaseQuantity + 1)}>＋</button>
        {error && <small className="cart-quantity-error" id={quantityErrorId} role="alert">{error}</small>}
        {pendingDraft && <small className="cart-quantity-status" role="status">{busy ? 'Đang cập nhật…' : 'Sẽ tự lưu sau khi bạn ngừng nhập.'}</small>}
      </div>
      {line.availableQuantity !== undefined && line.availableQuantity <= 3 && <p className="stock-note">Chỉ còn {line.availableQuantity} sản phẩm</p>}
      <button className="link-button cart-line-remove" type="button" disabled={busy} onClick={() => onRemove(line)}>Xóa</button>
      {onMoveToWishlist && line.productId != null && <button className="link-button cart-line-wishlist" type="button" disabled={busy || wishlistBusy} onClick={() => void moveToWishlist()}>{wishlistBusy ? 'Đang lưu…' : 'Lưu yêu thích và xóa khỏi giỏ'}</button>}
      {wishlistError && <p className="cart-stock-error" role="alert">{wishlistError}</p>}
    </div>
    <b className="cart-line-item-total">{lineTotal}</b>
  </article>
}
