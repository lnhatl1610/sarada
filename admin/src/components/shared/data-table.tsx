import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table'
import { publishAdminPageSize, useAdminPageSize } from './admin-page-size'
import { registerAdminTable, tableColumnsKey } from '../../lib/table-column-preferences'

export type DataTableColumn<Row> = {
  id: string
  header: string
  cell: (row: Row) => ReactNode
  sortable?: boolean
  sortKey?: string
  hideable?: boolean
  pin?: 'left' | 'right'
}

export type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string | number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  noResults?: boolean
  page?: number
  pageCount?: number
  totalRows?: number
  pageSize?: number
  onPageSizeChange?: (pageSize: 10 | 20 | 50 | 100) => void
  onPageChange?: (page: number) => void
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onSortChange?: (column: string, direction: 'asc' | 'desc' | 'none') => void
  selectedRowKeys?: Array<string | number>
  onSelectionChange?: (keys: Array<string | number>) => void
  selectionLabel?: (row: Row) => string
}

const EMPTY_SELECTION: Array<string | number> = []

function stableRowId(key: string | number) {
  return `${typeof key}:${String(key)}`
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription = 'Dữ liệu sẽ xuất hiện tại đây khi có bản ghi mới.',
  noResults = false,
  page = 1,
  pageCount = 1,
  totalRows,
  pageSize,
  onPageSizeChange,
  onPageChange,
  sortBy,
  sortDirection = 'asc',
  onSortChange,
  selectedRowKeys,
  onSelectionChange,
  selectionLabel = (row) => String(rowKey(row)),
}: DataTableProps<Row>) {
  const { t, i18n } = useTranslation()
  const sharedPageSize = useAdminPageSize()
  const tableRoute = window.location.pathname.replace(/\/\d+(?=\/|$)/g, '/:id')
  const tableParams = new URLSearchParams(window.location.search)
  const tableScope = ['page', 'section', 'kind', 'tab']
    .map((key) => `${key}=${tableParams.get(key) ?? ''}`)
    .join(':')
  const tableId = `${tableRoute}:${tableScope}:${columns.map((column) => column.id).join('|')}`
  const tableUserId = document.documentElement.dataset.adminUserId ?? 'guest'
  const preferenceKey = tableColumnsKey(tableUserId, tableId)
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => document.documentElement.dataset.adminDensity === 'compact' ? 'compact' : 'comfortable')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const defaults = JSON.parse(document.documentElement.dataset.adminTableColumnDefaults ?? '{}') as Record<string, unknown>
      const synced = defaults[tableId]
      if (Array.isArray(synced)) return Object.fromEntries(columns.filter((column) => column.hideable !== false).map((column) => [column.id, synced.includes(column.id)]))
      return JSON.parse(localStorage.getItem(preferenceKey) ?? '{}') as VisibilityState
    } catch { return {} }
  })
  const hydratedPreferenceKey = useRef(preferenceKey)
  const lastSelectedPosition = useRef<number | null>(null)
  useEffect(() => { lastSelectedPosition.current = null }, [page, rows])
  useEffect(() => {
    const syncDensity = (event: Event) => {
      const next = (event as CustomEvent<{ density?: string }>).detail?.density
      if (next === 'comfortable' || next === 'compact') setDensity(next)
    }
    window.addEventListener('fashion-admin-density-change', syncDensity)
    return () => window.removeEventListener('fashion-admin-density-change', syncDensity)
  }, [])
  useEffect(() => {
    if (hydratedPreferenceKey.current !== preferenceKey) {
      hydratedPreferenceKey.current = preferenceKey
      try { setColumnVisibility(JSON.parse(localStorage.getItem(preferenceKey) ?? '{}') as VisibilityState) } catch { setColumnVisibility({}) }
      return
    }
    try { localStorage.setItem(preferenceKey, JSON.stringify(columnVisibility)) } catch { /* Storage can be unavailable in private browsing. */ }
  }, [columnVisibility, preferenceKey])
  useEffect(() => {
    const tableLabel = document.querySelector<HTMLElement>('#admin-main-content h1, main h1')?.textContent?.trim() || tableRoute
    registerAdminTable(tableUserId, {
      id: tableId,
      label: `${tableLabel} · ${tableScope.replaceAll(':', ' · ')}`,
      columns: columns.map((column) => ({ id: column.id, label: typeof column.header === 'string' ? column.header : column.id, hideable: column.hideable !== false })),
    })
  }, [columns, tableId, tableUserId, tableRoute, tableScope])
  useEffect(() => {
    const applyAccountDefaults = () => {
      try {
        const defaults = JSON.parse(document.documentElement.dataset.adminTableColumnDefaults ?? '{}') as Record<string, unknown>
        const visible = defaults[tableId]
        if (!Array.isArray(visible)) return
        const next = Object.fromEntries(columns.filter((column) => column.hideable !== false).map((column) => [column.id, visible.includes(column.id)]))
        setColumnVisibility((current) => Object.keys(next).every((id) => current[id] === next[id]) ? current : next)
      } catch { /* Ignore malformed account preferences and retain the current table state. */ }
    }
    window.addEventListener('fashion-admin-apply-table-column-defaults', applyAccountDefaults)
    return () => window.removeEventListener('fashion-admin-apply-table-column-defaults', applyAccountDefaults)
  }, [columns, tableId])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const serialized = params.get('__columns')
    if (!serialized) return
    try {
      const visible = new Set(JSON.parse(serialized) as string[])
      setColumnVisibility(Object.fromEntries(columns.map((column) => [column.id, visible.has(column.id)])))
    } catch { /* Keep local column preferences when the URL snapshot is invalid. */ }
  }, [columns, preferenceKey])
  const selectionEnabled = Boolean(selectedRowKeys && onSelectionChange)
  const selectedKeys = selectedRowKeys ?? EMPTY_SELECTION
  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries(selectedKeys.map((key) => [stableRowId(key), true])),
    [selectedKeys],
  )
  const visibleRowIds = useMemo(() => new Set(rows.map((row) => stableRowId(rowKey(row)))), [rows, rowKey])
  const tableColumns = useMemo<ColumnDef<Row, unknown>[]>(() => {
    const definitions: ColumnDef<Row, unknown>[] = columns.map((column) => ({
      id: column.id,
      header: column.header,
      cell: ({ row }) => column.cell(row.original),
      enableHiding: column.hideable !== false,
      enableSorting: column.sortable ?? false,
      meta: { serverSortKey: column.sortKey ?? column.id },
    }))

    if (selectionEnabled) definitions.unshift({
      id: '__select',
      enableHiding: false,
      header: () => null,
      cell: () => null,
    })

    return definitions
  }, [columns, selectionEnabled])
  const sorting = useMemo(() => {
    const column = columns.find((item) => (item.sortKey ?? item.id) === sortBy)
    return column ? [{ id: column.id, desc: sortDirection === 'desc' }] : []
  }, [columns, sortBy, sortDirection])

  // TanStack Table owns an imperative instance that React Compiler intentionally skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => stableRowId(rowKey(row)),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    enableRowSelection: selectionEnabled,
    state: { columnVisibility, rowSelection, sorting },
    onColumnVisibilityChange: (updater) => setColumnVisibility((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      return next
    }),
    onRowSelectionChange: (updater) => {
      if (!onSelectionChange) return
      const nextSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      const keptKeys = selectedKeys.filter((key) => !visibleRowIds.has(stableRowId(key)))
      const currentPageKeys = rows
        .filter((row) => nextSelection[stableRowId(rowKey(row))])
        .map(rowKey)
      onSelectionChange([...keptKeys, ...currentPageKeys])
    },
  })
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('fashion-admin-table-columns-changed', {
      detail: { tableId, columns: columns.filter((column) => column.hideable !== false && columnVisibility[column.id] !== false).map((column) => column.id) },
    }))
  }, [columnVisibility, columns, tableId])
  useEffect(() => {
    document.documentElement.dataset.adminTableVisibleColumns = table.getVisibleLeafColumns().filter((column) => column.id !== '__select').map((column) => column.id).join(',')
    const applySavedColumns = (event: Event) => {
      const detail = (event as CustomEvent<{ tableId?: string; columns?: string[] }>).detail
      if (!detail?.columns || (detail.tableId && detail.tableId !== tableId)) return
      const visible = new Set(detail.columns)
      setColumnVisibility(Object.fromEntries(columns.map((column) => [column.id, visible.has(column.id)])))
    }
    window.addEventListener('fashion-admin-apply-saved-columns', applySavedColumns)
    return () => window.removeEventListener('fashion-admin-apply-saved-columns', applySavedColumns)
  }, [columns, columnVisibility, table, tableId])

  if (error) return <section className="shared-table-state" role="alert"><h2>{t('Không tải được dữ liệu')}</h2><p>{error}</p>{onRetry && <button className="secondary" onClick={onRetry}>{t('Thử lại')}</button>}</section>
  if (loading) return <div className="shared-table-skeleton" aria-label={t('Đang tải dữ liệu')} aria-busy="true">{Array.from({ length: 5 }, (_, index) => <div className="shared-table-skeleton-row" key={index}>{columns.map((column) => <span key={column.id} />)}</div>)}</div>
  if (!rows.length) return <section className="shared-table-state"><h2>{noResults ? t('Không tìm thấy kết quả') : t(emptyTitle)}</h2><p>{noResults ? t('Thử thay đổi từ khóa hoặc bộ lọc.') : t(emptyDescription)}</p></section>

  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide())
  const firstVisibleColumnId = table.getVisibleLeafColumns().find((column) => column.id !== '__select')?.id
  const effectivePageSize = pageSize ?? sharedPageSize
  const firstVisibleRow = totalRows === 0 ? 0 : (page - 1) * effectivePageSize + 1
  const lastVisibleRow = totalRows === undefined ? undefined : Math.min(page * effectivePageSize, totalRows)

  return <div className={`shared-data-table ${density === 'compact' ? 'is-compact' : 'is-comfortable'}`}>
    {(typeof totalRows === 'number' || selectionEnabled || hideableColumns.length > 1 || (onPageChange && typeof totalRows === 'number')) && <div className="shared-table-toolbar">
      {typeof totalRows === 'number' && <p className="shared-table-count" aria-live="polite">{totalRows === 0 ? t('0 kết quả') : t('Hiển thị {{from}}–{{to}} / {{total}}', { from: firstVisibleRow.toLocaleString(i18n.language), to: lastVisibleRow?.toLocaleString(i18n.language), total: totalRows.toLocaleString(i18n.language) })}</p>}
      {selectionEnabled && selectedKeys.length > 0 && <span className="shared-table-selection-count" aria-live="polite">{t('Đã chọn {{count}}', { count: selectedKeys.length })}</span>}
      {onPageChange && typeof totalRows === 'number' && <label className="shared-table-page-size">{t('Số dòng')} <select aria-label={t('Số dòng mỗi trang')} value={effectivePageSize} onChange={(event) => { const nextSize = Number(event.target.value) as 10 | 20 | 50 | 100; if (onPageSizeChange) onPageSizeChange(nextSize); else publishAdminPageSize(nextSize, 'table'); onPageChange(1) }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select></label>}
      <label className="shared-table-density">{t('Mật độ')} <select aria-label={t('Mật độ bảng')} value={density} onChange={(event) => { const next = event.target.value as 'comfortable' | 'compact'; setDensity(next); window.dispatchEvent(new CustomEvent('fashion-admin-density-request', { detail: { density: next } })) }}><option value="comfortable">{t('Thoáng')}</option><option value="compact">{t('Gọn')}</option></select></label>
      {hideableColumns.length > 1 && <details className="shared-table-column-menu">
        <summary className="secondary">{t('Hiển thị cột')}</summary>
        <div className="shared-table-column-options" aria-label={t('Chọn cột hiển thị')}>{hideableColumns.map((column) => <label key={column.id}><input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />{typeof column.columnDef.header === 'string' ? t(column.columnDef.header) : column.id}</label>)}</div>
      </details>}
    </div>}
    <div className="table-wrap" role="region" aria-label={t('Bảng dữ liệu')} tabIndex={0}>
      <table>
        <thead>{table.getHeaderGroups().map((headerGroup) => <tr key={headerGroup.id}>{headerGroup.headers.map((header) => {
          const column = columns.find((item) => item.id === header.column.id)
          if (header.isPlaceholder) return <th key={header.id} />
          if (header.column.id === '__select') return <th key={header.id} className="shared-table-select-column"><input type="checkbox" aria-label={t('Chọn tất cả trên trang này')} aria-checked={table.getIsSomePageRowsSelected() ? 'mixed' : table.getIsAllPageRowsSelected()} checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} /></th>

          const sortKey = column?.sortKey ?? column?.id
          const active = sortBy === sortKey
          const ariaSort = active ? sortDirection === 'asc' ? 'ascending' : 'descending' : 'none'

          const stickyClass = column?.pin === 'left' || header.column.id === '__select' || header.column.id === firstVisibleColumnId
            ? ` shared-table-sticky-left${header.column.id === firstVisibleColumnId && selectionEnabled ? ' shared-table-first-data' : ''}`
            : column?.pin === 'right' || (column && columns[columns.length - 1]?.id === column.id && /actions?$/i.test(column.id))
              ? ' shared-table-sticky-right'
              : ''
          return <th key={header.id} className={`${stickyClass.trim()}${header.column.id === '__select' ? ' shared-table-select-column' : ''}`} aria-sort={column?.sortable ? ariaSort : undefined}>
             {column?.sortable && onSortChange && sortKey
               ? <button className="shared-table-sort" onClick={() => onSortChange(sortKey, !active ? 'asc' : sortDirection === 'asc' ? 'desc' : 'none')}>{flexRender(header.column.columnDef.header, header.getContext())}<span aria-hidden="true">{active ? sortDirection === 'asc' ? ' ↑' : ' ↓' : ' ↕'}</span></button>
              : flexRender(header.column.columnDef.header, header.getContext())}
          </th>
        })}</tr>)}</thead>
        <tbody>{table.getRowModel().rows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => {
          const column = columns.find((item) => item.id === cell.column.id)
          const stickyClass = column?.pin === 'left' || cell.column.id === '__select' || cell.column.id === firstVisibleColumnId
            ? ` shared-table-sticky-left${cell.column.id === firstVisibleColumnId && selectionEnabled ? ' shared-table-first-data' : ''}`
            : column?.pin === 'right' || (column && columns[columns.length - 1]?.id === column.id && /actions?$/i.test(column.id))
              ? ' shared-table-sticky-right'
              : ''
          return cell.column.id === '__select'
          ? <td key={cell.id} className={`shared-table-select-column${stickyClass}`}><input type="checkbox" aria-label={t('Chọn {{label}}', { label: selectionLabel(row.original) })} checked={row.getIsSelected()} onChange={(event) => {
            const position = row.index
            const next = new Set(selectedKeys.map(stableRowId))
            const shiftKey = (event.nativeEvent as Event & { shiftKey?: boolean }).shiftKey === true
            if (shiftKey && lastSelectedPosition.current !== null) {
              const [start, end] = [lastSelectedPosition.current, position].sort((a, b) => a - b)
              const range = rows.slice(start, end + 1).map(rowKey)
              for (const key of range) {
                if (event.currentTarget.checked) next.add(stableRowId(key))
                else next.delete(stableRowId(key))
              }
            } else {
              lastSelectedPosition.current = position
              if (event.currentTarget.checked) next.add(stableRowId(rowKey(row.original)))
              else next.delete(stableRowId(rowKey(row.original)))
            }
            const pageKeys = rows.map(rowKey)
            const outsidePage = selectedKeys.filter((key) => !visibleRowIds.has(stableRowId(key)))
            onSelectionChange?.([...outsidePage, ...pageKeys.filter((key) => next.has(stableRowId(key)))])
          }} /></td>
          : <td key={cell.id} className={stickyClass.trim()}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
        })}</tr>)}</tbody>
      </table>
    </div>
    {onPageChange && (pageCount > 1 || typeof totalRows === 'number') && <nav className="shared-table-pagination" aria-label={t('Phân trang bảng')}>
      <span>{t('Trang {{page}} / {{pages}}', { page, pages: pageCount })}</span>
      <div><button className="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>{t('Trước')}</button><button className="secondary" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>{t('Tiếp')}</button></div>
    </nav>}
  </div>
}
