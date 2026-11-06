import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Search, X } from 'lucide-react'
import { productSearchQuerySchema } from '../../lib/product-search'
import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'
import { fetchSearchContentSuggestions, fetchSearchSuggestions, fetchTrendingSearchTerms, trackSearchTerm, type SearchContentSuggestion, type SearchProduct } from './search-api'
import './StorefrontSearchBox.css'

type LinkItem = { id: number; name: string; slug: string }

type Props = {
  value: string
  categories: LinkItem[]
  collections: LinkItem[]
  onChange: (value: string) => void
  onSubmit: (value: string) => void
}

const HISTORY_KEY = 'fashion-store-search-history'
const HISTORY_LIMIT = 5

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi-VN').trim()
}

function readHistory(): string[] {
  try {
    const saved = JSON.parse(readBrowserStorage(HISTORY_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string').slice(0, HISTORY_LIMIT) : []
  } catch {
    return []
  }
}

export function StorefrontSearchBox({ value, categories, collections, onChange, onSubmit }: Props) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [history, setHistory] = useState<string[]>(readHistory)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [debouncedValue, setDebouncedValue] = useState('')
  const queryValidation = productSearchQuerySchema.safeParse(value)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (overlayOpen && !dialog.open) {
      dialog.showModal()
      setOpen(true)
      window.requestAnimationFrame(() => inputRef.current?.focus())
    } else if (!overlayOpen && dialog.open) {
      dialog.close()
      triggerRef.current?.focus()
    }
  }, [overlayOpen])

  const closeOverlay = () => {
    setOverlayOpen(false)
    setOpen(false)
    setActiveIndex(-1)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value.trim()), 220)
    return () => window.clearTimeout(timer)
  }, [value])

  useEffect(() => {
    const closeIfOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeIfOutside)
    return () => document.removeEventListener('pointerdown', closeIfOutside)
  }, [])

  const suggestionsQuery = useQuery({
    queryKey: ['storefront-search-suggestions', debouncedValue],
    queryFn: ({ signal }) => fetchSearchSuggestions(debouncedValue, signal),
    enabled: open && debouncedValue.length >= 2 && queryValidation.success,
    staleTime: 30_000,
    retry: false,
  })
  const contentSuggestionsQuery = useQuery({
    queryKey: ['storefront-search-content-suggestions', debouncedValue],
    queryFn: ({ signal }) => fetchSearchContentSuggestions(debouncedValue, signal),
    enabled: open && debouncedValue.length >= 2 && queryValidation.success,
    staleTime: 30_000,
    retry: false,
  })
  const trendingQuery = useQuery({
    queryKey: ['storefront-search-trending'],
    queryFn: ({ signal }) => fetchTrendingSearchTerms(signal),
    enabled: open && debouncedValue.length < 2,
    staleTime: 60_000,
    retry: false,
  })

  const matchingCategories = useMemo(() => {
    if (debouncedValue.length < 2) return []
    const needle = normalize(debouncedValue)
    return categories.filter((item) => normalize(item.name).includes(needle)).slice(0, 3)
  }, [categories, debouncedValue])
  const matchingCollections = useMemo(() => {
    if (debouncedValue.length < 2) return []
    const needle = normalize(debouncedValue)
    return collections.filter((item) => normalize(item.name).includes(needle)).slice(0, 2)
  }, [collections, debouncedValue])
  const products = (suggestionsQuery.data ?? []).slice(0, 4)
  const contentSuggestions = contentSuggestionsQuery.data ?? []
  const trendingTerms = trendingQuery.data ?? []
  const showHistory = debouncedValue.length < 2 && history.length > 0
  const showTrending = debouncedValue.length < 2 && trendingTerms.length > 0
  const optionCount = products.length + contentSuggestions.length + matchingCategories.length + matchingCollections.length + (showHistory ? history.length : 0) + (showTrending ? trendingTerms.length : 0)

  const resetKey = `${debouncedValue}:${optionCount}`
  const [activeResetKey, setActiveResetKey] = useState(resetKey)
  if (activeResetKey !== resetKey) {
    setActiveResetKey(resetKey)
    setActiveIndex(-1)
  }

  const submit = (event?: FormEvent<HTMLFormElement>, term = value) => {
    event?.preventDefault()
    const parsed = productSearchQuerySchema.safeParse(term)
    if (!parsed.success) return
    const normalizedTerm = parsed.data
    if (normalizedTerm) {
      const nextHistory = [normalizedTerm, ...history.filter((item) => normalize(item) !== normalize(normalizedTerm))].slice(0, HISTORY_LIMIT)
      setHistory(nextHistory)
      writeBrowserStorage(HISTORY_KEY, JSON.stringify(nextHistory))
      void trackSearchTerm(normalizedTerm).catch(() => undefined)
    }
    setOpen(false)
    closeOverlay()
    onSubmit(normalizedTerm)
  }

  const activateOption = (index: number) => {
    if (index < 0) return
    if (index < products.length) {
      navigate(`/products/${encodeURIComponent(products[index].slug)}`)
      closeOverlay()
      return
    }
    let offset = products.length
    if (index < offset + contentSuggestions.length) {
      navigate(contentSuggestions[index - offset].href)
      closeOverlay()
      return
    }
    offset += contentSuggestions.length
    if (index < offset + matchingCategories.length) {
      navigate(`/categories/${encodeURIComponent(matchingCategories[index - offset].slug)}`)
      closeOverlay()
      return
    }
    offset += matchingCategories.length
    if (index < offset + matchingCollections.length) {
      navigate(`/collections/${encodeURIComponent(matchingCollections[index - offset].slug)}`)
      closeOverlay()
      return
    }
    offset += matchingCollections.length
    if (showHistory && index < offset + history.length) {
      const recentTerm = history[index - offset]
      onChange(recentTerm)
      submit(undefined, recentTerm)
      return
    }
    if (showHistory) offset += history.length
    const trendingTerm = trendingTerms[index - offset]?.term
    if (trendingTerm) {
      onChange(trendingTerm)
      submit(undefined, trendingTerm)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    } else if (event.key === 'ArrowDown' && optionCount > 0) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current + 1) % optionCount)
    } else if (event.key === 'ArrowUp' && optionCount > 0) {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current <= 0 ? optionCount - 1 : current - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      activateOption(activeIndex)
    }
  }

  const renderProduct = (product: SearchProduct, index: number) => <button id={`storefront-search-option-${index}`} className="storefront-search-option storefront-search-product" type="button" role="option" aria-selected={activeIndex === index} onMouseEnter={() => setActiveIndex(index)} onClick={() => activateOption(index)} key={`product-${product.id}`}>
    {product.images?.[0]?.url ? <img src={product.images[0].url} alt="" width="64" height="80" loading="lazy" /> : <span className="storefront-search-image-placeholder" aria-hidden="true" />}
    <span><strong>{product.name}</strong><small>{product.price.toLocaleString('vi-VN')} ₫</small></span>
  </button>
  const renderContentSuggestion = (page: SearchContentSuggestion, index: number) => <button id={`storefront-search-option-${index}`} className="storefront-search-option storefront-search-content" type="button" role="option" aria-selected={activeIndex === index} onMouseEnter={() => setActiveIndex(index)} onClick={() => activateOption(index)} key={`${page.type}-${page.id}`}>
    <span><strong>{page.title}</strong>{page.description && <small>{page.description}</small>}<small>{page.type === 'article' ? 'Bài viết' : 'Trang thông tin'}</small></span>
  </button>

  return <div className="storefront-search-box" ref={rootRef}>
    <button ref={triggerRef} className="storefront-search-trigger" type="button" aria-label="Mở tìm kiếm" aria-haspopup="dialog" aria-expanded={overlayOpen} onClick={() => setOverlayOpen(true)}><Search aria-hidden="true" size={17} /><span>Tìm sản phẩm</span></button>
    <dialog ref={dialogRef} className="storefront-search-overlay" aria-label="Tìm kiếm sản phẩm và nội dung" onCancel={(event) => { event.preventDefault(); closeOverlay() }} onClose={() => { setOverlayOpen(false); triggerRef.current?.focus() }} onClick={(event) => { if (event.target === dialogRef.current) closeOverlay() }}>
      <div className="storefront-search-overlay__inner">
        <div className="storefront-search-overlay__top"><p className="eyebrow">TÌM THIẾT KẾ BẠN ĐANG TÌM</p><button className="storefront-search-overlay__close" type="button" aria-label="Đóng tìm kiếm" onClick={closeOverlay}><X aria-hidden="true" size={19} /></button></div>
    <form className="storefront-header-search" role="search" onSubmit={(event) => submit(event)} noValidate>
      <div className="storefront-header-search-controls">
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Tìm sản phẩm"
          aria-autocomplete="list"
          aria-expanded={open && (optionCount > 0 || debouncedValue.length >= 2 || trendingQuery.isFetching)}
          aria-controls="storefront-search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `storefront-search-option-${activeIndex}` : undefined}
          aria-invalid={Boolean(value && !queryValidation.success)}
          aria-describedby={value && !queryValidation.success ? 'header-search-error' : undefined}
          maxLength={120}
          placeholder="Tìm sản phẩm"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => { onChange(event.target.value); setOpen(true) }}
          onKeyDown={handleKeyDown}
        />
        {value && <button aria-label="Xóa nội dung tìm kiếm" className="storefront-search-clear" type="button" onClick={() => { onChange(''); setOpen(true) }}><X aria-hidden="true" size={14} /></button>}
        <button aria-label="Tìm kiếm" type="submit"><Search aria-hidden="true" size={16} /></button>
      </div>
      {value && !queryValidation.success && <small id="header-search-error" className="storefront-header-search-error" role="alert">{queryValidation.error.issues[0]?.message}</small>}
    </form>
    {open && (optionCount > 0 || debouncedValue.length >= 2 || trendingQuery.isFetching) && <div className="storefront-search-suggestions">
      {(suggestionsQuery.isFetching || contentSuggestionsQuery.isFetching) && <p className="storefront-search-status" role="status">Đang tìm sản phẩm và nội dung…</p>}
      {trendingQuery.isFetching && <p className="storefront-search-status" role="status">Đang tải từ khóa phổ biến…</p>}
      {suggestionsQuery.isError && <p className="storefront-search-status" role="alert">Chưa tải được gợi ý. Nhấn Enter để xem kết quả tìm kiếm.</p>}
      {contentSuggestionsQuery.isError && <p className="storefront-search-status" role="alert">Chưa tải được gợi ý nội dung; bạn vẫn có thể tìm sản phẩm. <button type="button" onClick={() => { void contentSuggestionsQuery.refetch() }}>Thử lại</button></p>}
      {trendingQuery.isError && debouncedValue.length < 2 && <p className="storefront-search-status" role="alert">Chưa tải được từ khóa phổ biến. <button type="button" onClick={() => { void trendingQuery.refetch() }}>Thử lại</button></p>}
      <div id="storefront-search-suggestions" role="listbox" aria-label="Gợi ý tìm kiếm">
      {products.length > 0 && <section role="group" aria-label="Sản phẩm"><p className="storefront-search-group-label">Gợi ý sản phẩm</p>{products.map(renderProduct)}</section>}
      {contentSuggestions.length > 0 && <section role="group" aria-label="Bài viết và trang"><p className="storefront-search-group-label">Bài viết và trang</p>{contentSuggestions.map((page, index) => renderContentSuggestion(page, products.length + index))}</section>}
      {matchingCategories.length > 0 && <section role="group" aria-label="Danh mục"><p className="storefront-search-group-label">Danh mục</p>{matchingCategories.map((item, index) => {
        const optionIndex = products.length + contentSuggestions.length + index
        return <button id={`storefront-search-option-${optionIndex}`} className="storefront-search-option" type="button" role="option" aria-selected={activeIndex === optionIndex} key={`category-${item.id}`} onMouseEnter={() => setActiveIndex(optionIndex)} onClick={() => activateOption(optionIndex)}>{item.name}<small>Danh mục</small></button>
      })}</section>}
      {matchingCollections.length > 0 && <section role="group" aria-label="Bộ sưu tập"><p className="storefront-search-group-label">Bộ sưu tập</p>{matchingCollections.map((item, index) => {
        const optionIndex = products.length + contentSuggestions.length + matchingCategories.length + index
        return <button id={`storefront-search-option-${optionIndex}`} className="storefront-search-option" type="button" role="option" aria-selected={activeIndex === optionIndex} key={`collection-${item.id}`} onMouseEnter={() => setActiveIndex(optionIndex)} onClick={() => activateOption(optionIndex)}>{item.name}<small>Bộ sưu tập</small></button>
      })}</section>}
      {showHistory && <section role="group" aria-label="Tìm kiếm gần đây"><p className="storefront-search-group-label">Tìm kiếm gần đây</p>{history.map((item, index) => {
        const optionIndex = products.length + contentSuggestions.length + matchingCategories.length + matchingCollections.length + index
        return <button id={`storefront-search-option-${optionIndex}`} className="storefront-search-option" type="button" role="option" aria-selected={activeIndex === optionIndex} key={`history-${item}`} onMouseEnter={() => setActiveIndex(optionIndex)} onClick={() => { onChange(item); submit(undefined, item) }}>{item}<small>Tìm lại</small></button>
      })}</section>}
      {showTrending && <section role="group" aria-label="Từ khóa phổ biến"><p className="storefront-search-group-label">Từ khóa phổ biến</p>{trendingTerms.map((item, index) => {
        const optionIndex = products.length + contentSuggestions.length + matchingCategories.length + matchingCollections.length + (showHistory ? history.length : 0) + index
        return <button id={`storefront-search-option-${optionIndex}`} className="storefront-search-option" type="button" role="option" aria-selected={activeIndex === optionIndex} key={`trending-${item.term}`} onMouseEnter={() => setActiveIndex(optionIndex)} onClick={() => { onChange(item.term); submit(undefined, item.term) }}>{item.term}<small>Đang được tìm kiếm</small></button>
      })}<p className="storefront-search-status">Xu hướng được tổng hợp ẩn danh trong 30 ngày.</p></section>}
      </div>
      {debouncedValue.length >= 2 && !suggestionsQuery.isFetching && !contentSuggestionsQuery.isFetching && !suggestionsQuery.isError && !contentSuggestionsQuery.isError && optionCount === 0 && <p className="storefront-search-status">Không tìm thấy gợi ý. Nhấn Enter để xem kết quả.</p>}
      <button className="storefront-search-submit" type="button" onClick={() => submit(undefined, value)}>Xem tất cả kết quả cho “{value.trim()}”</button>
    </div>}
      </div>
    </dialog>
  </div>
}
