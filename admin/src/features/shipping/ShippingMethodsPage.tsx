import { adminApiFetch } from '../../lib/admin-api'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { FormField } from '../../components/shared/form-field'
import { MoneyInput } from '../../components/shared/money'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { useListUrlState } from '../../lib/use-list-url-state'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { formatVnd } from '../../lib/date-format'
import '../../ReferenceData.css'
import { ShippingRatesPanel } from './ShippingRatesPanel'

type Item = { id: number; name: string; fee: number; est_days: string | null; province_code: string | null; ward_codes: string[] | null; is_active: boolean; orders_count: number }
type Result = { data: Item[]; meta: { current_page: number; last_page: number; total: number } }
type LocationOption = { code: string; name: string }
const schema = (t: (key: string) => string) => z.object({ name: z.string().trim().min(1, t('Nhập tên phương thức.')), fee: z.string().trim().min(1, t('Nhập phí vận chuyển.')).regex(/^\d+$/, t('Phí vận chuyển phải là số nguyên không âm.')), est_days: z.string(), province_code: z.string(), ward_codes: z.array(z.string()), is_active: z.boolean() })
type Form = z.infer<ReturnType<typeof schema>>
type Props = { apiUrl: string; accessToken: string; canManage: boolean }
async function request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const data = await response.json() as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(data, response.status, 'Không thể xử lý yêu cầu.')
  return data
}

export function ShippingMethodsPage({ apiUrl, accessToken, canManage }: Props) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const pageSize = useAdminPageSize()
  const { state: urlState, queryState, setValue: setUrlValue, clearFilters } = useListUrlState('shipping_methods', { q: '', sort: 'name', page: '1' })
  const q = urlState.q
  const queryQ = queryState.q
  const page = Math.max(1, Number.parseInt(urlState.page, 10) || 1)
  const sort = urlState.sort || 'name'
  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc'
  const [editing, setEditing] = useState<Item | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Item | null>(null)
  const [notice, setNotice] = useState('')
  const form = useForm<Form>({ resolver: zodResolver(schema(t)), defaultValues: { name: '', fee: '0', est_days: '', province_code: '', ward_codes: [], is_active: true } })
  const selectedProvinceCode = form.watch('province_code')
  const confirmDiscard = useUnsavedFormGuard(open && form.formState.isDirty)
  const list = useQuery({ queryKey: ['admin', 'shipping-methods', queryQ, sort, page, pageSize], queryFn: () => request<Result>(`${apiUrl}/admin/shipping-methods?${new URLSearchParams({ q: queryQ, page: String(page), per_page: String(pageSize), sort })}`, accessToken), enabled: Boolean(accessToken) })
  const provinces = useQuery({ queryKey: ['admin', 'shipping-methods', 'province-options'], queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/locations/provinces`, { headers: { Accept: 'application/json' } })
    const body = await response.json() as { data?: LocationOption[]; message?: string }
    if (!response.ok) throw new Error(body.message ?? t('Không tải được danh sách tỉnh/thành.'))
    return body.data ?? []
  }, enabled: Boolean(accessToken), staleTime: 86_400_000 })
  const wards = useQuery({ queryKey: ['admin', 'shipping-methods', 'ward-options', selectedProvinceCode], queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/locations/provinces/${encodeURIComponent(selectedProvinceCode)}/wards`, { headers: { Accept: 'application/json' } })
    const body = await response.json() as { data?: LocationOption[]; message?: string }
    if (!response.ok) throw new Error(body.message ?? t('Không tải được danh sách phường/xã.'))
    return body.data ?? []
  }, enabled: Boolean(accessToken && selectedProvinceCode), staleTime: 86_400_000 })
  const save = useMutation({ mutationFn: (values: Form) => {
    const fee = Number(values.fee)
    if (!Number.isInteger(fee) || fee < 0) throw new Error(t("Phí vận chuyển phải là số nguyên không âm."))
    return request(`${apiUrl}/admin/shipping-methods${editing ? `/${editing.id}` : ''}`, accessToken, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ name: values.name, fee, est_days: values.est_days || null, province_code: values.province_code || null, ward_codes: values.province_code && values.ward_codes.length ? values.ward_codes : null, is_active: values.is_active }) })
  }, onError: (error) => { applyServerValidationErrors(form, error) }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'shipping-methods'] }); setOpen(false); setNotice(t("Đã lưu phương thức vận chuyển.")) } })
  const remove = useMutation({ mutationFn: (item: Item) => request(`${apiUrl}/admin/shipping-methods/${item.id}`, accessToken, { method: 'DELETE' }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'shipping-methods'] }); setDeleting(null); setNotice(t("Đã xóa phương thức vận chuyển.")) } })
  const openForm = (item?: Item) => { setEditing(item ?? null); form.reset(item ? { name: item.name, fee: String(item.fee), est_days: item.est_days ?? '', province_code: item.province_code ?? '', ward_codes: item.ward_codes ?? [], is_active: item.is_active } : { name: '', fee: '0', est_days: '', province_code: '', ward_codes: [], is_active: true }); save.reset(); setOpen(true) }
  const columns: DataTableColumn<Item>[] = [
    { id: 'name', header: t("PHƯƠNG THỨC"), sortable: true, cell: (item) => <strong>{item.name}</strong> },
    { id: 'fee', header: t('PHÍ'), sortable: true, cell: (item) => formatVnd(item.fee) },
    { id: 'days', header: t("THỜI GIAN DỰ KIẾN"), sortKey: 'est_days', sortable: true, cell: (item) => item.est_days ?? '—' },
    { id: 'area', header: t('KHU VỰC'), cell: (item) => item.province_code ? `${provinces.data?.find((province) => province.code === item.province_code)?.name ?? item.province_code}${item.ward_codes?.length ? ` · ${t('{{count}} phường/xã', { count: item.ward_codes.length })}` : ''}` : t('Toàn quốc') },
    { id: 'orders', header: t("ĐƠN ĐÃ DÙNG"), sortKey: 'orders_count', sortable: true, cell: (item) => item.orders_count },
    { id: 'active', header: t("TRẠNG THÁI"), sortKey: 'is_active', sortable: true, cell: (item) => item.is_active ? t("Đang bật") : t("Đã tắt") },
    ...(canManage ? [{ id: 'actions', header: t('THAO TÁC'), cell: (item: Item) => <RowActionsMenu label={t('Thao tác phương thức {{name}}', { name: item.name })} actions={[{ id: 'edit', label: t('Sửa'), onSelect: () => openForm(item) }, ...(item.orders_count === 0 ? [{ id: 'delete', label: t('Xóa'), onSelect: () => setDeleting(item), destructive: true }] : [])]} /> }] : []),
  ]
  return <section className="panel reference-page"><div className="panel-heading"><div><h2>{t('Phương thức vận chuyển')}</h2><p>{t('Phí và thời gian dự kiến của các lựa chọn giao hàng.')}</p></div>{canManage && <button className="primary" onClick={() => openForm()}>{t('Thêm phương thức')}</button>}</div>{notice && <p className="reference-notice" role="status">{t(notice)}</p>}
      <FilterBar hasFilters={Boolean(q)} onClear={() => clearFilters(['q'])} activeFilters={q ? [{ id: 'q', label: t('Tìm: {{query}}', { query: q }), onRemove: () => setUrlValue('q', '') }] : []}><input aria-label={t('Tìm phương thức vận chuyển')} placeholder={t('Tìm phương thức...')} value={q} onChange={(event) => setUrlValue('q', event.target.value)} /></FilterBar>
     
      <DataTable columns={columns} rows={list.data?.data ?? []} rowKey={(item) => item.id} loading={list.isLoading} error={list.error instanceof Error ? t(list.error.message) : null} onRetry={() => void list.refetch()} noResults={Boolean(q)} emptyTitle={t('Chưa có phương thức vận chuyển')} emptyDescription={t('Thêm phương thức để hiển thị lựa chọn giao hàng.')} page={list.data?.meta.current_page ?? page} pageCount={list.data?.meta.last_page ?? 1} totalRows={list.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUrlValue('page', String(nextPage))} sortBy={sortBy} sortDirection={sortDirection} onSortChange={(key, direction) => setUrlValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${key}` : key)} />
     {open && <form className="reference-form" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
       <h3>{editing ? t('Sửa') : t('Thêm')} {t('phương thức vận chuyển')}</h3>
       <div className="reference-form-grid">
         <FormField id="shipping-name" label={t('Tên')} required error={t(form.formState.errors.name?.message ?? '')}><input {...form.register('name')} /></FormField>
         <MoneyInput label={t('Phí (VND)')} error={t(form.formState.errors.fee?.message ?? '')} required {...form.register('fee')} />
         <FormField id="shipping-est-days" label={t('Thời gian dự kiến')} error={t(form.formState.errors.est_days?.message ?? '')}><input placeholder={t('2–4 ngày')} {...form.register('est_days')} /></FormField>
         <FormField id="shipping-province-code" label={t('Tỉnh/thành áp dụng')} error={t(form.formState.errors.province_code?.message ?? '')}>
           <select {...form.register('province_code', { onChange: () => form.setValue('ward_codes', [], { shouldDirty: true }) })}>
             <option value="">{t('Toàn quốc')}</option>
             {(provinces.data ?? []).map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
           </select>
           {provinces.isError && <small role="alert">{t('Không tải được tỉnh/thành. Hãy thử tải lại trang.')}</small>}
         </FormField>
         <FormField id="shipping-ward-codes" label={t('Giới hạn phường/xã (không bắt buộc)')} error={t(form.formState.errors.ward_codes?.message ?? '')}>
           <select multiple size={5} disabled={!selectedProvinceCode || wards.isPending || wards.isError} aria-describedby="shipping-ward-codes-help" {...form.register('ward_codes')}>
             {(wards.data ?? []).map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
           </select>
           <small id="shipping-ward-codes-help">{!selectedProvinceCode ? t('Chọn tỉnh/thành trước. Để trống khu vực áp dụng thì phương thức dùng mức tỉnh/thành.') : wards.isPending ? t('Đang tải phường/xã…') : wards.isError ? t('Không tải được phường/xã. Hãy thử tải lại trang.') : t('Chọn một hoặc nhiều phường/xã để giới hạn giao hàng; để trống áp dụng toàn tỉnh/thành.')}</small>
         </FormField>
         <label className="reference-checkbox"><input type="checkbox" {...form.register('is_active')} /> {t('Đang bật')}{form.formState.errors.is_active && <small role="alert">{t(form.formState.errors.is_active.message ?? '')}</small>}</label>
       </div>
       {save.error && <p role="alert" className="reference-error">{t(save.error.message)}</p>}
       <div className="reference-form-actions"><button type="button" className="secondary" onClick={() => { if (confirmDiscard()) setOpen(false) }}>{t('Hủy')}</button><button className="primary" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t('Đang lưu...') : t('Lưu')}</button></div>
     </form>}
      <ConfirmDialog open={deleting !== null} title={t('Xóa phương thức vận chuyển?')} description={remove.error instanceof Error ? t(remove.error.message) : t('Phương thức chưa có đơn sẽ được xóa.')} confirmLabel={t('Xóa')} busy={remove.isPending} onConfirm={() => { if (deleting) remove.mutate(deleting) }} onOpenChange={(next) => { if (!next) { setDeleting(null); remove.reset() } }} />
      <ShippingRatesPanel apiUrl={apiUrl} accessToken={accessToken} canManage={canManage} />
  </section>
}
