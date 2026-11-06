import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { adminApiFetch } from '../../lib/admin-api'
import type { components } from '../../types/api'
import { useTranslation } from 'react-i18next'

type LoginAttempt = components['schemas']['LoginAttempt']
type Props = { apiUrl: string; accessToken: string; userId?: number }
type ListResponse = { data: LoginAttempt[]; meta: { total: number; current_page: number; last_page: number; per_page: number } }
type ScoreResponse = { data: { score: number; level: 'strong' | 'fair' | 'needs_attention'; checks: Array<{ key: string; label: string; passed: boolean; points: number }> } }

const resultLabels: Record<LoginAttempt['result'], string> = {
  success: 'Thành công', bad_password: 'Sai mật khẩu', bad_2fa: 'Sai mã xác thực', locked: 'Bị chặn', passkey: 'Passkey',
}

export function AccountLoginHistoryPage({ apiUrl, accessToken, userId }: Props) {
  const { t, i18n } = useTranslation()
  const [resultFilter, setResultFilter] = useState('')
  const score = useQuery({
    queryKey: ['admin-account-security-score', userId],
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/account/security-score`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error(t('Không tải được điểm bảo mật.'))
      return await response.json() as ScoreResponse
    },
  })
  const history = useQuery({
    queryKey: ['admin-account-login-history', userId, resultFilter],
    queryFn: async () => {
      const query = resultFilter ? `?result=${encodeURIComponent(resultFilter)}` : ''
      const response = await adminApiFetch(`${apiUrl}/account/login-history${query}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error(t('Không tải được lịch sử đăng nhập.'))
      return await response.json() as ListResponse
    },
  })

  return <section className="account-login-history-page">
    <header className="page-heading"><div><p className="eyebrow">{t('Bảo mật')}</p><h1>{t('Lịch sử đăng nhập')}</h1><p>{t('Kiểm tra lần đăng nhập gần đây và tình trạng bảo mật tài khoản.')}</p></div></header>
    <section className="panel security-score-panel" aria-labelledby="security-score-title">
      <div><h2 id="security-score-title">{t('Điểm bảo mật')}</h2><p>{t('Điểm dựa trên email, xác thực hai bước, thời điểm đổi mật khẩu và đăng nhập thất bại gần đây.')}</p></div>
      {score.isPending && <span role="status">{t('Đang tính…')}</span>}
      {score.isError && <Button type="button" variant="outline" onClick={() => void score.refetch()}>{t('Thử tải lại')}</Button>}
      {score.data && <strong className="security-score-value">{score.data.data.score}/100</strong>}
      {score.data && <ul>{score.data.data.checks.map((check) => <li key={check.key}><span>{t(check.label)}</span><strong className={check.passed ? 'permission-granted' : 'permission-missing'}>{check.passed ? `+${check.points}` : t('Cần xử lý')}</strong></li>)}</ul>}
    </section>
    <div className="account-login-history-toolbar"><label>{t('Lọc kết quả')}<select value={resultFilter} onChange={(event) => setResultFilter(event.target.value)}><option value="">{t('Tất cả')}</option><option value="success">{t('Thành công')}</option><option value="bad_password">{t('Sai mật khẩu')}</option><option value="bad_2fa">{t('Sai mã xác thực')}</option><option value="locked">{t('Bị chặn')}</option></select></label></div>
    {history.isPending && <p role="status">{t('Đang tải lịch sử…')}</p>}
    {history.isError && <div className="panel" role="alert"><p>{history.error.message}</p><Button type="button" variant="outline" onClick={() => void history.refetch()}>{t('Thử lại')}</Button></div>}
    {history.data && <div className="panel account-login-history-list" aria-live="polite">
      {history.data.data.map((attempt) => <article className="login-history-row" key={attempt.id}>
        <div><strong>{t(resultLabels[attempt.result])}</strong><small>{attempt.ip_address ?? t('Không có IP')} · {attempt.user_agent ?? t('Không rõ thiết bị')}</small></div>
        <time dateTime={attempt.created_at ?? undefined}>{attempt.created_at ? new Date(attempt.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN') : t('Không rõ thời gian')}</time>
      </article>)}
      {history.data.data.length === 0 && <p className="workspace-empty">{t('Chưa có lịch sử đăng nhập phù hợp.')}</p>}
    </div>}
  </section>
}
