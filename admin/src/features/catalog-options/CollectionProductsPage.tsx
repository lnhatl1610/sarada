import { adminApiFetch } from '../../lib/admin-api'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { FilterBar } from '../../components/shared/filter-bar'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { useListUrlState } from '../../lib/use-list-url-state'
import { useTranslation } from 'react-i18next'

type Product = { id: number; name: string; slug: string; sku: string | null; sort_order: number; lookbook_x: number | null; lookbook_y: number | null }
type SearchProduct = Pick<Product, 'id' | 'name' | 'slug' | 'sku'>
type SearchResult = { data: SearchProduct[]; meta: { current_page: number; last_page: number; total: number } }
type CollectionInfo = { id: number; name: string; banner: string | null; banner_alt: string | null; is_lookbook: boolean }
type Props = { collectionId: number; apiUrl: string; accessToken: string; permissions: string[] }

type SortableProductProps = {
  product: Product
  canUpdate: boolean
  busy: boolean
  selected: boolean
  isLookbook: boolean
  onSelect: (id: number) => void
  onRemove: (product: Product) => void
  onSaveLookbookPosition: (id: number, x: number | null, y: number | null) => void
}

function SortableProduct({ product, canUpdate, busy, selected, isLookbook, onSelect, onRemove, onSaveLookbookPosition }: SortableProductProps) {
  const { t } = useTranslation()
  const [x, setX] = useState(product.lookbook_x === null ? '' : String(product.lookbook_x))
  const [y, setY] = useState(product.lookbook_y === null ? '' : String(product.lookbook_y))
  const incompletePosition = (x === '') !== (y === '')
  const invalidPosition = [x, y].some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100))
  const unchangedPosition = x === String(product.lookbook_x ?? '') && y === String(product.lookbook_y ?? '')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id, disabled: busy || !canUpdate })

  return <li
    ref={setNodeRef}
    className={`collection-product-row${isDragging ? ' is-dragging' : ''}`}
    style={{ transform: CSS.Transform.toString(transform), transition }}
  >
    {canUpdate && <input type="checkbox" aria-label={t('Chọn {{name}} để gỡ', { name: product.name })} checked={selected} disabled={busy} onChange={() => onSelect(product.id)} />}
    {canUpdate && <button className="collection-product-drag" type="button" aria-label={t('Kéo để sắp xếp {{name}}', { name: product.name })} title={t('Kéo để sắp xếp')} disabled={busy} {...attributes} {...listeners}><GripVertical size={17} aria-hidden="true" /></button>}
    <span className="collection-product-copy"><strong>{product.name}</strong><small>{product.sku ?? product.slug}</small></span>
    {isLookbook && <div className="collection-lookbook-position"><label>{t('Ngang %')}<input type="number" min="0" max="100" step="0.1" aria-label={t('Vị trí ngang của {{name}}', { name: product.name })} value={x} disabled={!canUpdate || busy} onChange={(event) => setX(event.target.value)} /></label><label>{t('Dọc %')}<input type="number" min="0" max="100" step="0.1" aria-label={t('Vị trí dọc của {{name}}', { name: product.name })} value={y} disabled={!canUpdate || busy} onChange={(event) => setY(event.target.value)} /></label><button type="button" className="secondary" disabled={!canUpdate || busy || incompletePosition || invalidPosition || unchangedPosition} onClick={() => onSaveLookbookPosition(product.id, x === '' ? null : Number(x), y === '' ? null : Number(y))}>{t('Lưu điểm')}</button></div>}
    <a className="secondary" href={`/products/${product.id}/edit`}>{t('Mở')}</a>
    {canUpdate && <button className="secondary collection-product-remove" type="button" disabled={busy} onClick={() => onRemove(product)} aria-label={t('Gỡ {{name}} khỏi bộ sưu tập', { name: product.name })} title={t('Gỡ khỏi bộ sưu tập')}><X size={15} aria-hidden="true" /></button>}
  </li>
}

export function CollectionProductsPage({ collectionId, apiUrl, accessToken, permissions }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const pageSize = useAdminPageSize()
  const { state: searchState, queryState, setValue, clearFilters } = useListUrlState(`collection_products_${collectionId}`, { q: '', page: '1', sort: 'name' })
  const searchPage = Math.max(1, Number.parseInt(searchState.page, 10) || 1)
  const searchSort = searchState.sort || 'name'
  const searchSortBy = searchSort.startsWith('-') ? searchSort.slice(1) : searchSort
  const searchSortDirection = searchSort.startsWith('-') ? 'desc' : 'asc'
  const productsQueryKey = ['admin', 'collection-products', collectionId] as const
  const canUpdate = permissions.includes('products.update')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [searchSelection, setSearchSelection] = useState<{ query: string; ids: number[] }>({ query: searchState.q, ids: [] })
  const selectedIds = searchSelection.query === searchState.q ? searchSelection.ids : []
  const setSelectedIds = (next: number[] | ((current: number[]) => number[])) => setSearchSelection((current) => ({
    query: searchState.q,
    ids: typeof next === 'function' ? next(current.query === searchState.q ? current.ids : []) : next,
  }))
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<number[]>([])
  const [productToRemove, setProductToRemove] = useState<Product | null>(null)
  const [confirmBulkRemove, setConfirmBulkRemove] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await adminApiFetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
    const body = await response.json() as T & { message?: string }
    if (!response.ok) throw new Error(body.message ?? t('Không thể xử lý yêu cầu.'))
    return body
  }

  const productsQuery = useQuery({
    queryKey: productsQueryKey,
    enabled: Boolean(accessToken),
    queryFn: async ({ signal }) => {
      const body = await request<{ data?: Product[]; collection?: CollectionInfo }>(`/admin/collections/${collectionId}/products`, { signal })
      return { data: body.data ?? [], collection: body.collection }
    },
  })
  const products = productsQuery.data?.data ?? []
  const collection = productsQuery.data?.collection
  const loading = productsQuery.isPending
  const searchQuery = useQuery({
    queryKey: ['admin', 'collection-product-search', collectionId, queryState.q, searchSort, searchPage, pageSize],
    enabled: Boolean(accessToken && queryState.q.trim()),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ q: queryState.q.trim(), page: String(searchPage), per_page: String(pageSize), sort: searchSort, exclude_collection_id: String(collectionId) })
      return request<SearchResult>(`/admin/products?${params}`, { signal })
    },
  })
  const searchColumns: DataTableColumn<SearchProduct>[] = [
    { id: 'name', header: t('Sản phẩm').toLocaleUpperCase(), sortable: true, cell: (product) => <span className="collection-product-copy"><strong>{product.name}</strong><small>{product.sku ?? product.slug}</small></span> },
    { id: 'slug', header: t('Đường dẫn sản phẩm').toLocaleUpperCase(), cell: (product) => product.slug },
  ]
  const pageError = error || (productsQuery.error instanceof Error ? productsQuery.error.message : '')
  const load = async () => {
    setError('')
    const result = await productsQuery.refetch()
    if (result.error) setError(result.error instanceof Error ? result.error.message : t('Không tải được dữ liệu.'))
  }

  const addSelected = async () => {
    if (!selectedIds.length || !canUpdate) return
    setBusy(true)
    setError('')
    try {
      await request(`/admin/collections/${collectionId}/products`, {
        method: 'POST',
        body: JSON.stringify({ product_ids: selectedIds }),
      })
      setSelectedIds([])
      setNotice(t('Đã thêm {{count}} sản phẩm vào bộ sưu tập.', { count: selectedIds.length }))
      await queryClient.invalidateQueries({ queryKey: productsQueryKey })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Không thể thêm sản phẩm.'))
    } finally {
      setBusy(false)
    }
  }

  const reorder = async (next: Product[]) => {
    if (!canUpdate) return
    const previous = products
    queryClient.setQueryData(productsQueryKey, { ...productsQuery.data, data: next })
    setBusy(true)
    setError('')
    try {
      await request(`/admin/collections/${collectionId}/products/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ products: next.map((product, index) => ({ id: product.id, sort_order: index, ...(collection?.is_lookbook ? { lookbook_x: product.lookbook_x, lookbook_y: product.lookbook_y } : {}) })) }),
      })
      setNotice(t('Đã lưu thứ tự sản phẩm.'))
    } catch (cause) {
      queryClient.setQueryData(productsQueryKey, { ...productsQuery.data, data: previous })
      setError(cause instanceof Error ? cause.message : t('Không thể lưu thứ tự.'))
    } finally {
      setBusy(false)
    }
  }

  const saveLookbookPosition = async (productId: number, x: number | null, y: number | null) => {
    if (!canUpdate || !collection?.is_lookbook) return
    const previous = products
    const next = products.map((product) => product.id === productId ? { ...product, lookbook_x: x, lookbook_y: y } : product)
    queryClient.setQueryData(productsQueryKey, { ...productsQuery.data, data: next })
    setBusy(true)
    setError('')
    try {
      await request(`/admin/collections/${collectionId}/products/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ products: next.map((product) => ({ id: product.id, sort_order: product.sort_order, lookbook_x: product.lookbook_x, lookbook_y: product.lookbook_y })) }),
      })
      setNotice(t('Đã lưu vị trí điểm sản phẩm.'))
    } catch (cause) {
      queryClient.setQueryData(productsQueryKey, { ...productsQuery.data, data: previous })
      setError(cause instanceof Error ? cause.message : t('Không thể lưu vị trí điểm sản phẩm.'))
    } finally {
      setBusy(false)
    }
  }

  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id || busy || !canUpdate) return
    const from = products.findIndex((product) => product.id === event.active.id)
    const to = products.findIndex((product) => product.id === event.over?.id)
    if (from >= 0 && to >= 0) void reorder(arrayMove(products, from, to))
  }

  const remove = async () => {
    if (!productToRemove) return
    setBusy(true)
    setError('')
    try {
      await request(`/admin/collections/${collectionId}/products/${productToRemove.id}`, { method: 'DELETE' })
      setNotice(t('Đã gỡ “{{name}}” khỏi bộ sưu tập.', { name: productToRemove.name }))
      setSelectedAssignedIds((ids) => ids.filter((id) => id !== productToRemove.id))
      setProductToRemove(null)
      await queryClient.invalidateQueries({ queryKey: productsQueryKey })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Không thể gỡ sản phẩm.'))
    } finally {
      setBusy(false)
    }
  }

  const bulkRemove = async () => {
    if (!selectedAssignedIds.length || selectedAssignedIds.length > 1000 || !canUpdate) return
    setBusy(true)
    setError('')
    try {
      const count = selectedAssignedIds.length
      await request(`/admin/collections/${collectionId}/products`, {
        method: 'DELETE',
        body: JSON.stringify({ product_ids: selectedAssignedIds }),
      })
      setSelectedAssignedIds([])
      setConfirmBulkRemove(false)
      setNotice(t('Đã gỡ {{count}} sản phẩm khỏi bộ sưu tập.', { count }))
      await queryClient.invalidateQueries({ queryKey: productsQueryKey })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Không thể gỡ sản phẩm đã chọn.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <section className="panel reference-page"><p role="status">{t('Đang tải sản phẩm trong bộ sưu tập…')}</p><div className="skeleton-line" /><div className="skeleton-line" /></section>

  return <section className="panel reference-page">
    <div className="panel-heading"><div><h2>{t('Sản phẩm trong bộ sưu tập')}</h2><p>{collection?.is_lookbook ? t('Tìm và sắp xếp sản phẩm; nhập tọa độ ngang/dọc trên ảnh để đặt điểm mở sản phẩm.') : t('Tìm sản phẩm để thêm, kéo để sắp xếp và gỡ sản phẩm khỏi bộ sưu tập.')}</p></div><a className="secondary" href="/collections">{t('Quay lại')}</a></div>
    {pageError && <p className="reference-error" role="alert">{pageError} <button className="secondary" type="button" onClick={() => searchQuery.error ? void searchQuery.refetch() : void load()}>{t('Thử lại')}</button></p>}
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    {collection?.is_lookbook && collection.banner && <div className="collection-lookbook-preview"><img src={collection.banner} alt={collection.banner_alt ?? collection.name} />{products.filter((product) => product.lookbook_x !== null && product.lookbook_y !== null).map((product, index) => <span key={product.id} className="collection-lookbook-preview-pin" style={{ left: `clamp(14px, ${product.lookbook_x}%, calc(100% - 14px))`, top: `clamp(14px, ${product.lookbook_y}%, calc(100% - 14px))` }} aria-label={t('Điểm {{number}}: {{name}}', { number: index + 1, name: product.name })}>{index + 1}</span>)}</div>}
    <div className="collection-product-search">
      <label htmlFor="collection-product-search">{t('Tìm sản phẩm để thêm')}</label>
      <FilterBar hasFilters={Boolean(searchState.q)} onClear={() => clearFilters(['q'])} activeFilters={searchState.q ? [{ id: 'q', label: t('Tìm: {{query}}', { query: searchState.q }), onRemove: () => setValue('q', '') }] : []}>
        <input id="collection-product-search" aria-label={t('Tìm sản phẩm để thêm')} value={searchState.q} onChange={(event) => { setSelectedIds([]); setValue('q', event.target.value) }} placeholder={t('Nhập tên hoặc SKU sản phẩm')} />
      </FilterBar>
      
      {queryState.q.trim() ? <>
        <DataTable columns={searchColumns} rows={searchQuery.data?.data ?? []} rowKey={(product) => product.id} loading={searchQuery.isPending} error={searchQuery.error instanceof Error ? searchQuery.error.message : null} onRetry={() => void searchQuery.refetch()} noResults emptyTitle={t('Không tìm thấy sản phẩm phù hợp')} emptyDescription={t('Thử tên hoặc SKU khác, hoặc xóa từ khóa tìm kiếm.')} page={searchQuery.data?.meta.current_page ?? searchPage} pageCount={searchQuery.data?.meta.last_page ?? 1} totalRows={searchQuery.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setValue('page', String(nextPage))} sortBy={searchSortBy} sortDirection={searchSortDirection} onSortChange={(key, direction) => setValue('sort', direction === 'none' ? 'name' : direction === 'desc' ? `-${key}` : key)} selectedRowKeys={canUpdate ? selectedIds : undefined} onSelectionChange={canUpdate ? (keys) => setSelectedIds(keys.map(Number)) : undefined} selectionLabel={(product) => t('sản phẩm {{name}}', { name: product.name })} />
        {canUpdate && <div className="collection-product-results"><span>{t('Đã chọn {{count}} sản phẩm', { count: selectedIds.length })}</span><button className="primary" type="button" disabled={busy || !selectedIds.length} onClick={() => void addSelected()}>{busy ? t('Đang thêm…') : selectedIds.length ? t('Thêm {{count}} sản phẩm', { count: selectedIds.length }) : t('Thêm sản phẩm đã chọn')}</button></div>}
      </> : <p className="collection-product-search-empty">{t('Nhập tên hoặc SKU để tìm sản phẩm chưa có trong bộ sưu tập.')}</p>}
    </div>
    {products.length > 0 && canUpdate && <div className="collection-product-bulk-toolbar"><label><input type="checkbox" checked={selectedAssignedIds.length === Math.min(products.length, 1000)} disabled={busy} onChange={(event) => setSelectedAssignedIds(event.target.checked ? products.slice(0, 1000).map((product) => product.id) : [])} /> {t('Chọn tối đa 1.000 sản phẩm')}</label><span>{t('Đã chọn {{count}}', { count: selectedAssignedIds.length })}</span><button className="secondary" type="button" disabled={busy || !selectedAssignedIds.length} onClick={() => setConfirmBulkRemove(true)}>{t('Gỡ đã chọn')}</button></div>}
    {productsQuery.isSuccess && !products.length ? <div className="empty-state"><strong>{t('Bộ sưu tập chưa có sản phẩm.')}</strong><p>{t('Tìm và thêm một hoặc nhiều sản phẩm ở phía trên.')}</p></div> : products.length > 0 && <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={products.map((product) => product.id)} strategy={verticalListSortingStrategy}>
        <ol className="collection-products-list" aria-label={t('Sản phẩm trong bộ sưu tập')}>{products.map((product) => <SortableProduct key={`${product.id}-${product.lookbook_x}-${product.lookbook_y}`} product={product} canUpdate={canUpdate} busy={busy} selected={selectedAssignedIds.includes(product.id)} isLookbook={Boolean(collection?.is_lookbook)} onSelect={(id) => setSelectedAssignedIds((ids) => ids.includes(id) ? ids.filter((current) => current !== id) : ids.length < 1000 ? [...ids, id] : ids)} onRemove={setProductToRemove} onSaveLookbookPosition={saveLookbookPosition} />)}</ol>
      </SortableContext>
    </DndContext>}
    {canUpdate && <ConfirmDialog open={productToRemove !== null} title={t('Gỡ sản phẩm khỏi bộ sưu tập?')} description={t('Sản phẩm “{{name}}” sẽ không còn xuất hiện trong bộ sưu tập này.', { name: productToRemove?.name ?? '' })} confirmLabel={t('Gỡ sản phẩm')} busy={busy} onConfirm={() => void remove()} onOpenChange={(open) => { if (!open && !busy) setProductToRemove(null) }} />}
    {canUpdate && <ConfirmDialog open={confirmBulkRemove} title={t('Gỡ {{count}} sản phẩm?', { count: selectedAssignedIds.length })} description={t('Các sản phẩm đã chọn sẽ bị gỡ khỏi bộ sưu tập này. Sản phẩm và tồn kho không bị xóa.')} confirmLabel={t('Gỡ sản phẩm đã chọn')} busy={busy} onConfirm={() => void bulkRemove()} onOpenChange={(open) => { if (!open && !busy) setConfirmBulkRemove(false) }} />}
  </section>
}
