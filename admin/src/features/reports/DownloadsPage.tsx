import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { formatDateTime, formatNumber } from '../../lib/date-format'
import { adminApiFetch } from '../../lib/admin-api'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import './DownloadsPage.css'

type DownloadItem = {
  id: number
  user_id: number
  owner_name: string | null
  type: 'personal_data' | 'scheduled_report' | 'admin_customers' | 'admin_products' | 'admin_orders' | 'admin_inventory' | 'admin_activity' | 'admin_report'
  params: Record<string, unknown>
  status: 'queued' | 'running' | 'ready' | 'failed' | 'expired'
  progress: number
  file_size: number | null
  error: string | null
  created_at: string | null
  finished_at: string | null
  expires_at: string | null
  download_url: string | null
}

const statusLabels: Record<DownloadItem['status'], string> = { queued: 'Đang chờ', running: 'Đang xử lý', ready: 'Sẵn sàng', failed: 'Lỗi', expired: 'Hết hạn' }
const typeLabels: Record<DownloadItem['type'], string> = {
  personal_data: 'Sao lưu dữ liệu cá nhân', scheduled_report: 'Báo cáo định kỳ',
  admin_customers: 'Xuất danh sách khách hàng', admin_products: 'Xuất danh sách sản phẩm',
  admin_orders: 'Xuất danh sách đơn hàng', admin_inventory: 'Xuất tồn kho',
  admin_activity: 'Xuất nhật ký hoạt động', admin_report: 'Xuất báo cáo',
}

function bytes(size: number | null, locale: string): string {
  if (size === null) return '—'
  if (size < 1024) return `${new Intl.NumberFormat(locale).format(size)} B`
  if (size < 1024 * 1024) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(size / 1024)} KB`
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(size / 1024 / 1024)} MB`
}

function description(item: DownloadItem, canViewAll: boolean, t: TFunction): string {
  const nested = item.params.filters
  const filters = nested && typeof nested === 'object' ? nested as Record<string, unknown> : item.params
  const parts = [
    typeof filters.report === 'string' ? t('Báo cáo {{report}}', { report: filters.report }) : '',
    filters.from && filters.to ? `${String(filters.from)} – ${String(filters.to)}` : '',
    canViewAll && item.owner_name ? item.owner_name : '',
  ]

  return parts.filter(Boolean).join(' · ')
}

export function DownloadsPage({ apiUrl, accessToken, canViewAll, currentUserId }: { apiUrl: string; accessToken: string; canViewAll: boolean; currentUserId?: number }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'vi-VN'
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
  const query = useQuery({
    queryKey: ['admin', 'downloads'],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/admin/downloads?per_page=100`, { headers })
      const body = await response.json() as { data?: DownloadItem[]; message?: string }
      if (!response.ok) throw new Error(t('Không tải được danh sách tệp.'))
      return body.data ?? []
    },
    refetchInterval: (current) => current.state.data?.some((item) => ['queued', 'running'].includes(item.status)) ? 5000 : 30000,
  })

  const mutate = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'retry' | 'delete' }) => {
      const response = await adminApiFetch(`${apiUrl}/admin/downloads/${id}${action === 'retry' ? '/retry' : ''}`, {
        method: action === 'retry' ? 'POST' : 'DELETE', headers: { ...headers, 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error(action === 'retry' ? t('Không chạy lại được tệp.') : t('Không xóa được tệp.'))
      return action === 'retry' ? t('Đã đưa tệp vào hàng đợi xử lý lại.') : t('Đã xóa tệp tải xuống.')
    },
    onSuccess: async (message) => { setNotice(message); setError(''); await queryClient.invalidateQueries({ queryKey: ['admin', 'downloads'] }) },
    onError: (reason) => { setError(reason instanceof Error ? reason.message : t('Không thực hiện được thao tác.')); setNotice('') },
  })

  const download = async (item: DownloadItem) => {
    setError(''); setNotice('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/downloads/${item.id}/file`, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!response.ok) throw new Error(t('Tệp đã hết hạn hoặc bạn không có quyền tải tệp này.'))
      const url = URL.createObjectURL(await response.blob())
      const extension = item.params.format === 'pdf' ? 'pdf' : item.type === 'personal_data' ? 'zip' : 'csv'
      const link = document.createElement('a')
      link.href = url; link.download = `fashion-store-${item.type}-${item.id}.${extension}`; link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice(t('Đã bắt đầu tải tệp.'))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('Không tải được tệp.'))
      void queryClient.invalidateQueries({ queryKey: ['admin', 'downloads'] })
    }
  }

  return <div className="downloads-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Báo cáo và dữ liệu')}</p><h1>{t('Trung tâm tải xuống')}</h1><p>{t('Tệp được lưu riêng tư tối đa 7 ngày. Tệp hết hạn sẽ không còn tải được.')}</p></div></header>
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    {error && <p className="reference-error" role="alert">{error}</p>}
    {query.isPending && <p role="status">{t('Đang tải danh sách…')}</p>}
    {query.isError && <div className="panel" role="alert"><p>{query.error.message}</p><button type="button" className="secondary" onClick={() => void query.refetch()}>{t('Thử lại')}</button></div>}
    {query.isSuccess && query.data.length === 0 && <section className="panel"><p>{t('Chưa có tệp xuất nào. Bản sao dữ liệu cá nhân, báo cáo định kỳ và các tệp CSV xuất dữ liệu sẽ xuất hiện tại đây.')}</p></section>}
    {query.isSuccess && query.data.length > 0 && <div className="downloads-list">{query.data.map((item) => <article className="panel download-card" key={item.id}>
      <div className="download-card-info"><div className="download-card-title"><h2>{t(typeLabels[item.type])}</h2><span className={`download-status download-status--${item.status}`}>{t(statusLabels[item.status])}</span></div>
        <p>{description(item, canViewAll, t)}</p>
        {item.type === 'scheduled_report' && item.user_id === currentUserId && Boolean(item.params.schedule_id) && <p><a href={`/reports/schedules?edit=${String(item.params.schedule_id)}`}>{t('Mở lịch gửi báo cáo')}</a></p>}
        <p>{t('Tạo lúc {{date}}', { date: formatDateTime(item.created_at) })} · {t('Kích thước {{size}}', { size: bytes(item.file_size, locale) })}{item.expires_at ? ` · ${t('Hết hạn {{date}}', { date: formatDateTime(item.expires_at) })}` : ''}</p>
        {['queued', 'running'].includes(item.status) && <div className="download-progress" role="progressbar" aria-label={t('Tiến độ {{progress}}%', { progress: formatNumber(item.progress) })} aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${item.progress}%` }} /></div>}
        {item.error && <p className="reference-error" role="alert">{item.error}</p>}
      </div>
      <div className="download-card-actions">
        {item.status === 'ready' && <button type="button" onClick={() => void download(item)}>{t('Tải xuống')}</button>}
        {['failed', 'expired'].includes(item.status) && <button className="secondary" type="button" disabled={mutate.isPending} onClick={() => mutate.mutate({ id: item.id, action: 'retry' })}>{t('Chạy lại')}</button>}
        <button className="secondary" type="button" disabled={mutate.isPending || ['queued', 'running'].includes(item.status)} onClick={() => setDeleteTarget(item.id)}>{t('Xóa')}</button>
      </div>
    </article>)}</div>}
    <ConfirmDialog open={deleteTarget !== null} title={t('Xóa tệp tải xuống?')} description={t('Tệp này sẽ bị xóa khỏi trung tâm tải xuống.')} confirmLabel={t('Xóa tệp')} busy={mutate.isPending} onConfirm={() => { if (deleteTarget !== null) mutate.mutate({ id: deleteTarget, action: 'delete' }, { onSuccess: () => setDeleteTarget(null) }) }} onOpenChange={(open) => { if (!open && !mutate.isPending) setDeleteTarget(null) }} />
  </div>
}
