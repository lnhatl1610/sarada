import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type CustomerVoucher = components['schemas']['CustomerVoucher']
export type CustomerVouchersEnvelope = components['schemas']['CustomerVoucherEnvelope']

export function useCustomerVouchers(enabled: boolean, page = 1, status?: CustomerVoucher['status']) {
  return useQuery({
    queryKey: ['account', 'vouchers', page, status ?? 'all'],
    queryFn: async ({ signal }) => {
      const response = await api.get<CustomerVouchersEnvelope>('/account/vouchers', {
        params: { page, per_page: 20, ...(status ? { status } : {}) },
        signal,
      })
      return response.data
    },
    enabled,
    staleTime: 30_000,
  })
}
