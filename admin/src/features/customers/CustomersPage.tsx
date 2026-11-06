import { adminApiFetch } from '../../lib/admin-api'
import { formatDate, formatDateTime, formatVnd } from '../../lib/date-format'
import { mediaUrl } from '../../lib/media-url'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { AdvancedFilterSheet } from '../../components/shared/advanced-filter-sheet'
import { FormField } from '../../components/shared/form-field'
import { FilterBar } from '../../components/shared/filter-bar'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { useListUrlState } from '../../lib/use-list-url-state'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { CustomerExportButton } from './CustomerExportButton'
import '../../ReferenceData.css'

type Customer = { id: number; name: string; email: string; phone: string | null; avatar: string | null; email_verified: boolean; status: string; order_count: number; total_spent: number; created_at: string; last_order_at: string | null }
type Detail = Customer & { gender: string | null; birthday: string | null; average_order_value: number; addresses: { id: number; recipient_name: string; street: string; ward_code: string; district_code: string; province_code: string; is_default: boolean }[]; orders: { id: number; code: string; grand_total: number; status: string }[]; reviews: { id: number; rating: number; content: string | null; product?: { name: string } }[]; wishlist: { id: number; name: string }[]; cart: { item_count: number; total_value: number; items: { id: number; product_name: string | null; sku: string | null; color: string | null; size: string | null; quantity: number; unit_price_snapshot: number }[] }; notes: { id: number; content: string; created_at: string; actor_id: number | null; actor_name: string | null }[] }
type List = { data: Customer[]; meta: { current_page: number; last_page: number; total: number }; status_counts?: Record<string, number> }
type Props = { apiUrl: string; accessToken: string; canManage: boolean; initialCustomerId?: number }
const schema = z.object({ name: z.string().trim().min(2), email: z.email(), phone: z.string(), gender: z.string(), birthday: z.string(), status: z.enum(['active', 'blocked']) })
type Form = z.infer<typeof schema>
const money = (amount: number) => formatVnd(amount)

export function CustomersPage({ apiUrl, accessToken, canManage, initialCustomerId }: Props) {
  const { t } = useTranslation()
  const pageSize = useAdminPageSize()
  const client = useQueryClient()
  const { state: urlState, queryState, setValue: setUrlValue, clearFilters } = useListUrlState('customers', { q: '', status: '', from: '', to: '', min_spent: '', max_spent: '', min_orders: '', max_orders: '', last_order_from: '', last_order_to: '', province_code: '', gender: '', email_verified: '', sort: '-created_at', page: '1' })
  const q = urlState.q
  const queryQ = queryState.q
  const status = urlState.status
  const from = urlState.from
  const to = urlState.to
  const minSpent = urlState.min_spent
  const maxSpent = urlState.max_spent
  const minOrders = urlState.min_orders
  const maxOrders = urlState.max_orders
  const lastOrderFrom = urlState.last_order_from
  const lastOrderTo = urlState.last_order_to
  const provinceCode = urlState.province_code
  const gender = urlState.gender
  const emailVerified = urlState.email_verified
  const sort = urlState.sort || '-created_at'
  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc'
  const page = Math.max(1, Number.parseInt(urlState.page, 10) || 1)
  const [selectedId, setSelectedId] = useState<number | null>(initialCustomerId ?? null)
  const [editOpen, setEditOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const form = useForm<Form>({ resolver: zodResolver(schema) })
  const confirmDiscard = useUnsavedFormGuard(editOpen && form.formState.isDirty)
  const list = useQuery({ queryKey: ['admin', 'customers', queryQ, status, from, to, minSpent, maxSpent, minOrders, maxOrders, lastOrderFrom, lastOrderTo, provinceCode, gender, emailVerified, sort, page, pageSize], queryFn: async () => {
    const params = new URLSearchParams({ page: String(page), per_page: String(pageSize), sort })
    if (queryQ.trim()) params.set('q', queryQ.trim())
    if (status) params.set('status', status)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (minSpent) params.set('min_spent', minSpent)
    if (maxSpent) params.set('max_spent', maxSpent)
    if (minOrders) params.set('min_orders', minOrders)
    if (maxOrders) params.set('max_orders', maxOrders)
    if (lastOrderFrom) params.set('last_order_from', lastOrderFrom)
    if (lastOrderTo) params.set('last_order_to', lastOrderTo)
    if (provinceCode.trim()) params.set('province_code', provinceCode.trim())
    if (gender) params.set('gender', gender)
    if (emailVerified) params.set('email_verified', emailVerified)
    const response = await adminApiFetch(`${apiUrl}/admin/customers?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json() as List & { message?: string }
    if (!response.ok) throw new Error(body.message ?? t("Không thể tải khách hàng."))
    return body
  }, enabled: Boolean(accessToken) })
  const detail = useQuery({ queryKey: ['admin', 'customer', selectedId], queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/admin/customers/${selectedId}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json() as { data?: Detail; message?: string }
    if (!response.ok || !body.data) throw new Error(body.message ?? t("Không thể tải chi tiết khách hàng."))
    return body.data
  }, enabled: Boolean(accessToken && selectedId) })
  const save = useMutation({ mutationFn: async (values: Form) => {
    const response = await adminApiFetch(`${apiUrl}/admin/customers/${selectedId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, phone: values.phone || null, gender: values.gender || null, birthday: values.birthday || null }) })
    const body = await response.json() as { message?: string; errors?: Record<string, string[]> }
    if (!response.ok) throw createApiResponseError(body, response.status, t("Không thể lưu khách hàng."))
  }, onError: (error) => { applyServerValidationErrors(form, error) }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'customer', selectedId] }); void client.invalidateQueries({ queryKey: ['admin', 'customers'] }); setEditOpen(false); setNotice(t("Đã lưu hồ sơ khách hàng.")) } })
  const addNote = useMutation({ mutationFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/admin/customers/${selectedId}/notes`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ content: noteDraft }) })
    const body = await response.json() as { message?: string; errors?: Record<string, string[]> }
    if (!response.ok) throw createApiResponseError(body, response.status, t("Không thể lưu ghi chú khách hàng."))
  }, onSuccess: () => { setNoteDraft(''); setNotice(t("Đã thêm ghi chú nội bộ.")); void client.invalidateQueries({ queryKey: ['admin', 'customer', selectedId] }) } })
  const openEdit = () => { if (!detail.data) return; form.reset({ name: detail.data.name, email: detail.data.email, phone: detail.data.phone ?? '', gender: detail.data.gender ?? '', birthday: detail.data.birthday ?? '', status: detail.data.status === 'blocked' ? 'blocked' : 'active' }); save.reset(); setEditOpen(true) }
  const closeEdit = () => { if (!confirmDiscard()) return; setEditOpen(false) }
  const closeCustomerDetail = () => { if (!confirmDiscard()) return; setSelectedId(null); setEditOpen(false); setNoteDraft('') }
  const columns: DataTableColumn<Customer>[] = [
    { id: 'name', header: t("KHÁCH HÀNG"), sortable: true, cell: (item) => <button className="customer-list-identity" onClick={() => { setNoteDraft(''); setSelectedId(item.id) }}><span className="customer-list-avatar">{item.avatar ? <img src={mediaUrl(apiUrl, item.avatar)} alt="" onError={(event) => event.currentTarget.remove()} /> : item.name.trim().charAt(0).toUpperCase()}</span>{item.name}</button> },
    { id: 'email', header: 'EMAIL', sortable: true, cell: (item) => item.email },
    { id: 'phone', header: t("SĐT"), cell: (item) => item.phone ?? '—' },
    { id: 'orders', header: t("SỐ ĐƠN"), sortKey: 'orders_count', sortable: true, cell: (item) => item.order_count },
    { id: 'spent', header: t("ĐÃ CHI"), sortKey: 'delivered_total', sortable: true, cell: (item) => money(item.total_spent) },
    { id: 'email-verified', header: 'EMAIL', cell: (item) => item.email_verified ? t("Đã xác thực") : t("Chưa xác thực") },
    { id: 'status', header: t("TRẠNG THÁI"), sortable: true, cell: (item) => item.status === 'active' ? t("Hoạt động") : t("Đã khóa") },
    { id: 'created', header: t("ĐĂNG KÝ"), sortKey: 'created_at', sortable: true, cell: (item) => formatDateTime(item.created_at) },
    { id: 'last-order', header: t('MUA GẦN NHẤT'), sortKey: 'last_order_at', sortable: true, cell: (item) => item.last_order_at ? formatDate(item.last_order_at) : t("Chưa mua") },
  ]
  const exportParams = new URLSearchParams()
  if (q.trim()) exportParams.set('q', q.trim())
  if (status) exportParams.set('status', status)
  if (from) exportParams.set('from', from)
  if (to) exportParams.set('to', to)
  if (minSpent) exportParams.set('min_spent', minSpent)
  if (maxSpent) exportParams.set('max_spent', maxSpent)
  if (minOrders) exportParams.set('min_orders', minOrders)
  if (maxOrders) exportParams.set('max_orders', maxOrders)
  if (lastOrderFrom) exportParams.set('last_order_from', lastOrderFrom)
  if (lastOrderTo) exportParams.set('last_order_to', lastOrderTo)
  if (provinceCode.trim()) exportParams.set('province_code', provinceCode.trim())
  if (gender) exportParams.set('gender', gender)
  if (emailVerified) exportParams.set('email_verified', emailVerified)
  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = []
  const addFilterChip = (id: string, label: string, key: string) => activeFilterChips.push({ id, label, onRemove: () => setUrlValue(key, '') })
  if (q) addFilterChip('q', `Tìm: ${q}`, 'q')
  if (status) addFilterChip('status', status === 'active' ? t("Hoạt động") : t("Bị khóa"), 'status')
  if (from) addFilterChip('from', `Đăng ký từ ${from}`, 'from')
  if (to) addFilterChip('to', `Đăng ký đến ${to}`, 'to')
  if (minSpent) addFilterChip('min_spent', `Chi tiêu từ ${minSpent} ₫`, 'min_spent')
  if (maxSpent) addFilterChip('max_spent', `Chi tiêu đến ${maxSpent} ₫`, 'max_spent')
  if (minOrders) addFilterChip('min_orders', `Số đơn từ ${minOrders}`, 'min_orders')
  if (maxOrders) addFilterChip('max_orders', `Số đơn đến ${maxOrders}`, 'max_orders')
  if (lastOrderFrom) addFilterChip('last_order_from', `Mua gần nhất từ ${lastOrderFrom}`, 'last_order_from')
  if (lastOrderTo) addFilterChip('last_order_to', `Mua gần nhất đến ${lastOrderTo}`, 'last_order_to')
  if (provinceCode) addFilterChip('province_code', `Tỉnh/thành ${provinceCode}`, 'province_code')
  if (gender) addFilterChip('gender', `Giới tính ${gender}`, 'gender')
  if (emailVerified) addFilterChip('email_verified', emailVerified === '1' ? t("Email đã xác thực") : t("Email chưa xác thực"), 'email_verified')
  return <div className="reports-page"><section className="panel listing"><div className="panel-heading"><div><h2>{t("Khách hàng")}</h2><p>{t("Tài khoản, số đơn và tổng chi tiêu từ đơn đã giao.")}</p></div></div><div className="customer-status-tabs" role="group" aria-label={t("Lọc trạng thái khách hàng")}><button type="button" aria-pressed={status === ''} className={status === '' ? 'active' : 'secondary'} onClick={() => setUrlValue('status', '')}>{t("Tất cả")}<b>{list.data?.status_counts?.all ?? '—'}</b></button><button type="button" aria-pressed={status === 'active'} className={status === 'active' ? 'active' : 'secondary'} onClick={() => setUrlValue('status', 'active')}>{t("Hoạt động")}<b>{list.data?.status_counts?.active ?? '—'}</b></button><button type="button" aria-pressed={status === 'blocked'} className={status === 'blocked' ? 'active' : 'secondary'} onClick={() => setUrlValue('status', 'blocked')}>{t("Bị khóa")}<b>{list.data?.status_counts?.blocked ?? '—'}</b></button></div>{notice && <p role="status" className="reference-notice">{notice}</p>}<FilterBar hasFilters={Boolean(q || status || from || to || minSpent || maxSpent || minOrders || maxOrders || lastOrderFrom || lastOrderTo || provinceCode || gender || emailVerified)} onClear={() => clearFilters(['q', 'status', 'from', 'to', 'min_spent', 'max_spent', 'min_orders', 'max_orders', 'last_order_from', 'last_order_to', 'province_code', 'gender', 'email_verified'])} activeFilters={activeFilterChips}><input aria-label={t("Tìm khách hàng")} placeholder={t("Tên, email hoặc SĐT")} value={q} onChange={(event) => setUrlValue('q', event.target.value)} /></FilterBar><AdvancedFilterSheet
      filters={{ from, to, min_spent: minSpent, max_spent: maxSpent, min_orders: minOrders, max_orders: maxOrders, last_order_from: lastOrderFrom, last_order_to: lastOrderTo, province_code: provinceCode, gender, email_verified: emailVerified }}
      defaults={{ from: '', to: '', min_spent: '', max_spent: '', min_orders: '', max_orders: '', last_order_from: '', last_order_to: '', province_code: '', gender: '', email_verified: '' }}
      activeCount={[from, to, minSpent, maxSpent, minOrders, maxOrders, lastOrderFrom, lastOrderTo, provinceCode, gender, emailVerified].filter(Boolean).length}
      onApply={(values) => { setUrlValue('from', values.from); setUrlValue('to', values.to); setUrlValue('min_spent', values.min_spent); setUrlValue('max_spent', values.max_spent); setUrlValue('min_orders', values.min_orders); setUrlValue('max_orders', values.max_orders); setUrlValue('last_order_from', values.last_order_from); setUrlValue('last_order_to', values.last_order_to); setUrlValue('province_code', values.province_code); setUrlValue('gender', values.gender); setUrlValue('email_verified', values.email_verified); setUrlValue('page', '1') }}
    >
      {(draft, setDraft) => <><label>{t("Ngày đăng ký từ")}<input type="date" value={draft.from} max={draft.to || undefined} onChange={(event) => setDraft('from', event.target.value)} /></label><label>{t("Ngày đăng ký đến")}<input type="date" value={draft.to} min={draft.from || undefined} onChange={(event) => setDraft('to', event.target.value)} /></label><label>{t("Chi tiêu tối thiểu (₫)")}<input aria-label={t("Chi tiêu tối thiểu")} type="number" min="0" value={draft.min_spent} onChange={(event) => setDraft('min_spent', event.target.value)} /></label><label>{t("Chi tiêu tối đa (₫)")}<input aria-label={t("Chi tiêu tối đa")} type="number" min="0" value={draft.max_spent} onChange={(event) => setDraft('max_spent', event.target.value)} /></label><label>{t("Số đơn từ")}<input aria-label={t("Số đơn tối thiểu")} type="number" min="0" value={draft.min_orders} onChange={(event) => setDraft('min_orders', event.target.value)} /></label><label>{t("Số đơn đến")}<input aria-label={t("Số đơn tối đa")} type="number" min="0" value={draft.max_orders} onChange={(event) => setDraft('max_orders', event.target.value)} /></label><label>{t("Mua gần nhất từ")}<input aria-label={t("Ngày mua gần nhất từ")} type="date" value={draft.last_order_from} max={draft.last_order_to || undefined} onChange={(event) => setDraft('last_order_from', event.target.value)} /></label><label>{t("Mua gần nhất đến")}<input aria-label={t("Ngày mua gần nhất đến")} type="date" value={draft.last_order_to} min={draft.last_order_from || undefined} onChange={(event) => setDraft('last_order_to', event.target.value)} /></label><label>{t("Mã tỉnh/thành")}<input aria-label={t("Mã tỉnh thành")} placeholder={t("Ví dụ: 01")} value={draft.province_code} onChange={(event) => setDraft('province_code', event.target.value)} /></label><label>{t("Giới tính")}<select aria-label={t("Giới tính khách hàng")} value={draft.gender} onChange={(event) => setDraft('gender', event.target.value)}><option value="">{t("Tất cả")}</option><option value="male">{t("Nam")}</option><option value="female">{t("Nữ")}</option><option value="other">{t("Khác")}</option></select></label><label>Email<select aria-label={t("Xác thực email")} value={draft.email_verified} onChange={(event) => setDraft('email_verified', event.target.value)}><option value="">{t("Tất cả")}</option><option value="1">{t("Đã xác thực")}</option><option value="0">{t("Chưa xác thực")}</option></select></label></>}
    </AdvancedFilterSheet><div className="list-actions"><CustomerExportButton apiUrl={apiUrl} accessToken={accessToken} query={exportParams.toString()} total={list.data?.meta.total ?? 0} /></div><DataTable columns={columns} rows={list.data?.data ?? []} rowKey={(item) => item.id} loading={list.isLoading} error={list.error instanceof Error ? list.error.message : null} onRetry={() => void list.refetch()} noResults={Boolean(q || status || from || to || minSpent || maxSpent || minOrders || maxOrders || lastOrderFrom || lastOrderTo || provinceCode || gender || emailVerified)} emptyTitle={t("Chưa có khách hàng")} emptyDescription={t("Khách hàng đăng ký sẽ xuất hiện ở đây.")} page={list.data?.meta.current_page ?? page} pageCount={list.data?.meta.last_page ?? 1} totalRows={list.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUrlValue('page', String(nextPage))} sortBy={sortBy} sortDirection={sortDirection} onSortChange={(key, direction) => setUrlValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${key}` : key)} /></section>
     {selectedId && <section className="panel reference-page"><div className="panel-heading"><div><h2>{t("Chi tiết khách hàng")}</h2><p>{t("Mã tài khoản #")}{selectedId}</p></div><button className="secondary" onClick={closeCustomerDetail}>{t("Đóng")}</button></div>{detail.isLoading && <p>{t("Đang tải hồ sơ...")}</p>}{detail.error && <p role="alert" className="reference-error">{detail.error.message} <button className="secondary" onClick={() => void detail.refetch()}>{t("Thử lại")}</button></p>}{detail.data && <><div className="customer-detail-identity"><span className="customer-detail-avatar">{detail.data.avatar ? <img src={mediaUrl(apiUrl, detail.data.avatar)} alt="" onError={(event) => event.currentTarget.remove()} /> : detail.data.name.trim().charAt(0).toUpperCase()}</span><div><h3>{detail.data.name}</h3><p>{detail.data.email} · {detail.data.email_verified ? t("Email đã xác thực") : t("Email chưa xác thực")}</p><p>{detail.data.phone || t("Chưa có số điện thoại")} · {detail.data.gender === 'male' ? 'Nam' : detail.data.gender === 'female' ? t('Nữ') : detail.data.gender === 'other' ? t("Khác") : t("Chưa chọn")} {t("· Sinh ngày")}{detail.data.birthday ? formatDate(detail.data.birthday) : t("chưa cập nhật")} {t("· Tham gia")}{formatDateTime(detail.data.created_at)}</p></div></div><div className="report-metrics"><article><span>{t("TỔNG ĐƠN")}</span><strong>{detail.data.order_count}</strong></article><article><span>{t("ĐÃ CHI (ĐƠN ĐÃ GIAO)")}</span><strong>{money(detail.data.total_spent)}</strong></article><article><span>{t("GIÁ TRỊ ĐƠN TB")}</span><strong>{money(detail.data.average_order_value)}</strong></article><article><span>{t("ĐƠN GẦN NHẤT")}</span><strong>{detail.data.last_order_at ? formatDateTime(detail.data.last_order_at) : t("Chưa có")}</strong></article></div>{canManage && <div className="reference-form-actions"><button className="secondary" onClick={openEdit}>{t("Chỉnh sửa tài khoản")}</button></div>}<h3>{t("Địa chỉ")}</h3>{detail.data.addresses.length ? detail.data.addresses.map((item) => <p key={item.id}>{item.is_default && <strong>{t("Mặc định ·")}</strong>}{item.recipient_name} · {item.street}, {item.ward_code}, {item.district_code}, {item.province_code}</p>) : <p>{t("Chưa lưu địa chỉ.")}</p>}<h3>{t("Đơn gần đây")}</h3>{detail.data.orders.length ? detail.data.orders.map((item) => <p key={item.id}><a href={`/?page=orders&order=${item.id}`}>{item.code}</a> · {money(item.grand_total)} · {item.status}</p>) : <p>{t("Chưa có đơn.")}</p>}<h3>{t("Đánh giá")}</h3>{detail.data.reviews.length ? detail.data.reviews.map((item) => <p key={item.id}>{item.product?.name ?? t('Sản phẩm')} · {item.rating} {t("sao ·")}{item.content ?? t("Không có nội dung")}</p>) : <p>{t("Chưa có đánh giá.")}</p>}<h3>{t("Sản phẩm yêu thích")}</h3>{detail.data.wishlist.length ? detail.data.wishlist.map((item) => <p key={item.id}>{item.name}</p>) : <p>{t("Chưa có sản phẩm yêu thích.")}</p>}<h3>{t("Giỏ hàng")}</h3>{detail.data.cart.items.length ? <><p>{detail.data.cart.item_count} {t("sản phẩm ·")}{money(detail.data.cart.total_value)}</p>{detail.data.cart.items.map((item) => <p key={item.id}>{item.product_name ?? t("Sản phẩm đã gỡ")} · {item.sku ?? "—"} · {[item.color, item.size].filter(Boolean).join(" / ") || t("Không có biến thể")} {t("· SL")}{item.quantity} · {money(item.unit_price_snapshot)}</p>)}</> : <p>{t("Giỏ hàng đang trống.")}</p>}<h3>{t("Ghi chú nội bộ")}</h3>{detail.data.notes.map((note) => <article className="customer-note" key={note.id}><p>{note.content}</p><small>{note.actor_name ?? t("Tài khoản đã xóa")} · {formatDateTime(note.created_at)}</small></article>)}{canManage && <form className="customer-note-form" onSubmit={(event) => { event.preventDefault(); addNote.mutate() }}><FormField id="customer-note" label={t("Ghi chú")} required><textarea required minLength={3} maxLength={2000} rows={3} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} /></FormField>{addNote.error && <p role="alert" className="reference-error">{addNote.error.message}</p>}<button className="primary" disabled={addNote.isPending || noteDraft.trim().length < 3}>{addNote.isPending ? t("Đang lưu...") : t("Thêm ghi chú")}</button></form>}</>}</section>}
    {editOpen && <form className="panel reference-form" onSubmit={form.handleSubmit((values) => save.mutate(values))}><div className="panel-heading"><h3>{t("Chỉnh sửa khách hàng")}</h3><button type="button" className="secondary" onClick={closeEdit}>{t("Đóng")}</button></div><div className="reference-form-grid"><FormField id="customer-name" label={t("Tên")} required error={form.formState.errors.name?.message}><input {...form.register('name')} /></FormField><FormField id="customer-email" label={t("Email")} required error={form.formState.errors.email?.message}><input type="email" {...form.register('email')} /></FormField><FormField id="customer-phone" label={t("SĐT")} error={form.formState.errors.phone?.message}><input {...form.register('phone')} /></FormField><FormField id="customer-gender" label={t("Giới tính")} error={form.formState.errors.gender?.message}><select {...form.register('gender')}><option value="">{t("Chưa chọn")}</option><option value="male">{t("Nam")}</option><option value="female">{t("Nữ")}</option><option value="other">{t("Khác")}</option></select></FormField><FormField id="customer-birthday" label={t("Ngày sinh")} error={form.formState.errors.birthday?.message}><input type="date" {...form.register('birthday')} /></FormField><FormField id="customer-status" label={t("Trạng thái")} required error={form.formState.errors.status?.message}><select {...form.register('status')}><option value="active">{t("Hoạt động")}</option><option value="blocked">{t("Khóa tài khoản")}</option></select></FormField></div>{save.error && <p role="alert" className="reference-error">{save.error.message}</p>}<div className="reference-form-actions"><button type="button" className="secondary" onClick={closeEdit}>{t("Hủy")}</button><button className="primary" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t("Đang lưu...") : t("Lưu")}</button></div></form>}
  </div>
}
