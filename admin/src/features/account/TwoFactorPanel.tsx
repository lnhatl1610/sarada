import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApiFetch } from '../../lib/admin-api'
import { createApiResponseError } from '../../components/shared/api-validation'
import { FormField } from '../../components/shared/form-field'
import { AdminOtpInput } from '../../components/shared/AdminOtpInput'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { useTranslation } from 'react-i18next'

type Status = { enabled: boolean; enabled_at: string | null; recovery_codes_remaining: number }
type Setup = { qr_code: string; manual_entry_key: string }

export function TwoFactorPanel({ apiUrl, accessToken, requireSudo }: { apiUrl: string; accessToken: string; requireSudo: (action: () => void | Promise<void>) => void }) {
  const { t, i18n } = useTranslation()
  const [setup, setSetup] = useState<Setup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pendingSensitiveAction, setPendingSensitiveAction] = useState<'disable' | 'regenerate' | null>(null)
  const confirmDiscard = useUnsavedFormGuard(Boolean(code))
  const endpoint = `${apiUrl}/account/security/two-factor`

  const call = useCallback(async <T,>(path = '', init: RequestInit = {}) => {
    const response = await adminApiFetch(`${endpoint}${path}`, { ...init, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } })
    const body = await response.json().catch(() => ({})) as { data?: T; message?: string }
    if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể cập nhật xác thực hai bước.'))
    return body
  }, [endpoint, accessToken, t])

  const statusQuery = useQuery({
    queryKey: ['admin', 'account', 'two-factor'],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const body = await call<Status>()
      if (!body.data) throw new Error(t('Không tải được trạng thái xác thực hai bước.'))
      return body.data
    },
  })
  const status = statusQuery.data ?? null
  const load = () => statusQuery.refetch()
  const visibleError = error || (statusQuery.error instanceof Error ? statusQuery.error.message : '')

  const submit = async (path: string, body: Record<string, string>, success: string, showCodes = false, method = 'POST') => {
    setBusy(true); setError(''); setNotice('')
    try {
      const response = await call<{ recovery_codes?: string[]; qr_code?: string; manual_entry_key?: string; enabled?: boolean; enabled_at?: string | null; recovery_codes_remaining?: number }>(path, { method, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) })
      if (response.data?.qr_code && response.data.manual_entry_key) setSetup({ qr_code: response.data.qr_code, manual_entry_key: response.data.manual_entry_key })
      if (showCodes && response.data?.recovery_codes) setRecoveryCodes(response.data.recovery_codes)
      setCode(''); setNotice(t(success)); await load()
      if (method === 'DELETE') { setSetup(null); setRecoveryCodes([]) }
    } catch (exception) { setError(exception instanceof Error ? t(exception.message) : t('Không thể cập nhật xác thực hai bước.')) }
    finally { setBusy(false) }
  }

  const confirmSensitiveAction = () => {
    if (pendingSensitiveAction === 'regenerate') {
      requireSudo(() => submit('/recovery-codes', { code }, 'Đã tạo mã khôi phục mới. Bộ mã cũ không còn dùng được.', true))
    } else if (pendingSensitiveAction === 'disable') {
      requireSudo(() => submit('', { code }, 'Đã tắt xác thực hai bước.', false, 'DELETE'))
    }
    setPendingSensitiveAction(null)
  }

  const downloadCodes = () => {
    const blob = new Blob([`${t('Mã khôi phục Sarada')}\n\n${recoveryCodes.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'fashion-store-recovery-codes.txt'; link.click(); URL.revokeObjectURL(url)
  }
  const copyCodes = async () => { try { await navigator.clipboard.writeText(recoveryCodes.join('\n')); setNotice(t('Đã sao chép mã khôi phục.')) } catch { setError(t('Trình duyệt không cho phép sao chép. Hãy tải tệp mã khôi phục xuống.')) } }

  return <section id="2fa" className="panel account-settings-form"><div className="panel-heading"><div><h3>{t('Xác thực hai bước')}</h3><p>{t('Thêm mã từ ứng dụng xác thực khi đăng nhập quản trị.')}</p></div><span className="profile-role-badge">{status?.enabled ? t('Đang bật') : status ? t('Đang tắt') : t('Đang tải')}</span></div>
    {visibleError && <p className="account-settings-error" role="alert">{t(visibleError)}</p>}{notice && <p className="account-settings-notice" role="status">{notice}</p>}
    {!status ? <button className="secondary" type="button" onClick={() => void load()}>{t('Thử tải lại')}</button> : !status.enabled ? <>
      {!setup ? <form className="account-settings-inline-form" onSubmit={(event) => { event.preventDefault(); requireSudo(() => submit('/setup', {}, 'Quét mã bằng ứng dụng xác thực rồi nhập mã 6 số.')) }}><button className="primary" disabled={busy}>{t('Bật xác thực hai bước')}</button></form> : <div className="two-factor-enrollment"><img src={setup.qr_code} alt={t('Mã QR để thêm tài khoản vào ứng dụng xác thực')} /><p>{t('Không quét được mã? Nhập khóa này thủ công:')} <code>{setup.manual_entry_key}</code></p><form className="account-settings-inline-form" onSubmit={(event) => { event.preventDefault(); requireSudo(() => submit('/confirm', { code }, 'Đã bật xác thực hai bước. Hãy lưu mã khôi phục.', true)) }}><FormField id="two-factor-confirm-code" label={t('Mã xác thực 6 số')} required><AdminOtpInput id="two-factor-confirm-code" label={t('Mã xác thực')} value={code} onChange={setCode} /></FormField><button className="primary" disabled={busy || code.length !== 6}>{t('Xác nhận và bật')}</button><button className="secondary" type="button" onClick={() => { if (confirmDiscard()) { setCode(''); setSetup(null) } }}>{t('Hủy thiết lập')}</button></form></div>}
    </> : <>
      <p>{t('Đã bật lúc {{date}}. Còn {{count}} mã khôi phục.', { date: status.enabled_at ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(status.enabled_at)) : '—', count: status.recovery_codes_remaining })}</p>
      <form className="account-settings-inline-form" onSubmit={(event) => { event.preventDefault(); setPendingSensitiveAction('regenerate') }}><FormField id="two-factor-manage-code" label={t('Mã xác thực hiện tại')} required><AdminOtpInput id="two-factor-manage-code" label={t('Mã xác thực hiện tại')} value={code} onChange={setCode} /></FormField><button className="secondary" type="submit" disabled={busy || code.length !== 6}>{t('Tạo lại mã khôi phục')}</button></form>
      <button className="link-button" type="button" disabled={busy || code.length !== 6} onClick={() => setPendingSensitiveAction('disable')}>{t('Tắt xác thực hai bước')}</button>
    </>}
    {recoveryCodes.length > 0 && <div className="two-factor-recovery"><h4>{t('Lưu các mã khôi phục')}</h4><p>{t('Mỗi mã chỉ dùng được một lần. Bộ mã này chỉ hiển thị ngay sau khi tạo.')}</p><ul>{recoveryCodes.map((item) => <li key={item}><code>{item}</code></li>)}</ul><button className="secondary" type="button" onClick={downloadCodes}>{t('Tải xuống')}</button> <button className="secondary" type="button" onClick={() => void copyCodes()}>{t('Sao chép')}</button></div>}
    <ConfirmDialog open={pendingSensitiveAction !== null} title={t(pendingSensitiveAction === 'disable' ? 'Tắt xác thực hai bước?' : 'Tạo lại mã khôi phục?')} description={t(pendingSensitiveAction === 'disable' ? 'Tài khoản sẽ không còn yêu cầu mã xác thực khi đăng nhập. Hãy xác nhận thao tác bằng sudo mode và mã hiện tại.' : 'Bộ mã khôi phục hiện tại sẽ mất hiệu lực và được thay bằng bộ mã mới.')} confirmLabel={t(pendingSensitiveAction === 'disable' ? 'Tắt xác thực' : 'Tạo mã mới')} onConfirm={confirmSensitiveAction} onOpenChange={(open) => { if (!open && !busy) setPendingSensitiveAction(null) }} busy={busy} />
  </section>
}
