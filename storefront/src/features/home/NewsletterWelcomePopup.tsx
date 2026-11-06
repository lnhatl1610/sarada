import { useEffect, useRef, useState } from 'react'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import { NewsletterForm } from './NewsletterForm'
import './NewsletterWelcomePopup.css'

const dismissedKey = 'storefront-newsletter-welcome-dismissed'

export function NewsletterWelcomePopup({ storeName, welcomeOfferEnabled }: { storeName: string; welcomeOfferEnabled: boolean }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!welcomeOfferEnabled || readBrowserStorage(dismissedKey, 'session') === '1') return

    let lastPointerY = window.innerHeight / 2
    const show = () => setOpen(true)
    const timer = window.setTimeout(show, 15_000)
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      if (lastPointerY > 24 && event.clientY <= 2) show()
      lastPointerY = event.clientY
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [welcomeOfferEnabled])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const dismiss = () => {
    writeBrowserStorage(dismissedKey, '1', 'session')
    setOpen(false)
  }

  if (!welcomeOfferEnabled) return null

  return <dialog
    ref={dialogRef}
    className="newsletter-welcome-dialog"
    aria-labelledby="newsletter-welcome-title"
    aria-describedby="newsletter-welcome-description"
    onCancel={(event) => { event.preventDefault(); dismiss() }}
    onClick={(event) => { if (event.target === dialogRef.current) dismiss() }}
  >
    <button className="newsletter-welcome-close" type="button" aria-label="Đóng lời mời nhận tin" onClick={dismiss}>×</button>
    <p className="eyebrow">LÁ THƯ TỪ {storeName.toLocaleUpperCase('vi-VN')}</p>
    <h2 id="newsletter-welcome-title">Nhận ưu đãi chào mừng</h2>
    <p id="newsletter-welcome-description">Đăng ký nhận tin để nhận mã ưu đãi đang được cửa hàng cấu hình cùng những câu chuyện mới từ {storeName}.</p>
    <NewsletterForm storeName={storeName} idPrefix="newsletter-welcome" onSuccess={() => writeBrowserStorage(dismissedKey, '1', 'session')} />
  </dialog>
}
