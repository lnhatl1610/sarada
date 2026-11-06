import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { FormField } from '../../components/shared/form-field'
import { MoneyInput } from '../../components/shared/money'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { useListUrlState } from '../../lib/use-list-url-state'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { adminApiFetch } from '../../lib/admin-api'
import { formatVnd } from '../../lib/date-format'

type Rate = { id: number; province_code: string; province_name: string; fee: number; free_shipping_threshold: number | null; is_active: boolean }
type Result = { data: Rate[]; meta: { current_page: number; last_page: number; total: number }; message?: string }
type Props = { apiUrl: string; accessToken: string; canManage: boolean }
const schema = (t: (key: string) => string) => z.object({ province_code: z.string().trim().min(1, t('Nhập mã tỉnh/thành.')).max(32), province_name: z.string().trim().min(1, t('Nhập tên tỉnh/thành.')).max(120), fee: z.string().trim().min(1, t('Nhập phí giao hàng.')).regex(/^\d+$/, t('Phí giao hàng phải là số nguyên không âm.')), free_shipping_threshold: z.string(), is_active: z.boolean() })
type Form = z.infer<ReturnType<typeof schema>>
const money = (value: number | null, t: (key: string) => string) => value === null ? t('Dùng ngưỡng chung') : formatVnd(value)

export function ShippingRatesPanel({ apiUrl, accessToken, canManage }: Props) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const pageSize = useAdminPageSize()
  const { state, queryState, setValue, clearFilters } = useListUrlState('shipping_rates', { q: '', status: '', sort: 'province_name', page: '1' })
  const page = Math.max(1, Number.parseInt(state.page, 10) || 1)
  const sort = state.sort || 'province_name'
  const [editing, setEditing] = useState<Rate | null>(null)
  const [deleting, setDeleting] = useState<Rate | null>(null)
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const form = useForm<Form>({ resolver: zodResolver(schema(t)), defaultValues: { province_code: '', province_name: '', fee: '30000', free_shipping_threshold: '', is_active: true } })
  const confirmDiscard = useUnsavedFormGuard(open && form.formState.isDirty)
  const list = useQuery({ queryKey: ['admin', 'shipping-rates', queryState.q, state.status, sort, page, pageSize], queryFn: async () => {
    const params = new URLSearchParams({ q: queryState.q, sort, page: String(page), per_page: String(pageSize) })
    if (state.status) params.set('status', state.status)
    const response = await adminApiFetch(`${apiUrl}/admin/shipping-rates?${params}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json() as Result
    if (!response.ok) throw new Error(body.message ?? t("Không thể tải phí theo tỉnh/thành."))
    return body
  }, enabled: Boolean(accessToken) })
  const save = useMutation({ mutationFn: async (values: Form) => {
    const fee = Number(values.fee)
    const freeShippingThreshold = values.free_shipping_threshold.trim() ? Number(values.free_shipping_threshold) : null
    if (!Number.isSafeInteger(fee) || fee < 0 || (freeShippingThreshold !== null && (!Number.isSafeInteger(freeShippingThreshold) || freeShippingThreshold < 0))) throw new Error(t("Phí và ngưỡng miễn phí phải là số VND nguyên không âm."))
    const response = await adminApiFetch(`${apiUrl}/admin/shipping-rates${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ province_code: values.province_code.trim(), province_name: values.province_name.trim(), fee, free_shipping_threshold: freeShippingThreshold, is_active: values.is_active }) })
    const body = await response.json() as { message?: string; errors?: Record<string, string[]> }
    if (!response.ok) throw createApiResponseError(body, response.status, t("Không thể lưu mức phí tỉnh/thành."))
  }, onError: (error) => applyServerValidationErrors(form, error), onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'shipping-rates'] }); setOpen(false); setNotice(t("Đã lưu mức phí giao hàng theo tỉnh/thành.")) } })
  const remove = useMutation({ mutationFn: async (rate: Rate) => {
    const response = await adminApiFetch(`${apiUrl}/admin/shipping-rates/${rate.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json() as { message?: string }
    if (!response.ok) throw new Error(body.message ?? t("Không thể xóa mức phí tỉnh/thành."))
  }, onError: (error) => setNotice(error instanceof Error ? error.message : t("Không thể xóa mức phí tỉnh/thành.")), onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin', 'shipping-rates'] }); setDeleting(null); setNotice(t("Đã xóa mức phí tỉnh/thành. Đơn mới sẽ dùng mức phí chung.")) } })
  const openForm = (rate?: Rate) => {
    setEditing(rate ?? null)
    form.reset(rate ? { province_code: rate.province_code, province_name: rate.province_name, fee: String(rate.fee), free_shipping_threshold: rate.free_shipping_threshold === null ? '' : String(rate.free_shipping_threshold), is_active: rate.is_active } : { province_code: '', province_name: '', fee: '30000', free_shipping_threshold: '', is_active: true })
    save.reset()
    setOpen(true)
  }
  const columns: DataTableColumn<Rate>[] = [
    { id: 'province_name', header: t("TỈNH / THÀNH"), sortable: true, cell: (rate) => <strong>{rate.province_name}</strong> },
    { id: 'province_code', header: t("MÃ"), sortable: true, cell: (rate) => rate.province_code },
    { id: 'fee', header: t("PHÍ GIAO HÀNG"), sortable: true, cell: (rate) => money(rate.fee, t) },
    { id: 'threshold', header: t("MIỄN PHÍ TỪ"), sortable: true, sortKey: 'free_shipping_threshold', cell: (rate) => money(rate.free_shipping_threshold, t) },
    { id: 'status', header: t("TRẠNG THÁI"), sortable: true, sortKey: 'is_active', cell: (rate) => rate.is_active ? t("Đang bật") : t("Đã tắt") },
    ...(canManage ? [{ id: 'actions', header: t('THAO TÁC'), cell: (rate: Rate) => <RowActionsMenu label={t('Thao tác phí {{province}}', { province: rate.province_name })} actions={[{ id: 'edit', label: t('Sửa'), onSelect: () => openForm(rate) }, { id: 'delete', label: t('Xóa'), onSelect: () => setDeleting(rate), destructive: true }]} /> }] : []),
  ]
  return <section className="panel reference-page"><div className="panel-heading"><div><h3>{t('Phí giao hàng theo tỉnh/thành')}</h3><p>{t('Đơn mới dùng mức phí tỉnh/thành đang bật; nếu chưa có mức phí phù hợp, hệ thống dùng phí và ngưỡng miễn phí chung.')}</p></div>{canManage && <button className="primary" type="button" onClick={() => openForm()}>{t('Thêm tỉnh/thành')}</button>}</div>{notice && <p role="status" className="reference-notice">{t(notice)}</p>}
      <FilterBar hasFilters={Boolean(state.q || state.status)} onClear={() => clearFilters(['q', 'status'])} activeFilters={[...(state.q ? [{ id: 'q', label: t('Tìm: {{query}}', { query: state.q }), onRemove: () => setValue('q', '') }] : []), ...(state.status ? [{ id: 'status', label: state.status === 'active' ? t('Đang bật') : t('Đã tắt'), onRemove: () => setValue('status', '') }] : [])]}><input aria-label={t('Tìm tỉnh/thành')} placeholder={t('Tên hoặc mã tỉnh/thành')} value={state.q} onChange={(event) => setValue('q', event.target.value)} /><select aria-label={t('Trạng thái mức phí')} value={state.status} onChange={(event) => setValue('status', event.target.value)}><option value="">{t('Tất cả trạng thái')}</option><option value="active">{t('Đang bật')}</option><option value="inactive">{t('Đã tắt')}</option></select></FilterBar>
     
     <DataTable columns={columns} rows={list.data?.data ?? []} rowKey={(rate) => rate.id} loading={list.isLoading} error={list.error instanceof Error ? t(list.error.message) : null} onRetry={() => void list.refetch()} noResults={Boolean(state.q || state.status)} emptyTitle={t('Chưa cấu hình phí theo tỉnh/thành')} emptyDescription={t('Thêm tỉnh/thành để áp dụng mức phí giao hàng riêng.')} page={list.data?.meta.current_page ?? page} pageCount={list.data?.meta.last_page ?? 1} totalRows={list.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setValue('page', String(nextPage))} sortBy={sort.startsWith('-') ? sort.slice(1) : sort} sortDirection={sort.startsWith('-') ? 'desc' : 'asc'} onSortChange={(key, direction) => setValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${key}` : key)} />
     {open && <form className="reference-form" onSubmit={form.handleSubmit((values) => save.mutate(values))}><div className="panel-heading"><h4>{editing ? t('Sửa') : t('Thêm')} {t('mức phí tỉnh/thành')}</h4><button className="secondary" type="button" onClick={() => { if (confirmDiscard()) setOpen(false) }}>{t('Đóng')}</button></div><div className="reference-form-grid"><FormField id="shipping-rate-province-code" label={t('Mã tỉnh/thành')} required error={t(form.formState.errors.province_code?.message ?? '')}><input {...form.register('province_code')} maxLength={32} /></FormField><FormField id="shipping-rate-province-name" label={t('Tên tỉnh/thành')} required error={t(form.formState.errors.province_name?.message ?? '')}><input {...form.register('province_name')} maxLength={120} /></FormField><MoneyInput label={t('Phí giao hàng (VND)')} error={t(form.formState.errors.fee?.message ?? '')} required {...form.register('fee')} /><MoneyInput label={t('Miễn phí từ (VND, để trống dùng ngưỡng chung)')} error={t(form.formState.errors.free_shipping_threshold?.message ?? '')} {...form.register('free_shipping_threshold')} /><label className="reference-checkbox"><input type="checkbox" {...form.register('is_active')} /> {t('Đang áp dụng')}</label></div>{save.error && <p role="alert" className="reference-error">{t(save.error.message)}</p>}<div className="reference-form-actions"><button className="secondary" type="button" onClick={() => { if (confirmDiscard()) setOpen(false) }}>{t('Hủy')}</button><button className="primary" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t('Đang lưu…') : t('Lưu mức phí')}</button></div></form>}
    <ConfirmDialog open={Boolean(deleting)} title={t('Xóa phí tỉnh/thành?')} description={deleting ? t('Các đơn mới gửi tới {{province}} sẽ chuyển sang mức phí chung.', { province: deleting.province_name }) : ''} confirmLabel={t('Xóa mức phí')} busy={remove.isPending} onConfirm={() => { if (deleting) remove.mutate(deleting) }} onOpenChange={(next) => { if (!next && !remove.isPending) setDeleting(null) }} />
  </section>
}
