import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router'
import { api, getApiErrorMessage } from '../../lib/http'
import { trackStorefrontEvent } from '../privacy/cookie-consent'
import { subscribeToNewsletter } from '../marketing/newsletter-api'
import type { components, paths } from '../../types/api'
import type { CartLine, CartProduct } from '../cart/cart-types'
import type { CheckoutFormValues } from './checkout-schema'

export type CheckoutQuote = components['schemas']['CheckoutQuote']
type CheckoutPreviewPayload = paths['/checkout/preview']['post']['requestBody']['content']['application/json']
type PlaceOrderPayload = paths['/orders']['post']['requestBody']['content']['application/json']
type PlaceOrderVariables = { payload: PlaceOrderPayload; idempotencyKey: string }

type Options<TProduct extends CartProduct> = {
  accessToken: string
  cartToken: string
  customerId: number | null
  cart: CartLine<TProduct>[]
  setCart: Dispatch<SetStateAction<CartLine<TProduct>[]>>
  onToast: (message: string) => void
}

export function useCheckoutActions<TProduct extends CartProduct>({
  accessToken,
  cartToken,
  customerId,
  cart,
  setCart,
  onToast,
}: Options<TProduct>) {
  const navigate = useNavigate()
  const [quote, setQuote] = useState<CheckoutQuote | null>(null)
  const [previewError, setPreviewError] = useState('')
  const checkoutAttempt = useRef<{ signature: string; key: string } | null>(null)
  const pickupQuery = useQuery({
    queryKey: ['storefront', 'pickup-locations', cart.map((line) => `${line.variantId}:${line.quantity}`).join(',')],
    enabled: Boolean(cartToken || accessToken) && cart.length > 0,
    queryFn: async () => {
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (cartToken) headers['X-Cart-Token'] = cartToken
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`
      const { data } = await api.get<{ data: components['schemas']['PickupLocation'][] }>('/checkout/pickup-locations', { headers })
      return data.data
    },
  })
  const previewRequestId = useRef(0)
  const orderMutation = useMutation({
    mutationFn: async ({ payload, idempotencyKey }: PlaceOrderVariables) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Idempotency-Key': idempotencyKey,
      }
      if (cartToken) headers['X-Cart-Token'] = cartToken
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`
      const { data } = await api.post<components['schemas']['StorefrontPlacedOrderEnvelope']>('/orders', payload, { headers })
      return data
    },
  })
  const previewMutation = useMutation({
    mutationFn: async ({ provinceCode, wardCode, couponCode, shippingMethodId, usePoints, fulfillmentType, pickupLocationId }: { provinceCode: string; wardCode: string | null; couponCode: string; shippingMethodId: number | null; usePoints: boolean; fulfillmentType: 'delivery' | 'pickup'; pickupLocationId: number | null }) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
      if (cartToken) headers['X-Cart-Token'] = cartToken
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`
      const { data: body } = await api.post<components['schemas']['CheckoutQuoteEnvelope']>(
        '/checkout/preview',
        { fulfillment_type: fulfillmentType, ...(pickupLocationId ? { pickup_location_id: pickupLocationId } : {}), ...(provinceCode ? { province_code: provinceCode } : {}), ward_code: wardCode, coupon_code: couponCode.trim() || null, shipping_method_id: shippingMethodId, use_points: usePoints } satisfies CheckoutPreviewPayload,
        { headers },
      )
      if (!body.data) throw new Error('API không trả về báo giá thanh toán.')
      return body.data
    },
  })
  const { mutateAsync: requestCheckoutPreview, isPending: previewBusy, reset: resetPreviewMutation } = previewMutation
  const busy = orderMutation.isPending

  const placeOrder = async (values: CheckoutFormValues): Promise<{ errors?: Record<string, string[]> } | void> => {
    onToast('')
    if (busy) return

    const address = values.fulfillment_type === 'delivery' ? {
      recipient_name: values.customer_name,
      phone: values.customer_phone,
      province_code: values.province_code,
      district_code: values.district_code || null,
      ward_code: values.ward_code,
      street: values.street,
    } : undefined
    const payload = {
      customer_name: values.customer_name,
      customer_email: values.customer_email || null,
      customer_phone: values.customer_phone,
      payment_method: values.payment_method,
      fulfillment_type: values.fulfillment_type,
      ...(values.fulfillment_type === 'delivery' ? { shipping_address: address } : { pickup_location_id: Number(values.pickup_location_id) }),
      shipping_method_id: values.fulfillment_type === 'delivery' && values.shipping_method_id ? Number(values.shipping_method_id) : null,
      coupon_code: values.coupon_code.trim() || null,
      use_points: values.use_points,
      note: values.note.trim() || null,
      invoice_requested: values.invoice_requested,
      ...(values.invoice_requested ? {
        invoice_tax_code: values.invoice_tax_code.trim(),
        invoice_company_name: values.invoice_company_name.trim(),
        invoice_address: values.invoice_address.trim(),
      } : {}),
      terms_accepted: true as const,
    }
    const signature = JSON.stringify({
      payload,
      cartToken,
      customerId,
      items: cart.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
    })
    if (checkoutAttempt.current?.signature !== signature) {
      checkoutAttempt.current = { signature, key: crypto.randomUUID() }
    }

    try {
      const result = await orderMutation.mutateAsync({ payload, idempotencyKey: checkoutAttempt.current.key })
      if (!result.data?.code || typeof result.data.grand_total !== 'number') {
        throw new Error('API trả về đơn hàng thiếu mã hoặc tổng thanh toán.')
      }

      trackStorefrontEvent('purchase', {
        transaction_id: result.data.code,
        currency: 'VND',
        value: result.data.grand_total,
        shipping: result.data.shipping_fee,
        items: result.data.items.map((item) => ({
          item_name: item.product_name,
          item_variant: item.variant_name ?? undefined,
          price: item.unit_price,
          quantity: item.quantity,
        })),
      })

      let newsletterMessage: string | undefined
      if (values.newsletter_consent && values.customer_email.trim()) {
        try {
          newsletterMessage = await subscribeToNewsletter(values.customer_email.trim(), true)
        } catch {
          newsletterMessage = 'Đơn hàng đã được ghi nhận, nhưng chưa đăng ký nhận tin được. Bạn có thể đăng ký lại ở cuối trang.'
        }
      }

      checkoutAttempt.current = null
      setCart([])
      if (result.data.payment_method === 'bank_transfer' && result.data.payment_access_token) {
        navigate(`/checkout/payment/${result.data.code}#${result.data.payment_access_token}`, { state: newsletterMessage ? { newsletterMessage } : undefined })
      } else {
        navigate(`/checkout/success/${result.data.code}`, { state: { order: result.data, ...(newsletterMessage ? { newsletterMessage } : {}) } })
      }
      onToast(`Đặt hàng thành công · ${result.data.code}`)
    } catch (error) {
      const errors = isAxiosError<{ errors?: Record<string, string[]> }>(error) ? error.response?.data.errors : undefined
      if (errors) {
        onToast(Object.values(errors).flat()[0] ?? 'Vui lòng kiểm tra thông tin đơn hàng.')
        return { errors }
      }
      onToast(getApiErrorMessage(error, 'Không thể kết nối API đặt hàng.'))
    }
  }

  const previewCheckout = useCallback(async (provinceCode: string, wardCode: string | null, couponCode: string, shippingMethodId: number | null, usePoints: boolean, fulfillmentType: 'delivery' | 'pickup', pickupLocationId: number | null) => {
    const requestId = ++previewRequestId.current
    if (!provinceCode && fulfillmentType === 'delivery') {
      resetPreviewMutation()
      setQuote(null)
      setPreviewError('Chọn tỉnh / thành để tính phí giao hàng.')
      return
    }

    setPreviewError('')
    setQuote(null)
    try {
      const nextQuote = await requestCheckoutPreview({ provinceCode, wardCode, couponCode, shippingMethodId, usePoints, fulfillmentType, pickupLocationId })
      if (requestId !== previewRequestId.current) return
      setQuote(nextQuote)
    } catch (error) {
      if (requestId === previewRequestId.current) setPreviewError(getApiErrorMessage(error, 'Không thể tính đơn hàng.'))
    }
  }, [requestCheckoutPreview, resetPreviewMutation])

  const clearPreview = useCallback(() => {
    previewRequestId.current += 1
    resetPreviewMutation()
    setPreviewError('')
    setQuote(null)
  }, [resetPreviewMutation])

  return { quote, busy, previewBusy, previewError, placeOrder, previewCheckout, clearPreview, pickupLocations: pickupQuery.data ?? [], pickupLocationsLoading: pickupQuery.isPending, pickupLocationsError: pickupQuery.isError }
}
