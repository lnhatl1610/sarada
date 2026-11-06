import { useEffect, useRef, useState } from 'react'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import { COOKIE_CONSENT_STORAGE_KEY, COOKIE_CONSENT_UPDATED_EVENT, type CookiePreferences } from './cookie-consent'
import './CookieConsentManager.css'

function readPreferences(): CookiePreferences | null {
  try {
    const value = JSON.parse(readBrowserStorage(COOKIE_CONSENT_STORAGE_KEY) ?? 'null') as Partial<CookiePreferences> | null
    if (!value || value.necessary !== true || typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean') return null
    return { necessary: true, analytics: value.analytics, marketing: value.marketing, savedAt: typeof value.savedAt === 'string' ? value.savedAt : '' }
  } catch {
    return null
  }
}

export function CookieConsentManager() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(readPreferences)
  const [analytics, setAnalytics] = useState(preferences?.analytics ?? false)
  const [marketing, setMarketing] = useState(preferences?.marketing ?? false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (settingsOpen && !dialog.open) dialog.showModal()
    if (!settingsOpen && dialog.open) dialog.close()
  }, [settingsOpen])

  const save = (allowAnalytics: boolean, allowMarketing: boolean) => {
    const next: CookiePreferences = { necessary: true, analytics: allowAnalytics, marketing: allowMarketing, savedAt: new Date().toISOString() }
    setPreferences(next)
    writeBrowserStorage(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: next }))
    setAnalytics(allowAnalytics)
    setMarketing(allowMarketing)
    setSettingsOpen(false)
  }

  return <>
    <button type="button" className="cookie-settings-link" onClick={() => { setAnalytics(preferences?.analytics ?? false); setMarketing(preferences?.marketing ?? false); setSettingsOpen(true) }}>Cài đặt cookie</button>
    {!preferences && <aside className="cookie-consent-banner" aria-labelledby="cookie-consent-title">
      <div><h2 id="cookie-consent-title">Quyền riêng tư của bạn</h2><p>Cookie cần thiết giúp giỏ hàng và đăng nhập hoạt động. Cookie phân tích và tiếp thị chỉ được dùng khi bạn đồng ý.</p></div>
      <div className="cookie-consent-actions">
        <button type="button" className="cookie-consent-secondary" onClick={() => setSettingsOpen(true)}>Tùy chỉnh</button>
        <button type="button" className="cookie-consent-secondary" onClick={() => save(false, false)}>Chỉ cookie cần thiết</button>
        <button type="button" className="cookie-consent-primary" onClick={() => save(true, true)}>Chấp nhận tất cả</button>
      </div>
    </aside>}
    <dialog ref={dialogRef} className="cookie-settings-dialog" aria-labelledby="cookie-settings-title" onCancel={(event) => { event.preventDefault(); setSettingsOpen(false) }} onClose={() => setSettingsOpen(false)} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close() }}>
      <div className="cookie-settings-heading"><div><p className="eyebrow">QUYỀN RIÊNG TƯ</p><h2 id="cookie-settings-title">Cài đặt cookie</h2></div><button type="button" aria-label="Đóng cài đặt cookie" onClick={() => setSettingsOpen(false)}>×</button></div>
      <p>Cookie cần thiết luôn bật để duy trì chức năng cơ bản. Các nhóm khác đang tắt cho đến khi bạn chủ động cho phép.</p>
      <label className="cookie-consent-choice"><span><strong>Cần thiết</strong><small>Đăng nhập, giỏ hàng, bảo mật và lưu lựa chọn đồng ý.</small></span><input type="checkbox" checked disabled aria-label="Cookie cần thiết luôn bật" /></label>
      <label className="cookie-consent-choice"><span><strong>Phân tích</strong><small>Đo lường lượt xem trang và các bước mua hàng bằng Google Analytics khi cửa hàng đã cấu hình mã GA4.</small></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /></label>
      <label className="cookie-consent-choice"><span><strong>Tiếp thị</strong><small>Cá nhân hóa quảng cáo và đo lường chiến dịch. Chưa có pixel tiếp thị được cấu hình.</small></span><input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} /></label>
      <div className="cookie-settings-actions"><button type="button" className="cookie-consent-secondary" onClick={() => save(false, false)}>Chỉ cookie cần thiết</button><button type="button" className="cookie-consent-primary" onClick={() => save(analytics, marketing)}>Lưu lựa chọn</button></div>
    </dialog>
  </>
}
