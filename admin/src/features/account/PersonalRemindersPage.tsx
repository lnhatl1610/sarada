import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { adminApiFetch } from '../../lib/admin-api'
import type { components } from '../../types/api'
import { useTranslation } from 'react-i18next'

type Task = components['schemas']['PersonalTask']
type ListResponse = { data: Task[]; meta?: { current_page: number; last_page: number; total: number } }
type SnoozeDuration = '10_minutes' | '1_hour' | 'tomorrow_morning'

const snoozeOptions: Array<{ value: SnoozeDuration; label: string }> = [
  { value: '10_minutes', label: '10 phút' },
  { value: '1_hour', label: '1 giờ' },
  { value: 'tomorrow_morning', label: 'Sáng mai' },
]

function reminderTarget(task: Task): string | null {
  if (!task.subject_id) return null
  if (task.subject_type === 'order') return `/orders/${task.subject_id}`
  if (task.subject_type === 'product') return `/products/${task.subject_id}/edit`
  if (task.subject_type === 'customer') return `/customers/${task.subject_id}`
  if (task.subject_type === 'inventory') return `/inventory/adjustments/${task.subject_id}`
  return null
}

export function PersonalRemindersPage({ apiUrl, accessToken, userId, onNavigate }: { apiUrl: string; accessToken: string; userId?: number; onNavigate: (href: string) => void }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(0)
  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0)
    const interval = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => { window.clearTimeout(initialTimer); window.clearInterval(interval) }
  }, [])
  const queryKey = ['personal-reminders', userId, page]
  const reminders = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/me/reminders?page=${page}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error(t('Không tải được danh sách nhắc việc.'))
      return await response.json() as ListResponse
    },
  })
  const snooze = useMutation({
    mutationFn: async ({ taskId, duration }: { taskId: number; duration: SnoozeDuration }) => {
      const response = await adminApiFetch(`${apiUrl}/me/tasks/${taskId}/snooze`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ duration }) })
      const result = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? t('Không thể hoãn nhắc việc.'))
      return result
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['personal-reminders', userId] })
      void queryClient.invalidateQueries({ queryKey: ['personal-workspace', userId, 'tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-account-menu-summary', userId] })
    },
  })
  const items = reminders.data?.data ?? []

  return <section className="personal-workspace-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Không gian cá nhân')}</p><h1>{t('Nhắc việc')}</h1><p>{t('Nhắc theo lịch cho việc của bạn. Nhắc lặp tiếp tục theo chu kỳ đã chọn.')}</p></div></header>
    <nav className="personal-workspace-tabs" aria-label={t('Không gian cá nhân')}>
      <a href="/me/tasks" onClick={(event) => { event.preventDefault(); onNavigate('/me/tasks') }}>{t('Việc cần làm')}</a>
      <a href="/me/reminders" aria-current="page" className="active">{t('Nhắc việc')}</a>
    </nav>
    {snooze.error && <p className="account-form-error" role="alert">{snooze.error.message}</p>}
    {reminders.isPending && <p role="status">{t('Đang tải nhắc việc…')}</p>}
    {reminders.isError && <div className="panel" role="alert"><p>{reminders.error.message}</p><Button type="button" variant="outline" onClick={() => void reminders.refetch()}>{t('Thử lại')}</Button></div>}
    {!reminders.isPending && !reminders.isError && items.length === 0 && <div className="panel"><p>{t('Chưa có nhắc việc sắp tới. Tạo việc và đặt thời điểm nhắc trong mục Việc cần làm.')}</p><Button type="button" variant="outline" onClick={() => onNavigate('/me/tasks')}>{t('Mở việc cần làm')}</Button></div>}
    <div className="personal-workspace-list" aria-live="polite">
      {items.map((task) => {
        const target = reminderTarget(task)
        const reminderDate = task.remind_at ? new Date(task.remind_at) : null
        const overdue = reminderDate !== null && now > 0 && reminderDate.getTime() < now
        return <article className="personal-workspace-item" key={task.id}>
          <div><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}
            <small>{overdue ? t('Đã quá giờ nhắc') : t('Nhắc lúc')}{reminderDate ? ` · ${reminderDate.toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN')}` : ''}{task.repeat_rule ? ` · ${t('Lặp')} ${task.repeat_rule === 'daily' ? t('hằng ngày') : t('hằng tuần')}` : ''}</small>
            {target && <a href={target} onClick={(event) => { event.preventDefault(); onNavigate(target) }}>{t('Mở đối tượng liên kết')}</a>}
          </div>
          <div className="workspace-actions" aria-label={t('Hoãn nhắc việc {{title}}', { title: task.title })}>
            {snoozeOptions.map((option) => <Button key={option.value} type="button" size="sm" variant="outline" disabled={snooze.isPending} onClick={() => snooze.mutate({ taskId: task.id, duration: option.value })}>{t('Hoãn {{duration}}', { duration: t(option.label) })}</Button>)}
          </div>
        </article>
      })}
    </div>
    {reminders.data?.meta && reminders.data.meta.last_page > 1 && <div className="workspace-actions" aria-label={t('Phân trang nhắc việc')}>
      <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('Trang trước')}</Button>
      <span>{t('Trang {{page}} / {{lastPage}} · {{count}} nhắc việc', { page, lastPage: reminders.data.meta.last_page, count: reminders.data.meta.total })}</span>
      <Button type="button" variant="outline" disabled={page >= reminders.data.meta.last_page} onClick={() => setPage((value) => value + 1)}>{t('Trang sau')}</Button>
    </div>}
  </section>
}
