import { readBrowserStorage, writeBrowserStorage } from './browser-storage'

const fallbackIds = new Map<string, string>()
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

export function getStorefrontVisitorId(storageKey: string): string | null {
  if (typeof window === 'undefined') return null
  const stored = readBrowserStorage(storageKey)
  if (stored && uuidPattern.test(stored)) return stored

  const fallback = fallbackIds.get(storageKey)
  if (fallback) return fallback

  const visitorId = createUuid()
  fallbackIds.set(storageKey, visitorId)
  writeBrowserStorage(storageKey, visitorId)
  return visitorId
}
