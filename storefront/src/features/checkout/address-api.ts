import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type AddressOption = components['schemas']['VietnamLocationOption']
export type AddressCatalogMeta = components['schemas']['LocationCatalogMetadata']
export type AddressOptionsEnvelope = components['schemas']['LocationProvincesEnvelope'] | components['schemas']['LocationWardsEnvelope']
export type ShippingFee = components['schemas']['ShippingFee']

export async function fetchAddressProvinces(signal?: AbortSignal): Promise<AddressOptionsEnvelope> {
  const response = await api.get<components['schemas']['LocationProvincesEnvelope']>('/locations/provinces', { signal })
  return response.data
}

export async function fetchAddressWards(provinceCode: string, signal?: AbortSignal): Promise<AddressOptionsEnvelope> {
  const response = await api.get<components['schemas']['LocationWardsEnvelope']>(`/locations/provinces/${encodeURIComponent(provinceCode)}/wards`, { signal })
  return response.data
}

export async function fetchShippingFee(provinceCode: string, signal?: AbortSignal, wardCode?: string): Promise<ShippingFee> {
  const response = await api.get<components['schemas']['ShippingFeeEnvelope']>('/shipping/fee', {
    params: { province_code: provinceCode, ...(wardCode ? { ward_code: wardCode } : {}) },
    signal,
  })
  if (!response.data.data) throw new Error('Không tải được phí giao hàng.')
  return response.data.data
}
