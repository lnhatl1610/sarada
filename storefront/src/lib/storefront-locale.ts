import { useSyncExternalStore } from 'react'
import { readBrowserStorage, writeBrowserStorage } from './browser-storage'

export type StorefrontLocale = 'en' | 'vi'

const STORAGE_KEY = 'fashion-store-locale'
const EVENT_NAME = 'fashion-store-locale-change'

function getLocale(): StorefrontLocale {
  return readBrowserStorage(STORAGE_KEY) === 'en' ? 'en' : 'vi'
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT_NAME, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT_NAME, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function setStorefrontLocale(locale: StorefrontLocale) {
  writeBrowserStorage(STORAGE_KEY, locale)
  window.dispatchEvent(new Event(EVENT_NAME))
  document.documentElement.lang = locale
}

export function useStorefrontLocale() {
  return useSyncExternalStore<StorefrontLocale>(subscribe, getLocale, () => 'vi')
}
