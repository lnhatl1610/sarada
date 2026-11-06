import { useEffect, useState } from 'react'

export type AdminPageSize = 10 | 20 | 50 | 100
const EVENT_NAME = 'fashion-admin-page-size-change'
type PageSizeEventDetail = { pageSize: AdminPageSize; source: 'table' | 'preferences' }

function readPageSize(): AdminPageSize {
  const value = Number(document.documentElement.dataset.adminPageSize)
  return value === 10 || value === 20 || value === 50 || value === 100 ? value : 20
}

export function publishAdminPageSize(pageSize: AdminPageSize, source: PageSizeEventDetail['source']) {
  window.dispatchEvent(new CustomEvent<PageSizeEventDetail>(EVENT_NAME, { detail: { pageSize, source } }))
}

export function useAdminPageSize(): AdminPageSize {
  const [pageSize, setPageSize] = useState<AdminPageSize>(readPageSize)
  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<PageSizeEventDetail>).detail?.pageSize
      if (next === 10 || next === 20 || next === 50 || next === 100) setPageSize(next)
    }
    window.addEventListener(EVENT_NAME, update)
    return () => window.removeEventListener(EVENT_NAME, update)
  }, [])
  return pageSize
}
