import { useQuery } from '@tanstack/react-query'
import { adminApiFetch } from '../../lib/admin-api'

export type AlertData = {
  counts: { pending_orders: number; delivery_failed_orders: number; failed_payments: number; pending_reviews: number; low_stock: number; pending_staff_approvals: number }
  items: {
    pending_orders: { id: number; code: string; customer_name: string; created_at: string }[]
    delivery_failed_orders: { id: number; code: string; customer_name: string; updated_at: string }[]
    failed_payments: { id: number; code: string; customer_name: string; updated_at: string }[]
    pending_reviews: { id: number; product_id: number; product_name: string; created_at: string }[]
    low_stock: { id: number; sku: string; product_name: string; quantity: number; reserved: number }[]
    pending_staff_approvals: { id: number; name: string; email: string; created_at: string }[]
  }
}

export function useAdminAlerts({ apiUrl, accessToken, userId, permissions }: { apiUrl: string; accessToken: string; userId: number | undefined; permissions: string[] }) {
  const canView = ['orders.view', 'reviews.moderate', 'inventory.view', 'users.manage'].some((permission) => permissions.includes(permission))
  return useQuery({
    queryKey: ['admin', 'alerts', userId, [...permissions].sort().join(',')],
    enabled: Boolean(accessToken && userId && canView),
    queryFn: async ({ signal }) => {
      const response = await adminApiFetch(`${apiUrl}/admin/alerts`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, signal })
      if (!response.ok) throw new Error('Không tải được danh sách cảnh báo.')
      const body = await response.json() as { data: AlertData }
      return body.data
    },
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
