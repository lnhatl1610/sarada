import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/http'

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'zalo' | 'push'
export type NotificationEvent = 'orders' | 'promotions' | 'price_drops'
export type NotificationPreferences = Record<NotificationEvent, Record<NotificationChannel, boolean>>
export type NotificationChannelAvailability = Record<NotificationChannel, { available: boolean; reason: string | null }>
export type NotificationPreferencesResponse = { data: { preferences: NotificationPreferences; channels: NotificationChannelAvailability } }
export type PushSubscriptionItem = { id: number; device_name: string | null; created_at: string }
export type PushSubscriptionsResponse = { data: { public_key: string | null; configured: boolean; subscriptions: PushSubscriptionItem[] } }

const preferencesKey = ['account', 'notification-preferences'] as const
const pushKey = ['account', 'push-subscriptions'] as const

export function useNotificationPreferences(enabled: boolean) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: preferencesKey,
    queryFn: async ({ signal }) => (await api.get<NotificationPreferencesResponse>('/account/notification-preferences', { signal })).data.data,
    enabled,
  })
  const save = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => (await api.put<NotificationPreferencesResponse>('/account/notification-preferences', { preferences })).data.data,
    onSuccess: (data) => queryClient.setQueryData(preferencesKey, data),
  })
  const pushSubscriptions = useQuery({
    queryKey: pushKey,
    queryFn: async ({ signal }) => (await api.get<PushSubscriptionsResponse>('/account/push-subscriptions', { signal })).data.data,
    enabled: enabled && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
  })
  const registerPush = useMutation({
    mutationFn: async () => {
      const push = pushSubscriptions.data
      if (!push?.configured || !push.public_key) throw new Error('Máy chủ chưa cấu hình thông báo đẩy.')
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('Bạn cần cho phép thông báo trong cài đặt trình duyệt.')
      const normalized = push.public_key.replace(/-/g, '+').replace(/_/g, '/')
      const raw = window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
      const applicationServerKey = Uint8Array.from(raw, (character) => character.charCodeAt(0)).buffer as ArrayBuffer
      await navigator.serviceWorker.register('/storefront-sw.js')
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
        ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
      const serialized = subscription.toJSON()
      if (!serialized.keys?.p256dh || !serialized.keys.auth) throw new Error('Trình duyệt không trả về khóa mã hóa cho thiết bị này.')
      await api.post('/account/push-subscriptions', { endpoint: subscription.endpoint, keys: serialized.keys, content_encoding: 'aes128gcm', device_name: navigator.userAgent.slice(0, 100) })
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: pushKey }),
      queryClient.invalidateQueries({ queryKey: preferencesKey }),
    ]),
  })
  const removePush = useMutation({
    mutationFn: async (item: PushSubscriptionItem) => {
      await api.delete(`/account/push-subscriptions/${item.id}`)
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: pushKey }),
      queryClient.invalidateQueries({ queryKey: preferencesKey }),
    ]),
  })

  return { query, save, pushSubscriptions, registerPush, removePush }
}
