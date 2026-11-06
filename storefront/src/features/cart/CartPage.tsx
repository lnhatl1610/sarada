import { Link } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import '../../CartSync.css'
import type { AddressOption, ShippingFee } from '../checkout/address-api'
import { CartPromotionBox } from './CartPromotionBox'
import { GuestCartRecoveryForm } from './GuestCartRecoveryForm'
import { CartLineItem } from './CartLineItem'
import { CartEmptyRecommendations } from './CartEmptyRecommendations'
import { CartAddOns } from './CartAddOns'
import './CartEmptyRecommendations.css'
import type { CartLine, CartProduct } from './cart-types'
import type { CatalogProduct } from '../catalog/catalog-api'

type CartPageProps<TProduct extends CartProduct> = {
  accessToken: string
  customerId: number | null
  initialCouponCode?: string
  cartToken: string
  recoveryEmail: string | null
  onRecoveryEmailChange: (email: string | null) => void
  cart: CartLine<TProduct>[]
  syncStatus: 'loading' | 'ready' | 'error'
  syncError: string
  cartExpired: boolean
  busyItemIds: number[]
  total: number | null
  provinces: AddressOption[]
  provincesLoading: boolean
  provincesError: boolean
  provinceCode: string
  shippingFee?: ShippingFee
  shippingFeeLoading: boolean
  shippingFeeError: boolean
  formatMoney: (amount: number) => string
  onRetry: () => void
  onProvinceChange: (provinceCode: string) => void
  onRetryProvinces: () => void
  onRetryShippingFee: () => void
  onChangeQuantity: (line: CartLine<TProduct>, quantity: number) => Promise<boolean>
  onChangeVariant: (line: CartLine<TProduct>, variantId: number) => Promise<boolean>
  onRemoveLine: (line: CartLine<TProduct>) => Promise<boolean>
  onSaveToWishlist: (productId: number) => Promise<boolean>
  addBusy: boolean
  onAddRecommended: (product: CatalogProduct, variantId: number) => Promise<boolean>
}

export function CartPage<TProduct extends CartProduct>({
  accessToken,
  customerId,
  initialCouponCode = '',
  cartToken,
  recoveryEmail,
  onRecoveryEmailChange,
  cart,
  syncStatus,
  syncError,
  cartExpired,
  busyItemIds,
  total,
  provinces,
  provincesLoading,
  provincesError,
  provinceCode,
  shippingFee,
  shippingFeeLoading,
  shippingFeeError,
  formatMoney,
  onRetry,
  onProvinceChange,
  onRetryProvinces,
  onRetryShippingFee,
  onChangeQuantity,
  onChangeVariant,
  onRemoveLine,
  onSaveToWishlist,
  addBusy,
  onAddRecommended,
}: CartPageProps<TProduct>) {
  const [appliedCouponCode, setAppliedCouponCode] = useState('')
  const [selectedLineKeys, setSelectedLineKeys] = useState<string[]>([])
  const [bulkRemoving, setBulkRemoving] = useState(false)
  const [bulkRemoveMessage, setBulkRemoveMessage] = useState('')
  const selectAllRef = useRef<HTMLInputElement>(null)
  const lineKey = (line: CartLine<TProduct>) => line.serverItemId ? `item-${line.serverItemId}` : `${line.product.id}-${line.variantId}`
  const isLineBusy = (line: CartLine<TProduct>) => syncStatus !== 'ready' || (line.serverItemId ? busyItemIds.includes(line.serverItemId) : false)
  const selectableLines = cart.filter((line) => !isLineBusy(line))
  const selectedLines = cart.filter((line) => selectedLineKeys.includes(lineKey(line)))
  const allSelected = selectableLines.length > 0 && selectableLines.every((line) => selectedLineKeys.includes(lineKey(line)))
  const selectedHasBusyLine = selectedLines.some(isLineBusy)

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selectedLineKeys.length > 0 && !allSelected
  }, [selectedLineKeys.length, allSelected])

  const toggleLine = (line: CartLine<TProduct>, checked: boolean) => {
    const key = lineKey(line)
    setBulkRemoveMessage('')
    setSelectedLineKeys((current) => checked
      ? current.includes(key) ? current : [...current, key]
      : current.filter((selected) => selected !== key))
  }

  const toggleAllLines = (checked: boolean) => {
    setBulkRemoveMessage('')
    setSelectedLineKeys(checked ? selectableLines.map(lineKey) : [])
  }

  const removeSelectedLines = async () => {
    if (!selectedLines.length || selectedHasBusyLine || syncStatus !== 'ready' || bulkRemoving) return
    if (!window.confirm(`Xóa ${selectedLines.length} sản phẩm đã chọn khỏi giỏ hàng?`)) return
    setBulkRemoving(true)
    setBulkRemoveMessage('')
    let removed = 0
    for (const line of selectedLines) {
      if (line.serverItemId && busyItemIds.includes(line.serverItemId)) continue
      try {
        if (!await onRemoveLine(line)) continue
      } catch {
        continue
      }
      removed += 1
      const key = lineKey(line)
      setSelectedLineKeys((current) => current.filter((selected) => selected !== key))
    }
    setBulkRemoving(false)
    setBulkRemoveMessage(removed === selectedLines.length
      ? `Đã xóa ${removed} sản phẩm khỏi giỏ hàng.`
      : removed > 0
        ? `Đã xóa ${removed}/${selectedLines.length} sản phẩm. Các món còn lại vẫn được giữ trong giỏ.`
        : 'Chưa xóa được sản phẩm nào. Hãy thử lại.')
  }

  return (
    <div className="container subpage cart-page">
      <p className="eyebrow">GIỎ HÀNG</p>
      <h1>Những món đồ bạn đã chọn</h1>
      {syncStatus === 'loading' && <p className="cart-sync-state" role="status">Đang đồng bộ giỏ hàng…</p>}
      {syncError && (
        <div className="cart-sync-error" role="alert">
          <span>{syncError}</span>
          <button type="button" onClick={onRetry}>Thử lại</button>
        </div>
      )}
      {cartExpired && <div className="cart-sync-error" role="status"><span>Giỏ hàng cũ đã hết hạn nên các sản phẩm đã được xóa. Hãy chọn lại sản phẩm để tiếp tục.</span><Link to="/products">Xem sản phẩm</Link></div>}
      {cart.length ? (
        <div className="cart-layout">
          <div>
            <div className="cart-bulk-actions">
              <label><input ref={selectAllRef} type="checkbox" checked={allSelected} aria-checked={allSelected ? 'true' : selectedLineKeys.length ? 'mixed' : 'false'} disabled={!selectableLines.length || bulkRemoving} onChange={(event) => toggleAllLines(event.currentTarget.checked)} /> Chọn tất cả ({cart.length})</label>
              <button type="button" disabled={!selectedLines.length || selectedHasBusyLine || syncStatus !== 'ready' || bulkRemoving} onClick={() => void removeSelectedLines()}>{bulkRemoving ? 'Đang xóa…' : `Xóa đã chọn${selectedLines.length ? ` (${selectedLines.length})` : ''}`}</button>
            </div>
            {bulkRemoveMessage && <p className="cart-bulk-status" role={bulkRemoveMessage.startsWith('Chưa') || bulkRemoveMessage.includes('/') ? 'alert' : 'status'}>{bulkRemoveMessage}</p>}
            {cart.map((line) => <div className="cart-line-with-select" key={`${line.product.id}-${line.variantId}`}><label className="cart-line-select"><input type="checkbox" checked={selectedLineKeys.includes(lineKey(line))} aria-label={`Chọn ${line.product.name} trong giỏ`} disabled={isLineBusy(line) || bulkRemoving} onChange={(event) => toggleLine(line, event.currentTarget.checked)} /></label><CartLineItem idPrefix="full-cart" line={line} busy={bulkRemoving || isLineBusy(line)} formatMoney={formatMoney} onChangeQuantity={onChangeQuantity} onChangeVariant={onChangeVariant} onRemove={async (item) => { if (await onRemoveLine(item)) toggleLine(item, false) }} onMoveToWishlist={async (item) => { if (item.productId == null || !await onSaveToWishlist(item.productId)) return false; const removed = await onRemoveLine(item); if (removed) toggleLine(item, false); return removed }} /></div>)}
            <CartAddOns cart={cart} formatMoney={formatMoney} busy={addBusy || syncStatus !== 'ready' || bulkRemoving} onAdd={onAddRecommended} />
          </div>
          <aside className="summary">
            <h2>Tóm tắt đơn hàng</h2>
            <CartPromotionBox accessToken={accessToken} customerId={customerId} initialCouponCode={initialCouponCode} cartToken={cartToken} cart={cart} subtotal={total} provinces={provinces} provincesLoading={provincesLoading} provincesError={provincesError} provinceCode={provinceCode} shippingFee={shippingFee} shippingThreshold={shippingFee?.free_shipping_threshold} shippingThresholdLoading={shippingFeeLoading} shippingThresholdError={shippingFeeError} onProvinceChange={onProvinceChange} onRetryProvinces={onRetryProvinces} onRetryShippingThreshold={onRetryShippingFee} onCouponApplied={setAppliedCouponCode} formatMoney={formatMoney} />
            {!accessToken && <GuestCartRecoveryForm cartToken={cartToken} recoveryEmail={recoveryEmail} disabled={syncStatus !== 'ready'} onRecoveryEmailChange={onRecoveryEmailChange} />}
            {syncStatus !== 'ready' || cart.some((line) => line.availableQuantity !== undefined && line.quantity > line.availableQuantity) ? (
              <button className="button dark full cart-checkout-disabled" type="button" disabled>Giỏ hàng cần đồng bộ</button>
            ) : (
              <Link className="button dark full" to="/checkout" state={{ couponCode: appliedCouponCode }}>Tiến hành thanh toán</Link>
            )}
          </aside>
        </div>
      ) : syncStatus === 'ready' ? (
        <><div className="empty">
          <span aria-hidden="true">N</span>
          <h2>Chiếc túi đang chờ món đồ đầu tiên</h2>
          <p>Khám phá những thiết kế mới từ SARADA.</p>
          <Link className="button dark" to="/products">Khám phá sản phẩm</Link>
        </div><CartEmptyRecommendations /></>
      ) : null}
    </div>
  )
}
