import { useCallback, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { defaultAppearance, palettes, uiStyles } from './appearance-options'
import type { AppearanceChoice } from './appearance-options'
import './appearance-picker.css'

type Props = {
  value: AppearanceChoice
  resolvedMode: 'light' | 'dark'
  onChange: (value: AppearanceChoice) => void
  onClose: () => void
}

export function AppearancePicker({ value, resolvedMode, onChange, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const closeAndRestoreFocus = useCallback(() => {
    onClose()
    window.requestAnimationFrame(() => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus()
    })
  }, [onClose])
  const style = uiStyles.find((item) => item.id === value.styleId) ?? uiStyles[0]
  const palette = palettes.find((item) => item.id === value.paletteId) ?? palettes.find((item) => item.id === defaultAppearance.paletteId) ?? palettes[0]
  const tokens = palette[resolvedMode]
  const previewStyle = {
    '--ui-bg': tokens.bg,
    '--ui-surface': tokens.surface,
    '--ui-border': tokens.border,
    '--ui-text': tokens.text,
    '--ui-muted': tokens.muted,
    '--ui-primary': tokens.primary,
    '--ui-primary-hover': tokens.hover,
    '--ui-on-primary': tokens.onPrimary,
    '--ui-accent': tokens.accent,
    '--ui-radius': style.radius,
    '--ui-shadow': style.shadow,
    '--ui-border-width': style.borderWidth,
    '--ui-font-heading': style.headingFont,
  } as CSSProperties

  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeAndRestoreFocus() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeAndRestoreFocus])

  return <div className="appearance-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAndRestoreFocus() }}>
    <section className="appearance-dialog" role="dialog" aria-modal="true" aria-labelledby="appearance-title" onKeyDown={(event) => {
      if (event.key !== 'Tab') return
      const focusable = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), select, input, textarea, [tabindex]:not([tabindex="-1"])')
      const first = focusable.item(0)
      const last = focusable.item(focusable.length - 1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }}>
      <header className="appearance-heading"><div><p className="eyebrow">TÙY CHỈNH TRẢI NGHIỆM</p><h2 id="appearance-title">Giao diện của bạn</h2><p>Thay đổi được áp dụng ngay và lưu trên thiết bị này.</p></div><button ref={closeRef} className="appearance-close" type="button" aria-label="Đóng tùy chỉnh giao diện" onClick={closeAndRestoreFocus}>×</button></header>
      <div className="appearance-controls">
        <label className="appearance-style-select">Phong cách giao diện<select value={value.styleId} onChange={(event) => onChange({ ...value, styleId: event.target.value })}>{uiStyles.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select><small>{style.description}</small></label>
        <fieldset className="appearance-mode"><legend>Chế độ màu</legend><div><button type="button" aria-pressed={value.mode === 'system'} onClick={() => onChange({ ...value, mode: 'system' })}>◉ Theo thiết bị</button><button type="button" aria-pressed={value.mode === 'light'} onClick={() => onChange({ ...value, mode: 'light' })}>☼ Sáng</button><button type="button" aria-pressed={value.mode === 'dark'} onClick={() => onChange({ ...value, mode: 'dark' })}>◐ Tối</button></div></fieldset>
      </div>
      <fieldset className="appearance-palettes"><legend>Bảng màu</legend><div className="palette-grid">{palettes.map((item) => <button type="button" key={item.id} className="palette-option" aria-pressed={value.paletteId === item.id} onClick={() => onChange({ ...value, paletteId: item.id })}><span className="palette-swatches" aria-hidden="true">{[item[resolvedMode].primary, item[resolvedMode].accent, item[resolvedMode].surface, item[resolvedMode].bg].map((color, index) => <i key={index} style={{ background: color }} />)}</span><span><b>{item.id} · {item.name}</b><small>{item.mood}</small></span>{value.paletteId === item.id && <span className="palette-check" aria-label="Đang chọn">✓</span>}</button>)}</div></fieldset>
      <section className="appearance-preview" aria-label="Xem trước giao diện"><div className="appearance-preview-label">XEM TRƯỚC · {style.name} / {palette.name} / {resolvedMode === 'light' ? 'Sáng' : 'Tối'}{value.mode === 'system' ? ' · Theo thiết bị' : ''}</div><div className="appearance-preview-card" data-ui-style={style.id} data-theme={resolvedMode} style={previewStyle}><p className="appearance-preview-eyebrow">BỘ SƯU TẬP MỚI</p><h3>Thiết kế theo lựa chọn của bạn</h3><p>Tiếng Việt: ắ ằ ẳ ẵ ặ ệ ồ ộ ớ ờ ở ợ ữ ự</p><div><button type="button">Nút chính</button><span>Thẻ xem trước</span></div></div></section>
      <footer className="appearance-footer"><button type="button" className="appearance-reset" onClick={() => onChange(defaultAppearance)}>Khôi phục mặc định</button><button type="button" className="appearance-done" onClick={closeAndRestoreFocus}>Hoàn tất</button></footer>
    </section>
  </div>
}
