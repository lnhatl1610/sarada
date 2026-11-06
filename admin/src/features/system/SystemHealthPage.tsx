import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { adminApiFetch } from '../../lib/admin-api'
import { ADMIN_API_BASE_URL } from '../../lib/api-base'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../lib/date-format'

type Check = { status: 'ok' | 'warning' | 'error'; message?: string; [key: string]: string | number | boolean | null | undefined }
type Health = { status: Check['status']; checked_at: string; services: Record<string, Check>; versions: { php: string; laravel: string; node: string | null; environment: string } }
type FailedJob = { id: number; connection: string; queue: string; failed_at: string; summary: string }
const apiBase = ADMIN_API_BASE_URL

export function SystemHealthPage() {
  const { t } = useTranslation()
  const labels: Record<string, string> = { api: 'API', database: t('Cơ sở dữ liệu'), queue: t('Hàng đợi'), failed_jobs: t('Hàng đợi lỗi'), scheduler: 'Scheduler', mail: t('Email'), storage: t('Lưu trữ'), backups: t('Sao lưu') }
  const statusText = (status: Check['status']) => status === 'ok' ? t('Hoạt động') : status === 'warning' ? t('Cần chú ý') : t('Lỗi')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [actionTarget, setActionTarget] = useState<{ type: 'retry' | 'delete'; job: FailedJob } | null>(null)
  const [actionError, setActionError] = useState('')
  useEffect(() => {
    if (window.location.pathname === '/system/failed-jobs') {
      document.getElementById('failed-jobs')?.scrollIntoView({ block: 'start' })
    }
  }, [])
  const query = useQuery({
    queryKey: ['admin-system-health'],
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await adminApiFetch(`${apiBase}/admin/system/health`, { headers: { Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { data?: Health; message?: string }
      if (!response.ok || !body.data) throw new Error(body.message ?? t('Không tải được trạng thái hệ thống.'))
      return body.data
    },
  })
  const failedJobs = useQuery({
    queryKey: ['admin-system-failed-jobs', page],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiBase}/admin/system/failed-jobs?page=${page}&per_page=20`, { headers: { Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { data?: FailedJob[]; meta?: { current_page: number; last_page: number; total: number }; message?: string }
      if (!response.ok || !body.data || !body.meta) throw new Error(body.message ?? t('Không tải được hàng đợi lỗi.'))
      return { data: body.data, meta: body.meta }
    },
  })
  const runAction = useMutation({
    mutationFn: async ({ type, job }: { type: 'retry' | 'delete'; job: FailedJob }) => {
      const response = await adminApiFetch(`${apiBase}/admin/system/failed-jobs/${job.id}${type === 'retry' ? '/retry' : ''}`, {
        method: type === 'retry' ? 'POST' : 'DELETE', headers: { Accept: 'application/json' },
      })
      const body = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không thể cập nhật job lỗi.'))
      return body
    },
    onSuccess: () => { setActionError(''); setActionTarget(null); void queryClient.invalidateQueries({ queryKey: ['admin-system-failed-jobs'] }); void queryClient.invalidateQueries({ queryKey: ['admin-system-health'] }) },
    onError: (error) => setActionError(error instanceof Error ? error.message : t('Không thể cập nhật job lỗi.')),
  })
  const health = query.data

  return <section className="operations-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Quản trị hệ thống')}</p><h1>{t('Trạng thái hệ thống')}</h1><p>{t('Tình trạng API, cơ sở dữ liệu, queue, lịch chạy, email và dung lượng máy chủ.')}</p></div><Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? t('Đang cập nhật…') : t('Làm mới')}</Button></header>
    {query.isPending && <p role="status">{t('Đang kiểm tra dịch vụ…')}</p>}
    {query.isError && <div className="panel" role="alert"><p>{query.error.message}</p><Button type="button" variant="outline" onClick={() => void query.refetch()}>{t('Thử lại')}</Button></div>}
    {health && <>
      <section className={`panel system-health-summary system-health-${health.status}`} aria-live="polite"><strong>{t(health.status === 'ok' ? 'Hệ thống hoạt động bình thường' : health.status === 'warning' ? 'Một số dịch vụ cần chú ý' : 'Phát hiện lỗi hệ thống')}</strong><span>{t('Kiểm tra lúc {{time}}', { time: formatDateTime(health.checked_at) })}</span></section>
      <div className="system-health-grid">{Object.entries(health.services).map(([key, check]) => <article className={`panel system-health-card system-health-${check.status}`} key={key}>
        <div className="panel-heading"><h2>{labels[key] ?? key}</h2><span className={`profile-role-badge system-health-badge-${check.status}`}>{statusText(check.status)}</span></div>
        {check.message && <p>{check.message}</p>}
        {key === 'database' && check.latency_ms !== undefined && <p>{t('Độ trễ: {{latency}} ms', { latency: check.latency_ms })}</p>}
        {key === 'queue' && <p>{check.driver ? t('Driver {{driver}}', { driver: check.driver }) : ''}{check.queue ? ` · ${t('Hàng đợi {{queue}}', { queue: check.queue })}` : ''}{check.pending !== null && check.pending !== undefined ? ` · ${t('{{count}} việc đang chờ', { count: check.pending })}` : ''}</p>}
        {key === 'failed_jobs' && check.count !== null && check.count !== undefined && <p>{t('{{count}} việc lỗi', { count: check.count })}</p>}
        {key === 'scheduler' && <p>{check.last_run_at ? t('Lần chạy gần nhất: {{time}}', { time: formatDateTime(String(check.last_run_at)) }) : t('Chưa có heartbeat từ scheduler.')}</p>}
        {key === 'mail' && <p>{check.mailer ? t('Mailer {{mailer}} · {{transport}}', { mailer: check.mailer, transport: check.transport ?? t('chưa cấu hình') }) : ''}</p>}
        {key === 'storage' && <p>{check.disk ? t('Disk {{disk}}', { disk: check.disk }) : ''}{check.free_bytes ? ` · ${t('Còn {{size}} GB', { size: (Number(check.free_bytes) / 1024 ** 3).toFixed(1) })}` : ''}{check.disk_writable === false ? ` · ${t('Không ghi được vào disk')}` : ''}</p>}
      </article>)}</div>
      <section className="panel"><h2>{t('Phiên bản và môi trường')}</h2><p>PHP {health.versions.php} · Laravel {health.versions.laravel}{health.versions.node ? ` · Node ${health.versions.node}` : ''} · {health.versions.environment}</p></section>
    </>}
    <section id="failed-jobs" className="panel system-failed-jobs">
      <div className="panel-heading"><div><h2>{t('Hàng đợi lỗi')}</h2><p>{t('Thông báo chỉ hiển thị dòng lỗi đầu tiên; chi tiết nhạy cảm được ẩn một phần.')}</p></div></div>
      {actionError && <p role="alert" className="account-form-error">{actionError}</p>}
      {failedJobs.isPending && <p role="status">{t('Đang tải job lỗi…')}</p>}
      {failedJobs.isError && <div role="alert"><p>{failedJobs.error.message}</p><Button type="button" variant="outline" onClick={() => void failedJobs.refetch()}>{t('Thử lại')}</Button></div>}
      {!failedJobs.isPending && !failedJobs.isError && failedJobs.data?.data.length === 0 && <p>{t('Không có job lỗi.')}</p>}
      <div className="personal-workspace-list">{failedJobs.data?.data.map((job) => <article className="personal-workspace-item" key={job.id}>
        <div><strong>#{job.id} · {job.queue}</strong><small>{t('Kết nối {{connection}} · Lỗi lúc {{time}}', { connection: job.connection, time: formatDateTime(job.failed_at) })}</small><small>{job.summary}</small></div>
        <div className="workspace-actions"><Button type="button" variant="outline" size="sm" disabled={runAction.isPending} onClick={() => setActionTarget({ type: 'retry', job })}>{t('Thử lại')}</Button><Button type="button" variant="ghost" size="sm" disabled={runAction.isPending} onClick={() => setActionTarget({ type: 'delete', job })}>{t('Xóa')}</Button></div>
      </article>)}</div>
      {failedJobs.data?.meta && failedJobs.data.meta.last_page > 1 && <div className="workspace-actions"><span>{t('Trang {{current}} / {{last}} · {{total}} job', { current: failedJobs.data.meta.current_page, last: failedJobs.data.meta.last_page, total: failedJobs.data.meta.total })}</span><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>{t('Trước')}</Button><Button type="button" variant="outline" size="sm" disabled={page >= failedJobs.data.meta.last_page} onClick={() => setPage((current) => current + 1)}>{t('Sau')}</Button></div>}
    </section>
    <ConfirmDialog open={actionTarget !== null} title={t(actionTarget?.type === 'retry' ? 'Thử chạy lại job lỗi?' : 'Xóa job lỗi?')} description={t(actionTarget?.type === 'retry' ? 'Job sẽ được đưa lại vào hàng đợi và có thể thực hiện lại thao tác ban đầu.' : 'Bản ghi job lỗi sẽ bị xóa khỏi danh sách.')} confirmLabel={t(actionTarget?.type === 'retry' ? 'Thử lại' : 'Xóa job')} onConfirm={() => actionTarget && runAction.mutate(actionTarget)} onOpenChange={(open) => { if (!open && !runAction.isPending) setActionTarget(null) }} busy={runAction.isPending} />
  </section>
}
