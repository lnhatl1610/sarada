import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime } from '../../lib/date-format'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { AdvancedFilterSheet } from '../../components/shared/advanced-filter-sheet'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../lib/date-format'

type Movement = { id: number; type: string; quantity_change: number; stock_after: number; reference_type: string | null; reference_id: number | null; note: string | null; created_at: string; sku: string; product_name: string; actor_name: string | null }
type Actor = { id: number; name: string }
type Meta = { current_page: number; last_page: number; total: number }
type Response = { data: Movement[]; meta: Meta; filters: { actors: Actor[] } }
type Props = { apiUrl: string; accessToken: string }

export function InventoryMovementsPage({ apiUrl, accessToken }: Props) {
  const { t } = useTranslation()
  const label = (type: string) => ({ import: t('Nhập kho'), adjust: t('Điều chỉnh'), reserve: t('Giữ cho đơn'), release: t('Trả hàng giữ'), sale: t('Xuất bán'), return: t('Nhập lại hàng trả') }[type] ?? type)
  const referenceLabel = (type: string) => ({ csv_import: t('Nhập CSV'), manual_import: t('Nhập thủ công'), manual_adjustment: t('Điều chỉnh thủ công'), inventory_adjustment_batch: t('Phiếu điều chỉnh') }[type] ?? type)
  const initialParams = new URLSearchParams(window.location.search)
  const initialPage = Math.max(1, Number.parseInt(initialParams.get('page') ?? '1', 10) || 1)
  const pageSize = useAdminPageSize()
  const [search, setSearch] = useState(initialParams.get('q') ?? '')
  const [query, setQuery] = useState(initialParams.get('q') ?? '')
  const [type, setType] = useState(initialParams.get('type') ?? '')
  const [actorId, setActorId] = useState(initialParams.get('actor_id') ?? '')
  const [dateFrom, setDateFrom] = useState(initialParams.get('date_from') ?? '')
  const [dateTo, setDateTo] = useState(initialParams.get('date_to') ?? '')
  const [sort, setSort] = useState(initialParams.get('sort') ?? '-created_at')
  const [page, setPage] = useState(initialPage)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const restoreFromUrl = () => {
      const current = new URLSearchParams(window.location.search)
      setSearch(current.get('q') ?? '')
      setQuery(current.get('q') ?? '')
      setType(current.get('type') ?? '')
      setActorId(current.get('actor_id') ?? '')
      setDateFrom(current.get('date_from') ?? '')
      setDateTo(current.get('date_to') ?? '')
      setPage(Math.max(1, Number(current.get('page') ?? 1)))
      setSort(current.get('sort') ?? '-created_at')
    }
    window.addEventListener('popstate', restoreFromUrl)
    return () => window.removeEventListener('popstate', restoreFromUrl)
  }, [])

  const params = new URLSearchParams({ page: String(page), per_page: String(pageSize) })
  if (query) params.set('q', query)
  if (type) params.set('type', type)
  if (actorId) params.set('actor_id', actorId)
  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)
  if (sort) params.set('sort', sort)

  useEffect(() => {
    const next = new URLSearchParams(window.location.search)
    for (const key of ['q', 'type', 'actor_id', 'date_from', 'date_to', 'page', 'sort']) next.delete(key)
    const filters = { q: query, type, actor_id: actorId, date_from: dateFrom, date_to: dateTo, page: String(page), sort }
    for (const [key, value] of Object.entries(filters)) if (value && !(key === 'page' && value === '1')) next.set(key, value)
    const suffix = next.toString()
    const nextUrl = new URL(`${window.location.pathname}${suffix ? `?${suffix}` : ''}`, window.location.origin).href
    if (nextUrl !== window.location.href) window.history.pushState(null, '', nextUrl)
  }, [query, type, actorId, dateFrom, dateTo, page, sort])

  const movements = useQuery({
    queryKey: ['admin', 'inventory-movements', query, type, actorId, dateFrom, dateTo, page, sort, pageSize],
    enabled: Boolean(accessToken),
    queryFn: async ({ signal }) => {
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/movements?${params}`, { signal, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as Response & { message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không tải được lịch sử nhập/xuất.'))
      return body
    },
  })

  const exportCsv = async () => {
    setExportError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/movements/export?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/csv' } })
      if (!response.ok) throw new Error(t('Không thể xuất CSV theo bộ lọc hiện tại.'))
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `inventory-movements-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : t('Không thể xuất CSV.'))
    }
  }

  const clear = () => { setSearch(''); setQuery(''); setType(''); setActorId(''); setDateFrom(''); setDateTo(''); setPage(1); setSort('-created_at') }
  const columns: DataTableColumn<Movement>[] = [
    { id: 'created_at', header: t('Thời gian').toLocaleUpperCase(), sortable: true, cell: (row) => formatDateTime(row.created_at) },
    { id: 'sku', header: t('SKU / Sản phẩm').toLocaleUpperCase(), sortable: true, cell: (row) => <span><strong>{row.sku}</strong><br />{row.product_name}</span> },
    { id: 'type', header: t('Loại').toLocaleUpperCase(), cell: (row) => label(row.type) },
    { id: 'quantity_change', header: t('Biến động').toLocaleUpperCase(), sortable: true, cell: (row) => <strong className={row.quantity_change > 0 ? 'inventory-movement-positive' : row.quantity_change < 0 ? 'inventory-movement-negative' : ''}>{row.quantity_change > 0 ? '+' : ''}{formatNumber(row.quantity_change)}</strong> },
    { id: 'stock_after', header: t('Tồn sau').toLocaleUpperCase(), sortable: true, cell: (row) => formatNumber(row.stock_after) },
    { id: 'reference', header: t('Tham chiếu').toLocaleUpperCase(), cell: (row) => row.reference_type === 'order' && row.reference_id ? <a href={`/orders?search=${row.reference_id}`}>{t('Đơn #{{id}}', { id: row.reference_id })}</a> : row.reference_type === 'inventory_adjustment_batch' && row.reference_id ? <a href={`/inventory/adjustments/${row.reference_id}`}>{t('Phiếu #{{id}}', { id: row.reference_id })}</a> : row.reference_type ? `${referenceLabel(row.reference_type)}${row.reference_id ? ` #${row.reference_id}` : ''}` : '—' },
    { id: 'note', header: t('Ghi chú').toLocaleUpperCase(), cell: (row) => row.note ?? '—' },
    { id: 'actor', header: t('Người thực hiện').toLocaleUpperCase(), cell: (row) => row.actor_name ?? t('Hệ thống') },
  ]
  const hasFilters = Boolean(query || type || actorId || dateFrom || dateTo)

  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = []
  const addFilterChip = (id: string, label: string, clear: () => void) => activeFilterChips.push({ id, label, onRemove: clear })
  if (query) addFilterChip('q', t('Tìm: {{query}}', { query }), () => { setSearch(''); setQuery('') })
  if (type) addFilterChip('type', t('Loại: {{type}}', { type: label(type) }), () => setType(''))
  if (actorId) addFilterChip('actor_id', t('Người thực hiện #{{id}}', { id: actorId }), () => setActorId(''))
  if (dateFrom) addFilterChip('date_from', t('Từ {{date}}', { date: dateFrom }), () => setDateFrom(''))
  if (dateTo) addFilterChip('date_to', t('Đến {{date}}', { date: dateTo }), () => setDateTo(''))
  return <section className="panel listing">
    <div className="panel-heading"><div><h2>{t('Lịch sử nhập/xuất kho')}</h2><p>{t('Theo dõi biến động tồn, số tồn sau giao dịch và người thực hiện.')}</p></div><button className="secondary" type="button" onClick={() => void exportCsv()}>{t('Xuất CSV')}</button></div>
    <FilterBar hasFilters={hasFilters} onClear={clear} activeFilters={activeFilterChips}>
      <input aria-label={t('Tìm SKU hoặc tên sản phẩm')} placeholder={t('Tìm SKU hoặc sản phẩm')} value={search} onChange={(event) => setSearch(event.target.value)} />
    </FilterBar>
    <AdvancedFilterSheet filters={{ type, actor_id: actorId, date_from: dateFrom, date_to: dateTo }} defaults={{ type: '', actor_id: '', date_from: '', date_to: '' }} activeCount={[type, actorId, dateFrom, dateTo].filter(Boolean).length} onApply={(values) => { setType(values.type); setActorId(values.actor_id); setDateFrom(values.date_from); setDateTo(values.date_to); setPage(1) }}>
      {(draft, setValue) => <>
        <label>{t('Loại biến động')}<select value={draft.type} onChange={(event) => setValue('type', event.target.value)}><option value="">{t('Tất cả loại')}</option><option value="import">{t('Nhập kho')}</option><option value="adjust">{t('Điều chỉnh')}</option><option value="reserve">{t('Giữ cho đơn')}</option><option value="release">{t('Trả hàng giữ')}</option><option value="sale">{t('Xuất bán')}</option><option value="return">{t('Nhập lại hàng trả')}</option></select></label>
        <label>{t('Người thực hiện')}<select value={draft.actor_id} onChange={(event) => setValue('actor_id', event.target.value)}><option value="">{t('Tất cả người thực hiện')}</option>{movements.data?.filters.actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>
        <label>{t('Từ ngày')}<input type="date" value={draft.date_from} max={draft.date_to || undefined} onChange={(event) => setValue('date_from', event.target.value)} /></label>
        <label>{t('Đến ngày')}<input type="date" value={draft.date_to} min={draft.date_from || undefined} onChange={(event) => setValue('date_to', event.target.value)} /></label>
      </>}
    </AdvancedFilterSheet>
    
    {exportError && <p role="alert" className="reference-error">{exportError}</p>}
    <DataTable columns={columns} rows={movements.data?.data ?? []} rowKey={(row) => row.id} loading={movements.isPending} error={movements.error instanceof Error ? movements.error.message : null} onRetry={() => void movements.refetch()} noResults={hasFilters} emptyTitle={t('Chưa có biến động tồn kho')} emptyDescription={t('Các lần nhập, điều chỉnh và xử lý đơn hàng sẽ xuất hiện tại đây.')} page={movements.data?.meta.current_page ?? page} pageCount={movements.data?.meta.last_page ?? 1} totalRows={movements.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={setPage} sortBy={sort.replace(/^-/, '')} sortDirection={sort.startsWith('-') ? 'desc' : 'asc'} onSortChange={(column, direction) => { setSort(direction === 'none' ? '' : direction === 'desc' ? `-${column}` : column); setPage(1) }} />
  </section>
}
