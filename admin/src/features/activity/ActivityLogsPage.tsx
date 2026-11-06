import { useState } from 'react'
import { adminApiFetch } from '../../lib/admin-api'
import { formatDateTime } from '../../lib/date-format'
import { useQuery } from '@tanstack/react-query'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { AdvancedFilterSheet } from '../../components/shared/advanced-filter-sheet'
import { useListUrlState } from '../../lib/use-list-url-state'
import { enqueueAdminExportWhenLarge } from '../../lib/admin-exports'
import { useTranslation } from 'react-i18next'

type Row = { id: number; user_name: string | null; module: string; action: string; path: string; changes: string | null; ip: string | null; created_at: string }
type Result = { data: Row[]; meta: { current_page: number; last_page: number; total: number }; message?: string }
type Props = { apiUrl: string; accessToken: string }
type ChangeSet = { before?: Record<string, unknown>; after?: Record<string, unknown>; submitted?: Record<string, unknown>; changed_fields?: string[] }
const parseChanges = (value: string | null): ChangeSet => {
  if (!value) return {}
  try { return JSON.parse(value) as ChangeSet } catch { return { submitted: { raw: value } } }
}
const printChange = (value: unknown) => value === undefined ? '—' : typeof value === 'string' ? value : JSON.stringify(value, null, 2)
const moduleLabels: Record<string, string> = {
  account: 'Tài khoản', 'activity-logs': 'Nhật ký hoạt động', auth: 'Xác thực', banners: 'Banner', campaigns: 'Chiến dịch',
  'catalog-options': 'Tùy chọn danh mục', categories: 'Danh mục', collections: 'Bộ sưu tập', colors: 'Màu sắc', coupons: 'Mã giảm giá',
  customers: 'Khách hàng', inventory: 'Kho hàng', notifications: 'Thông báo', operations: 'Vận hành', orders: 'Đơn hàng', pages: 'Trang nội dung',
  payments: 'Thanh toán', products: 'Sản phẩm', reports: 'Báo cáo', reviews: 'Đánh giá', settings: 'Cài đặt',
  'shipping-methods': 'Phương thức vận chuyển', 'shipping-rates': 'Phí vận chuyển', sizes: 'Kích cỡ', staff: 'Nhân sự', tags: 'Thẻ sản phẩm', uploads: 'Tải lên',
}
const actionLabels: Record<string, string> = {
  LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất', LOGOUT_ALL: 'Đăng xuất mọi thiết bị', EMAIL_CHANGED: 'Đổi email', TWO_FACTOR_RESET: 'Đặt lại 2FA', linked: 'Liên kết', POST: 'Tạo', PATCH: 'Cập nhật', PUT: 'Thay thế', DELETE: 'Xóa', EXPORT: 'Xuất dữ liệu',
}
const auditDiffRows = (changes: ChangeSet) => {
  const before = changes.before ?? {}
  const after = changes.after ?? {}
  const rows: { field: string; before: unknown; after: unknown }[] = []
  const topLevelFields = [...new Set([
    ...Object.keys(before).filter((field) => field !== 'batch_records'),
    ...Object.keys(after).filter((field) => field !== 'batch_records'),
    ...(changes.changed_fields ?? []),
  ])]
  for (const field of topLevelFields) rows.push({ field, before: before[field], after: after[field] })

  const beforeGroups = before.batch_records && typeof before.batch_records === 'object' ? before.batch_records as Record<string, unknown> : {}
  const afterGroups = after.batch_records && typeof after.batch_records === 'object' ? after.batch_records as Record<string, unknown> : {}
  for (const group of new Set([...Object.keys(beforeGroups), ...Object.keys(afterGroups)])) {
    const beforeRecords = beforeGroups[group] && typeof beforeGroups[group] === 'object' ? beforeGroups[group] as Record<string, unknown> : {}
    const afterRecords = afterGroups[group] && typeof afterGroups[group] === 'object' ? afterGroups[group] as Record<string, unknown> : {}
    for (const recordId of new Set([...Object.keys(beforeRecords), ...Object.keys(afterRecords)])) {
      const beforeFields = beforeRecords[recordId] && typeof beforeRecords[recordId] === 'object' ? beforeRecords[recordId] as Record<string, unknown> : {}
      const afterFields = afterRecords[recordId] && typeof afterRecords[recordId] === 'object' ? afterRecords[recordId] as Record<string, unknown> : {}
      for (const field of new Set([...Object.keys(beforeFields), ...Object.keys(afterFields)])) {
        rows.push({ field: `${group} · ${recordId} · ${field}`, before: beforeFields[field], after: afterFields[field] })
      }
    }
  }
  return rows
}

export function ActivityLogsPage({ apiUrl, accessToken }: Props) {
  const { t } = useTranslation()
  const pageSize = useAdminPageSize()
  const { state: urlState, queryState, setValue: setUrlValue, clearFilters } = useListUrlState('activity_logs', { q: '', action: '', user_id: '', module: '', ip: '', from: '', to: '', sort: '-created_at', page: '1' })
  const q = urlState.q
  const queryQ = queryState.q
  const action = urlState.action
  const userId = urlState.user_id
  const module = urlState.module
  const ip = urlState.ip
  const from = urlState.from
  const to = urlState.to
  const sort = urlState.sort || '-created_at'
  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc'
  const page = Math.max(1, Number.parseInt(urlState.page, 10) || 1)
  const [selected, setSelected] = useState<Row | null>(null)
  const [exportError, setExportError] = useState('')
  const [exportNotice, setExportNotice] = useState('')
  const [exporting, setExporting] = useState(false)
  const logs = useQuery({ queryKey: ['admin', 'activity-logs', queryQ, action, userId, module, ip, from, to, sort, page, pageSize], queryFn: async () => {
    const params = new URLSearchParams({ page: String(page), per_page: String(pageSize), sort })
    if (queryQ.trim()) params.set('q', queryQ.trim())
    if (action) params.set('status', action)
    if (userId) params.set('user_id', userId)
    if (module) params.set('module', module)
    if (ip) params.set('ip', ip)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const response = await adminApiFetch(`${apiUrl}/admin/activity-logs?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json() as Result
    if (!response.ok) throw new Error(body.message ?? t('Không thể tải nhật ký.'))
    return body
  }, enabled: Boolean(accessToken) })
  const exportCsv = async () => {
    setExportError('')
    setExportNotice('')
    setExporting(true)
    try {
      const params = new URLSearchParams({ export: '1' })
      if (q.trim()) params.set('q', q.trim())
      if (action) params.set('status', action)
      if (userId) params.set('user_id', userId)
      if (module) params.set('module', module)
      if (ip) params.set('ip', ip)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (await enqueueAdminExportWhenLarge({ apiUrl, accessToken, type: 'activity', rowCount: logs.data?.meta.total ?? 0, filters: params })) {
        setExportNotice(t('Đã đưa nhật ký vào Trung tâm tải xuống.'))
        return
      }
      const response = await adminApiFetch(`${apiUrl}/admin/activity-logs?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/csv' } })
      if (!response.ok) throw new Error(t('Không thể xuất nhật ký hoạt động.'))
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = 'nhat-ky-hoat-dong.csv'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportNotice(t('Đã bắt đầu tải tệp CSV.'))
    } catch (error) { setExportError(error instanceof Error ? error.message : t('Không thể xuất nhật ký hoạt động.')) }
    finally { setExporting(false) }
  }
  const columns: DataTableColumn<Row>[] = [
    { id: 'date', header: t('Thời gian').toLocaleUpperCase(), sortKey: 'created_at', sortable: true, cell: (row) => formatDateTime(row.created_at) },
    { id: 'user', header: t('Người thực hiện').toLocaleUpperCase(), sortKey: 'user_name', sortable: true, cell: (row) => row.user_name ?? t('Tài khoản đã xóa') },
    { id: 'module', header: t('Phân hệ').toLocaleUpperCase(), sortable: true, cell: (row) => t(moduleLabels[row.module] ?? row.module) },
    { id: 'action', header: t('Thao tác').toLocaleUpperCase(), sortable: true, cell: (row) => t(actionLabels[row.action] ?? row.action) },
    { id: 'path', header: t('Đường dẫn').toLocaleUpperCase(), sortable: true, cell: (row) => row.path },
    { id: 'ip', header: 'IP', sortable: true, cell: (row) => row.ip ?? '—' },
    { id: 'changes', header: t('Chi tiết').toLocaleUpperCase(), cell: (row) => <button className="secondary" type="button" onClick={() => setSelected(row)}>{t('Xem thay đổi')}</button> },
  ]
  const changeSet = selected ? parseChanges(selected.changes) : null
  const diffRows = changeSet ? auditDiffRows(changeSet) : []
  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = []
  const addFilterChip = (id: string, label: string, key: string) => activeFilterChips.push({ id, label, onRemove: () => setUrlValue(key, '') })
  if (q) addFilterChip('q', t('Tìm: {{query}}', { query: q }), 'q')
  if (userId) addFilterChip('user_id', t('Nhân viên #{{id}}', { id: userId }), 'user_id')
  if (module) addFilterChip('module', t('Phân hệ {{module}}', { module: t(moduleLabels[module] ?? module) }), 'module')
  if (action) addFilterChip('action', t('Thao tác {{action}}', { action: t(actionLabels[action] ?? action) }), 'action')
  if (ip) addFilterChip('ip', t('IP {{ip}}', { ip }), 'ip')
  if (from) addFilterChip('from', t('Từ {{date}}', { date: from }), 'from')
  if (to) addFilterChip('to', t('Đến {{date}}', { date: to }), 'to')
  return <section className="panel listing"><div className="panel-heading"><div><h2>{t('Nhật ký hoạt động')}</h2><p>{t('Ghi lại các yêu cầu thay đổi dữ liệu thành công trong khu vực quản trị. Giá trị nhạy cảm được ẩn.')}</p></div><button className="secondary" type="button" disabled={exporting || !logs.data?.meta.total} onClick={() => void exportCsv()}>{exporting ? t('Đang xuất…') : t('Xuất CSV')}</button></div>{exportNotice && <p role="status">{exportNotice}</p>}{exportError && <p role="alert" className="reference-error">{exportError}</p>}<FilterBar hasFilters={Boolean(q || action || userId || module || ip || from || to)} onClear={() => clearFilters(['q', 'action', 'user_id', 'module', 'ip', 'from', 'to'])} activeFilters={activeFilterChips}><input aria-label={t('Tìm nhật ký')} placeholder={t('Tên người dùng, đường dẫn hoặc dữ liệu')} value={q} onChange={(event) => setUrlValue('q', event.target.value)} /></FilterBar><AdvancedFilterSheet filters={{ action, user_id: userId, module, ip, from, to }} defaults={{ action: '', user_id: '', module: '', ip: '', from: '', to: '' }} activeCount={[action, userId, module, ip, from, to].filter(Boolean).length} onApply={(values) => { setUrlValue('action', values.action); setUrlValue('user_id', values.user_id); setUrlValue('module', values.module); setUrlValue('ip', values.ip); setUrlValue('from', values.from); setUrlValue('to', values.to); setUrlValue('page', '1') }}>
      {(draft, setValue) => <><label>{t('Mã nhân viên')}<input aria-label={t('Lọc theo mã nhân viên')} type="number" min="1" value={draft.user_id} onChange={(event) => setValue('user_id', event.target.value)} /></label><label>{t('Phân hệ')}<select aria-label={t('Lọc phân hệ')} value={draft.module} onChange={(event) => setValue('module', event.target.value)}><option value="">{t('Tất cả phân hệ')}</option>{Object.entries(moduleLabels).map(([item, label]) => <option key={item} value={item}>{t(label)}</option>)}</select></label><label>{t('Loại thao tác')}<select aria-label={t('Loại thao tác')} value={draft.action} onChange={(event) => setValue('action', event.target.value)}><option value="">{t('Tất cả thao tác')}</option>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label><label>{t('Địa chỉ IP')}<input aria-label={t('Lọc theo địa chỉ IP')} value={draft.ip} onChange={(event) => setValue('ip', event.target.value)} /></label><label>{t('Từ ngày')}<input type="date" value={draft.from} max={draft.to || undefined} onChange={(event) => setValue('from', event.target.value)} /></label><label>{t('Đến ngày')}<input type="date" value={draft.to} min={draft.from || undefined} onChange={(event) => setValue('to', event.target.value)} /></label></>}
    </AdvancedFilterSheet><DataTable columns={columns} rows={logs.data?.data ?? []} rowKey={(row) => row.id} loading={logs.isLoading} error={logs.error instanceof Error ? logs.error.message : null} onRetry={() => void logs.refetch()} noResults={Boolean(q || action || userId || module || ip || from || to)} emptyTitle={t('Chưa có hoạt động')} emptyDescription={t('Các thay đổi quản trị sẽ xuất hiện ở đây.')} page={logs.data?.meta.current_page ?? page} pageCount={logs.data?.meta.last_page ?? 1} totalRows={logs.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUrlValue('page', String(nextPage))} sortBy={sortBy} sortDirection={sortDirection} onSortChange={(key, direction) => setUrlValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${key}` : key)} />
    {selected && <div className="activity-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><section className="activity-drawer" role="dialog" aria-modal="true" aria-labelledby="activity-drawer-title"><div className="panel-heading"><div><h3 id="activity-drawer-title">{t('Chi tiết thay đổi')}</h3><p>{formatDateTime(selected.created_at)} · {selected.user_name ?? t('Tài khoản đã xóa')} · {selected.ip ?? t('Không rõ IP')}</p></div><button className="secondary" type="button" onClick={() => setSelected(null)}>{t('Đóng')}</button></div><p><strong>{t('Phân hệ')}:</strong> {t(moduleLabels[selected.module] ?? selected.module)} · <strong>{t('Hành động')}:</strong> {t(actionLabels[selected.action] ?? selected.action)}</p><p><strong>{t('Đường dẫn / đối tượng')}:</strong> <code>{selected.path}</code></p>{diffRows.length > 0 ? <div className="table-wrap"><table><thead><tr><th>{t('Trường / bản ghi')}</th><th>{t('Trước')}</th><th>{t('Sau')}</th></tr></thead><tbody>{diffRows.map(({ field, before, after }) => <tr key={field}><th scope="row">{field}</th><td><pre>{printChange(before)}</pre></td><td><pre>{printChange(after)}</pre></td></tr>)}</tbody></table></div> : changeSet?.changed_fields ? <p>{t('Đã cập nhật các trường: {{fields}}', { fields: changeSet.changed_fields.join(', ') })}</p> : <pre>{JSON.stringify(changeSet?.submitted ?? {}, null, 2)}</pre>}</section></div>}
  </section>
}
