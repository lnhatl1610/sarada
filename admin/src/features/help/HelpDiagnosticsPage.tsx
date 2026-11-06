import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'

type Props = { apiUrl: string; accessToken: string; userId?: number }
type ApiInfo = { app_version: string; api_version: string; commit: string; environment: string; php_version: string; laravel_version: string; timezone: string; request_id: string | null }

export function HelpDiagnosticsPage({ apiUrl, accessToken, userId }: Props) {
  const { t } = useTranslation()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const query = useQuery({ queryKey: ['admin-app-info'], queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/admin/app-info`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    if (!response.ok) throw new Error(t('Không tải được thông tin phiên bản từ API.'))
    return (await response.json() as { data: ApiInfo }).data
  } })
  const browserInfo = navigator.userAgent
  const info = query.data
  const details = [
    [t('Admin'), import.meta.env.VITE_APP_VERSION ?? '0.0.0'], [t('Phiên bản API'), info?.app_version ?? '—'], ['API', info?.api_version ?? '—'], [t('Mã commit'), info?.commit || t('Chưa cấu hình')],
    [t('Môi trường'), info?.environment ?? '—'], ['PHP', info?.php_version ?? '—'], ['Laravel', info?.laravel_version ?? '—'],
    [t('Trình duyệt'), browserInfo], [t('Múi giờ'), info?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone],
    [t('Màn hình'), t('{{width}} × {{height}} · cửa sổ {{windowWidth}} × {{windowHeight}}', { width: window.screen.width, height: window.screen.height, windowWidth: window.innerWidth, windowHeight: window.innerHeight })], [t('Tài khoản'), userId ? `#${userId}` : '—'], [t('Mã request'), info?.request_id ?? '—'],
  ] as const
  async function copy() {
    try { await navigator.clipboard.writeText(details.map(([label, value]) => `${label}: ${value}`).join('\n')); setError(''); setNotice(t('Đã sao chép thông tin chẩn đoán.')) }
    catch { setNotice(''); setError(t('Trình duyệt không cho phép sao chép. Hãy chọn và sao chép nội dung bên dưới.')) }
  }
  return <section className="admin-help-page"><header className="page-heading"><div><p className="eyebrow">{t('Trợ giúp')}</p><h1>{t('Phiên bản & chẩn đoán')}</h1><p>{t('Thông tin kỹ thuật để gửi kèm khi báo lỗi.')}</p></div><button type="button" onClick={() => void copy()}>{t('Sao chép thông tin')}</button></header>
    {notice && <p role="status" className="support-notice">{notice}</p>}{error && <p role="alert" className="support-error">{error}</p>}{query.isError && <p role="alert" className="support-error">{query.error.message} <button type="button" onClick={() => void query.refetch()}>{t('Thử lại')}</button></p>}
    {query.isLoading && <p role="status">{t('Đang tải thông tin API…')}</p>}
    <dl className="admin-diagnostics-list">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl>
  </section>
}
