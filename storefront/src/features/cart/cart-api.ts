import { api, getApiErrorMessage } from '../../lib/http'
import type { components } from '../../types/api'

export type CartItemResponse = components['schemas']['CartItem']
export type CartResponse = components['schemas']['StorefrontCart']
export type CartEnvelope = components['schemas']['CartEnvelope']
export type CartCheckoutQuote = components['schemas']['CheckoutQuote']
export type AvailableCoupon = components['schemas']['AvailableCoupon']

type CartRequestOptions = {
  cartToken: string
  accessToken?: string
  signal?: AbortSignal
}

function cartHeaders({ cartToken, accessToken }: CartRequestOptions) {
  return {
    ...(cartToken ? { 'X-Cart-Token': cartToken } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }
}

function unwrapCartResponse(body: CartEnvelope): CartResponse {
  if (!body.data) throw new Error('Không thể đồng bộ giỏ hàng.')
  return body.data
}

async function withCartErrors<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    const response = await request
    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể đồng bộ giỏ hàng.'), { cause: error })
  }
}

export async function getCart(options: CartRequestOptions): Promise<CartResponse> {
  return unwrapCartResponse(await withCartErrors(api.get<CartEnvelope>('/cart', { headers: cartHeaders(options), signal: options.signal })))
}

export async function mergeGuestCart(options: { accessToken: string; sessionToken: string }): Promise<CartResponse> {
  const payload: components['schemas']['CartMergeInput'] = { session_token: options.sessionToken }
  const response = await withCartErrors(api.post<CartEnvelope>('/cart/merge', payload, {
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return unwrapCartResponse(response)
}

export async function updateCartItem(options: CartRequestOptions & { itemId: number; quantity: number; variantId?: number }): Promise<CartResponse> {
  return unwrapCartResponse(await withCartErrors(api.patch<CartEnvelope>(`/cart/items/${options.itemId}`, {
    quantity: options.quantity,
    ...(options.variantId ? { variant_id: options.variantId } : {}),
  }, { headers: cartHeaders(options) })))
}

export async function removeCartItem(options: CartRequestOptions & { itemId: number }): Promise<CartResponse> {
  return unwrapCartResponse(await withCartErrors(api.delete<CartEnvelope>(`/cart/items/${options.itemId}`, { headers: cartHeaders(options) })))
}

export async function saveGuestCartRecoveryContact(options: CartRequestOptions & { email: string }): Promise<CartResponse> {
  const input: components['schemas']['StoreCartRecoveryContactInput'] = { email: options.email, consent: true }
  return unwrapCartResponse(await withCartErrors(api.put<CartEnvelope>('/cart/recovery-contact', input, { headers: cartHeaders(options) })))
}

export async function removeGuestCartRecoveryContact(options: CartRequestOptions): Promise<CartResponse> {
  return unwrapCartResponse(await withCartErrors(api.delete<CartEnvelope>('/cart/recovery-contact', { headers: cartHeaders(options) })))
}

export async function previewCartQuote(options: CartRequestOptions & { provinceCode: string; couponCode: string }): Promise<CartCheckoutQuote> {
  try {
    const response = await api.post<components['schemas']['CheckoutQuoteEnvelope']>(
      '/checkout/preview',
      { province_code: options.provinceCode, coupon_code: options.couponCode.trim() || null },
      { headers: cartHeaders(options) },
    )
    if (!response.data.data) throw new Error('API không trả về báo giá giỏ hàng.')
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tính báo giá giỏ hàng.'), { cause: error })
  }
}

export async function getAvailableCoupons(options: CartRequestOptions & { signal?: AbortSignal }): Promise<AvailableCoupon[]> {
  try {
    const response = await api.get<components['schemas']['AvailableCouponsEnvelope']>('/coupons/available', {
      headers: cartHeaders(options),
      signal: options.signal,
    })
    return response.data.data ?? []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải danh sách mã ưu đãi.'), { cause: error })
  }
}

