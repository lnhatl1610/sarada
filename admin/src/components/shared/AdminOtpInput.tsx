import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import './AdminOtpInput.css'

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  required?: boolean
}

export function AdminOtpInput({ id, label, value, onChange, disabled = false, autoFocus = false, required = true }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = value.replace(/\D/g, '').slice(0, 6)

  const setDigit = (index: number, raw: string) => {
    const incoming = raw.replace(/\D/g, '')
    if (!incoming) {
      onChange(digits.slice(0, index) + digits.slice(index + 1))
      return
    }
    const next = digits.split('')
    let destination = Math.min(index, digits.length)
    for (const digit of incoming) {
      const target = Math.min(destination++, 5)
      next[target] = digit
    }
    onChange(next.join('').slice(0, 6))
    refs.current[Math.min(destination, 5)]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      onChange(digits.slice(0, index - 1) + digits.slice(index))
      refs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      refs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    event.preventDefault()
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return <div className="admin-otp-input" role="group" aria-label={label} onPaste={handlePaste}>
    {Array.from({ length: 6 }, (_, index) => <input
      key={index}
      ref={(element) => { refs.current[index] = element }}
      id={index === 0 ? id : `${id}-${index + 1}`}
      type="text"
      inputMode="numeric"
      autoComplete={index === 0 ? 'one-time-code' : 'off'}
      aria-label={`Chữ số ${index + 1} của ${label.toLocaleLowerCase('vi-VN')}`}
      pattern="[0-9]"
      maxLength={index === 0 ? 6 : 1}
      value={digits[index] ?? ''}
      disabled={disabled}
      required={required && index === 0}
      autoFocus={autoFocus && index === 0}
      onChange={(event) => setDigit(index, event.target.value)}
      onKeyDown={(event) => handleKeyDown(event, index)}
    />)}
  </div>
}
