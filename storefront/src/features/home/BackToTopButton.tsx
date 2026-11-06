import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import './BackToTopButton.css'

const SHOW_AFTER_PX = 480

export function BackToTopButton() {
  const [visible, setVisible] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      const nextVisible = window.scrollY > SHOW_AFTER_PX
      setVisible((current) => current === nextVisible ? current : nextVisible)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  if (!visible && !focused) return null

  return <button
    type="button"
    className="storefront-back-to-top"
    aria-label="Lên đầu trang"
    title="Lên đầu trang"
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
  ><ArrowUp size={19} aria-hidden="true" /></button>
}
