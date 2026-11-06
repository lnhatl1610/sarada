type BrowserStorageArea = 'local' | 'session'

function getStorage(area: BrowserStorageArea): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return area === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readBrowserStorage(key: string, area: BrowserStorageArea = 'local'): string | null {
  try {
    return getStorage(area)?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function writeBrowserStorage(key: string, value: string, area: BrowserStorageArea = 'local'): boolean {
  try {
    const storage = getStorage(area)
    if (!storage) return false
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeBrowserStorage(key: string, area: BrowserStorageArea = 'local'): void {
  try {
    getStorage(area)?.removeItem(key)
  } catch {
    // Storage is optional; the in-memory application state remains authoritative.
  }
}
