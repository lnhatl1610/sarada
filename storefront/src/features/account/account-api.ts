import axios from 'axios'
import { api, getApiErrorMessage } from '../../lib/http'
import type { components } from '../../types/api'

export type CustomerAddress = components['schemas']['CustomerAddress']
export type CustomerAddressInput = components['schemas']['AddressInput']

export type WishlistProduct = Pick<components['schemas']['Product'], 'id' | 'name' | 'slug' | 'price' | 'images' | 'variants'>
export type WishlistList = components['schemas']['WishlistList']
export type SharedWishlist = components['schemas']['SharedWishlistEnvelope']['data']

export class AddressValidationError extends Error {
  readonly fields: Record<string, string[]>

  constructor(fields: Record<string, string[]>, cause?: unknown) {
    super(Object.values(fields).flat().join(' '), { cause })
    this.fields = fields
    this.name = 'AddressValidationError'
  }
}

type Options = { accessToken: string; signal?: AbortSignal }

async function request<T>(execute: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await execute()
    return response.data
  } catch (error) {
    if (axios.isAxiosError<{ errors?: Record<string, string[]> }>(error) && error.response?.data.errors) {
      throw new AddressValidationError(error.response.data.errors, error)
    }
    throw new Error(getApiErrorMessage(error, 'Không thể tải dữ liệu tài khoản.'), { cause: error })
  }
}

export async function getAddresses(options: Options): Promise<CustomerAddress[]> {
  const response = await request(() => api.get<components['schemas']['AddressListEnvelope']>('/account/addresses', {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return response.data
}

export async function saveAddress(options: Options & { address?: CustomerAddress; values: CustomerAddressInput }): Promise<CustomerAddress> {
  const headers = { Authorization: `Bearer ${options.accessToken}` }
  const execute = options.address
    ? () => api.patch<components['schemas']['AddressEnvelope']>(`/account/addresses/${options.address!.id}`, options.values, { signal: options.signal, headers })
    : () => api.post<components['schemas']['AddressEnvelope']>('/account/addresses', options.values, { signal: options.signal, headers })
  return (await request(execute)).data
}

export async function deleteAddress(options: Options & { addressId: number }): Promise<void> {
  await request(() => api.delete<components['schemas']['MessageEnvelope']>(`/account/addresses/${options.addressId}`, {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
}

export async function setDefaultAddress(options: Options & { addressId: number }): Promise<void> {
  await request(() => api.patch<components['schemas']['MessageEnvelope']>(`/account/addresses/${options.addressId}/default`, undefined, {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
}

export async function getWishlist(options: Options): Promise<WishlistProduct[]> {
  const response = await request(() => api.get<components['schemas']['StorefrontProductPageEnvelope']>('/wishlist?per_page=48', {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return response.data
}

export async function updateWishlist(options: Options & { productId: number; saved: boolean }): Promise<void> {
  await request(() => options.saved
    ? api.delete<components['schemas']['MessageEnvelope']>(`/wishlist/${options.productId}`, { signal: options.signal, headers: { Authorization: `Bearer ${options.accessToken}` } })
    : api.put<components['schemas']['MessageEnvelope']>(`/wishlist/${options.productId}`, undefined, { signal: options.signal, headers: { Authorization: `Bearer ${options.accessToken}` } }))
}

export async function getWishlistLists(options: Options): Promise<WishlistList[]> {
  const response = await request(() => api.get<components['schemas']['WishlistListCollectionEnvelope']>('/wishlist/lists', {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return response.data
}

export async function getWishlistListProducts(options: Options & { listId: number }): Promise<WishlistProduct[]> {
  const response = await request(() => api.get<components['schemas']['StorefrontProductPageEnvelope']>(`/wishlist/lists/${options.listId}/products?per_page=48`, {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return response.data
}

export async function createWishlistList(options: Options & { name: string }): Promise<WishlistList> {
  const response = await request(() => api.post<components['schemas']['WishlistListEnvelope']>('/wishlist/lists', { name: options.name }, {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return response.data
}

export async function renameWishlistList(options: Options & { listId: number; name: string }): Promise<WishlistList> {
  const response = await request(() => api.patch<components['schemas']['WishlistListEnvelope']>(`/wishlist/lists/${options.listId}`, { name: options.name }, {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return response.data
}

export async function deleteWishlistList(options: Options & { listId: number }): Promise<void> {
  await request(() => api.delete<components['schemas']['MessageEnvelope']>(`/wishlist/lists/${options.listId}`, {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
}

export async function setWishlistListSharing(options: Options & { listId: number; shareable: boolean }): Promise<WishlistList> {
  const response = await request(() => api.patch<components['schemas']['WishlistListEnvelope']>(`/wishlist/lists/${options.listId}/share`, { shareable: options.shareable }, {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return response.data
}

export async function getSharedWishlist(token: string, options: Pick<Options, 'signal'> = {}): Promise<SharedWishlist> {
  const response = await request(() => api.get<components['schemas']['SharedWishlistEnvelope']>(`/shared-wishlists/${encodeURIComponent(token)}?per_page=48`, {
    signal: options.signal,
  }))
  return response.data
}

export async function updateWishlistListProduct(options: Options & { listId: number; productId: number; saved: boolean }): Promise<void> {
  const headers = { Authorization: `Bearer ${options.accessToken}` }
  await request(() => options.saved
    ? api.delete<components['schemas']['MessageEnvelope']>(`/wishlist/lists/${options.listId}/products/${options.productId}`, { signal: options.signal, headers })
    : api.put<components['schemas']['MessageEnvelope']>(`/wishlist/lists/${options.listId}/products/${options.productId}`, undefined, { signal: options.signal, headers }))
}

export async function getProductPriceAlertIds(options: Options): Promise<number[]> {
  const response = await request(() => api.get<components['schemas']['ProductPriceAlertListEnvelope']>('/account/product-price-alerts', {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
  return response.data.product_ids
}

export async function setProductPriceAlert(options: Options & { productId: number; enabled: boolean }): Promise<number | null> {
  const headers = { Authorization: `Bearer ${options.accessToken}` }
  if (!options.enabled) {
    await request(() => api.delete<components['schemas']['MessageEnvelope']>(`/account/products/${options.productId}/price-alert`, { signal: options.signal, headers }))
    return null
  }

  const response = await request(() => api.put<components['schemas']['ProductPriceAlertEnvelope']>(`/account/products/${options.productId}/price-alert`, undefined, { signal: options.signal, headers }))
  return response.data.reference_price
}

export async function subscribeAccountStockAlert(options: Options & { productId: number; variantId: number }): Promise<void> {
  await request(() => api.post<components['schemas']['MessageEnvelope']>(`/account/products/${options.productId}/stock-alerts`, { variant_id: options.variantId }, {
    signal: options.signal,
    headers: { Authorization: `Bearer ${options.accessToken}` },
  }))
}
