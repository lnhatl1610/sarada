import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { api, getApiErrorMessage } from '../../lib/http'
import type { components } from '../../types/api'
import type { TrackedOrder } from './order-types'

type OrderChangeDialogState = { order: TrackedOrder; type: 'cancellation' | 'return' } | null
export type CustomerReviewValues = {
  order_item_id?: number
  rating: number
  title: string
  content: string
  images?: File[]
  videos?: File[]
}

type Options = {
  accessToken: string
  customerId: number | null
  orderSlug: string
  returnTo: string
  onToast: (message: string) => void
}

export function useCustomerOrderActions({ accessToken, customerId, orderSlug, returnTo, onToast }: Options) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [orderChangeDialog, setOrderChangeDialog] = useState<OrderChangeDialogState>(null)
  const orderChangeMutation = useMutation({
    mutationFn: async ({ order, type, reason }: { order: TrackedOrder; type: 'cancellation' | 'return'; reason: string }) => {
      const { data: body } = await api.post<components['schemas']['CustomerOrderDetailEnvelope']>(
        `/orders/${encodeURIComponent(order.code)}/change-requests`,
        { type, reason },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      return { body, order, type }
    },
  })
  const reviewMutation = useMutation({
    mutationFn: async (values: CustomerReviewValues) => {
      if (values.order_item_id == null) throw new Error('Chọn sản phẩm đã mua trước khi gửi đánh giá.')
      const orderItemId = values.order_item_id
      const payload = new FormData()
      payload.append('order_item_id', String(orderItemId))
      payload.append('rating', String(values.rating))
      if (values.title.trim()) payload.append('title', values.title.trim())
      if (values.content.trim()) payload.append('content', values.content.trim())
      values.images?.forEach((image) => payload.append('images[]', image))
      values.videos?.forEach((video) => payload.append('videos[]', video))
      const response = await api.post<components['schemas']['StorefrontReviewEnvelope']>('/reviews', payload, { headers: { Authorization: `Bearer ${accessToken}` } })
      return { response, orderItemId }
    },
    onSuccess: ({ response, orderItemId }) => {
      queryClient.setQueryData<TrackedOrder>(['account', 'orders', customerId ?? 'current', 'detail', orderSlug], (current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === orderItemId ? { ...item, review_status: response.data.data.status } : item),
      } : current)
    },
  })
  const reviewBusy = reviewMutation.isPending

  const cancelCustomerOrder = (order: TrackedOrder) => {
    const type = ['delivered', 'completed'].includes(order.status) ? 'return' : 'cancellation'
    setOrderChangeDialog({ order, type })
  }

  const submitCustomerOrderChange = async (reason: string): Promise<string | null> => {
    if (!orderChangeDialog) return 'Không tìm thấy đơn hàng cần gửi yêu cầu.'
    if (orderChangeMutation.isPending) return null

    const { order, type } = orderChangeDialog
    try {
      const { body } = await orderChangeMutation.mutateAsync({ order, type, reason })
      queryClient.setQueryData(['account', 'orders', customerId ?? 'current', 'detail', orderSlug], body.data)
      void queryClient.invalidateQueries({ queryKey: ['account', 'orders', customerId ?? 'current'] })
      setOrderChangeDialog(null)
      onToast(type === 'return' ? 'Đã gửi yêu cầu trả hàng' : 'Đã gửi yêu cầu hủy đơn hàng')
      window.setTimeout(() => onToast(''), 2500)
      return null
    } catch (error) {
      return getApiErrorMessage(error, 'Không thể kết nối khi gửi yêu cầu.')
    }
  }

  const submitReview = async (values: CustomerReviewValues): Promise<string | null> => {
    if (!accessToken) {
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`)
      return 'Vui lòng đăng nhập để gửi đánh giá.'
    }

    try {
      if (reviewMutation.isPending) return null
      await reviewMutation.mutateAsync(values)
      onToast('Đã gửi đánh giá. Đánh giá sẽ hiển thị sau khi được duyệt.')
      window.setTimeout(() => onToast(''), 3500)
      return null
    } catch (error) {
      return getApiErrorMessage(error, 'Không gửi được đánh giá.')
    }
  }

  return {
    orderChangeDialog,
    setOrderChangeDialog,
    orderChangeBusy: orderChangeMutation.isPending,
    cancelCustomerOrder,
    submitCustomerOrderChange,
    reviewBusy,
    submitReview,
  }
}
