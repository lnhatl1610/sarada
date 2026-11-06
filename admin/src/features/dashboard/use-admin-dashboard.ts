import { useQuery } from '@tanstack/react-query'
import { adminApiFetch } from '../../lib/admin-api'
import type { components } from '../../types/api'

export type AdminDashboardSummary = components['schemas']['DashboardSummaryEnvelope']['data']

export type AdminDashboardRevenuePoint = { date: string; revenue: number; orders: number }
export type AdminDashboardTopProduct = { product_id: number | null; product_slug: string | null; product_name: string; thumbnail: string | null; units_sold: number; revenue: number }
export type AdminDashboardRecentOrder = {
  id: number
  code: string
  customer_name: string
  grand_total: number
  status: string
  placed_at: string | null
  created_at?: string
}

export type DashboardGroupBy = 'day' | 'week' | 'month'

type UseAdminDashboardOptions = {
  apiUrl: string
  accessToken: string
  userId?: number
  from: string
  to: string
  previousFrom: string
  previousTo: string
  comparePrevious: boolean
  groupBy: DashboardGroupBy
  enabled: boolean
  autoRefresh: boolean
}

async function fetchDashboardData<T>(url: string, accessToken: string, signal: AbortSignal, errorMessage: string): Promise<T> {
  const response = await adminApiFetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(errorMessage)

  const body = await response.json() as { data?: T }
  if (body.data === undefined) throw new Error(errorMessage)
  return body.data
}

export function useAdminDashboard({ apiUrl, accessToken, userId, from, to, previousFrom, previousTo, comparePrevious, groupBy, enabled, autoRefresh }: UseAdminDashboardOptions) {
  const queryOptions = {
    refetchInterval: autoRefresh ? 60_000 : false,
    refetchOnWindowFocus: autoRefresh,
    refetchIntervalInBackground: false,
  } as const
  const queryKeyBase = ['admin', 'dashboard', userId, from, to] as const
  const dateRangeQuery = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`

  const summary = useQuery({
    queryKey: [...queryKeyBase, 'summary'],
    enabled: enabled && Boolean(accessToken),
    ...queryOptions,
    queryFn: ({ signal }) => fetchDashboardData<AdminDashboardSummary>(
      `${apiUrl}/admin/dashboard/summary?${dateRangeQuery}`,
      accessToken,
      signal,
      'Không tải được số liệu tổng quan.',
    ),
  })

  const revenue = useQuery({
    queryKey: [...queryKeyBase, 'revenue'],
    enabled: enabled && Boolean(accessToken),
    ...queryOptions,
    queryFn: ({ signal }) => fetchDashboardData<AdminDashboardRevenuePoint[]>(
      `${apiUrl}/admin/dashboard/revenue?${dateRangeQuery}&group_by=${groupBy}`,
      accessToken,
      signal,
      'Không tải được biểu đồ doanh thu.',
    ),
  })

  const previousRevenue = useQuery({
    queryKey: ['admin', 'dashboard', userId, 'previous-revenue', previousFrom, previousTo, groupBy],
    enabled: enabled && Boolean(accessToken) && comparePrevious,
    ...queryOptions,
    queryFn: ({ signal }) => fetchDashboardData<AdminDashboardRevenuePoint[]>(
      `${apiUrl}/admin/dashboard/revenue?from=${encodeURIComponent(previousFrom)}&to=${encodeURIComponent(previousTo)}&group_by=${groupBy}`,
      accessToken,
      signal,
      'Không tải được biểu đồ kỳ trước.',
    ),
  })

  const topProducts = useQuery({
    queryKey: [...queryKeyBase, 'top-products'],
    enabled: enabled && Boolean(accessToken),
    ...queryOptions,
    queryFn: ({ signal }) => fetchDashboardData<AdminDashboardTopProduct[]>(
      `${apiUrl}/admin/dashboard/top-products?${dateRangeQuery}`,
      accessToken,
      signal,
      'Không tải được danh sách sản phẩm bán chạy.',
    ),
  })

  const recentOrders = useQuery({
    queryKey: ['admin', 'dashboard', userId, 'recent-orders'],
    enabled: enabled && Boolean(accessToken),
    ...queryOptions,
    queryFn: ({ signal }) => fetchDashboardData<AdminDashboardRecentOrder[]>(
      `${apiUrl}/admin/orders?per_page=8&page=1&sort=-placed_at`,
      accessToken,
      signal,
      'Không tải được đơn hàng gần đây.',
    ),
  })

  const refreshAll = () => {
    void Promise.all([
      summary.refetch(),
      revenue.refetch(),
      topProducts.refetch(),
      recentOrders.refetch(),
    ])
    if (comparePrevious) void previousRevenue.refetch()
  }

  const updatedAt = Math.max(summary.dataUpdatedAt, revenue.dataUpdatedAt, topProducts.dataUpdatedAt, recentOrders.dataUpdatedAt, comparePrevious ? previousRevenue.dataUpdatedAt : 0)

  return {
    summary: summary.data ?? null,
    summaryLoading: summary.isLoading,
    summaryError: summary.error instanceof Error ? summary.error.message : '',
    revenueSeries: revenue.data ?? [],
    revenueLoading: revenue.isLoading,
    revenueError: revenue.error instanceof Error ? revenue.error.message : '',
    previousRevenueSeries: previousRevenue.data ?? [],
    previousRevenueLoading: comparePrevious && previousRevenue.isLoading,
    previousRevenueError: previousRevenue.error instanceof Error ? previousRevenue.error.message : '',
    topProducts: topProducts.data ?? [],
    topProductsLoading: topProducts.isLoading,
    topProductsError: topProducts.error instanceof Error ? topProducts.error.message : '',
    recentOrders: recentOrders.data ?? [],
    recentOrdersLoading: recentOrders.isLoading,
    recentOrdersError: recentOrders.error instanceof Error ? recentOrders.error.message : '',
    isFetching: summary.isFetching || revenue.isFetching || topProducts.isFetching || recentOrders.isFetching,
    hasError: summary.isError || revenue.isError || topProducts.isError || recentOrders.isError,
    lastUpdated: updatedAt > 0 ? new Date(updatedAt) : null,
    refreshAll,
  }
}
