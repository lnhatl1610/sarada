import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type StoreLocation = components['schemas']['StoreLocation']
export type StoreLocationList = components['schemas']['StoreLocationListEnvelope']
export type ProvinceOption = components['schemas']['VietnamLocationOption']

export async function getStoreLocations(options: { provinceCode?: string; page?: number; signal?: AbortSignal }): Promise<StoreLocationList> {
  const response = await api.get<StoreLocationList>('/stores', {
    params: { per_page: 100, ...(options.provinceCode ? { province_code: options.provinceCode } : {}), ...(options.page ? { page: options.page } : {}) },
    signal: options.signal,
  })
  return response.data
}

export async function getLocationProvinces(signal?: AbortSignal): Promise<ProvinceOption[]> {
  const response = await api.get<components['schemas']['LocationProvincesEnvelope']>('/locations/provinces', { signal })
  return response.data.data
}
