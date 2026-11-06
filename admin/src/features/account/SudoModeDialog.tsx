import { useState } from 'react'
import type { FormEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'

type Result = { data?: { active: boolean; expires_at: string | null }; message?: string; errors?: Record<string, string[]> }

export function SudoModeDialog({ apiUrl, accessToken, open, requiresTwoFactor, onOpenChange, onAuthenticated }: {
  apiUrl: string
  accessToken: string
  open: boolean
  requiresTwoFactor: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticated: (expiresAt: string | null) => void
}) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/account/sudo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: password, ...(requiresTwoFactor ? { two_factor_code: code } : {}) }),
      })
      const body = await response.json().catch(() => ({})) as Result
      if (!response.ok || !body.data?.active) throw new Error(Object.values(body.errors ?? {})[0]?.[0] ?? body.message ?? t('Không thể xác nhận lại tài khoản.'))
      setPassword('')
      setCode('')
      onAuthenticated(body.data.expires_at)
      onOpenChange(false)
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Không thể xác nhận lại tài khoản.'))
    } finally {
      setBusy(false)
    }
  }

  return <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) { setPassword(''); setCode(''); setError('') }; onOpenChange(nextOpen) }}>
    <DialogContent className="sudo-mode-dialog">
      <DialogHeader><DialogTitle>{t('Xác nhận lại tài khoản')}</DialogTitle><DialogDescription>{t('Nhập mật khẩu để bật sudo mode trong 10 phút. Phiên hiện tại sẽ dùng xác nhận này cho thao tác nhạy cảm đang thực hiện.')}</DialogDescription></DialogHeader>
      <form onSubmit={(event) => void submit(event)}>
        <label>{t('Mật khẩu hiện tại')}<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {requiresTwoFactor && <label>{t('Mã xác thực 2 bước')}<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} pattern="\d{6}" required /></label>}
        {error && <p role="alert" className="sudo-mode-error">{error}</p>}
        <DialogFooter><button type="button" className="secondary" onClick={() => onOpenChange(false)}>{t('Hủy')}</button><button type="submit" disabled={busy}>{busy ? t('Đang xác nhận…') : t('Xác nhận 10 phút')}</button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
