import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import type { AddressOption, ShippingFee } from '../checkout/address-api'
import { getAvailableCoupons, previewCartQuote, type AvailableCoupon, type CartCheckoutQuote } from './cart-api'
import type { CartLine } from './cart-types'
import './CartPromotionBox.css'

const couponSchema = z.object({
  couponCode: z.string().trim().max(100, 'Mã giảm giá không được quá 100 ký tự.'),
})
type CouponFormValues = z.infer<typeof couponSchema>

type CartPromotionBoxProps = {
  accessToken: string
  customerId: number | null
  initialCouponCode?: string
  cartToken: string
  cart: CartLine[]
  subtotal: number | null
  provinces: AddressOption[]
  provincesLoading: boolean
  provincesError: boolean
  provinceCode: string
  shippingThreshold?: number | null
  shippingFee?: ShippingFee
  shippingThresholdLoading: boolean
  shippingThresholdError: boolean
  onProvinceChange: (code: string) => void
  onRetryProvinces: () => void
  onRetryShippingThreshold: () => void
  onCouponApplied: (couponCode: string) => void
  formatMoney: (amount: number) => string
}

export function CartPromotionBox({
  accessToken,
  customerId,
  initialCouponCode = '',
  cartToken,
  cart,
  subtotal,
  provinces,
  provincesLoading,
  provincesError,
  provinceCode,
  shippingThreshold,
  shippingFee,
  shippingThresholdLoading,
  shippingThresholdError,
  onProvinceChange,
  onRetryProvinces,
  onRetryShippingThreshold,
  onCouponApplied,
  formatMoney,
}: CartPromotionBoxProps) {
  const { control, register, handleSubmit, setValue, formState: { errors: formErrors } } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: { couponCode: initialCouponCode },
  })
  const couponField = register('couponCode')
  const couponDraft = useWatch({ control, name: 'couponCode' })
  const [quoteState, setQuoteState] = useState<{ signature: string; quote: CartCheckoutQuote } | null>(null)
  const [errorState, setErrorState] = useState<{ signature: string; message: string } | null>(null)
  const normalizedCoupon = couponDraft.trim().toUpperCase()
  const cartSignature = JSON.stringify(cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity })))
  const availableCouponsQuery = useQuery({
    queryKey: ['storefront', 'available-coupons', cartToken, customerId, cartSignature],
    queryFn: ({ signal }) => getAvailableCoupons({ cartToken, accessToken: accessToken || undefined, signal }),
    enabled: cart.length > 0,
    staleTime: 30_000,
  })
  const signature = JSON.stringify({
    provinceCode,
    couponCode: normalizedCoupon,
    cartToken,
    customerId,
    items: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity, price: line.product.price })),
  })
  const currentSignature = useRef(signature)
  const initialCoupon = useRef(initialCouponCode.trim().toUpperCase())
  const initialCouponRequest = useRef('')
  useEffect(() => { currentSignature.current = signature }, [signature])
  const quote = quoteState?.signature === signature ? quoteState.quote : null
  const error = errorState?.signature === signature ? errorState.message : ''
  const repricedLines = quote?.items.flatMap((quotedItem) => {
    const line = cart.find((cartLine) => cartLine.variantId === quotedItem.variant_id)
    return line && line.product.price !== quotedItem.unit_price
      ? [{ name: line.product.name, previousPrice: line.product.price, currentPrice: quotedItem.unit_price }]
      : []
  }) ?? []

  const quoteMutation = useMutation({
    mutationFn: ({ couponCode }: { couponCode: string; requestSignature: string }) =>
      previewCartQuote({ cartToken, accessToken: accessToken || undefined, provinceCode, couponCode }),
    onMutate: () => setErrorState(null),
    onSuccess: (result, { requestSignature }) => {
      if (currentSignature.current !== requestSignature) return
      setQuoteState({ signature: requestSignature, quote: result })
      onCouponApplied(result.coupon_code ?? '')
    },
    onError: (requestError, { requestSignature }) => {
      if (currentSignature.current === requestSignature) {
        setErrorState({ signature: requestSignature, message: requestError instanceof Error ? requestError.message : 'Không thể tính báo giá giỏ hàng.' })
      }
    },
  })
  const pending = quoteMutation.isPending

  const requestQuote = (couponCode = normalizedCoupon) => {
    if (!provinceCode || !cart.length || pending) return
    const requestSignature = JSON.stringify({
      provinceCode,
      couponCode: couponCode.trim().toUpperCase(),
      cartToken,
      customerId,
      items: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity, price: line.product.price })),
    })
    quoteMutation.mutate({ couponCode, requestSignature })
  }

  useEffect(() => {
    const couponCode = initialCoupon.current
    if (!couponCode || !provinceCode || !cart.length || pending || normalizedCoupon !== couponCode || quote?.coupon_code === couponCode) return
    const requestKey = JSON.stringify({ couponCode, provinceCode, cartToken, customerId, cartSignature })
    if (initialCouponRequest.current === requestKey) return
    initialCouponRequest.current = requestKey
    requestQuote(couponCode)
  }, [provinceCode, cart.length, pending, normalizedCoupon, quote?.coupon_code, cartToken, customerId, cartSignature])

  useEffect(() => {
    if (initialCoupon.current && normalizedCoupon !== initialCoupon.current) initialCoupon.current = ''
  }, [normalizedCoupon])

  const removeCoupon = () => {
    setValue('couponCode', '', { shouldValidate: true })
    void requestQuote('')
  }

  const submitCoupon = (values: CouponFormValues) => {
    void requestQuote(values.couponCode.toUpperCase())
  }

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(submitCoupon)(event)
  }

  const selectCoupon = (coupon: AvailableCoupon) => {
    if (!coupon.eligible || !provinceCode || pending) return
    setValue('couponCode', coupon.code, { shouldValidate: true })
    onCouponApplied('')
    void requestQuote(coupon.code)
  }

  const couponOfferDescription = (coupon: AvailableCoupon) => {
    if (coupon.description) return coupon.description
    if (coupon.type === 'percent') return `Giảm ${coupon.value}%${coupon.max_discount ? `, tối đa ${formatMoney(coupon.max_discount)}` : ''}`
    if (coupon.type === 'free_ship') return 'Miễn phí giao hàng'
    return `Giảm ${formatMoney(coupon.value)}`
  }

  return <section className="cart-promotion-box" aria-labelledby="cart-promotion-title">
    <h3 id="cart-promotion-title">Ưu đãi &amp; giao hàng</h3>
    <label htmlFor="cart-shipping-province">Tỉnh / thành giao hàng</label>
    <select id="cart-shipping-province" value={provinceCode} disabled={provincesLoading || provincesError} onChange={(event) => { onCouponApplied(''); onProvinceChange(event.target.value) }}>
      <option value="">{provincesLoading ? 'Đang tải tỉnh / thành…' : 'Chọn tỉnh / thành'}</option>
      {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
    </select>
    {provincesError && <p className="cart-promotion-message" role="alert">Không tải được danh sách tỉnh / thành. <button type="button" onClick={onRetryProvinces}>Thử lại</button></p>}
    {shippingThresholdLoading && <p className="cart-promotion-message" role="status">Đang tải ưu đãi giao hàng…</p>}
    {shippingThresholdError && <p className="cart-promotion-message" role="alert">Không tải được ngưỡng miễn phí giao hàng. <button type="button" onClick={onRetryShippingThreshold}>Thử lại</button></p>}
    {!shippingThresholdLoading && !shippingThresholdError && shippingThreshold === 0 && <p className="cart-promotion-message">Tỉnh / thành này đang được miễn phí giao hàng.</p>}
    {!shippingThresholdLoading && !shippingThresholdError && shippingThreshold != null && shippingThreshold > 0 && subtotal === null && <p className="cart-promotion-message" role="status">Đang đồng bộ giá sản phẩm để tính ưu đãi giao hàng…</p>}
    {!shippingThresholdLoading && !shippingThresholdError && shippingThreshold != null && shippingThreshold > 0 && subtotal !== null && (() => {
      const remaining = Math.max(0, shippingThreshold - subtotal)
      const progress = Math.min(100, Math.round((subtotal / shippingThreshold) * 100))
      return <div className="cart-free-shipping">
        <div className="cart-free-shipping-track" role="progressbar" aria-label="Tiến trình miễn phí giao hàng" aria-valuemin={0} aria-valuemax={shippingThreshold} aria-valuenow={Math.min(subtotal, shippingThreshold)}><span style={{ width: `${progress}%` }} /></div>
        <p>{remaining ? `Mua thêm ${formatMoney(remaining)} để được miễn phí giao hàng.` : 'Đơn hàng đã đạt ngưỡng miễn phí giao hàng.'}</p>
      </div>
    })()}
    <form className="cart-coupon-form" onSubmit={submitForm} noValidate>
      <label htmlFor="cart-coupon-code">Mã giảm giá</label>
      <div><input id="cart-coupon-code" autoCapitalize="characters" maxLength={100} aria-invalid={Boolean(formErrors.couponCode)} aria-describedby={formErrors.couponCode ? 'cart-coupon-code-error' : undefined} {...couponField} onChange={(event) => { void couponField.onChange(event); onCouponApplied('') }} placeholder="Nhập mã ưu đãi" /><button type="submit" disabled={pending || !cart.length || !provinceCode}>{pending ? 'Đang kiểm tra…' : quote?.coupon_code ? 'Cập nhật' : 'Áp dụng'}</button></div>
      {formErrors.couponCode && <p id="cart-coupon-code-error" className="cart-coupon-error" role="alert">{formErrors.couponCode.message}</p>}
    </form>
    <div className="cart-coupon-offers" aria-labelledby="cart-coupon-offers-title">
      <h4 id="cart-coupon-offers-title">Mã ưu đãi hiện có</h4>
      {availableCouponsQuery.isLoading && <p className="cart-promotion-message" role="status">Đang tải mã ưu đãi…</p>}
      {availableCouponsQuery.isError && <p className="cart-coupon-error" role="alert">{availableCouponsQuery.error.message} <button type="button" onClick={() => { void availableCouponsQuery.refetch() }}>Thử lại</button></p>}
      {availableCouponsQuery.isSuccess && availableCouponsQuery.data.length === 0 && <p className="cart-promotion-message">Hiện chưa có mã ưu đãi đang hoạt động.</p>}
      {availableCouponsQuery.data?.map((coupon) => <article className="cart-coupon-offer" key={coupon.id}>
        <div><strong>{coupon.code}</strong><p>{couponOfferDescription(coupon)}</p><small>Đơn tối thiểu {formatMoney(coupon.min_order_value)}{coupon.ends_at ? ` · Hết hạn ${new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(coupon.ends_at))}` : ''}</small>
          {!coupon.eligible && coupon.unavailable_reason && <small className="cart-coupon-reason">{coupon.unavailable_reason}</small>}
        </div>
        <button type="button" disabled={!coupon.eligible || !provinceCode || pending} onClick={() => selectCoupon(coupon)}>{coupon.eligible ? 'Dùng mã' : 'Chưa đủ điều kiện'}</button>
      </article>)}
      {!provinceCode && availableCouponsQuery.data?.length ? <p className="cart-promotion-message">Chọn tỉnh / thành để dùng mã và tính phí giao hàng.</p> : null}
    </div>
    {!provinceCode && <p className="cart-promotion-message">Chọn tỉnh / thành để kiểm tra mã và tính phí giao hàng.</p>}
    {error && <p className="cart-coupon-error" role="alert">{error}</p>}
    {repricedLines.length > 0 && <div className="cart-price-change" role="status" aria-live="polite">
      <strong>Giá sản phẩm đã được cập nhật theo báo giá mới:</strong>
      <ul>{repricedLines.map((line, index) => <li key={`${line.name}-${index}`}>{line.name}: {formatMoney(line.previousPrice)} → {formatMoney(line.currentPrice)} mỗi sản phẩm.</li>)}</ul>
    </div>}
    {quote?.coupon_code && <p className="cart-coupon-applied" role="status">Đã áp dụng {quote.coupon_code}, giảm {formatMoney(quote.discount_total)}. <button type="button" disabled={pending} onClick={removeCoupon}>Gỡ mã</button></p>}
    {provinceCode && <button className="cart-quote-button" type="button" disabled={pending || !cart.length} onClick={() => void requestQuote('')}>{pending ? 'Đang tính…' : 'Tính báo giá'}</button>}
    <dl className="cart-quote-breakdown">
      <div><dt>Tạm tính</dt><dd>{quote ? formatMoney(quote.subtotal) : subtotal === null ? 'Đang đồng bộ giá…' : formatMoney(subtotal)}</dd></div>
      {quote?.coupon_code && <div><dt>Giảm giá</dt><dd>− {formatMoney(quote.discount_total)}</dd></div>}
      <div><dt>Giao hàng</dt><dd>{quote ? formatMoney(quote.shipping_fee) : shippingFee ? formatMoney(shippingFee.fee) : provinceCode ? 'Tính sau khi báo giá' : 'Chọn tỉnh / thành'}</dd></div>
      {quote && <div className="cart-quote-total"><dt>Tổng cộng</dt><dd>{formatMoney(quote.grand_total)}</dd></div>}
    </dl>
    {!quote && <p className="cart-promotion-message">Tổng cuối cùng được xác nhận sau khi tính báo giá theo tỉnh / thành.</p>}
  </section>
}
