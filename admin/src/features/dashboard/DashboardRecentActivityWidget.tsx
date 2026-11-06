import { useQuery } from '@tanstack/react-query'
import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime } from '../../lib/date-format'
import { useTranslation } from 'react-i18next'

type ActivityItem = {
  id: number
  module: string
  action: string
  path: string
  ip: string | null
  created_at: string
  user_name: string | null
}

type Props = {
  apiUrl: string
  accessToken: string
  userId: number | undefined
  enabled: boolean
  autoRefresh: boolean
}

const actionLabels: Record<string, string> = {
  LOGIN: 'Đăng nhập',
  LOGOUT: 'Đăng xuất',
  EMAIL_CHANGED: 'Đổi email',
  POST: 'Tạo mới',
  PATCH: 'Cập nhật',
  PUT: 'Cập nhật',
  DELETE: 'Xóa',
  EXPORT: 'Xuất dữ liệu',
}

export function DashboardRecentActivityWidget({ apiUrl, accessToken, userId, enabled, autoRefresh }: Props) {
  const { t } = useTranslation()
  const activity = useQuery({
    queryKey: ['admin', 'dashboard', userId, 'recent-activity'],
    enabled: enabled && Boolean(accessToken && userId),
    refetchInterval: autoRefresh ? 60_000 : false,
    refetchOnWindowFocus: autoRefresh,
    refetchIntervalInBackground: false,
    queryFn: async ({ signal }) => {
      const response = await adminApiFetch(`${apiUrl}/admin/activity-logs?per_page=10&page=1&sort=-created_at`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        signal,
      })
      if (!response.ok) throw new Error(t('Không tải được hoạt động gần đây.'))
      const body = await response.json() as { data?: ActivityItem[] }
      if (!Array.isArray(body.data)) throw new Error(t('Dữ liệu hoạt động gần đây không hợp lệ.'))
      return body.data
    },
  })

  if (!enabled) return null
  const rows = activity.data ?? []

  return <section className="panel dashboard-recent-activity" aria-labelledby="dashboard-recent-activity-title">
    <div className="panel-heading"><div><h2 id="dashboard-recent-activity-title">{t('Hoạt động gần đây')}</h2><p>{t('10 thao tác quản trị mới nhất')}</p></div><a href="/activity-logs">{t('Nhật ký đầy đủ')} ↗</a></div>
    {activity.isLoading ? <div className="shared-skeleton" role="status" aria-label={t('Đang tải hoạt động gần đây')}><span /><span /><span /></div> : activity.isError ? <div className="shared-ui-state" role="alert"><p>{activity.error instanceof Error ? activity.error.message : t('Không tải được hoạt động gần đây.')}</p><button className="secondary" type="button" onClick={() => void activity.refetch()}>{t('Thử lại')}</button></div> : rows.length ? <ol className="dashboard-recent-activity-list">
      {rows.map((item) => <li key={item.id}><time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time><span><strong>{item.user_name ?? t('Tài khoản đã xóa')}</strong><small>{t(actionLabels[item.action] ?? item.action)} · {t(item.module)} · {item.path}</small></span></li>)}
    </ol> : <div className="no-orders compact">{t('Chưa có hoạt động quản trị được ghi nhận.')}</div>}
  </section>
}
