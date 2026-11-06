import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, ChevronLeft, ChevronRight, Clock3, Archive, RotateCcw, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime } from '../../lib/date-format'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'

type Notice = { id: string; event: string; title: string; detail: string; href: string; priority: 'normal' | 'important' | 'urgent'; read_at: string | null; archived_at: string | null; snoozed_until: string | null; created_at: string }
type NoticeResponse = { data?: Notice[]; meta?: { current_page: number; last_page: number; total: number; unread_count: number }; message?: string }
type Filters = { status: 'all' | 'unread' | 'archived'; event: string; priority: string; q: string; page: number }
type Action = { id: string; kind: 'read' | 'archive' | 'restore' | 'delete' | 'snooze'; until?: string }

const eventPermissions: Record<string, string> = { new_order: 'orders.view', delivery_failed: 'orders.view', low_stock: 'inventory.view', review_pending: 'reviews.moderate', staff_pending: 'users.manage', weekly_report: 'reports.view' }

function relativeTime(value: string, locale: string, justNow: string): string {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31_536_000], ['month', 2_592_000], ['day', 86_400], ['hour', 3_600], ['minute', 60]]
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of units) if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit)
  return justNow
}

export function NotificationCenterPage({ apiUrl, accessToken, accountId, permissions, isSuperAdmin }: { apiUrl: string; accessToken: string; accountId: number; permissions: string[]; isSuperAdmin: boolean }) {
  const { t, i18n } = useTranslation()
  const eventLabels: Record<string, string> = {
    new_order: t('Đơn hàng mới'), delivery_failed: t('Giao hàng thất bại'), low_stock: t('Tồn kho'), review_pending: t('Đánh giá'),
    staff_pending: t('Nhân viên'), task_reminder: t('Nhắc việc'), weekly_report: t('Báo cáo'), admin_digest: t('Bản tin tóm tắt'), security_suspicious_session: t('Phiên đăng nhập lạ'),
  }
  const client = useQueryClient()
  const [filters, setFilters] = useState<Filters>({ status: 'all', event: '', priority: '', q: '', page: 1 })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['admin', 'notifications', accountId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ per_page: '25', page: String(filters.page), status: filters.status })
      if (filters.event) params.set('event', filters.event)
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.q.trim()) params.set('q', filters.q.trim())
      const response = await adminApiFetch(`${apiUrl}/admin/notifications?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as NoticeResponse
      if (!response.ok) throw new Error(body.message ?? t('Không tải được thông báo.'))
      return body
    },
    placeholderData: (previous) => previous,
  })
  const action = useMutation({
    mutationFn: async ({ id, kind, until }: Action) => {
      const routes: Record<Action['kind'], { path: string; method: string; body?: string }> = {
        read: { path: `/${id}/read`, method: 'PATCH' },
        archive: { path: `/${id}/archive`, method: 'PATCH', body: JSON.stringify({ archived: true }) },
        restore: { path: `/${id}/archive`, method: 'PATCH', body: JSON.stringify({ archived: false }) },
        delete: { path: `/${id}`, method: 'DELETE' },
        snooze: { path: `/${id}/snooze`, method: 'POST', body: JSON.stringify({ until }) },
      }
      const request = routes[kind]
      const response = await adminApiFetch(`${apiUrl}/admin/notifications${request.path}`, { method: request.method, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(request.body ? { 'Content-Type': 'application/json' } : {}) }, body: request.body })
      const body = await response.json().catch(() => ({})) as NoticeResponse
      if (!response.ok) throw new Error(body.message ?? t('Không cập nhật được thông báo.'))
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'notifications', accountId] }) },
  })
  const markAll = useMutation({
    mutationFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/admin/notifications/read-all`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không thể đánh dấu tất cả đã đọc.'))
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'notifications', accountId] }) },
  })
  const pageData = query.data
  const groups = new Map<string, Notice[]>()
  for (const item of pageData?.data ?? []) {
    const day = new Date(item.created_at).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })
    groups.set(day, [...(groups.get(day) ?? []), item])
  }
  const update = <Key extends keyof Filters>(key: Key, value: Filters[Key]) => setFilters((current) => ({ ...current, [key]: value, ...(key === 'page' ? {} : { page: 1 }) }))

  return <div className="notification-center">
    <section className="panel notification-center-panel">
      <header className="panel-heading"><div><h2>{t('Trung tâm thông báo')}</h2><p>{t('{{count}} mục chưa đọc · Chuông trên header cập nhật mỗi phút.', { count: pageData?.meta?.unread_count ?? 0 })}</p></div><div className="notification-center-head-actions"><a href="/account/notifications">{t('Tùy chọn nhận tin')}</a><button className="secondary" type="button" disabled={!pageData?.meta?.unread_count || markAll.isPending} onClick={() => markAll.mutate()}>{markAll.isPending ? t('Đang cập nhật…') : t('Đọc tất cả')}</button></div></header>
      <div className="notification-center-tabs" role="group" aria-label={t('Trạng thái thông báo')}>
        {([['all', t('Tất cả')], ['unread', t('Chưa đọc')], ['archived', t('Đã lưu trữ')]] as const).map(([status, label]) => <button type="button" aria-pressed={filters.status === status} className={filters.status === status ? 'active' : ''} key={status} onClick={() => update('status', status)}>{label}</button>)}
      </div>
      <div className="notification-center-filters">
        <label className="notification-center-search"><Search size={16} aria-hidden="true" /><input value={filters.q} onChange={(event) => update('q', event.target.value)} placeholder={t('Tìm trong thông báo')} aria-label={t('Tìm trong thông báo')} /></label>
        <label>{t('Loại')}<select value={filters.event} onChange={(event) => update('event', event.target.value)}><option value="">{t('Tất cả loại')}</option>{Object.entries(eventLabels).filter(([key]) => isSuperAdmin || !eventPermissions[key] || permissions.includes(eventPermissions[key])).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>{t('Mức độ')}<select value={filters.priority} onChange={(event) => update('priority', event.target.value)}><option value="">{t('Tất cả mức độ')}</option><option value="normal">{t('Thường')}</option><option value="important">{t('Quan trọng')}</option><option value="urgent">{t('Khẩn')}</option></select></label>
      </div>
      {action.isError && <p className="account-settings-error" role="alert">{action.error.message}</p>}
      {markAll.isError && <p className="account-settings-error" role="alert">{markAll.error.message}</p>}
      {query.isPending && <p className="notification-center-state" role="status">{t('Đang tải thông báo…')}</p>}
      {query.isError && <div className="notification-center-state" role="alert"><p>{query.error.message}</p><button className="secondary" type="button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></div>}
      {pageData && (pageData.data?.length ? <div className="notification-center-list">
        {[...groups.entries()].map(([day, items]) => <section className="notification-day-group" key={day}><h3>{day}</h3>{items.map((item) => <article className="notification-center-item" data-unread={!item.read_at} data-priority={item.priority} key={item.id}>
          <span className="notification-center-icon"><Bell size={17} aria-hidden="true" /></span>
          <a className="notification-center-copy" href={item.href} onClick={(event) => { if (!item.read_at) { event.preventDefault(); action.mutate({ id: item.id, kind: 'read' }, { onSuccess: () => window.location.assign(item.href) }) } }}><span><strong>{item.title}</strong><small>{item.detail}</small></span><span className="notification-center-meta"><span>{eventLabels[item.event] ?? item.event}</span><span className="notification-priority">{item.priority === 'urgent' ? t('Khẩn') : item.priority === 'important' ? t('Quan trọng') : t('Thường')}</span><time title={formatDateTime(item.created_at)}>{relativeTime(item.created_at, i18n.language, t('vừa xong'))}</time></span></a>
          <div className="notification-center-actions">
            {!item.read_at && <button className="icon-button" type="button" aria-label={t('Đánh dấu đã đọc')} title={t('Đánh dấu đã đọc')} disabled={action.isPending} onClick={() => action.mutate({ id: item.id, kind: 'read' })}><Check size={16} /></button>}
            <button className="icon-button" type="button" aria-label={item.archived_at ? t('Khôi phục thông báo') : t('Lưu trữ thông báo')} title={item.archived_at ? t('Khôi phục') : t('Lưu trữ')} disabled={action.isPending} onClick={() => action.mutate({ id: item.id, kind: item.archived_at ? 'restore' : 'archive' })}>{item.archived_at ? <RotateCcw size={16} /> : <Archive size={16} />}</button>
            {!item.archived_at && <details className="notification-snooze"><summary aria-label={t('Hoãn thông báo')} title={t('Hoãn thông báo')}><Clock3 size={16} /></summary><div><button type="button" onClick={() => action.mutate({ id: item.id, kind: 'snooze', until: 'one_hour' })}>{t('1 giờ')}</button><button type="button" onClick={() => action.mutate({ id: item.id, kind: 'snooze', until: 'this_afternoon' })}>{t('Chiều nay')}</button><button type="button" onClick={() => action.mutate({ id: item.id, kind: 'snooze', until: 'tomorrow' })}>{t('Ngày mai')}</button></div></details>}
            <button className="icon-button" type="button" aria-label={t('Xóa thông báo')} title={t('Xóa')} disabled={action.isPending} onClick={() => setDeleteTarget(item.id)}><Trash2 size={16} /></button>
          </div>
          {item.snoozed_until && <small className="notification-snoozed-note">{t('Được nhắc lại {{date}}', { date: formatDateTime(item.snoozed_until) })}</small>}
        </article>)}</section>)}
      </div> : <p className="notification-center-state">{t('Không có thông báo phù hợp.')}</p>)}
      {pageData?.meta && pageData.meta.last_page > 1 && <nav className="notification-center-pagination" aria-label={t('Phân trang thông báo')}><span>{t('Trang {{current}}/{{last}} · {{total}} thông báo', { current: pageData.meta.current_page, last: pageData.meta.last_page, total: pageData.meta.total })}</span><div><button className="secondary" type="button" aria-label={t('Trang trước')} disabled={filters.page <= 1 || query.isFetching} onClick={() => update('page', filters.page - 1)}><ChevronLeft size={16} /></button><button className="secondary" type="button" aria-label={t('Trang sau')} disabled={filters.page >= pageData.meta.last_page || query.isFetching} onClick={() => update('page', filters.page + 1)}><ChevronRight size={16} /></button></div></nav>}
      <ConfirmDialog open={Boolean(deleteTarget)} title={t('Xóa thông báo?')} description={t('Thông báo này sẽ bị xóa khỏi danh sách của bạn.')} confirmLabel={t('Xóa thông báo')} busy={action.isPending} onConfirm={() => { if (deleteTarget) action.mutate({ id: deleteTarget, kind: 'delete' }, { onSuccess: () => setDeleteTarget(null) }) }} onOpenChange={(open) => { if (!open && !action.isPending) setDeleteTarget(null) }} />
    </section>
  </div>
}
