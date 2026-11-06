import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'

type ExportItem = { id: number; status: 'queued' | 'running' | 'ready' | 'failed' | 'expired'; progress: number; file_size: number | null; error: string | null; created_at: string; finished_at: string | null; expires_at: string | null; download_url: string | null }
type Props = { apiUrl: string; accessToken: string; userId?: number }
const statusLabels: Record<ExportItem['status'], string> = { queued: 'Đang chờ', running: 'Đang tạo tệp', ready: 'Sẵn sàng tải', failed: 'Tạo tệp thất bại', expired: 'Đã hết hạn' }
const retentionRows = (activityLogDays: number) => [
  ['Hồ sơ và tùy chọn tài khoản', 'Trong thời gian tài khoản còn hoạt động'],
  ['Việc cần làm', 'Đến khi bạn xóa hoặc tài khoản bị xóa'],
  ['Lịch sử đăng nhập', '180 ngày'],
  ['Thông báo đã đọc', 'Tối đa 90 ngày'],
  ['Nhật ký hoạt động quản trị', `${activityLogDays} ngày`],
  ['Tệp xuất dữ liệu cá nhân', '7 ngày sau khi tạo'],
]

export function AccountPrivacyPage({ apiUrl, accessToken, userId }: Props) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
  const retention = useQuery({
    queryKey: ['account-privacy-retention'],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/account/privacy/retention`, { headers })
      if (!response.ok) throw new Error(t('Không tải được thời hạn lưu dữ liệu.'))
      return await response.json() as { data: { activity_log_days: number } }
    },
  })
  const exports = useQuery({
    queryKey: ['account-privacy-exports', userId],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/account/privacy/exports`, { headers })
      if (!response.ok) throw new Error(t('Không tải được yêu cầu xuất dữ liệu.'))
      return await response.json() as { data: ExportItem[] }
    },
    refetchInterval: (query) => query.state.data?.data.some((item) => item.status === 'queued' || item.status === 'running') ? 2500 : false,
  })
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/account/privacy/exports`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' })
      const body = await response.json() as { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không thể yêu cầu xuất dữ liệu.'))
      return body
    },
    onSuccess: async (body) => { setError(''); setNotice(body.message ?? t('Đã tiếp nhận yêu cầu.')); await exports.refetch() },
    onError: (cause) => { setError(cause instanceof Error ? cause.message : t('Không thể yêu cầu xuất dữ liệu.')) },
  })

  async function download(item: ExportItem) {
    if (!item.download_url) return
    setError('')
    try {
      const response = await adminApiFetch(item.download_url, { headers })
      if (!response.ok) throw new Error(t('Tệp chưa sẵn sàng hoặc đã hết hạn. Hãy tải lại danh sách.'))
      const blobUrl = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `fashion-store-personal-data-${item.id}.zip`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Không tải được tệp.')) }
  }

  function clearBrowserData() {
    try {
      localStorage.clear()
      sessionStorage.clear()
      queryClient.clear()
      setConfirmClear(false)
      setError('')
      setNotice(t('Đã xóa dữ liệu lưu trên trình duyệt. Phiên đăng nhập hiện tại vẫn hoạt động.'))
    } catch {
      setError(t('Trình duyệt không cho phép xóa toàn bộ dữ liệu lưu cục bộ.'))
    }
  }

  return <section className="account-privacy-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Tài khoản')}</p><h1>{t('Quyền riêng tư & dữ liệu của tôi')}</h1><p>{t('Quản lý bản sao dữ liệu cá nhân và dữ liệu lưu trên trình duyệt.')}</p></div></header>
    {notice && <p className="account-privacy-notice" role="status">{notice}</p>}
    {error && <p className="account-privacy-error" role="alert">{error}</p>}
    <section className="panel account-privacy-card"><div><h2>{t('Tải dữ liệu cá nhân')}</h2><p>{t('Tạo tệp ZIP gồm hồ sơ, tùy chọn, công việc, nhật ký hoạt động của bạn và lịch sử đăng nhập. Tệp không bao gồm mật khẩu, token hoặc mã xác thực.')}</p></div>
      <Button type="button" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate()}>{exportMutation.isPending ? t('Đang gửi yêu cầu…') : t('Tạo bản sao dữ liệu')}</Button>
      {exports.isPending && <p role="status">{t('Đang tải danh sách yêu cầu…')}</p>}
      {exports.isError && <div role="alert"><p>{exports.error.message}</p><Button variant="outline" onClick={() => void exports.refetch()}>{t('Tải lại')}</Button></div>}
      {exports.data && <div className="account-privacy-export-list" aria-live="polite">
        {exports.data.data.map((item) => <article key={item.id} className="account-privacy-export-row"><div><strong>{t(statusLabels[item.status])}</strong><small>{t('Yêu cầu lúc {{date}}', { date: new Date(item.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN') })} · {item.progress}%</small>{item.expires_at && item.status === 'ready' && <small>{t('Liên kết hết hạn {{date}}', { date: new Date(item.expires_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN') })}</small>}{item.error && <small role="alert">{item.error}</small>}</div>{item.status === 'ready' && <Button variant="outline" onClick={() => void download(item)}>{t('Tải ZIP')}</Button>}</article>)}
        {exports.data.data.length === 0 && <p className="workspace-empty">{t('Bạn chưa yêu cầu xuất dữ liệu.')}</p>}
      </div>}
    </section>
    <section className="panel account-privacy-card"><div><h2>{t('Xóa dữ liệu trên trình duyệt này')}</h2><p>{t('Xóa localStorage, sessionStorage và bộ nhớ đệm truy vấn. Thao tác này không đăng xuất tài khoản.')}</p></div><Button variant="outline" onClick={() => setConfirmClear(true)}>{t('Xóa dữ liệu trình duyệt')}</Button></section>
    <section className="panel account-privacy-card"><div><h2>{t('Dữ liệu được lưu và thời hạn')}</h2><p>{t('Thời hạn dưới đây phản ánh cấu hình hiện tại của hệ thống.')}</p></div>{retention.isError && <p role="alert">{t('Không tải được thời hạn lưu dữ liệu.')} <button type="button" className="link-button" onClick={() => void retention.refetch()}>{t('Thử lại')}</button></p>}<dl className="account-privacy-retention">{retentionRows(365).map(([kind, duration]) => <div key={kind}><dt>{t(kind)}</dt><dd>{kind === 'Nhật ký hoạt động quản trị' ? retention.isPending ? t('Đang tải…') : retention.isError ? t('Chưa tải được') : t('{{days}} ngày', { days: retention.data?.data.activity_log_days ?? 365 }) : t(duration)}</dd></div>)}</dl></section>
    <ConfirmDialog open={confirmClear} title={t('Xóa dữ liệu trình duyệt?')} description={t('Các tùy chọn lưu cục bộ trên trình duyệt này sẽ bị xóa. Phiên đăng nhập đang hoạt động không bị đăng xuất.')} confirmLabel={t('Xóa dữ liệu')} onConfirm={clearBrowserData} onOpenChange={setConfirmClear} />
  </section>
}
