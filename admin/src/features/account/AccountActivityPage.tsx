import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { createApiResponseError } from '../../components/shared/api-validation'
import { formatDateTime } from '../../lib/date-format'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { publishAdminPageSize, useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { useListUrlState } from '../../lib/use-list-url-state'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { useTranslation } from 'react-i18next'

type Activity = { id: number; module: string; action: string; path: string; changes: string | Record<string, unknown> | null; ip: string | null; created_at: string }
type ResponseBody = { data?: Activity[]; message?: string; errors?: Record<string, string[]>; meta?: { current_page: number; last_page: number; total: number; per_page: number } }

const moduleLabels: Record<string, string> = { account: 'Tài khoản', 'activity-logs': 'Nhật ký hoạt động', auth: 'Xác thực', banners: 'Banner', campaigns: 'Chiến dịch', 'catalog-options': 'Danh mục dữ liệu', categories: 'Danh mục', collections: 'Bộ sưu tập', colors: 'Màu sắc', coupons: 'Mã giảm giá', customers: 'Khách hàng', inventory: 'Kho hàng', notifications: 'Thông báo', operations: 'Vận hành', orders: 'Đơn hàng', pages: 'Trang nội dung', payments: 'Thanh toán', products: 'Sản phẩm', reports: 'Báo cáo', reviews: 'Đánh giá', settings: 'Cài đặt', 'shipping-methods': 'Phương thức vận chuyển', 'shipping-rates': 'Phí vận chuyển theo tỉnh', sizes: 'Kích cỡ', staff: 'Nhân viên', tags: 'Thẻ', uploads: 'Tải tệp lên' }
const actionLabels: Record<string, string> = { POST: 'Tạo', PUT: 'Cập nhật', PATCH: 'Cập nhật', DELETE: 'Xóa', LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất', EMAIL_CHANGED: 'Đổi email', EXPORT: 'Xuất dữ liệu' }

function parseChanges(value: Activity['changes']): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'object') return value
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : { value: parsed }
  } catch {
    return { value }
  }
}

function readableValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

function ChangeDetails({ row }: { row: Activity }) {
  const { t } = useTranslation()
  const changes = parseChanges(row.changes)
  const before = changes.before && typeof changes.before === 'object' ? changes.before as Record<string, unknown> : null
  const after = changes.after && typeof changes.after === 'object' ? changes.after as Record<string, unknown> : null
  const changedFields = Array.isArray(changes.changed_fields) ? changes.changed_fields.filter((field): field is string => typeof field === 'string') : []
  const payload = changes.submitted && typeof changes.submitted === 'object' ? changes.submitted as Record<string, unknown> : changes
  const result = changes.result && typeof changes.result === 'object' ? changes.result as Record<string, unknown> : null
  const hasDiff = Boolean((before || after) && (Object.keys(before ?? {}).length || Object.keys(after ?? {}).length))
  const keys = hasDiff ? [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {}), ...changedFields])] : Object.keys(payload).filter((key) => key !== 'before' && key !== 'after' && key !== 'result' && key !== 'submitted')

  if (!keys.length && !result) return <p className="account-activity-empty">{t('Không ghi nhận dữ liệu thay đổi cho thao tác này.')}</p>

  return <div className="account-activity-change-details">
    {keys.length > 0 && <div className="table-wrap"><table><thead><tr><th>{t('Trường')}</th><th>{hasDiff ? t('Trước') : t('Dữ liệu yêu cầu')}</th>{hasDiff && <th>{t('Sau')}</th>}</tr></thead><tbody>{keys.map((key) => <tr key={key}><th scope="row">{key}</th><td><pre>{readableValue(hasDiff ? before?.[key] : payload[key])}</pre></td>{hasDiff && <td><pre>{readableValue(after?.[key])}</pre></td>}</tr>)}</tbody></table></div>}
    {result && <details><summary>{t('Phản hồi sau thao tác')}</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>}
  </div>
}

export function AccountActivityPage({ apiUrl, accessToken, accountId }: { apiUrl: string; accessToken: string; accountId: number }) {
  const { t } = useTranslation()
  const defaultPageSize = useAdminPageSize()
  const { state, setValue, clearFilters } = useListUrlState('account_activity', { module: '', action: '', from: '', to: '', sort: '-created_at', page: '1', per_page: String(defaultPageSize) })
  const [selected, setSelected] = useState<Activity | null>(null)
  const page = Math.max(1, Number.parseInt(state.page, 10) || 1)
  const perPage = Number(state.per_page) || defaultPageSize
  const sort = state.sort || '-created_at'
  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc'
  const query = useQuery({
    queryKey: ['account-activity', accountId, state.module, state.action, state.from, state.to, sort, page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
      params.set('sort', sort)
      if (state.module) params.set('module', state.module)
      if (state.action) params.set('action', state.action)
      if (state.from) params.set('from', state.from)
      if (state.to) params.set('to', state.to)
      const response = await adminApiFetch(`${apiUrl}/account/activity?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as ResponseBody
      if (!response.ok) throw createApiResponseError(body, response.status, t('Không tải được lịch sử hoạt động.'))
      return body
    },
    enabled: Boolean(accessToken),
  })

  const columns: DataTableColumn<Activity>[] = [
    { id: 'created_at', header: t('THỜI GIAN'), sortable: true, sortKey: 'created_at', cell: (row) => formatDateTime(row.created_at) },
    { id: 'module', header: t('PHÂN HỆ'), sortable: true, sortKey: 'module', cell: (row) => t(moduleLabels[row.module] ?? row.module) },
    { id: 'action', header: t('HÀNH ĐỘNG'), sortable: true, sortKey: 'action', cell: (row) => t(actionLabels[row.action] ?? row.action) },
    { id: 'path', header: t('ĐƯỜNG DẪN / ĐỐI TƯỢNG'), sortable: true, sortKey: 'path', cell: (row) => row.path },
    { id: 'ip', header: 'IP', sortable: true, sortKey: 'ip', cell: (row) => row.ip ?? '—' },
    { id: 'details', header: t('CHI TIẾT'), cell: (row) => <button className="link-button" type="button" aria-label={t('Xem chi tiết hoạt động {{id}}', { id: row.id })} onClick={() => setSelected(row)}>{t('Xem thay đổi')}</button> },
  ]
  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = []
  const addFilterChip = (id: string, label: string, key: string) => activeFilterChips.push({ id, label, onRemove: () => setValue(key, '') })
  if (state.module) addFilterChip('module', t(moduleLabels[state.module] ?? state.module), 'module')
  if (state.action) addFilterChip('action', t(actionLabels[state.action] ?? state.action), 'action')
  if (state.from) addFilterChip('from', t('Từ {{date}}', { date: state.from }), 'from')
  if (state.to) addFilterChip('to', t('Đến {{date}}', { date: state.to }), 'to')
  const hasFilters = Boolean(state.module || state.action || state.from || state.to)

  return <>
    <section className="panel account-personal-page">
      <header className="panel-heading"><div><h2>{t('Hoạt động của tôi')}</h2><p>{t('Chỉ hiển thị thao tác do tài khoản hiện tại thực hiện.')}</p></div></header>
      <FilterBar hasFilters={hasFilters} onClear={() => clearFilters(['module', 'action', 'from', 'to'])} label={t('Lọc hoạt động cá nhân')} activeFilters={activeFilterChips}>
        <select aria-label={t('Phân hệ')} value={state.module} onChange={(event) => setValue('module', event.target.value)}><option value="">{t('Tất cả phân hệ')}</option>{Object.entries(moduleLabels).map(([value, label]) => <option value={value} key={value}>{t(label)}</option>)}</select>
        <select aria-label={t('Hành động')} value={state.action} onChange={(event) => setValue('action', event.target.value)}><option value="">{t('Tất cả hành động')}</option>{Object.entries(actionLabels).map(([value, label]) => <option value={value} key={value}>{t(label)}</option>)}</select>
        <label>{t('Từ ngày')} <input type="date" aria-label={t('Từ ngày')} value={state.from} max={state.to || undefined} onChange={(event) => setValue('from', event.target.value)} /></label>
        <label>{t('Đến ngày')} <input type="date" aria-label={t('Đến ngày')} value={state.to} min={state.from || undefined} onChange={(event) => setValue('to', event.target.value)} /></label>
      </FilterBar>
      
        <DataTable columns={columns} rows={query.data?.data ?? []} rowKey={(row) => row.id} loading={query.isPending} error={query.error instanceof Error ? t(query.error.message) : null} onRetry={() => void query.refetch()} noResults={hasFilters} emptyTitle={t('Chưa có hoạt động')} emptyDescription={t('Các thao tác tài khoản sẽ xuất hiện tại đây.')} page={query.data?.meta?.current_page ?? page} pageCount={query.data?.meta?.last_page ?? 1} totalRows={query.data?.meta?.total ?? 0} pageSize={perPage as 10 | 20 | 50 | 100} onPageChange={(nextPage) => setValue('page', String(nextPage))} onPageSizeChange={(nextSize) => { setValue('per_page', String(nextSize)); publishAdminPageSize(nextSize, 'table') }} sortBy={sortBy} sortDirection={sortDirection} onSortChange={(key, direction) => { setValue('sort', direction === 'none' ? '-created_at' : direction === 'desc' ? `-${key}` : key); setValue('page', '1') }} />
    </section>
    <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null) }}>
      <SheetContent side="right" className="account-activity-sheet">
        <SheetHeader><SheetTitle>{t('Chi tiết hoạt động')}</SheetTitle><SheetDescription>{selected ? `${t(actionLabels[selected.action] ?? selected.action)} · ${t(moduleLabels[selected.module] ?? selected.module)} · ${formatDateTime(selected.created_at)}` : ''}</SheetDescription></SheetHeader>
        {selected && <div className="account-activity-detail"><dl><div><dt>{t('Đường dẫn')}</dt><dd>{selected.path}</dd></div><div><dt>{t('Địa chỉ IP')}</dt><dd>{selected.ip ?? t('Không ghi nhận')}</dd></div></dl><h3>{t('Trường dữ liệu')}</h3><ChangeDetails row={selected} /></div>}
      </SheetContent>
    </Sheet>
  </>
}
