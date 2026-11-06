import { useCallback, useEffect, useRef, useState } from 'react'
import { clearUnsavedForm, markUnsavedForm } from './unsaved-forms'

const DEFAULT_MESSAGE = 'Bạn có thay đổi chưa lưu. Rời khỏi biểu mẫu sẽ làm mất các thay đổi này.'

export function useUnsavedFormGuard(isDirty: boolean, message = DEFAULT_MESSAGE) {
  const [guardId] = useState(() => Symbol('unsaved-form'))
  const cleared = useRef(false)
  useEffect(() => {
    if (!isDirty) {
      cleared.current = false
      markUnsavedForm(guardId, false)
      return
    }
    if (cleared.current) return
    markUnsavedForm(guardId, true)
    return () => clearUnsavedForm(guardId)
  }, [guardId, isDirty])

  useEffect(() => {
    if (!isDirty) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (cleared.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isDirty])

  const clear = useCallback(() => {
    cleared.current = true
    clearUnsavedForm(guardId)
  }, [guardId])

  const confirmDiscard = useCallback(() => {
    if (!isDirty) return true
    const confirmed = window.confirm(message)
    if (confirmed) clear()
    return confirmed
  }, [clear, isDirty, message])

  // Consumers invoke this callback from navigation and form event handlers, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  return Object.assign(confirmDiscard, { clear })
}
