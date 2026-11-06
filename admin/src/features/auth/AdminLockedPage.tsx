import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminAuthLayout } from './AdminAuthLayout'

export function AdminLockedPage() {
  const { t } = useTranslation()
  const params = new URLSearchParams(window.location.search)
  const lockedUntil = params.get('until')
  const accountBlocked = params.get('type') === 'account'
  const returnTo = params.get('returnTo')
  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'
  const expiresAt = lockedUntil ? Date.parse(lockedUntil) : Number.NaN
  const [secondsLeft, setSecondsLeft] = useState(() => Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0)

  useEffect(() => {
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt])

  const temporary = Number.isFinite(expiresAt)
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return <AdminAuthLayout><section className="login-card"><a className="admin-brand login-brand" href="/">NÉT<span>.</span><small>STUDIO</small></a><p className="admin-state-code">!</p><h1>{accountBlocked ? t('Không thể đăng nhập') : t('Tài khoản tạm khóa')}</h1><p className="login-lede">{accountBlocked ? t('Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ quản trị viên cửa hàng để được hỗ trợ.') : t('Đăng nhập không thành công nhiều lần. Vì lý do bảo mật, quyền đăng nhập quản trị đã tạm khóa.')}</p>{!accountBlocked && temporary && secondsLeft > 0 ? <p className="login-lede" role="status">{t('Bạn có thể thử lại sau {{time}}.', { time: `${minutes}:${String(seconds).padStart(2, '0')}` })}</p> : !accountBlocked && <p className="login-lede">{t('Nếu bạn cần hỗ trợ, vui lòng liên hệ quản trị viên cửa hàng.')}</p>}<div className="reference-form-actions"><a className="primary" href={loginHref}>{t('Quay về đăng nhập')}</a></div></section></AdminAuthLayout>
}
