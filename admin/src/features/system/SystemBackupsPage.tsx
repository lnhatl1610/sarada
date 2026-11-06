import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { adminApiFetch } from '../../lib/admin-api'
import { ADMIN_API_BASE_URL } from '../../lib/api-base'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../lib/date-format'

type BackupFile = { file_name: string; size: number; created_at: string; download_url: string }
type BackupRun = { id: number; status: 'queued' | 'running' | 'completed' | 'failed'; file_name: string | null; file_size: number | null; error: string | null; requested_by: string | null; created_at: string | null; started_at: string | null; finished_at: string | null }
type Payload = { backups: BackupFile[]; runs: BackupRun[] }
const apiBase = ADMIN_API_BASE_URL

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function SystemBackupsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const query = useQuery({
    queryKey: ['admin-system-backups'],
    refetchInterval: 10_000,
    queryFn: async () => {
      const response = await adminApiFetch(`${apiBase}/admin/system/backups`, { headers: { Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { data?: Payload; message?: string }
      if (!response.ok || !body.data) throw new Error(body.message ?? t('Không tải được dữ liệu sao lưu.'))
      return body.data
    },
  })
  const create = useMutation({
    mutationFn: async () => {
      const response = await adminApiFetch(`${apiBase}/admin/system/backups`, { method: 'POST', headers: { Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không thể tạo yêu cầu sao lưu.'))
      return body.message ?? t('Đã đưa yêu cầu sao lưu vào hàng đợi.')
    },
    onSuccess: async (value) => { setError(''); setMessage(value); await queryClient.invalidateQueries({ queryKey: ['admin-system-backups'] }) },
    onError: (reason) => { setMessage(''); setError(reason instanceof Error ? reason.message : t('Không thể tạo yêu cầu sao lưu.')) },
  })

  async function download(file: BackupFile) {
    setError('')
    try {
      const response = await adminApiFetch(`${apiBase}/admin/system/backups/${encodeURIComponent(file.file_name)}`, { headers: { Accept: 'application/zip' } })
      if (!response.ok) throw new Error(t('Không thể tải bản sao lưu.'))
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = file.file_name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('Không thể tải bản sao lưu.'))
    }
  }

  const activeRun = query.data?.runs.some((run) => run.status === 'queued' || run.status === 'running') ?? false
  return <section className="operations-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Quản trị hệ thống')}</p><h1>{t('Sao lưu hệ thống')}</h1><p>{t('Sao lưu cơ sở dữ liệu và ảnh tải lên. Tệp được giữ riêng tư trong máy chủ và tự dọn sau 7 ngày.')}</p></div><Button type="button" disabled={create.isPending || activeRun} onClick={() => create.mutate()}>{create.isPending ? t('Đang gửi yêu cầu…') : activeRun ? t('Đang có tác vụ sao lưu') : t('Tạo bản sao lưu ngay')}</Button></header>
    {message && <p role="status" className="panel">{message}</p>}
    {error && <div role="alert" className="panel"><p>{error}</p></div>}
    {query.isPending && <p role="status">{t('Đang tải bản sao lưu…')}</p>}
    {query.isError && <div role="alert" className="panel"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}>{t('Thử lại')}</Button></div>}
    <section className="panel"><div className="panel-heading"><div><h2>{t('Bản sao lưu')}</h2><p>{t('Tối đa 100 tệp mới nhất, chỉ thành viên có quyền sao lưu mới xem và tải được.')}</p></div><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>{t('Làm mới')}</Button></div>
      {!query.isPending && query.data?.backups.length === 0 && <p>{t('Chưa có bản sao lưu. Tạo một bản để bắt đầu.')}</p>}
      <div className="personal-workspace-list">{query.data?.backups.map((file) => <article className="personal-workspace-item" key={file.file_name}><div><strong>{file.file_name}</strong><small>{formatDateTime(file.created_at)} · {formatBytes(file.size)}</small></div><Button size="sm" variant="outline" onClick={() => void download(file)}>{t('Tải xuống')}</Button></article>)}</div>
    </section>
    <section className="panel"><h2>{t('Lịch sử tác vụ')}</h2>
      {query.data?.runs.length === 0 && <p>{t('Chưa có tác vụ sao lưu.')}</p>}
      <div className="personal-workspace-list">{query.data?.runs.map((run) => <article className="personal-workspace-item" key={run.id}><div><strong>#{run.id} · {t(run.status === 'queued' ? 'Đang chờ' : run.status === 'running' ? 'Đang chạy' : run.status === 'completed' ? 'Hoàn tất' : 'Thất bại')}</strong><small>{run.requested_by ?? t('Quản trị viên')} · {run.created_at ? formatDateTime(run.created_at) : '—'}</small>{run.error && <small role="alert">{run.error}</small>}</div>{run.file_name && <small>{run.file_name} · {formatBytes(run.file_size ?? 0)}</small>}</article>)}</div>
    </section>
  </section>
}
