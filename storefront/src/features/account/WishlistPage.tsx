import { useEffect, useState } from 'react'
import type { WishlistList, WishlistProduct } from './account-api'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { DemoConceptBadge } from '../../components/shared/DemoConceptBadge'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import './WishlistPage.css'

type WishlistPageProps = {
  lists: WishlistList[]
  listsLoading: boolean
  listsError: string
  activeListId: number | null
  onSelectList: (listId: number) => void
  onCreateList: (name: string) => Promise<void>
  onRenameList: (name: string) => Promise<void>
  onDeleteList: () => Promise<void>
  onShareList: (shareable: boolean) => Promise<string | null>
  loading: boolean
  error?: string
  products: WishlistProduct[]
  formatMoney: (amount: number) => string
  onRemove: (product: WishlistProduct) => void
  priceAlertProductIds: number[]
  priceAlertsError: string
  onRetryPriceAlerts: () => void
  priceAlertBusyProductId: number | null
  restockBusyVariantId: number | null
  onTogglePriceAlert: (productId: number) => void
  onNotifyWhenRestocked: (productId: number, variantId: number) => void
  onAddToCart: (product: WishlistProduct, variantId: number, quantity: number) => void
  cartReady: boolean
  cartSyncStatus: 'loading' | 'ready' | 'error'
  cartSyncError: string
  onRetryCart: () => void
  addingToCart: boolean
  addToCartError: string
  onRetry: () => void
}

export function WishlistPage({ lists, listsLoading, listsError, activeListId, onSelectList, onCreateList, onRenameList, onDeleteList, onShareList, loading, error, products, formatMoney, onRemove, priceAlertProductIds, priceAlertsError, onRetryPriceAlerts, priceAlertBusyProductId, restockBusyVariantId, onTogglePriceAlert, onNotifyWhenRestocked, onAddToCart, cartReady, cartSyncStatus, cartSyncError, onRetryCart, addingToCart, addToCartError, onRetry }: WishlistPageProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({})
  const activeList = lists.find((list) => list.id === activeListId)
  const [newListName, setNewListName] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [listActionError, setListActionError] = useState('')
  const [shareLink, setShareLink] = useState('')

  // The input is intentionally reset when the selected server-backed list changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setRenameValue(activeList?.name ?? ''), [activeList?.id, activeList?.name])

  const runListAction = async (action: () => Promise<unknown>) => {
    setListActionError('')
    try {
      await action()
    } catch (actionError) {
      setListActionError(actionError instanceof Error ? actionError.message : 'Không thể cập nhật danh sách.')
    }
  }

  return (
    <div className="container subpage account-page">
      <Link className="back-link" to="/account">← Tài khoản</Link>
      <p className="eyebrow">ĐÃ LƯU</p>
      <h1>Sản phẩm yêu thích</h1>
      <section className="wishlist-list-tools" aria-label="Quản lý danh sách yêu thích">
        <label>Danh sách
          <select aria-label="Chọn danh sách yêu thích" value={activeListId ?? ''} disabled={listsLoading || !lists.length} onChange={(event) => onSelectList(Number(event.target.value))}>
            {lists.map((list) => <option key={list.id} value={list.id}>{list.name} ({list.item_count})</option>)}
          </select>
        </label>
        <form onSubmit={(event) => { event.preventDefault(); void runListAction(async () => { await onCreateList(newListName); setNewListName('') }) }}>
          <label htmlFor="wishlist-new-list">Tạo danh sách</label>
          <div className="wishlist-list-form-row"><input id="wishlist-new-list" maxLength={80} value={newListName} onChange={(event) => setNewListName(event.target.value)} placeholder="Ví dụ: Đồ đi làm" /><button className="button dark" type="submit" disabled={!newListName.trim()}>Tạo</button></div>
        </form>
        {activeList && <>
          <form onSubmit={(event) => { event.preventDefault(); void runListAction(() => onRenameList(renameValue)) }}>
            <label htmlFor="wishlist-rename-list">Đổi tên danh sách đang chọn</label>
            <div className="wishlist-list-form-row"><input id="wishlist-rename-list" maxLength={80} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /><button className="button" type="submit" disabled={!renameValue.trim() || renameValue.trim() === activeList.name}>Lưu tên</button></div>
          </form>
          <div className="wishlist-list-actions">
            <button className="link-button" type="button" onClick={() => void runListAction(async () => { setShareLink((await onShareList(!activeList.share_token)) ?? '') })}>{activeList.share_token ? 'Tắt chia sẻ' : 'Tạo liên kết chia sẻ'}</button>
            <button className="link-button" type="button" onClick={() => void runListAction(onDeleteList)}>Xóa danh sách</button>
          </div>
          {(shareLink || (activeList.share_token ? `${window.location.origin}/shared-wishlist/${activeList.share_token}` : '')) && <p className="wishlist-share-link">Liên kết chia sẻ: <a href={shareLink || `${window.location.origin}/shared-wishlist/${activeList.share_token}`}>{shareLink || `${window.location.origin}/shared-wishlist/${activeList.share_token}`}</a></p>}
        </>}
        {listsError && <p role="alert">{listsError}</p>}
        {listActionError && <p role="alert">{listActionError}</p>}
      </section>
      {loading ? (
        <p className="state" aria-live="polite">Đang tải danh sách…</p>
      ) : error ? (
        <div className="empty" role="alert">
          <h2>Chưa tải được danh sách yêu thích</h2>
          <p>{error}</p>
          <button className="button dark" type="button" onClick={onRetry}>Thử lại</button>
        </div>
      ) : products.length ? (
        <div className="grid">
          {products.map((item) => {
            const variants = item.variants ?? []
            const availableVariants = variants.filter((variant) => variant.available_quantity > 0)
            const selectedVariantId = selectedVariants[item.id] ?? 0
            const selectedVariant = availableVariants.find((variant) => variant.id === selectedVariantId)
            const image = item.images?.[0]
            const mediaLabel = getMediaDisclosureLabel(image?.alt)
            return (
              <article className="card" key={item.id}>
                <Link to={`/products/${item.slug}`} className="art wishlist-product-art" aria-label={`Xem ${item.name}${mediaLabel ? `, ${mediaLabel}` : ''}`}>
                  <ResponsiveImage className="catalog-product-image" src={image?.url} srcSet={image?.srcset ?? undefined} alt={getProductImageAlt(image?.url, image?.alt, item.name)} width={800} height={1000} sizes="(max-width: 620px) 50vw, 25vw" />
                  {mediaLabel && <DemoConceptBadge label={mediaLabel} />}
                </Link>
                <div className="card-info">
                  <div><Link to={`/products/${item.slug}`}>{item.name}</Link></div>
                  <b>{formatMoney(item.price)}</b>
                </div>
                {variants.length > 0 ? <label className="wishlist-variant-picker">Màu và kích cỡ<select aria-label={`Chọn màu và kích cỡ cho ${item.name}`} value={selectedVariantId || ''} onChange={(event) => setSelectedVariants((current) => ({ ...current, [item.id]: Number(event.target.value) }))}><option value="">Chọn phân loại</option>{variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.available_quantity <= 0}>{[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku}{variant.available_quantity <= 0 ? ' · Hết hàng' : ` · Còn ${variant.available_quantity}`}</option>)}</select></label> : <p className="wishlist-unavailable">Chưa có biến thể để đặt hàng.</p>}
                <button className="link-button" type="button" disabled={priceAlertBusyProductId !== null || Boolean(priceAlertsError)} onClick={() => onTogglePriceAlert(item.id)}>{priceAlertBusyProductId === item.id ? 'Đang cập nhật…' : priceAlertProductIds.includes(item.id) ? 'Tắt báo giảm giá' : 'Báo khi giảm giá'}</button>
                {priceAlertsError && <div className="wishlist-cart-error" role="alert"><span>{priceAlertsError}</span><button className="link-button" type="button" onClick={onRetryPriceAlerts}>Thử lại</button></div>}
                {variants.filter((variant) => variant.available_quantity <= 0).map((variant) => <button className="link-button" type="button" key={`restock-${variant.id}`} disabled={restockBusyVariantId === variant.id} onClick={() => onNotifyWhenRestocked(item.id, variant.id)}>{restockBusyVariantId === variant.id ? 'Đang đăng ký…' : `Báo khi có hàng · ${[variant.color, variant.size].filter(Boolean).join(' · ') || variant.sku}`}</button>)}
                {addToCartError && <p className="auth-error" role="alert">{addToCartError}</p>}
                {cartSyncStatus === 'error' && <div className="wishlist-cart-error" role="alert"><span>{cartSyncError || 'Không thể đồng bộ giỏ hàng.'}</span><button className="link-button" type="button" onClick={onRetryCart}>Thử lại</button></div>}
                <button className="button dark full" type="button" disabled={!selectedVariant || !cartReady || addingToCart} onClick={() => selectedVariant && onAddToCart(item, selectedVariant.id, 1)}>{addingToCart ? 'Đang thêm…' : cartSyncStatus === 'loading' ? 'Đang đồng bộ giỏ…' : cartSyncStatus === 'error' ? 'Giỏ hàng chưa sẵn sàng' : selectedVariant ? 'Thêm vào giỏ' : availableVariants.length ? 'Chọn phân loại' : 'Tạm hết hàng'}</button>
                <button className="link-button" type="button" onClick={() => onRemove(item)}>Xóa khỏi yêu thích</button>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty">
          <img className="account-empty-illustration" src="/illustrations/empty-wishlist.svg" alt="" aria-hidden="true" />
          <h2>Danh sách yêu thích đang trống</h2>
          <p>Lưu những thiết kế bạn muốn xem lại.</p>
          <Link className="button dark" to="/products">Khám phá sản phẩm</Link>
        </div>
      )}
    </div>
  )
}
