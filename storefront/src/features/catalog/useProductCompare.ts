import { useCallback, useEffect, useState } from 'react'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'

const STORAGE_KEY = 'storefront_product_compare'
const CHANGE_EVENT = 'storefront:product-compare-change'
export const MAX_COMPARE_PRODUCTS = 4

function readComparedSlugs(): string[] {
  try {
    const value: unknown = JSON.parse(readBrowserStorage(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return [...new Set(value.filter((slug): slug is string => typeof slug === 'string' && /^[\p{L}\p{N}-]+$/u.test(slug)))].slice(0, MAX_COMPARE_PRODUCTS)
  } catch {
    return []
  }
}

function saveComparedSlugs(slugs: string[]): void {
  writeBrowserStorage(STORAGE_KEY, JSON.stringify(slugs))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useProductCompare() {
  const [slugs, setSlugs] = useState(readComparedSlugs)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    const sync = () => setSlugs(readComparedSlugs())
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggle = useCallback((slug: string): boolean => {
    const current = readComparedSlugs()
    const next = current.includes(slug)
      ? current.filter((item) => item !== slug)
      : current.length < MAX_COMPARE_PRODUCTS ? [...current, slug] : current
    const didAdd = next.length > current.length
    setLimitReached(!current.includes(slug) && !didAdd)
    if (didAdd || next.length < current.length) {
      setSlugs(next)
      saveComparedSlugs(next)
    }
    return didAdd || current.includes(slug)
  }, [])

  const replace = useCallback((next: string[]) => {
    const normalized = [...new Set(next.filter((slug) => /^[\p{L}\p{N}-]+$/u.test(slug)))].slice(0, MAX_COMPARE_PRODUCTS)
    setSlugs(normalized)
    setLimitReached(false)
    saveComparedSlugs(normalized)
  }, [])

  const clear = useCallback(() => replace([]), [replace])

  return { slugs, limitReached, toggle, replace, clear }
}
