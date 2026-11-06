import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { adminApiFetch } from '../../lib/admin-api'
import { useDebouncedValue } from '../../lib/use-debounced-value'
import { ariaKeyboardShortcut, formatKeyboardShortcut, isKeyboardEditableTarget, matchesKeyboardShortcut, type AdminShortcuts } from '../../lib/keyboard-shortcuts'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command'

type SearchItem = { id: number | string; label: string; detail: string | null; url: string }
type SearchResults = { products: SearchItem[]; orders: SearchItem[]; customers: SearchItem[] }
export type SearchPage = SearchItem & { detail: string }

export function GlobalSearch({ apiUrl, accessToken, userId, pages, onNavigate, shortcut, shortcutsEnabled }: {
  apiUrl: string
  accessToken: string
  userId: number | undefined
  pages: SearchPage[]
  onNavigate: (url: string) => void
  shortcut: AdminShortcuts['search']
  shortcutsEnabled: boolean
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebouncedValue(query.trim())
  const search = useQuery({
    queryKey: ['admin', 'global-search', userId, debouncedQuery],
    enabled: Boolean(accessToken && debouncedQuery.length >= 2),
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await adminApiFetch(`${apiUrl}/admin/search?q=${encodeURIComponent(debouncedQuery)}`, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        signal,
      })
      if (!response.ok) throw new Error(t('Không thể tìm kiếm dữ liệu cửa hàng.'))
      const body = await response.json() as { data: SearchResults }
      return body.data
    },
  })
  const pageResults = debouncedQuery.length < 2 ? [] : pages
    .filter((item) => `${item.label} ${item.detail}`.toLocaleLowerCase().includes(debouncedQuery.toLocaleLowerCase()))
    .slice(0, 5)

  useEffect(() => {
    if (!shortcutsEnabled) return
    const openSearch = (event: KeyboardEvent) => {
      if (isKeyboardEditableTarget(event.target) || !matchesKeyboardShortcut(event, shortcut)) return
      event.preventDefault()
      setOpen(true)
    }
    document.addEventListener('keydown', openSearch)
    return () => document.removeEventListener('keydown', openSearch)
  }, [shortcut, shortcutsEnabled])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  const selectResult = (url: string) => {
    setOpen(false)
    setQuery('')
    onNavigate(url)
  }

  return <>
    <button className="quick-search-trigger" type="button" aria-label={t('Tìm kiếm toàn cửa hàng')} aria-haspopup="dialog" aria-keyshortcuts={shortcutsEnabled ? ariaKeyboardShortcut(shortcut) : undefined} onClick={() => setOpen(true)}>
      <Search size={16} aria-hidden="true" /><span>{t('Tìm đơn, sản phẩm, khách hàng...')}</span>{shortcutsEnabled && <kbd className="quick-search-hint">{formatKeyboardShortcut(shortcut)}</kbd>}
    </button>
    <CommandDialog open={open} onOpenChange={setOpen} title={t('Tìm kiếm toàn cửa hàng')} description={t('Tìm đơn hàng, sản phẩm, khách hàng hoặc trang quản trị.')} shouldFilter={false} className="admin-command-dialog">
      <CommandInput ref={inputRef} value={query} onValueChange={setQuery} placeholder={t('Tìm đơn, sản phẩm, khách hàng...')} />
      <CommandList className="admin-command-list">
        {debouncedQuery.length < 2 ? <CommandEmpty>{t('Nhập ít nhất 2 ký tự để tìm kiếm.')}</CommandEmpty> : search.isLoading ? <CommandEmpty>{t('Đang tìm kiếm…')}</CommandEmpty> : <>
          {search.isError && <p className="command-status" role="status">{t('Không tải được dữ liệu cửa hàng; bạn vẫn có thể mở trang phù hợp bên dưới.')}</p>}
          {search.data && (['orders', 'products', 'customers'] as const).map((group) => {
            const labels = { orders: t('Đơn hàng'), products: t('Sản phẩm'), customers: t('Khách hàng') }
            const items = search.data[group]
            return <CommandGroup key={group} heading={labels[group]}>{items.map((item) => <CommandItem key={item.id} value={`${item.label} ${item.detail ?? ''}`} onSelect={() => selectResult(item.url)}><span className="command-result-copy"><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</span></CommandItem>)}</CommandGroup>
          })}
          {pageResults.length > 0 && <CommandGroup heading={t('Trang')}>{pageResults.map((item) => <CommandItem key={item.id} value={`${item.label} ${item.detail}`} onSelect={() => selectResult(item.url)}><span className="command-result-copy"><strong>{item.label}</strong><small>{item.detail}</small></span></CommandItem>)}</CommandGroup>}
          {((search.data && !Object.values(search.data).some((items) => items.length)) || search.isError) && pageResults.length === 0 && <CommandEmpty>{t('Không có kết quả phù hợp.')}</CommandEmpty>}
        </>}
      </CommandList>
    </CommandDialog>
  </>
}
