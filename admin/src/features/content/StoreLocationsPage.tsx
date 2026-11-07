import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'
import { createApiResponseError, applyServerValidationErrors } from '../../components/shared/api-validation'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { StoreLocationInventoryPanel } from './StoreLocationInventoryPanel'
import type { components } from '../../types/api'
import './StoreLocationsPage.css'

type Location = components['schemas']['StoreLocation']
type Values = components['schemas']['StoreLocationInput']
type OpeningSchedule = NonNullable<Values['opening_schedule']>
type FormValues = {
  name: string
  address: string
  province_code: string
  province_name: string
  ward_code: string
  ward_name: string
  phone: string
  email: string
  opening_hours: string
  opening_schedule: OpeningSchedule | null
  latitude: string
  longitude: string
  sort_order: string
  is_active: boolean
}
type ListResponse = components['schemas']['StoreLocationListEnvelope']
type ProvinceResponse = components['schemas']['LocationProvincesEnvelope']
type WardResponse = components['schemas']['LocationWardsEnvelope']

const blank: FormValues = { name: '', address: '', province_code: '', province_name: '', ward_code: '', ward_name: '', phone: '', email: '', opening_hours: '', opening_schedule: null, latitude: '', longitude: '', sort_order: '0', is_active: false }
const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

async function request<T>(url: string, token: string, fallback: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json().catch(() => ({})) as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, fallback)
  return body
}

export function StoreLocationsPage({ apiUrl, accessToken, permissions }: { apiUrl: string; accessToken: string; permissions: string[] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Location | null>(null)
  const [deleting, setDeleting] = useState<Location | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')
  const [stockLocation, setStockLocation] = useState<Location | null>(null)
  const schema = useMemo(() => z.object({
    name: z.string().trim().min(2, t('Tên cửa hàng cần ít nhất 2 ký tự.')).max(150),
    address: z.string().trim().min(5, t('Vui lòng nhập địa chỉ đầy đủ.')).max(500),
    province_code: z.string().min(1, t('Vui lòng chọn tỉnh/thành.')).max(32),
    province_name: z.string().min(1).max(150),
    ward_code: z.string().max(32),
    ward_name: z.string().max(150),
    phone: z.string().trim().min(8, t('Vui lòng nhập số điện thoại.')).max(32),
    email: z.union([z.literal(''), z.string().email(t('Email không hợp lệ.')).max(254)]),
    opening_hours: z.string().trim().min(3, t('Vui lòng nhập giờ mở cửa.')).max(2000),
    opening_schedule: z.array(z.object({
      day: z.number().int().min(0).max(6),
      opens_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, t('Nhập giờ theo định dạng HH:mm.')),
      closes_at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, t('Nhập giờ theo định dạng HH:mm.')),
    })).max(7).nullable().superRefine((schedule, context) => {
      if (!schedule) return
      const seenDays = new Set<number>()
      schedule.forEach((entry, index) => {
        if (seenDays.has(entry.day)) context.addIssue({ code: 'custom', message: t('Mỗi thứ chỉ được khai báo một lần.'), path: [index, 'day'] })
        seenDays.add(entry.day)
        if (entry.closes_at <= entry.opens_at) context.addIssue({ code: 'custom', message: t('Giờ đóng cửa phải sau giờ mở cửa.'), path: [] })
      })
    }),
    latitude: z.string().trim().min(1, t('Vui lòng nhập vĩ độ.')).transform(Number).pipe(z.number().min(-90).max(90)),
    longitude: z.string().trim().min(1, t('Vui lòng nhập kinh độ.')).transform(Number).pipe(z.number().min(-180).max(180)),
    sort_order: z.string().trim().min(1).transform(Number).pipe(z.number().int().min(0).max(65535)),
    is_active: z.boolean(),
  }), [t])
  const form = useForm<FormValues, unknown, Values>({ resolver: zodResolver(schema), defaultValues: blank })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)
  const formValues = useWatch({ control: form.control })
  const openingSchedule = (formValues.opening_schedule ?? null) as FormValues['opening_schedule']

  function toggleScheduleDay(day: number, open: boolean) {
    const current = form.getValues('opening_schedule') ?? []
    const next = open
      ? [...current, { day, opens_at: '09:00', closes_at: '21:00' }]
      : current.filter((entry) => entry.day !== day)
    form.setValue('opening_schedule', next.sort((a, b) => a.day - b.day), { shouldDirty: true, shouldValidate: true })
  }

  function updateScheduleTime(day: number, key: 'opens_at' | 'closes_at', value: string) {
    const current = form.getValues('opening_schedule') ?? []
    const next: OpeningSchedule = current.map((entry) => {
      if (entry.day !== day) return entry
      return key === 'opens_at' ? { ...entry, opens_at: value } : { ...entry, closes_at: value }
    })
    form.setValue('opening_schedule', next, { shouldDirty: true, shouldValidate: true })
  }
  const locations = useQuery({
    queryKey: ['admin', 'store-locations', search, page],
    queryFn: () => request<ListResponse>(`${apiUrl}/admin/stores?per_page=20&page=${page}&q=${encodeURIComponent(search)}`, accessToken, t('Không tải được danh sách cửa hàng.')),
    enabled: Boolean(accessToken),
  })
  const provinces = useQuery({
    queryKey: ['store-location-provinces'],
    queryFn: async () => (await request<ProvinceResponse>(`${apiUrl}/locations/provinces`, accessToken, t('Không tải được danh sách tỉnh/thành.'))).data,
    enabled: Boolean(accessToken),
    staleTime: 60 * 60 * 1000,
  })
  const wards = useQuery({
    queryKey: ['store-location-wards', formValues.province_code],
    queryFn: async () => (await request<WardResponse>(`${apiUrl}/locations/provinces/${encodeURIComponent(formValues.province_code ?? '')}/wards`, accessToken, t('Không tải được danh sách xã/phường.'))).data,
    enabled: Boolean(accessToken && formValues.province_code),
    staleTime: 60 * 60 * 1000,
  })
  const save = useMutation({
    mutationFn: (values: Values) => request(`${apiUrl}/admin/stores${editing ? `/${editing.id}` : ''}`, accessToken, t('Không lưu được cửa hàng.'), { method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ ...values, email: values.email || null, ward_code: values.ward_code || null }) }),
    onError: (error) => { if (!applyServerValidationErrors(form, error)) setNotice(error instanceof Error ? error.message : t('Không lưu được cửa hàng.')) },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin', 'store-locations'] }); await queryClient.invalidateQueries({ queryKey: ['storefront', 'store-locations'] }); setNotice(t('Đã lưu cửa hàng.')); reset(true) },
  })
  const remove = useMutation({
    mutationFn: (location: Location) => request(`${apiUrl}/admin/stores/${location.id}`, accessToken, t('Không xóa được cửa hàng.'), { method: 'DELETE' }),
    onError: (error) => setNotice(error instanceof Error ? error.message : t('Không xóa được cửa hàng.')),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin', 'store-locations'] }); await queryClient.invalidateQueries({ queryKey: ['storefront', 'store-locations'] }); setDeleting(null); setNotice(t('Đã xóa cửa hàng.')) },
  })

  function reset(force = false) {
    if (!force && !confirmDiscard()) return
    setEditing(null)
    form.reset(blank)
  }
  function edit(location: Location) {
    if (!confirmDiscard()) return
    setEditing(location)
    form.reset({ ...location, email: location.email ?? '', ward_code: location.ward_code ?? '', ward_name: location.ward_name ?? '', opening_schedule: location.opening_schedule ?? null, latitude: String(location.latitude), longitude: String(location.longitude), sort_order: String(location.sort_order) })
    setNotice('')
    document.getElementById('store-location-name')?.focus()
  }

  return <div className="admin-store-locations">
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    <section className="panel" aria-labelledby="store-location-editor-title">
      <div className="panel-heading"><div><h2 id="store-location-editor-title">{editing ? t('Sửa cửa hàng: {{name}}', { name: editing.name }) : t('Thêm cửa hàng')}</h2><p>{t('Chỉ cửa hàng đang hoạt động mới xuất hiện trên Storefront.')}</p></div><button className="secondary" type="button" onClick={() => reset()}>{t('Làm mới biểu mẫu')}</button></div>
      <form noValidate onSubmit={form.handleSubmit((values) => { setNotice(''); save.mutate(values) })}>
        <div className="admin-store-location-grid">
          <FormField label={t('Tên cửa hàng')} required error={form.formState.errors.name?.message}><input id="store-location-name" maxLength={150} {...form.register('name')} /></FormField>
          <FormField label={t('Điện thoại')} required error={form.formState.errors.phone?.message}><input type="tel" maxLength={32} {...form.register('phone')} /></FormField>
          <FormField label={t('Email')} error={form.formState.errors.email?.message}><input type="email" maxLength={254} {...form.register('email')} /></FormField>
          <FormField label={t('Tỉnh/thành')} required error={form.formState.errors.province_code?.message}>
            <select value={formValues.province_code} disabled={provinces.isPending || provinces.isError} onChange={(event) => { const selected = provinces.data?.find((province) => province.code === event.target.value); form.setValue('province_code', selected?.code ?? '', { shouldDirty: true, shouldValidate: true }); form.setValue('province_name', selected?.name ?? '', { shouldDirty: true }); form.setValue('ward_code', '', { shouldDirty: true, shouldValidate: true }); form.setValue('ward_name', '', { shouldDirty: true }) }}>
              <option value="">{provinces.isPending ? t('Đang tải tỉnh/thành…') : t('Chọn tỉnh/thành')}</option>
              {provinces.data?.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
            </select>
            {provinces.isError && <small role="alert">{t('Không tải được danh sách tỉnh/thành.')} <button type="button" className="link-button" onClick={() => void provinces.refetch()}>{t('Thử lại')}</button></small>}
          </FormField>
          <FormField label={t('Xã/phường theo danh mục')} error={form.formState.errors.ward_code?.message}>
            <select value={formValues.ward_code} disabled={!formValues.province_code || wards.isPending || wards.isError} onChange={(event) => { const selected = wards.data?.find((ward) => ward.code === event.target.value); form.setValue('ward_code', selected?.code ?? '', { shouldDirty: true, shouldValidate: true }); form.setValue('ward_name', selected?.name ?? '', { shouldDirty: true }) }}>
              <option value="">{!formValues.province_code ? t('Chọn tỉnh/thành trước') : wards.isPending ? t('Đang tải xã/phường…') : t('Chọn xã/phường')}</option>
              {wards.data?.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
            </select>
            {wards.isError && <small role="alert">{t('Không tải được danh sách xã/phường.')} <button type="button" className="link-button" onClick={() => void wards.refetch()}>{t('Thử lại')}</button></small>}
          </FormField>
          {!formValues.ward_code && <FormField label={t('Tên xã/phường cũ (tùy chọn)')} hint={t('Dùng cho địa chỉ cũ chưa có mã trong danh mục.')}><input maxLength={150} {...form.register('ward_name')} /></FormField>}
          <FormField label={t('Thứ tự hiển thị')}><input type="number" min={0} max={65535} {...form.register('sort_order')} /></FormField>
          <FormField label={t('Địa chỉ đầy đủ')} required className="admin-store-location-wide" error={form.formState.errors.address?.message}><input maxLength={500} {...form.register('address')} /></FormField>
          <FormField label={t('Giờ mở cửa')} required hint={t('Ví dụ: Thứ 2–Chủ nhật, 09:00–21:00.')} className="admin-store-location-wide" error={form.formState.errors.opening_hours?.message}><textarea rows={3} maxLength={2000} {...form.register('opening_hours')} /></FormField>
          <fieldset className="admin-store-location-wide grid gap-3 border-b border-border py-3">
            <legend className="font-semibold">{t('Lịch mở cửa hàng tuần')}</legend>
            <p className="text-sm text-muted-foreground">{t('Tùy chọn. Khi có lịch, Storefront sẽ hiển thị cửa hàng đang mở hay đã đóng theo giờ Việt Nam.')}</p>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={openingSchedule !== null} onChange={(event) => form.setValue('opening_schedule', event.target.checked ? [] : null, { shouldDirty: true, shouldValidate: true })} /> {t('Dùng lịch tuần để hiển thị trạng thái')}</label>
            {openingSchedule !== null && <div className="grid gap-3 sm:grid-cols-2">
              {weekdays.map((weekday, day) => {
                const interval = openingSchedule.find((entry) => entry.day === day)
                return <div className="flex min-h-11 flex-wrap items-center gap-2" key={weekday}>
                  <label className="flex min-w-28 items-center gap-2"><input type="checkbox" checked={Boolean(interval)} onChange={(event) => toggleScheduleDay(day, event.target.checked)} /> {t(weekday)}</label>
                  {interval ? <>
                    <input aria-label={t('{{day}} mở cửa lúc', { day: t(weekday) })} type="time" value={interval.opens_at} onChange={(event) => updateScheduleTime(day, 'opens_at', event.target.value)} />
                    <span aria-hidden="true">–</span>
                    <input aria-label={t('{{day}} đóng cửa lúc', { day: t(weekday) })} type="time" value={interval.closes_at} onChange={(event) => updateScheduleTime(day, 'closes_at', event.target.value)} />
                  </> : <span className="text-sm text-muted-foreground">{t('Đóng cửa')}</span>}
                </div>
              })}
            </div>}
            {form.formState.errors.opening_schedule?.message && <p className="text-sm text-destructive" role="alert">{form.formState.errors.opening_schedule.message}</p>}
          </fieldset>
          <FormField label={t('Vĩ độ')} required error={form.formState.errors.latitude?.message}><input type="number" step="any" min={-90} max={90} {...form.register('latitude')} /></FormField>
          <FormField label={t('Kinh độ')} required error={form.formState.errors.longitude?.message}><input type="number" step="any" min={-180} max={180} {...form.register('longitude')} /></FormField>
        </div>
        <label className="admin-store-location-publish"><input type="checkbox" {...form.register('is_active')} /> {t('Xuất bản cửa hàng')}</label>
        <div className="admin-store-location-actions"><button className="primary" type="submit" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t('Đang lưu…') : editing ? t('Lưu thay đổi') : t('Tạo cửa hàng')}</button>{editing && <button className="secondary" type="button" onClick={() => reset()}>{t('Hủy sửa')}</button>}</div>
      </form>
    </section>
    <section className="panel" aria-labelledby="store-location-list-title">
      <div className="panel-heading"><div><h2 id="store-location-list-title">{t('Danh sách cửa hàng')}</h2><p>{locations.data?.meta.total ?? 0} {t('địa điểm')}</p></div><input aria-label={t('Tìm cửa hàng')} placeholder={t('Tìm tên, địa chỉ hoặc điện thoại')} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div>
      {locations.isLoading ? <p role="status">{t('Đang tải cửa hàng…')}</p> : locations.isError ? <p role="alert">{locations.error instanceof Error ? locations.error.message : t('Không tải được danh sách cửa hàng.')} <button type="button" onClick={() => void locations.refetch()}>{t('Thử lại')}</button></p> : locations.data?.data.length ? <div className="admin-store-location-list">
        {locations.data.data.map((location) => <article className="admin-store-location-row" key={location.id}>
          <div><div className="admin-store-location-row-title"><h3>{location.name}</h3><span className={`status-badge ${location.is_active ? 'status-badge-success' : 'status-badge-neutral'}`}>{location.is_active ? t('Đang xuất bản') : t('Bản nháp')}</span>{location.is_open_now !== null && <span className="status-badge status-badge-neutral">{location.is_open_now ? t('Đang mở') : t('Đã đóng cửa')}</span>}</div><p>{location.address}, {location.province_name}</p><small>{location.phone} · {location.opening_hours}</small></div>
          <div className="admin-store-location-actions"><button className="secondary" type="button" onClick={() => edit(location)}>{t('Sửa')}</button>{permissions.includes('inventory.view') && <button className="secondary" type="button" onClick={() => setStockLocation(location)}>{t('Tồn kho')}</button>}<button className="secondary destructive" type="button" onClick={() => setDeleting(location)}>{t('Xóa')}</button></div>
        </article>)}
      </div> : <p>{t('Chưa có cửa hàng. Tạo địa điểm đầu tiên để hiển thị trên Storefront.')}</p>}
      {locations.data && locations.data.meta.last_page > 1 && <nav className="admin-store-location-pagination" aria-label={t('Phân trang cửa hàng')}><button className="secondary" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('Trang trước')}</button><span>{t('Trang {{page}} / {{lastPage}}', { page, lastPage: locations.data.meta.last_page })}</span><button className="secondary" type="button" disabled={page >= locations.data.meta.last_page} onClick={() => setPage((value) => value + 1)}>{t('Trang sau')}</button></nav>}
    </section>
    {stockLocation && permissions.includes('inventory.view') && <><button className="link-button" type="button" onClick={() => setStockLocation(null)}>{t('Đóng quản lý tồn kho')}</button><StoreLocationInventoryPanel apiUrl={apiUrl} accessToken={accessToken} storeId={stockLocation.id} storeName={stockLocation.name} /></>}
    <ConfirmDialog open={Boolean(deleting)} title={t('Xóa cửa hàng?')} description={deleting ? t('“{{name}}” sẽ bị xóa khỏi danh sách cửa hàng.', { name: deleting.name }) : ''} confirmLabel={t('Xóa cửa hàng')} busy={remove.isPending} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null) }} onConfirm={() => { if (deleting) remove.mutate(deleting) }} />
  </div>
}
