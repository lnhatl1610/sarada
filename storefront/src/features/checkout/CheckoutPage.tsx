import { useEffect, useState } from 'react'
import { useForm, useWatch, type FieldErrors, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { LockKeyhole } from 'lucide-react'
import type { CustomerAddress } from '../account/account-api'
import type { AddressOption } from './address-api'
import type { components } from '../../types/api'
import { checkoutSchema, type CheckoutFormInput, type CheckoutFormValues } from './checkout-schema'
import { StorefrontBrand } from '../home/StorefrontBrand'
import './CheckoutPage.css'

type CheckoutQuote = components['schemas']['CheckoutQuote']
type CheckoutCartLine = { product: { id: number; name: string; price: number }; quantity: number; variantId?: number | null }


type CheckoutPageProps = {
  storeName: string
  initialCouponCode: string
  codEnabled: boolean | undefined
  bankTransferEnabled: boolean | undefined
  configurationLoading: boolean
  configurationError: boolean
  onRetryConfiguration: () => void
  addresses: CustomerAddress[]
  addressError: string
  provinces: AddressOption[]
  wards: AddressOption[]
  locationsLoading: boolean
  locationsError: boolean
  shippingThreshold: number | null | undefined
  shippingThresholdLoading: boolean
  shippingThresholdError: boolean
  onRetryLocations: () => void
  onRetryShippingThreshold: () => void
  previewBusy: boolean
  previewError: string
  onClearPreview: () => void
  cartReady: boolean
  cartError: string
  cartExpired: boolean
  cartHasUnavailableItems: boolean
  onRetryCart: () => void
  onProvinceChange: (provinceCode: string) => void
  onSubmit: (values: CheckoutFormValues) => Promise<{ errors?: Record<string, string[]> } | void>
  onPreview: (provinceCode: string, wardCode: string | null, couponCode: string, shippingMethodId: number | null, usePoints: boolean, fulfillmentType: 'delivery' | 'pickup', pickupLocationId: number | null) => void
  authenticated: boolean
  membershipPointsAvailable: number
  membershipLoading: boolean
  membershipError: string
  onRetryMembership: () => void
  cart: CheckoutCartLine[]
  checkoutBusy: boolean
  quote: CheckoutQuote | null
  pickupLocations: components['schemas']['PickupLocation'][]
  pickupLocationsLoading: boolean
  pickupLocationsError: boolean
  money: (amount: number) => string
}

const emptyDraft: CheckoutFormValues = {
  payment_method: 'cod', fulfillment_type: 'delivery', pickup_location_id: '',
  customer_name: '', customer_phone: '', customer_email: '', newsletter_consent: false, province_code: '',
  district_code: '', ward_code: '', street: '', shipping_method_id: '', coupon_code: '', use_points: false, note: '',
  invoice_requested: false, invoice_tax_code: '', invoice_company_name: '', invoice_address: '',
}

export function CheckoutPage({ storeName, initialCouponCode, codEnabled, bankTransferEnabled, configurationLoading, configurationError, onRetryConfiguration, addresses, addressError, provinces, wards, locationsLoading, locationsError, shippingThreshold, shippingThresholdLoading, shippingThresholdError, onRetryLocations, onRetryShippingThreshold, previewBusy, previewError, onClearPreview, cartReady, cartError, cartExpired, cartHasUnavailableItems, onRetryCart, onProvinceChange, onSubmit, onPreview, authenticated, membershipPointsAvailable, membershipLoading, membershipError, onRetryMembership, cart, checkoutBusy, quote, money, pickupLocations, pickupLocationsLoading, pickupLocationsError }: CheckoutPageProps) {
  const { control, register, setValue, setError, trigger, handleSubmit, formState: { errors } } = useForm<CheckoutFormInput, undefined, CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { ...emptyDraft, coupon_code: initialCouponCode, payment_method: 'cod' },
  })
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [cartValidationError, setCartValidationError] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState('')
  const [checkoutStep, setCheckoutStep] = useState(1)
  const [isCompactCheckout, setIsCompactCheckout] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 850px)').matches)
  const [summaryExpanded, setSummaryExpanded] = useState(() => typeof window !== 'undefined' && !window.matchMedia('(max-width: 850px)').matches)
  const shippingMethods = quote?.shipping_methods ?? []
  const draft = useWatch({ control, defaultValue: emptyDraft })
  const provinceCode = draft.province_code ?? ''
  const fulfillmentType = draft.fulfillment_type ?? 'delivery'
  const cartUnavailableForSelection = draft.fulfillment_type === 'delivery' && cartHasUnavailableItems
  const paymentMethod = draft.payment_method ?? 'cod'
  const cartSignature = JSON.stringify(cart.map((line) => ({ variantId: line.variantId ?? line.product.id, quantity: line.quantity, price: line.product.price })))
  const selectedProvince = provinces.find((province) => province.code === draft.province_code)
  const selectedWard = wards.find((ward) => ward.code === draft.ward_code)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 850px)')
    const updateViewport = () => {
      setIsCompactCheckout(media.matches)
      setSummaryExpanded(!media.matches)
    }
    updateViewport()
    media.addEventListener('change', updateViewport)
    return () => media.removeEventListener('change', updateViewport)
  }, [])

  useEffect(() => {
    if (configurationLoading || configurationError) return
    if (codEnabled && paymentMethod === 'bank_transfer' && !bankTransferEnabled) setValue('payment_method', 'cod', { shouldValidate: true })
    else if (!codEnabled && bankTransferEnabled && paymentMethod === 'cod') setValue('payment_method', 'bank_transfer', { shouldValidate: true })
  }, [bankTransferEnabled, codEnabled, configurationError, configurationLoading, paymentMethod, setValue])

  const selectAddress = (id: string) => {
    setSelectedAddressId(id)
    const address = addresses.find((item) => String(item.id) === id)
    if (!address) return
    setValue('customer_name', address.recipient_name, { shouldValidate: true })
    setValue('customer_phone', address.phone, { shouldValidate: true })
    setValue('province_code', address.province_code, { shouldValidate: true })
    setValue('district_code', address.district_code ?? '')
    setValue('ward_code', address.ward_code, { shouldValidate: true })
    setValue('shipping_method_id', '', { shouldValidate: true })
    setValue('street', address.street, { shouldValidate: true })
    onProvinceChange(address.province_code)
  }

  const provinceField = register('province_code')
  const couponField = register('coupon_code')
  const submitCheckout = async (values: CheckoutFormValues) => {
    if (!termsAccepted) {
      setTermsError('Bạn cần đồng ý với điều khoản sử dụng trước khi đặt hàng.')
      return
    }
    setTermsError('')
    const result = await onSubmit(values)
    const serverErrors = result && 'errors' in result ? result.errors : undefined
    if (!serverErrors) return
    const cartErrorMessage = serverErrors.cart?.[0]
    if (cartErrorMessage) {
      setCartValidationError(cartErrorMessage)
      return
    }
    setCartValidationError('')

    const fields: Record<string, FieldPath<CheckoutFormValues>> = {
      customer_name: 'customer_name', customer_phone: 'customer_phone', customer_email: 'customer_email',
      'shipping_address.recipient_name': 'customer_name', 'shipping_address.phone': 'customer_phone',
      province_code: 'province_code', ward_code: 'ward_code', street: 'street',
      shipping_method_id: 'shipping_method_id', pickup_location_id: 'pickup_location_id',
      payment_method: 'payment_method',
      coupon_code: 'coupon_code', note: 'note', invoice_tax_code: 'invoice_tax_code', invoice_company_name: 'invoice_company_name', invoice_address: 'invoice_address',
    }
    for (const [key, messages] of Object.entries(serverErrors)) {
      const field = fields[key] ?? Object.entries(fields).find(([name]) => key.endsWith(`.${name}`))?.[1]
      if (field && messages[0]) setError(field, { type: 'server', message: messages[0] })
    }
    const contactError = ['customer_name', 'customer_phone', 'customer_email'].some((key) => Boolean(serverErrors[key]))
    const fulfillmentError = ['province_code', 'ward_code', 'street', 'shipping_method_id', 'pickup_location_id', 'coupon_code', 'invoice_tax_code', 'invoice_company_name', 'invoice_address'].some((key) => Boolean(serverErrors[key]))
    if (contactError || fulfillmentError) {
      const step = contactError ? 1 : 2
      setCheckoutStep(step)
      requestAnimationFrame(() => document.getElementById(`checkout-step-${step}`)?.focus({ preventScroll: true }))
    }
  }
  const handleInvalidCheckout = (invalidFields: FieldErrors<CheckoutFormValues>) => {
    const contactError = ['customer_name', 'customer_phone', 'customer_email'].some((field) => field in invalidFields)
    const step = contactError ? 1 : 'payment_method' in invalidFields ? 3 : 2
    setCheckoutStep(step)
    requestAnimationFrame(() => document.getElementById(`checkout-step-${step}`)?.focus({ preventScroll: true }))
  }
  const preview = () => {
    if (fulfillmentType === 'delivery' && !draft.province_code) {
      setValue('province_code', '', { shouldValidate: true })
      return
    }
    onPreview(draft.province_code ?? '', draft.ward_code || null, draft.coupon_code ?? '', draft.shipping_method_id ? Number(draft.shipping_method_id) : null, Boolean(draft.use_points), fulfillmentType, draft.pickup_location_id ? Number(draft.pickup_location_id) : null)
  }

  useEffect(() => {
    // Clear any quote tied to earlier address/coupon/cart values before scheduling the new server preview.
    onClearPreview()
    if (!cartReady || cartUnavailableForSelection || !cart.length || (fulfillmentType === 'delivery' && !provinceCode) || (fulfillmentType === 'pickup' && !draft.pickup_location_id)) return
    const timeout = window.setTimeout(() => onPreview(provinceCode, draft.ward_code || null, draft.coupon_code ?? '', draft.shipping_method_id ? Number(draft.shipping_method_id) : null, Boolean(draft.use_points), fulfillmentType, draft.pickup_location_id ? Number(draft.pickup_location_id) : null), 650)
    return () => window.clearTimeout(timeout)
  }, [cartReady, cartUnavailableForSelection, cart.length, cartSignature, provinceCode, draft.ward_code, draft.coupon_code, draft.shipping_method_id, draft.use_points, fulfillmentType, draft.pickup_location_id, onClearPreview, onPreview])

  if (cartReady && !cartError && !cartExpired && cart.length === 0) {
    return <div className="container subpage">
      <CheckoutMinimalHeader storeName={storeName} />
      <p className="eyebrow">THANH TOÁN</p>
      <h1>Hoàn tất đơn hàng</h1>
      <section className="empty checkout-empty-state" aria-labelledby="checkout-empty-title">
        <img className="storefront-state-illustration" src="/illustrations/empty-cart.svg" alt="" aria-hidden="true" />
        <h2 id="checkout-empty-title">Giỏ hàng của bạn đang trống</h2>
        <p>Thêm sản phẩm vào giỏ trước khi tiếp tục thanh toán.</p>
        <Link className="button dark" to="/products">Khám phá sản phẩm</Link>
      </section>
    </div>
  }

  return <div className="container subpage checkout-page">
    <CheckoutMinimalHeader storeName={storeName} />
    <p className="eyebrow">THANH TOÁN</p>
    <h1>Hoàn tất đơn hàng</h1>
    <nav className="checkout-progress-steps" aria-label="Tiến trình thanh toán">
      {['Thông tin', 'Vận chuyển', 'Thanh toán'].map((label, index) => {
        const step = index + 1
        const state = step === checkoutStep ? 'current' : step < checkoutStep ? 'complete' : 'upcoming'
        return <button key={label} type="button" disabled={step > checkoutStep} className={`checkout-progress-step is-${state}`} aria-current={step === checkoutStep ? 'step' : undefined} onClick={() => {
          setCheckoutStep(step)
          requestAnimationFrame(() => {
            const target = document.getElementById(`checkout-step-${step}`)
            target?.focus({ preventScroll: true })
            target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
          })
        }}>
          <span className="checkout-progress-step-number">{step < checkoutStep ? '✓' : step}</span>
          <span>{label}</span>
        </button>
      })}
    </nav>
    <div className="cart-layout checkout-layout">
      <form className="checkout" onSubmit={(event) => {
        if (checkoutStep !== 3) {
          event.preventDefault()
          return
        }
        void handleSubmit(submitCheckout, handleInvalidCheckout)(event)
      }} aria-busy={checkoutBusy} noValidate>
        {addressError && <p className="auth-error" role="alert">{addressError}</p>}
        {!cartReady && !cartError && <p className="cart-sync-state" role="status">Đang đồng bộ giỏ hàng…</p>}
        {cartError && <div className="cart-sync-error" role="alert"><span>{cartError}</span><button type="button" onClick={onRetryCart}>Thử lại</button></div>}
      {cartExpired && <div className="cart-sync-error" role="status"><span>Giỏ hàng đã hết hạn và các sản phẩm cũ đã được xóa. Quay lại giỏ để chọn sản phẩm mới trước khi thanh toán.</span><Link to="/cart">Mở giỏ hàng</Link></div>}
      {cartValidationError && <div className="cart-sync-error" role="alert"><span>{cartValidationError}</span><Link to="/cart">Kiểm tra giỏ hàng</Link></div>}
        {cartUnavailableForSelection && <p className="cart-stock-error" role="alert">Có sản phẩm trong giỏ vượt số lượng tồn giao hàng. <Link to="/cart">Quay lại giỏ hàng để điều chỉnh.</Link> Hoặc chọn nhận tại cửa hàng để kiểm tra tồn chi nhánh.</p>}
        <section className="checkout-stage" hidden={checkoutStep !== 1}>
        <h2 id="checkout-step-1" tabIndex={-1}>Thông tin người nhận</h2>
        {draft.fulfillment_type === 'delivery' && addresses.length > 0 && <label className="wide">Chọn địa chỉ đã lưu
          <select value={selectedAddressId} onChange={(event) => selectAddress(event.target.value)}>
            <option value="">Nhập địa chỉ mới</option>
            {addresses.map((address) => <option key={address.id} value={address.id}>{address.label === 'company' ? 'Công ty' : address.label === 'other' ? 'Khác' : 'Nhà'} · {address.recipient_name} · {address.ward_name ?? address.ward_code}, {address.province_name ?? address.province_code}{address.is_default ? ' · Mặc định giao hàng' : ''}</option>)}
          </select>
        </label>}
        <div className="fields">
          <label>Họ tên<input autoComplete="name" maxLength={160} aria-invalid={!!errors.customer_name} {...register('customer_name')} />{errors.customer_name && <small className="field-error" role="alert">{errors.customer_name.message}</small>}</label>
          <label>Số điện thoại<input autoComplete="tel" type="tel" maxLength={13} title="Nhập số điện thoại Việt Nam gồm 10 chữ số hoặc bắt đầu bằng +84" aria-invalid={!!errors.customer_phone} {...register('customer_phone')} />{errors.customer_phone && <small className="field-error" role="alert">{errors.customer_phone.message}</small>}</label>
          <label>Email<input autoComplete="email" type="email" aria-invalid={!!errors.customer_email} {...register('customer_email')} />{errors.customer_email && <small className="field-error" role="alert">{errors.customer_email.message}</small>}</label>
        </div>
        <div className="checkout-newsletter-opt-in">
          <label><input type="checkbox" {...register('newsletter_consent')} /> Tôi đồng ý nhận email về bộ sưu tập và ưu đãi từ SARADA.</label>
          <p>Đăng ký chỉ được gửi sau khi đặt hàng thành công. Bạn có thể hủy bất cứ lúc nào trong <Link to="/policies/privacy">Chính sách bảo mật</Link>.</p>
        </div>
        <div className="checkout-stage-actions">
          <Link className="button secondary" to="/cart">Quay lại giỏ hàng</Link>
          <button className="button dark" type="button" onClick={async () => {
            const valid = await trigger(['customer_name', 'customer_phone', 'customer_email'])
            if (!valid) return
            setCheckoutStep(2)
            requestAnimationFrame(() => document.getElementById('checkout-step-2')?.focus({ preventScroll: true }))
          }}>Tiếp tục · Vận chuyển</button>
        </div>
        </section>
        <section id="checkout-step-2" tabIndex={-1} className="checkout-stage" hidden={checkoutStep !== 2}>
        <h2>Vận chuyển và ưu đãi</h2>
        <fieldset className="wide checkout-fulfillment"><legend>Hình thức nhận hàng</legend>
          <label><input type="radio" value="delivery" {...register('fulfillment_type', { onChange: () => { setValue('pickup_location_id', ''); setValue('shipping_method_id', ''); onClearPreview() } })} /> Giao hàng</label>
          <label><input type="radio" value="pickup" {...register('fulfillment_type', { onChange: () => { setValue('shipping_method_id', ''); onClearPreview() } })} /> Nhận tại cửa hàng · miễn phí</label>
        </fieldset>
        {draft.fulfillment_type === 'pickup' && <label className="wide">Cửa hàng nhận hàng
          <select aria-invalid={Boolean(errors.pickup_location_id)} disabled={pickupLocationsLoading || pickupLocationsError} {...register('pickup_location_id', { onChange: () => onClearPreview() })}>
            <option value="">{pickupLocationsLoading ? 'Đang kiểm tra tồn ở cửa hàng…' : 'Chọn cửa hàng có đủ sản phẩm'}</option>
            {pickupLocations.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.address}, {location.province_name}</option>)}
          </select>
          {pickupLocationsError && <small role="alert">Không tải được tình trạng hàng tại cửa hàng. Vui lòng tải lại trang.</small>}
          {!pickupLocationsLoading && !pickupLocationsError && pickupLocations.length === 0 && <small role="status">Chưa có cửa hàng nào đủ toàn bộ sản phẩm trong giỏ để nhận.</small>}
          {errors.pickup_location_id && <small className="field-error" role="alert">{errors.pickup_location_id.message}</small>}
          {pickupLocations.find((location) => String(location.id) === draft.pickup_location_id) && <small>{pickupLocations.find((location) => String(location.id) === draft.pickup_location_id)?.opening_hours}</small>}
        </label>}
        <div className="fields">
          {draft.fulfillment_type === 'delivery' && <>
          <label>Tỉnh / thành
            <select aria-invalid={!!errors.province_code} disabled={locationsLoading || locationsError} {...provinceField} onChange={(event) => { void provinceField.onChange(event); setValue('ward_code', '', { shouldValidate: true }); setValue('district_code', ''); setValue('shipping_method_id', '', { shouldValidate: true }); onProvinceChange(event.target.value) }}>
              <option value="">Chọn tỉnh / thành</option>
              {draft.province_code && !selectedProvince && <option value={draft.province_code}>Địa chỉ cũ · {draft.province_code}</option>}
              {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
            </select>
            {errors.province_code && <small className="field-error" role="alert">{errors.province_code.message}</small>}
          </label>
          <label>Xã / phường
            <select aria-invalid={!!errors.ward_code} disabled={!draft.province_code || locationsLoading || locationsError} {...register('ward_code', { onChange: () => setValue('shipping_method_id', '', { shouldValidate: true }) })}>
              <option value="">{!draft.province_code ? 'Chọn tỉnh / thành trước' : locationsLoading ? 'Đang tải xã / phường…' : 'Chọn xã / phường'}</option>
              {draft.ward_code && !selectedWard && <option value={draft.ward_code}>Địa chỉ cũ · {draft.ward_code}</option>}
              {wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
            </select>
            {errors.ward_code && <small className="field-error" role="alert">{errors.ward_code.message}</small>}
          </label>
          <input type="hidden" {...register('district_code')} />
          <label className="wide">Phương thức giao hàng
            <select aria-label="Phương thức giao hàng" aria-invalid={Boolean(errors.shipping_method_id)} disabled={!provinceCode || locationsError || previewBusy || !shippingMethods.length} {...register('shipping_method_id')}>
              {shippingMethods.map((method) => <option key={method.id ?? 'province'} value={method.id ?? ''}>{method.name}{quote ? ` · ${money(method.fee)}` : ' · Đang tính lại phí'}{method.est_days ? ` · Dự kiến ${method.est_days}` : ''}</option>)}
            </select>
            {!provinceCode ? <small>Chọn tỉnh/thành để xem lựa chọn giao hàng.</small> : !shippingMethods.length ? <small role="status">{previewBusy ? 'Đang tải lựa chọn giao hàng…' : 'Chưa có lựa chọn giao hàng. Hãy tính báo giá để tải lại.'}</small> : quote?.shipping_method ? <small role="status">Đã chọn {quote.shipping_method.name}{quote.shipping_method.est_days ? ` · Dự kiến ${quote.shipping_method.est_days}` : ''}.</small> : null}
            {errors.shipping_method_id && <small className="field-error" role="alert">{errors.shipping_method_id.message}</small>}
          </label>
          {locationsError && <div className="wide location-load-error" role="alert"><span>Không tải được danh mục địa chỉ.</span><button type="button" onClick={onRetryLocations}>Thử lại</button></div>}
          <label className="wide">Địa chỉ cụ thể<input autoComplete="street-address" maxLength={255} placeholder="Số nhà, tên đường" aria-invalid={!!errors.street} {...register('street')} />{errors.street && <small className="field-error" role="alert">{errors.street.message}</small>}</label>
          </>}
          <label className="wide">Mã giảm giá<input autoCapitalize="characters" maxLength={100} placeholder="Nhập mã nếu có" aria-invalid={!!errors.coupon_code} {...couponField} onChange={(event) => { void couponField.onChange(event); onClearPreview() }} />{errors.coupon_code && <small className="field-error" role="alert">{errors.coupon_code.message}</small>}</label>
          {authenticated && <fieldset className="wide checkout-points-fields"><legend>Điểm thành viên</legend>{membershipLoading ? <p role="status">Đang tải số dư điểm…</p> : membershipError ? <p role="alert">Không tải được số dư điểm. <button className="text-button" type="button" onClick={onRetryMembership}>Thử lại</button></p> : membershipPointsAvailable > 0 ? <label><input type="checkbox" disabled={previewBusy || checkoutBusy} {...register('use_points')} /> Dùng {membershipPointsAvailable.toLocaleString('vi-VN')} điểm hiện có để giảm giá đơn hàng</label> : <p>Bạn chưa có điểm khả dụng.</p>}{draft.use_points && <small>Điểm được áp dụng vào tiền hàng sau mã giảm giá. Báo giá sẽ được tính lại từ máy chủ.</small>}</fieldset>}
          <label className="wide">Ghi chú giao hàng<textarea rows={3} maxLength={2000} aria-invalid={!!errors.note} {...register('note')} />{errors.note && <small className="field-error" role="alert">{errors.note.message}</small>}</label>
          <fieldset className="wide checkout-invoice-fields"><legend>Hóa đơn điện tử</legend><label className="checkout-invoice-toggle"><input type="checkbox" {...register('invoice_requested')} /> Tôi cần xuất hóa đơn VAT</label><p>Thông tin hóa đơn sẽ được gửi cho cửa hàng cùng đơn hàng.</p>{draft.invoice_requested && <div className="checkout-invoice-details"><label>Mã số thuế<input autoComplete="off" inputMode="numeric" maxLength={14} placeholder="0123456789" aria-invalid={!!errors.invoice_tax_code} {...register('invoice_tax_code')} />{errors.invoice_tax_code && <small className="field-error" role="alert">{errors.invoice_tax_code.message}</small>}</label><label>Tên công ty<input autoComplete="organization" maxLength={255} aria-invalid={!!errors.invoice_company_name} {...register('invoice_company_name')} />{errors.invoice_company_name && <small className="field-error" role="alert">{errors.invoice_company_name.message}</small>}</label><label className="wide">Địa chỉ xuất hóa đơn<textarea autoComplete="street-address" rows={2} maxLength={500} aria-invalid={!!errors.invoice_address} {...register('invoice_address')} />{errors.invoice_address && <small className="field-error" role="alert">{errors.invoice_address.message}</small>}</label></div>}</fieldset>
        </div>
        <button type="button" className="secondary quote-button" disabled={!cartReady || checkoutBusy || previewBusy || (draft.fulfillment_type === 'pickup' && !draft.pickup_location_id)} onClick={preview}>{previewBusy ? 'Đang tính phí và ưu đãi…' : draft.fulfillment_type === 'pickup' ? 'Tính lại tổng và xác nhận tồn kho' : 'Tính lại phí giao hàng và ưu đãi'}</button>
        {previewError && <p className="auth-error" role="alert">{previewError}</p>}
        <div className="checkout-stage-actions">
          <button className="button secondary" type="button" onClick={() => setCheckoutStep(1)}>Quay lại · Thông tin</button>
          <button className="button dark" type="button" disabled={!quote || previewBusy || Boolean(previewError) || locationsLoading || locationsError || cartUnavailableForSelection} onClick={async () => {
            const fields: FieldPath<CheckoutFormValues>[] = draft.fulfillment_type === 'delivery'
              ? ['province_code', 'ward_code', 'street', 'shipping_method_id', 'coupon_code', 'note']
              : ['pickup_location_id', 'coupon_code', 'note']
            if (draft.invoice_requested) fields.push('invoice_tax_code', 'invoice_company_name', 'invoice_address')
            if (!await trigger(fields)) return
            setCheckoutStep(3)
            requestAnimationFrame(() => document.getElementById('checkout-step-3')?.focus({ preventScroll: true }))
          }}>Tiếp tục · Thanh toán</button>
        </div>
        </section>
        <section className="checkout-stage" hidden={checkoutStep !== 3}>
        <h2 id="checkout-step-3" tabIndex={-1}>Thanh toán</h2>
        {configurationError ? <p className="cod-unavailable" role="alert">Không tải được phương thức thanh toán. <button className="text-button" type="button" onClick={onRetryConfiguration}>Thử lại</button></p> : configurationLoading ? <p className="cod-unavailable" role="status">Đang kiểm tra phương thức thanh toán…</p> : <fieldset className="checkout-payment-methods"><legend>Chọn phương thức</legend>
          {codEnabled && <label><input type="radio" value="cod" {...register('payment_method')} /> Thanh toán khi nhận hàng (COD)</label>}
          {bankTransferEnabled && <label><input type="radio" value="bank_transfer" {...register('payment_method')} /> Chuyển khoản ngân hàng / VietQR</label>}
          {!codEnabled && !bankTransferEnabled && <p className="cod-unavailable" role="status">Cửa hàng hiện chưa hỗ trợ phương thức thanh toán nào.</p>}
          {errors.payment_method && <small className="field-error" role="alert">{errors.payment_method.message}</small>}
        </fieldset>}
        <label className="checkout-terms"><input type="checkbox" checked={termsAccepted} aria-invalid={Boolean(termsError)} aria-describedby={termsError ? 'checkout-terms-error' : 'checkout-terms-help'} onChange={(event) => { setTermsAccepted(event.target.checked); if (event.target.checked) setTermsError('') }} /><span>Tôi đã đọc và đồng ý với <Link to="/pages/terms">điều khoản sử dụng</Link> và <Link to="/pages/privacy">chính sách bảo mật</Link>.</span></label>
        {termsError ? <small id="checkout-terms-error" className="field-error" role="alert">{termsError}</small> : <small id="checkout-terms-help" className="checkout-terms-help">Cần đồng ý để tiếp tục đặt hàng.</small>}
        <button className="button secondary full" type="button" onClick={() => setCheckoutStep(2)}>Quay lại · Vận chuyển</button>
        <button className="button dark full" disabled={(!codEnabled && !bankTransferEnabled) || configurationError || configurationLoading || !cartReady || cartUnavailableForSelection || checkoutBusy || !cart.length || locationsLoading || locationsError || !quote || previewBusy || Boolean(previewError)}>{checkoutBusy ? 'Đang gửi…' : configurationLoading ? 'Đang kiểm tra phương thức thanh toán…' : configurationError ? 'Không tải được phương thức thanh toán' : !codEnabled && !bankTransferEnabled ? 'Chưa có phương thức thanh toán' : previewBusy ? 'Đang xác nhận tổng…' : quote ? `Đặt hàng · ${money(quote.grand_total)}` : draft.fulfillment_type === 'pickup' && !draft.pickup_location_id ? 'Chọn cửa hàng nhận hàng' : draft.fulfillment_type === 'delivery' && !provinceCode ? 'Chọn tỉnh / thành để xem tổng' : 'Chờ báo giá để đặt hàng'}</button>
        </section>
      </form>
      <aside className="summary checkout-order-summary">
        <details className="checkout-summary-disclosure" open={!isCompactCheckout || summaryExpanded} onToggle={(event) => {
          if (isCompactCheckout) setSummaryExpanded(event.currentTarget.open)
          else if (!event.currentTarget.open) event.currentTarget.open = true
        }}>
        <summary><span className="checkout-summary-title">Đơn hàng của bạn</span><strong>{quote ? money(quote.grand_total) : 'Chờ báo giá'}</strong></summary>
        <div className="checkout-summary-content">
        {draft.fulfillment_type === 'delivery' && <>{shippingThresholdError ? <p className="free-shipping-state" role="status"><span>Chưa tải được ngưỡng miễn phí giao hàng.</span><button type="button" onClick={onRetryShippingThreshold}>Thử lại</button></p>
          : shippingThresholdLoading ? <p className="free-shipping-state" role="status">Đang tải ưu đãi giao hàng…</p>
            : shippingThreshold === 0 ? <p className="free-shipping-state">Đơn hàng được miễn phí giao hàng.</p>
              : shippingThreshold != null && shippingThreshold > 0 ? quote ? (() => {
                const subtotal = quote.subtotal
                const progress = Math.min(100, Math.round((subtotal / shippingThreshold) * 100))
                const remaining = Math.max(0, shippingThreshold - subtotal)
                return <section className="free-shipping-progress" aria-label="Tiến trình miễn phí giao hàng">
                  <div className="free-shipping-track" role="progressbar" aria-label="Tiến trình miễn phí giao hàng" aria-valuemin={0} aria-valuemax={shippingThreshold} aria-valuenow={Math.min(subtotal, shippingThreshold)}><span style={{ width: `${progress}%` }} /></div>
                  <p>{remaining ? `Mua thêm ${money(remaining)} để được miễn phí giao hàng.` : 'Đơn hàng đã đạt ngưỡng miễn phí giao hàng.'}</p>
                </section>
              })() : <p className="free-shipping-state" role="status">{provinceCode ? 'Tính báo giá để xem tiến trình miễn phí giao hàng.' : 'Chọn tỉnh / thành để tính ưu đãi giao hàng.'}</p> : null}</>}
        {cart.map((line) => {
          const quotedLine = quote?.items.find((item) => item.variant_id === line.variantId && item.quantity === line.quantity)
          return <p key={`${line.variantId ?? line.product.id}-${line.product.id}`}><span>{line.product.name} × {line.quantity}</span><b>{quotedLine ? money(quotedLine.line_total) : 'Chờ báo giá'}</b></p>
        })}
        <hr />
        <p><span>Tạm tính</span><b>{quote ? money(quote.subtotal) : 'Chưa có báo giá'}</b></p>
        {quote && <><p><span>Giảm giá mã</span><b>− {money(quote.coupon_discount_total)}</b></p>{quote.membership_points_used > 0 && <p><span>Điểm thành viên · {quote.membership_points_used.toLocaleString('vi-VN')} điểm</span><b>− {money(quote.membership_discount_total)}</b></p>}{quote.fulfillment_type === 'pickup' ? <p><span>Nhận hàng</span><b>Cửa hàng · miễn phí</b></p> : <><p><span>Giao hàng</span><b>{quote.shipping_method?.name ?? 'Theo tỉnh/thành'}</b></p>{quote.shipping_method?.est_days && <p><span>Dự kiến</span><b>{quote.shipping_method.est_days}</b></p>}<p><span>Phí vận chuyển</span><b>{money(quote.shipping_fee)}</b></p></>}</>}
        <p><b>Tổng cộng</b><b>{quote ? money(quote.grand_total) : 'Chưa có báo giá'}</b></p>
        </div>
        </details>
      </aside>
    </div>
  </div>
}

function CheckoutMinimalHeader({ storeName }: { storeName: string }) {
  return <header className="checkout-minimal-header">
    <StorefrontBrand name={storeName} />
    <span className="checkout-minimal-header__secure"><LockKeyhole aria-hidden="true" size={16} /> Thanh toán an toàn</span>
  </header>
}
