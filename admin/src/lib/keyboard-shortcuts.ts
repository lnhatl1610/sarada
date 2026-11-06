export type AdminShortcuts = {
  search: string
  sidebar: string
  lock: string
  help: string
}

export const defaultAdminShortcuts: AdminShortcuts = {
  search: 'ctrl+k',
  sidebar: 'ctrl+b',
  lock: 'ctrl+l',
  help: '?',
}

const allowedShortcuts: Record<keyof AdminShortcuts, string[]> = {
  search: ['ctrl+k', 'ctrl+shift+k', 'alt+k'],
  sidebar: ['ctrl+b', 'ctrl+shift+b', 'alt+b'],
  lock: ['ctrl+l', 'ctrl+shift+l', 'alt+l'],
  help: ['?', 'ctrl+shift+?', 'alt+?'],
}

export function normalizeAdminShortcuts(value: unknown): AdminShortcuts {
  const candidate = value && typeof value === 'object' ? value as Partial<AdminShortcuts> : {}
  return Object.fromEntries((Object.keys(defaultAdminShortcuts) as Array<keyof AdminShortcuts>).map((key) => [key, allowedShortcuts[key].includes(candidate[key] ?? '') ? candidate[key] : defaultAdminShortcuts[key]])) as unknown as AdminShortcuts
}

export function matchesKeyboardShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts.pop()
  if (!key || event.key.toLowerCase() !== key) return false
  const hasControl = parts.includes('ctrl')
  const hasAlt = parts.includes('alt')
  const hasShift = parts.includes('shift') || key === '?'
  if (hasControl !== (event.ctrlKey || event.metaKey) || hasAlt !== event.altKey || hasShift !== event.shiftKey) return false
  return true
}

export function isKeyboardEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

export function formatKeyboardShortcut(shortcut: string): string {
  return shortcut.split('+').map((part) => part === 'ctrl' ? 'Ctrl / ⌘' : part === 'alt' ? 'Alt' : part === 'shift' ? 'Shift' : part.toUpperCase()).join(' + ')
}

export function ariaKeyboardShortcut(shortcut: string): string {
  const parts = shortcut.split('+').map((part) => part === 'ctrl' ? 'Control' : part === 'alt' ? 'Alt' : part === 'shift' ? 'Shift' : part)
  const controlIndex = parts.indexOf('Control')
  if (controlIndex >= 0) {
    const metaParts = [...parts]
    metaParts[controlIndex] = 'Meta'
    return `${parts.join('+')} ${metaParts.join('+')}`
  }
  return parts.join('+')
}
