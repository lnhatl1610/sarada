import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { getMediaDisclosureLabel } from '../../components/shared/getMediaDisclosure'
import { getProductImageAlt } from '../../components/shared/product-image-alt'
import { formatVnd } from '../../lib/money'
import type { CatalogPageProduct } from './CatalogPage'

export function CatalogQuickView({ product, busy, cartSyncLoading, error, onAdd }: {
  product: CatalogPageProduct
  busy: boolean
  cartSyncLoading: boolean
  error: string
  onAdd: (product: CatalogPageProduct, variantId: number) => Promise<boolean>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [variantId, setVariantId] = useState<number | null>(null)
  const variants = product.variants ?? []
  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? variants.find((variant) => variant.available_quantity > 0) ?? variants[0]
  const colorOptions = [...new Map(variants.filter((variant) => variant.color_value_id !== null && variant.color).map((variant) => [variant.color_value_id!, variant])).values()]
  const colorVariants = selectedVariant?.color_value_id == null ? variants : variants.filter((variant) => variant.color_value_id === selectedVariant.color_value_id)
  const sizeOptions = [...new Map(colorVariants.filter((variant) => variant.size).map((variant) => [variant.size!, variant])).values()]
  const selectedImage = product.images?.find((image) => image.color_value_id === selectedVariant?.color_value_id) ?? product.images?.[0]
  const hasInventory = variants.length > 0

  function open(trigger: HTMLButtonElement) {
    triggerRef.current = trigger
    setVariantId(variants.find((variant) => variant.available_quantity > 0)?.id ?? variants[0]?.id ?? null)
    dialogRef.current?.showModal()
    window.requestAnimationFrame(() => closeRef.current?.focus())
  }

  function selectColor(colorValueId: number) {
    const matching = variants.filter((variant) => variant.color_value_id === colorValueId)
    const next = matching.find((variant) => variant.size === selectedVariant?.size && variant.available_quantity > 0)
      ?? matching.find((variant) => variant.available_quantity > 0)
      ?? matching[0]
    setVariantId(next?.id ?? null)
  }

  function selectSize(size: string) {
    const next = colorVariants.find((variant) => variant.size === size && variant.available_quantity > 0)
      ?? colorVariants.find((variant) => variant.size === size)
    setVariantId(next?.id ?? null)
  }

  async function addSelectedVariant() {
    if (selectedVariant?.available_quantity && selectedVariant.available_quantity > 0) {
      if (await onAdd(product, selectedVariant.id)) dialogRef.current?.close()
    }
  }

  return <>
    <button className="catalog-quick-view-trigger" type="button" aria-haspopup="dialog" onClick={(event) => open(event.currentTarget)}>
      Xem nhanh
    </button>
    <dialog ref={dialogRef} className="catalog-quick-view" aria-labelledby={`quick-view-title-${product.id}`} onClose={() => window.requestAnimationFrame(() => triggerRef.current?.focus())}>
      <div className="catalog-quick-view-content">
        <button ref={closeRef} className="catalog-quick-view-close" type="button" aria-label="Đóng xem nhanh" onClick={() => dialogRef.current?.close()}>×</button>
        <div className="catalog-quick-view-image">
          <ResponsiveImage src={selectedImage?.url} srcSet={selectedImage?.srcset ?? undefined} alt={getProductImageAlt(selectedImage?.url, selectedImage?.alt, product.name)} width={800} height={1000} loading="lazy" sizes="(max-width: 700px) 100vw, 45vw" />
          {getMediaDisclosureLabel(selectedImage?.alt) && <span className="sr-only">{getMediaDisclosureLabel(selectedImage?.alt)}</span>}
        </div>
        <div className="catalog-quick-view-details">
          <p className="eyebrow">XEM NHANH</p>
          <h2 id={`quick-view-title-${product.id}`}>{product.name}</h2>
          <p className="catalog-quick-view-price">{formatVnd(selectedVariant?.price ?? product.price)}{selectedVariant?.compare_at_price && selectedVariant.compare_at_price > (selectedVariant.price ?? product.price) && <del>{formatVnd(selectedVariant.compare_at_price)}</del>}</p>
          {product.short_description && <p>{product.short_description}</p>}
          {hasInventory && colorOptions.length > 0 && <label className="catalog-quick-view-field">Màu sắc
            <select value={selectedVariant?.color_value_id ?? ''} onChange={(event) => selectColor(Number(event.target.value))}>
              {colorOptions.map((variant) => <option key={variant.color_value_id} value={variant.color_value_id!}>{variant.color}</option>)}
            </select>
          </label>}
          {hasInventory && sizeOptions.length > 0 && <label className="catalog-quick-view-field">Kích cỡ
            <select value={selectedVariant?.size ?? ''} onChange={(event) => selectSize(event.target.value)}>
              {sizeOptions.map((variant) => <option key={variant.size} value={variant.size!} disabled={!colorVariants.some((choice) => choice.size === variant.size && choice.available_quantity > 0)}>{variant.size}{!colorVariants.some((choice) => choice.size === variant.size && choice.available_quantity > 0) ? ' · Hết hàng' : ''}</option>)}
            </select>
          </label>}
          <p className={selectedVariant?.available_quantity ? 'catalog-quick-view-stock available' : 'catalog-quick-view-stock unavailable'} role="status">
            {!hasInventory ? 'Chưa có thông tin tồn kho' : selectedVariant?.available_quantity ? selectedVariant.is_low_stock ? `Chỉ còn ${selectedVariant.available_quantity} sản phẩm` : 'Còn hàng' : 'Tạm hết hàng'}
          </p>
          <button className="button dark full" type="button" disabled={!selectedVariant || !selectedVariant.available_quantity || busy || cartSyncLoading} onClick={() => void addSelectedVariant()}>
            {busy ? 'Đang thêm…' : cartSyncLoading ? 'Đang đồng bộ giỏ…' : 'Thêm vào túi'}
          </button>
          {error && <p className="catalog-quick-view-error" role="alert">{error}</p>}
          <Link className="catalog-quick-view-detail-link" to={`/products/${product.slug}`} onClick={() => dialogRef.current?.close()}>Xem chi tiết sản phẩm</Link>
        </div>
      </div>
    </dialog>
  </>
}
