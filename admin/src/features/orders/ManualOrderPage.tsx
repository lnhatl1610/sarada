import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { useDebouncedValue } from '../../lib/use-debounced-value'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { FormField } from '../../components/shared/form-field'
import { LocationFields } from './LocationFields'
import { provinceNameForCode, wardNameForCode } from './location-utils'
import { useTranslation } from 'react-i18next'
import { formatVnd } from '../../lib/date-format'

type VariantOption = { variant_id: number; product_name: string; sku: string; price: number; color: string | null; size: string | null; available: number }
type DraftItem = VariantOption & { quantity: number }
type ShippingOption = { id: number; name: string; fee: number }
type CustomerOption = { id: number; name: string; email: string; phone: string | null }

export function ManualOrderPage({ apiUrl, accessToken, onBack, onCreated }: { apiUrl: string; accessToken: string; onBack: () => void; onCreated: (id: number) => void }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const query = useDebouncedValue(search.trim())
  const [options, setOptions] = useState<VariantOption[]>([])
  const [items, setItems] = useState<DraftItem[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [provinceCode, setProvinceCode] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [street, setStreet] = useState('')
  const [note, setNote] = useState('')
  const [shippingMethods, setShippingMethods] = useState<ShippingOption[]>([])
  const [shippingMethodId, setShippingMethodId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const customerQuery = useDebouncedValue(customerSearch.trim())
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
  const [customerId, setCustomerId] = useState('')
  const confirmDiscard = useUnsavedFormGuard(Boolean(items.length || customerName || customerEmail || customerPhone || recipientName || recipientPhone || provinceCode || wardCode || street || note || shippingMethodId || couponCode))

  useEffect(() => {
    let active = true
    adminApiFetch(`${apiUrl}/admin/orders/manual-options?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      .then(async (response) => { const body = await response.json() as { data?: VariantOption[]; shipping_methods?: ShippingOption[] }; if (!response.ok) throw new Error(t('Không tải được danh sách biến thể.')); if (active) { setOptions(body.data ?? []); setShippingMethods(body.shipping_methods ?? []) } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : t('Không tải được sản phẩm.')) })
    return () => { active = false }
  }, [apiUrl, accessToken, query, t])

  useEffect(() => {
    let active = true
    adminApiFetch(`${apiUrl}/admin/orders/manual-customers?q=${encodeURIComponent(customerQuery)}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      .then(async (response) => { const body = await response.json() as { data?: CustomerOption[] }; if (!response.ok) throw new Error(); if (active) setCustomerOptions(body.data ?? []) })
      .catch(() => { if (active) setCustomerOptions([]) })
    return () => { active = false }
  }, [apiUrl, accessToken, customerQuery])

  const addItem = (variant: VariantOption) => setItems((current) => {
    const found = current.find((item) => item.variant_id === variant.variant_id)
    if (found) return current.map((item) => item.variant_id === variant.variant_id ? { ...item, quantity: Math.min(item.quantity + 1, variant.available) } : item)
    return [...current, { ...variant, quantity: 1 }]
  })
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const fieldError = (key: string) => fieldErrors[key]?.[0]
  const clearFieldError = (key: string) => setFieldErrors((current) => { const next = { ...current }; delete next[key]; return next })
  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))
    setFieldErrors((current) => Object.fromEntries(Object.entries(current).flatMap(([key, value]) => {
      const match = key.match(/^items\.(\d+)\.(.+)$/)
      if (!match) return [[key, value]]
      const errorIndex = Number(match[1])
      if (errorIndex === index) return []
      return [[errorIndex > index ? `items.${errorIndex - 1}.${match[2]}` : key, value]]
    })))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setFieldErrors({})
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/orders/manual`, {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ customer_id: customerId ? Number(customerId) : null, customer_name: customerName, customer_email: customerEmail || null, customer_phone: customerPhone, shipping_address: { recipient_name: recipientName, phone: recipientPhone, province_code: provinceCode, province: provinceNameForCode(provinceCode), district_code: null, ward_code: wardCode, ward: wardNameForCode(provinceCode, wardCode), street }, shipping_method_id: shippingMethodId ? Number(shippingMethodId) : null, coupon_code: couponCode || null, items: items.map(({ variant_id, quantity }) => ({ variant_id, quantity })), note: note || null }),
      })
      const body = await response.json() as { data?: { id: number }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) {
        if (body.errors) setFieldErrors(body.errors)
        throw new Error(body.errors ? t('Vui lòng kiểm tra các trường được đánh dấu.') : body.message ?? t('Không tạo được đơn hàng.'))
      }
       confirmDiscard.clear()
       onCreated(body.data.id)
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Không tạo được đơn hàng.')) }
    finally { setBusy(false) }
  }

  return <section className="page-content manual-order-page">
    <header className="page-heading"><div><button className="secondary" type="button" onClick={() => { if (confirmDiscard()) onBack() }}>{t('← Quay lại đơn hàng')}</button><h1>{t('Tạo đơn thủ công')}</h1><p>{t('Thêm sản phẩm và thông tin giao hàng. Giá và tồn kho sẽ được xác nhận lại trên máy chủ.')}</p></div></header>
    <form className="manual-order-form" onSubmit={submit}>
      <section className="panel"><h2>{t('Thông tin khách hàng')}</h2><div className="manual-order-grid"><FormField id="manual-customer-search" label={t('Chọn khách hàng có sẵn')} hint={t('Bỏ trống để tạo đơn cho khách mới hoặc khách vãng lai.')} className="manual-order-wide" error={fieldError('customer_id')}><input list="manual-order-customers" placeholder={t('Tìm tên, email hoặc số điện thoại')} value={customerSearch} onChange={(e) => { clearFieldError('customer_id'); const value = e.target.value; setCustomerSearch(value); const match = customerOptions.find((customer) => `${customer.name} · ${customer.email} · ${customer.phone ?? ''}` === value); if (match) { clearFieldError('customer_name'); clearFieldError('customer_email'); clearFieldError('customer_phone'); clearFieldError('shipping_address.recipient_name'); clearFieldError('shipping_address.phone'); setCustomerId(String(match.id)); setCustomerName(match.name); setCustomerEmail(match.email); setCustomerPhone(match.phone ?? ''); setRecipientName(match.name); setRecipientPhone(match.phone ?? '') } else setCustomerId('') }} /></FormField><datalist id="manual-order-customers">{customerOptions.map((customer) => <option key={customer.id} value={`${customer.name} · ${customer.email} · ${customer.phone ?? ''}`} />)}</datalist><FormField id="manual-customer-name" label={t('Họ tên')} required error={fieldError('customer_name')}><input required value={customerName} onChange={(e) => { clearFieldError('customer_name'); clearFieldError('customer_id'); setCustomerId(''); setCustomerName(e.target.value); if (!recipientName) setRecipientName(e.target.value) }} /></FormField><FormField id="manual-customer-phone" label={t('Số điện thoại')} required error={fieldError('customer_phone')}><input required value={customerPhone} onChange={(e) => { clearFieldError('customer_phone'); clearFieldError('customer_id'); setCustomerId(''); setCustomerPhone(e.target.value); if (!recipientPhone) setRecipientPhone(e.target.value) }} /></FormField><FormField id="manual-customer-email" label={t('Email')} error={fieldError('customer_email')}><input type="email" value={customerEmail} onChange={(e) => { clearFieldError('customer_email'); clearFieldError('customer_id'); setCustomerId(''); setCustomerEmail(e.target.value) }} /></FormField></div></section>
      <section className="panel"><h2>{t('Sản phẩm')}</h2><input aria-label={t('Tìm sản phẩm theo tên hoặc SKU')} placeholder={t('Tìm sản phẩm theo tên hoặc SKU')} value={search} onChange={(e) => setSearch(e.target.value)} /><div className="manual-order-options">{options.map((option) => <button type="button" key={option.variant_id} disabled={!option.available} onClick={() => { clearFieldError('items'); addItem(option) }}><strong>{option.product_name}</strong><span>{t('SKU {{sku}} · {{variant}} · Còn {{available}}', { sku: option.sku, variant: [option.color, option.size].filter(Boolean).join(' / ') || t('Mặc định'), available: option.available })}</span><b>{formatVnd(option.price)}</b></button>)}</div>{fieldError('items') && <p className="shared-field-error" role="alert">{fieldError('items')}</p>}{items.map((item, index) => <div className="manual-order-line" key={item.variant_id}><span>{item.product_name}<small>{item.sku}</small>{fieldError(`items.${index}.variant_id`) && <small className="shared-field-error" role="alert">{fieldError(`items.${index}.variant_id`)}</small>}</span><div className="manual-order-quantity"><label htmlFor={`manual-order-quantity-${item.variant_id}`}>{t('Số lượng')}</label><input id={`manual-order-quantity-${item.variant_id}`} aria-label={t('Số lượng {{sku}}', { sku: item.sku })} type="number" min="1" max={item.available} value={item.quantity} aria-invalid={Boolean(fieldError(`items.${index}.quantity`))} aria-describedby={fieldError(`items.${index}.quantity`) ? `manual-order-quantity-${item.variant_id}-error` : undefined} onChange={(e) => { clearFieldError(`items.${index}.quantity`); setItems((current) => current.map((line) => line.variant_id === item.variant_id ? { ...line, quantity: Math.max(1, Math.min(item.available, Number(e.target.value))) } : line)) }} />{fieldError(`items.${index}.quantity`) && <small id={`manual-order-quantity-${item.variant_id}-error`} className="shared-field-error" role="alert">{fieldError(`items.${index}.quantity`)}</small>}</div><strong>{formatVnd(item.price * item.quantity)}</strong><button type="button" className="link-button" onClick={() => removeItem(index)}>{t('Xóa')}</button></div>)}</section>
      <section className="panel"><h2>{t('Địa chỉ giao hàng')}</h2><div className="manual-order-grid"><FormField id="manual-recipient-name" label={t('Người nhận')} required error={fieldError('shipping_address.recipient_name')}><input required value={recipientName} onChange={(e) => { clearFieldError('shipping_address.recipient_name'); setRecipientName(e.target.value) }} /></FormField><FormField id="manual-recipient-phone" label={t('Số điện thoại nhận')} required error={fieldError('shipping_address.phone')}><input required value={recipientPhone} onChange={(e) => { clearFieldError('shipping_address.phone'); setRecipientPhone(e.target.value) }} /></FormField><LocationFields idPrefix="manual-order" provinceCode={provinceCode} wardCode={wardCode} onProvinceChange={(value) => { clearFieldError('shipping_address.province_code'); clearFieldError('shipping_address.ward_code'); setProvinceCode(value) }} onWardChange={(value) => { clearFieldError('shipping_address.ward_code'); setWardCode(value) }} provinceError={fieldError('shipping_address.province_code')} wardError={fieldError('shipping_address.ward_code')} /><FormField id="manual-street" label={t('Địa chỉ cụ thể')} required className="manual-order-wide" error={fieldError('shipping_address.street')}><input required value={street} onChange={(e) => { clearFieldError('shipping_address.street'); setStreet(e.target.value) }} /></FormField><FormField id="manual-shipping-method" label={t('Phương thức vận chuyển')} error={fieldError('shipping_method_id')}><select value={shippingMethodId} onChange={(e) => { clearFieldError('shipping_method_id'); setShippingMethodId(e.target.value) }}><option value="">{t('Mặc định cửa hàng')}</option>{shippingMethods.map((method) => <option key={method.id} value={method.id}>{t('{{method}} · {{fee}}', { method: method.name, fee: formatVnd(method.fee) })}</option>)}</select></FormField><FormField id="manual-coupon-code" label={t('Mã giảm giá')} error={fieldError('coupon_code')}><input value={couponCode} onChange={(e) => { clearFieldError('coupon_code'); setCouponCode(e.target.value.toUpperCase()) }} /></FormField><FormField id="manual-order-note" label={t('Ghi chú nội bộ')} className="manual-order-wide" error={fieldError('note')}><input value={note} onChange={(e) => { clearFieldError('note'); setNote(e.target.value) }} /></FormField></div></section>
      <section className="panel manual-order-summary"><h2>{t('Thanh toán')}</h2><p>{t('Phương thức mặc định:')} <strong>COD</strong></p><p>{t('Tạm tính:')} <strong>{formatVnd(subtotal)}</strong></p><small>{t('Phí vận chuyển, mã giảm giá và tổng tiền được tính lại từ cấu hình máy chủ.')}</small><p className="auth-error" role="alert">{error}</p><button className="primary" type="submit" disabled={busy || !items.length}>{busy ? t('Đang tạo đơn…') : t('Xác nhận tạo đơn')}</button></section>
    </form>
  </section>
}
