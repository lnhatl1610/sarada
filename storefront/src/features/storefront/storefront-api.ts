import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type StorefrontConfiguration = components['schemas']['StorefrontConfigurationEnvelope']['data']

export async function fetchStorefrontConfiguration(signal?: AbortSignal): Promise<StorefrontConfiguration> {
  const response = await api.get<components['schemas']['StorefrontConfigurationEnvelope']>('/auth/registration-status', { signal })
  if (!response.data.data) throw new Error('Không tải được cấu hình cửa hàng.')
  return response.data.data
}
