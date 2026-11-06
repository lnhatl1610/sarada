import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime } from '../../lib/date-format'

type ImportJob = {
  id: number
  type: string
  source_filename: string
  status: 'processing' | 'completed' | 'completed_with_errors' | 'failed'
  total_rows: number
  successful_rows: number
  failed_rows: number
  error_message: string | null
  errors_url: string | null
  created_at: string
  user?: { id: number; name: string }
}
type Page = { data: ImportJob[]; meta: { current_page: number; last_page: number; total: number } }

const statusLabels = (t: (key: string) => string): Record<ImportJob['status'], string> => ({
  processing: t('Đang xử lý'), completed: t('Hoàn tất'), completed_with_errors: t('Hoàn tất, có dòng lỗi'), failed: t('Thất bại'),
})

export function ImportHistoryPage({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const { t } = useTranslation()
  const labels = statusLabels(t)
  const [page, setPage] = useState(1)
  const [downloadError, setDownloadError] = useState('')
  const history = useQuery({
    queryKey: ['admin', 'imports', page],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/admin/imports?page=${page}&per_page=20`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as Page & { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không thể tải lịch sử nhập dữ liệu.'))
      return body
    },
  })

  const downloadErrors = async (job: ImportJob) => {
    if (!job.errors_url) return
    setDownloadError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/imports/${job.id}/errors`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/csv' } })
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string }
        throw new Error(body.message ?? t('Không thể tải tệp lỗi.'))
      }
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `loi-nhap-kho-${job.id}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : t('Không thể tải tệp lỗi.'))
    }
  }

  return <section className="panel reference-page">
    <div className="panel-heading"><div><h2>{t('Lịch sử nhập dữ liệu')}</h2><p>{t('Theo dõi các lần nhập kho CSV và tải danh sách dòng chưa nhập thành công.')}</p></div><a className="secondary" href="/inventory/import">{t('Nhập dữ liệu')}</a></div>
    {downloadError && <p className="reference-error" role="alert">{downloadError}</p>}
    {history.isPending ? <p role="status">{t('Đang tải lịch sử…')}</p> : history.isError ? <div className="reference-error" role="alert"><p>{history.error.message}</p><button className="secondary" type="button" onClick={() => void history.refetch()}>{t('Thử lại')}</button></div> : !history.data.data.length ? <div className="empty-state"><h3>{t('Chưa có lần nhập dữ liệu nào')}</h3><p>{t('Lịch sử sẽ xuất hiện sau khi bạn nhập CSV kho hàng.')}</p></div> : <>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>{t('Tệp')}</th><th>{t('Người nhập')}</th><th>{t('Thời gian')}</th><th>{t('Trạng thái')}</th><th>{t('Tổng dòng')}</th><th>{t('Thành công')}</th><th>{t('Lỗi')}</th><th>{t('Thao tác')}</th></tr></thead><tbody>{history.data.data.map((job) => <tr key={job.id}><td>{job.source_filename}</td><td>{job.user?.name ?? t('Tôi')}</td><td>{formatDateTime(job.created_at)}</td><td>{labels[job.status]}</td><td>{job.total_rows}</td><td>{job.successful_rows}</td><td>{job.failed_rows}{job.error_message && <small className="field-error">{job.error_message}</small>}</td><td>{job.errors_url ? <button className="secondary" type="button" onClick={() => void downloadErrors(job)}>{t('Tải CSV lỗi')}</button> : '—'}</td></tr>)}</tbody></table></div>
      <div className="list-pagination"><span>{t('{{count}} lần nhập', { count: history.data.meta.total })}</span><button className="secondary" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t('Trước')}</button><span>{t('Trang {{current}}/{{last}}', { current: history.data.meta.current_page, last: history.data.meta.last_page })}</span><button className="secondary" type="button" disabled={page >= history.data.meta.last_page} onClick={() => setPage((value) => value + 1)}>{t('Sau')}</button></div>
    </>}
  </section>
}
