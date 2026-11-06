import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type StorefrontNotification = components['schemas']['StorefrontCustomerNotification']
export type StorefrontNotificationsEnvelope = components['schemas']['StorefrontCustomerNotificationEnvelope']

export function useStorefrontNotifications(enabled: boolean, page = 1) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['account', 'notifications', page],
    queryFn: async ({ signal }) => {
      const response = await api.get<StorefrontNotificationsEnvelope>('/account/notifications', { params: { page, per_page: 20 }, signal })
      return response.data
    },
    enabled,
    staleTime: 30_000,
  })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['account', 'notifications'] })
  const markRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/account/notifications/${encodeURIComponent(id)}/read`),
    onSuccess: refresh,
  })
  const markAllRead = useMutation({
    mutationFn: async () => api.post('/account/notifications/read-all'),
    onSuccess: refresh,
  })

  return { query, markRead, markAllRead }
}
