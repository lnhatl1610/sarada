import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { FormField } from '../../components/shared/form-field'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import type { components } from '../../types/api'
import './CareerOpeningsPage.css'

type Opening = components['schemas']['CareerOpening']
type Values = components['schemas']['CareerOpeningInput']
type FormValues = { title: string; department: string; location: string; employment_type: 'full_time' | 'part_time'; summary: string; description: string; requirements: string; benefits: string; is_active: boolean; sort_order: string }
type ListResponse = components['schemas']['CareerOpeningAdminList']
const blank: FormValues = { title: '', department: '', location: '', employment_type: 'full_time', summary: '', description: '', requirements: '', benefits: '', is_active: false, sort_order: '0' }

async function request<T>(url: string, token: string, fallback: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json().catch(() => ({})) as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, fallback)
  return body
}

export function CareerOpeningsPage({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [editing, setEditing] = useState<Opening | null>(null)
  const [deleting, setDeleting] = useState<Opening | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')
  const schema = useMemo(() => z.object({
    title: z.string().trim().min(2, t('tiêu đề cần ít nhất 2 ký tự.')).max(180),
    department: z.string().trim().min(2, t('vui lòng nhập phòng ban.')).max(120),
    location: z.string().trim().min(2, t('vui lòng nhập địa điểm.')).max(150),
    employment_type: z.enum(['full_time', 'part_time']),
    summary: z.string().trim().max(800),
    description: z.string().trim().min(10, t('mô tả cần ít nhất 10 ký tự.')).max(20000),
    requirements: z.string().trim().max(10000),
    benefits: z.string().trim().max(10000),
    is_active: z.boolean(),
    sort_order: z.string().trim().min(1).transform(Number).pipe(z.number().int().min(0).max(65535)),
  }).transform(({ summary, requirements, benefits, ...values }) => ({ ...values, summary: summary || null, requirements: requirements || null, benefits: benefits || null })), [t])
  const form = useForm<FormValues, unknown, Values>({ resolver: zodResolver(schema), defaultValues: blank })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)
  const query = useQuery({
    queryKey: ['admin', 'career-openings', search, status, page],
    queryFn: () => request<ListResponse>(`${apiUrl}/admin/career-openings?per_page=20&page=${page}&q=${encodeURIComponent(search)}${status ? `&status=${status}` : ''}`, accessToken, t('không tải được danh sách.')),
    enabled: Boolean(accessToken),
  })
  const lastPage = query.data?.meta.last_page ?? 1
  const save = useMutation({
    mutationFn: (values: Values) => request(`${apiUrl}/admin/career-openings${editing ? `/${editing.id}` : ''}`, accessToken, t('không lưu được vị trí.'), { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values) }),
    onError: (error) => { if (!applyServerValidationErrors(form, error)) setNotice(error instanceof Error ? error.message : t('không lưu được vị trí.')) },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin', 'career-openings'] }); await client.invalidateQueries({ queryKey: ['storefront', 'career-openings'] }); setNotice(t('đã lưu vị trí.')); reset(true) },
  })
  const remove = useMutation({
    mutationFn: (opening: Opening) => request(`${apiUrl}/admin/career-openings/${opening.id}`, accessToken, t('không xóa được vị trí.'), { method: 'DELETE' }),
    onError: (error) => setNotice(error instanceof Error ? error.message : t('không xóa được vị trí.')),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin', 'career-openings'] }); await client.invalidateQueries({ queryKey: ['storefront', 'career-openings'] }); setDeleting(null); setNotice(t('đã xóa vị trí.')) },
  })

  function reset(force = false) {
    if (!force && !confirmDiscard()) return
    setEditing(null)
    form.reset(blank)
  }

  function edit(opening: Opening) {
    if (!confirmDiscard()) return
    setEditing(opening)
    form.reset({ title: opening.title, department: opening.department, location: opening.location, employment_type: opening.employment_type, summary: opening.summary ?? '', description: opening.description, requirements: opening.requirements ?? '', benefits: opening.benefits ?? '', is_active: opening.is_active, sort_order: String(opening.sort_order) })
    setNotice('')
    document.getElementById('career-opening-title')?.focus()
  }

  return <div className="admin-career-openings">
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    <section className="panel" aria-labelledby="career-opening-editor-title">
      <div className="panel-heading"><div><h2 id="career-opening-editor-title">{editing ? t('sửa vị trí') : t('thêm vị trí')}</h2><p>{t('vị trí chỉ xuất hiện trên Storefront khi được bật công khai.')}</p></div><button className="secondary" type="button" onClick={() => reset()}>{t('làm mới biểu mẫu')}</button></div>
      <form noValidate onSubmit={form.handleSubmit((values) => { setNotice(''); save.mutate(values) })}>
        <div className="admin-career-opening-grid">
          <FormField label={t('chức danh')} required error={form.formState.errors.title?.message}><input id="career-opening-title" maxLength={180} {...form.register('title')} /></FormField>
          <FormField label={t('phòng ban')} required error={form.formState.errors.department?.message}><input maxLength={120} {...form.register('department')} /></FormField>
          <FormField label={t('địa điểm')} required error={form.formState.errors.location?.message}><input maxLength={150} {...form.register('location')} /></FormField>
          <FormField label={t('hình thức')} required><select {...form.register('employment_type')}><option value="full_time">{t('toàn thời gian')}</option><option value="part_time">{t('bán thời gian')}</option></select></FormField>
          <FormField label={t('giới thiệu ngắn')} hint={t('nội dung tóm tắt tùy chọn, tối đa 800 ký tự.')} className="admin-career-opening-wide" error={form.formState.errors.summary?.message}><textarea rows={2} maxLength={800} {...form.register('summary')} /></FormField>
          <FormField label={t('mô tả công việc')} required className="admin-career-opening-wide" error={form.formState.errors.description?.message}><textarea rows={5} maxLength={20000} {...form.register('description')} /></FormField>
          <FormField label={t('yêu cầu')} className="admin-career-opening-wide" error={form.formState.errors.requirements?.message}><textarea rows={4} maxLength={10000} {...form.register('requirements')} /></FormField>
          <FormField label={t('quyền lợi')} className="admin-career-opening-wide" error={form.formState.errors.benefits?.message}><textarea rows={4} maxLength={10000} {...form.register('benefits')} /></FormField>
          <FormField label={t('thứ tự hiển thị')}><input type="number" min={0} max={65535} {...form.register('sort_order')} /></FormField>
        </div>
        <label className="admin-career-opening-publish"><input type="checkbox" {...form.register('is_active')} /> {t('công khai vị trí')}</label>
        <div className="admin-career-opening-actions"><button className="primary" type="submit" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t('đang lưu…') : editing ? t('lưu thay đổi') : t('tạo vị trí')}</button>{editing && <button className="secondary" type="button" onClick={() => reset()}>{t('hủy sửa')}</button>}</div>
      </form>
    </section>
    <section className="panel" aria-labelledby="career-opening-list-title">
      <div className="panel-heading"><div><h2 id="career-opening-list-title">{t('danh sách vị trí')}</h2><p>{query.data?.meta.total ?? 0} {t('vị trí')}</p></div><div className="admin-career-opening-filters"><input aria-label={t('tìm vị trí')} placeholder={t('tìm chức danh, phòng ban, địa điểm')} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /><select aria-label={t('lọc trạng thái')} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">{t('mọi trạng thái')}</option><option value="published">{t('đang công khai')}</option><option value="draft">{t('bản nháp')}</option></select></div></div>
      {query.isPending ? <p role="status">{t('đang tải…')}</p> : query.isError ? <p role="alert">{query.error instanceof Error ? query.error.message : t('không tải được danh sách.')} <button type="button" onClick={() => void query.refetch()}>{t('thử lại')}</button></p> : query.data?.data.length ? <div className="admin-career-opening-list">
        {query.data.data.map((opening) => <article key={opening.id} className="admin-career-opening-row"><div><div className="admin-career-opening-row-heading"><span>{opening.department} · {opening.location} · {opening.employment_type === 'full_time' ? t('toàn thời gian') : t('bán thời gian')}</span><span className={`status-badge ${opening.is_active ? 'status-badge-success' : 'status-badge-neutral'}`}>{opening.is_active ? t('đang công khai') : t('bản nháp')}</span></div><h3>{opening.title}</h3><p>{opening.summary || opening.description}</p></div><div className="admin-career-opening-actions"><button className="secondary" type="button" onClick={() => edit(opening)}>{t('sửa')}</button><button className="secondary destructive" type="button" onClick={() => setDeleting(opening)}>{t('xóa')}</button></div></article>)}
      </div> : <p>{t('chưa có vị trí phù hợp.')}</p>}
      {query.data && lastPage > 1 && <nav className="admin-career-opening-pagination" aria-label={t('phân trang')}><button className="secondary" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('trang trước')}</button><span>{t('trang {{page}} / {{lastPage}}', { page, lastPage })}</span><button className="secondary" type="button" disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>{t('trang sau')}</button></nav>}
    </section>
    <ConfirmDialog open={Boolean(deleting)} title={t('xóa vị trí?')} description={deleting ? t('“{{title}}” sẽ bị xóa.', { title: deleting.title }) : ''} confirmLabel={t('xóa')} busy={remove.isPending} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null) }} onConfirm={() => { if (deleting) remove.mutate(deleting) }} />
  </div>
}
