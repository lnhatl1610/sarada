import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedValue } from './use-debounced-value'

type ListState = Record<string, string>

export function useListUrlState(scope: string, defaults: ListState) {
  const defaultsJson = JSON.stringify(defaults)
  const stableDefaults = useMemo(() => JSON.parse(defaultsJson) as ListState, [defaultsJson])
  const readState = useCallback((): ListState => {
    const params = new URLSearchParams(window.location.search)
    return Object.fromEntries(Object.entries(stableDefaults).map(([key, fallback]) => [key, params.get(`${scope}_${key}`) ?? fallback]))
  }, [scope, stableDefaults])
  const historyMode = useRef<'push' | 'replace'>('replace')
  const [state, setState] = useState<ListState>(readState)
  const debouncedSearch = useDebouncedValue(state.q ?? '', 300)
  const queryState = useMemo(() => ({ ...state, q: debouncedSearch }), [state, debouncedSearch])

  useEffect(() => {
    const syncFromUrl = () => { historyMode.current = 'replace'; setState(readState()) }
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [readState])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    for (const [key, fallback] of Object.entries(stableDefaults)) {
      const value = state[key] ?? fallback
      if (!value || value === fallback) params.delete(`${scope}_${key}`)
      else params.set(`${scope}_${key}`, value)
    }
    const query = params.toString()
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      if (historyMode.current === 'push') window.history.pushState(window.history.state, '', nextUrl)
      else window.history.replaceState(window.history.state, '', nextUrl)
    }
    historyMode.current = 'replace'
  }, [scope, stableDefaults, state])

  const setValue = useCallback((key: string, value: string) => {
    historyMode.current = key === 'q' ? 'replace' : 'push'
    setState((current) => ({ ...current, [key]: value, ...(key === 'page' ? {} : { page: '1' }) }))
  }, [])

  const applyValues = useCallback((values: ListState) => {
    historyMode.current = 'push'
    setState((current) => ({ ...current, ...values, page: '1' }))
  }, [])

  const clearFilters = useCallback((keys: string[]) => {
    historyMode.current = 'push'
    setState((current) => ({ ...current, ...Object.fromEntries(keys.map((key) => [key, stableDefaults[key] ?? ''])), page: '1' }))
  }, [stableDefaults])

  return { state, queryState, setValue, applyValues, clearFilters }
}
