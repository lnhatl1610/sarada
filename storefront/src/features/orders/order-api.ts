import { api, getApiErrorMessage } from '../../lib/http'
import type { components } from '../../types/api'
import type { CustomerOrderSummary, TrackedOrder } from './order-types'

type AccountOrderOptions = { accessToken: string; signal?: AbortSignal }

export type CustomerOrderStatusFilter = 'all' | 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'returned'
export type CustomerOrderFilters = { page: number; status: CustomerOrderStatusFilter; q: string; from: string; to: string }
export type CustomerOrderPage = { orders: CustomerOrderSummary[]; currentPage: number; lastPage: number; total: number }

export async function getAccountOrders({ accessToken, signal, filters }: AccountOrderOptions & { filters: CustomerOrderFilters }): Promise<CustomerOrderPage> {
  try {
    const response = await api.get<components['schemas']['CustomerOrderListEnvelope']>('/orders', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
      params: {
        page: filters.page,
        status: filters.status,
        q: filters.q || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      },
    })
    return { orders: response.data.data, currentPage: response.data.meta.current_page, lastPage: response.data.meta.last_page, total: response.data.meta.total }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải lịch sử đơn hàng.'), { cause: error })
  }
}

export async function getAccountOrder({ accessToken, signal, code }: AccountOrderOptions & { code: string }): Promise<TrackedOrder> {
  try {
    const response = await api.get<components['schemas']['CustomerOrderDetailEnvelope']>(`/orders/${encodeURIComponent(code)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    })
    if (!response.data.data) throw new Error('Không tìm thấy đơn hàng.')
    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Không thể tải đơn hàng.'), { cause: error })
  }
}
