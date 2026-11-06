import { useState } from 'react'
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
import './FaqsPage.css'

type Faq = components['schemas']['Faq']
type Values = components['schemas']['FaqInput']
type FormValues = { category: string; question: string; answer: string; category_order: string; sort_order: string; is_active: boolean }
type ListResponse = components['schemas']['FaqListEnvelope']
const blank: FormValues = { category: '', question: '', answer: '', category_order: '0', sort_order: '0', is_active: false }

async function request<T>(url: string, token: string, fallback: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json().catch(() => ({})) as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, fallback)
  return body
}

export function FaqsPage({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Faq | null>(null)
  const [deleting, setDeleting] = useState<Faq | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')
  const form = useForm<FormValues, unknown, Values>({
    defaultValues: blank,
    resolver: zodResolver(z.object({
      category: z.string().trim().min(2, t('FAQ: nhập tên nhóm từ 2 ký tự.')).max(120),
      question: z.string().trim().min(5, t('FAQ: câu hỏi cần ít nhất 5 ký tự.')).max(255),
      answer: z.string().trim().min(2, t('FAQ: nhập câu trả lời.')).max(12000),
      category_order: z.string().transform(Number).pipe(z.number().int().min(0).max(65535)),
      sort_order: z.string().transform(Number).pipe(z.number().int().min(0).max(65535)),
      is_active: z.boolean(),
    })),
  })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)
  const query = useQuery({
    queryKey: ['admin', 'faqs', search, status, page],
    queryFn: () => request<ListResponse>(`${apiUrl}/admin/faqs?per_page=20&page=${page}&q=${encodeURIComponent(search)}${status ? `&status=${status}` : ''}`, accessToken, t('FAQ: không tải được danh sách.')),
    enabled: Boolean(accessToken),
  })
  const save = useMutation({
    mutationFn: (values: Values) => request(`${apiUrl}/admin/faqs${editing ? `/${editing.id}` : ''}`, accessToken, t('FAQ: không lưu được mục.'), { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values) }),
    onError: (error) => { if (!applyServerValidationErrors(form, error)) setNotice(error instanceof Error ? error.message : t('FAQ: không lưu được mục.')) },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] }); await queryClient.invalidateQueries({ queryKey: ['storefront', 'faqs'] }); setNotice(t('FAQ: đã lưu mục.')); reset(true) },
  })
  const remove = useMutation({
    mutationFn: (faq: Faq) => request(`${apiUrl}/admin/faqs/${faq.id}`, accessToken, t('FAQ: không xóa được mục.'), { method: 'DELETE' }),
    onError: (error) => setNotice(error instanceof Error ? error.message : t('FAQ: không xóa được mục.')),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] }); await queryClient.invalidateQueries({ queryKey: ['storefront', 'faqs'] }); setDeleting(null); setNotice(t('FAQ: đã xóa mục.')) },
  })

  function reset(force = false) {
    if (!force && !confirmDiscard()) return
    setEditing(null)
    form.reset(blank)
  }
  function edit(faq: Faq) {
    if (!confirmDiscard()) return
    setEditing(faq)
    form.reset({ ...faq, category_order: String(faq.category_order), sort_order: String(faq.sort_order) })
    setNotice('')
    document.getElementById('faq-question')?.focus()
  }

  return <div className="admin-faqs">
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    <section className="panel" aria-labelledby="faq-editor-title">
      <div className="panel-heading"><div><h2 id="faq-editor-title">{editing ? t('FAQ: sửa mục') : t('FAQ: thêm mục')}</h2><p>{t('FAQ: nội dung chỉ hiển thị công khai khi được xuất bản.')}</p></div><button className="secondary" type="button" onClick={() => reset()}>{t('FAQ: làm mới biểu mẫu')}</button></div>
      <form noValidate onSubmit={form.handleSubmit((values) => { setNotice(''); save.mutate(values) })}>
        <div className="admin-faq-grid">
          <FormField label={t('FAQ: nhóm')} required error={form.formState.errors.category?.message}><input maxLength={120} {...form.register('category')} /></FormField>
          <FormField label={t('FAQ: thứ tự nhóm')}><input type="number" min={0} max={65535} {...form.register('category_order')} /></FormField>
          <FormField label={t('FAQ: câu hỏi')} required className="admin-faq-wide" error={form.formState.errors.question?.message}><input id="faq-question" maxLength={255} {...form.register('question')} /></FormField>
          <FormField label={t('FAQ: câu trả lời')} required className="admin-faq-wide" error={form.formState.errors.answer?.message}><textarea rows={5} maxLength={12000} {...form.register('answer')} /></FormField>
          <FormField label={t('FAQ: thứ tự trong nhóm')}><input type="number" min={0} max={65535} {...form.register('sort_order')} /></FormField>
        </div>
        <label className="admin-faq-publish"><input type="checkbox" {...form.register('is_active')} /> {t('FAQ: xuất bản mục')}</label>
        <div className="admin-faq-actions"><button className="primary" type="submit" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t('FAQ: đang lưu…') : editing ? t('FAQ: lưu thay đổi') : t('FAQ: tạo mục')}</button>{editing && <button className="secondary" type="button" onClick={() => reset()}>{t('FAQ: hủy sửa')}</button>}</div>
      </form>
    </section>
    <section className="panel" aria-labelledby="faq-list-title">
      <div className="panel-heading"><div><h2 id="faq-list-title">{t('FAQ: danh sách câu hỏi')}</h2><p>{query.data?.meta.total ?? 0} {t('FAQ: mục')}</p></div><div className="admin-faq-filters"><input aria-label={t('FAQ: tìm câu hỏi')} placeholder={t('FAQ: tìm nhóm, câu hỏi hoặc câu trả lời')} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /><select aria-label={t('FAQ: lọc trạng thái')} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">{t('FAQ: mọi trạng thái')}</option><option value="published">{t('FAQ: đã xuất bản')}</option><option value="draft">{t('FAQ: bản nháp')}</option></select></div></div>
      {query.isPending ? <p role="status">{t('FAQ: đang tải…')}</p> : query.isError ? <p role="alert">{query.error instanceof Error ? query.error.message : t('FAQ: không tải được danh sách.')} <button type="button" onClick={() => void query.refetch()}>{t('FAQ: thử lại')}</button></p> : query.data?.data.length ? <div className="admin-faq-list">
        {query.data.data.map((faq) => <article key={faq.id} className="admin-faq-row"><div><div className="admin-faq-row-heading"><span>{faq.category}</span><span className={`status-badge ${faq.is_active ? 'status-badge-success' : 'status-badge-neutral'}`}>{faq.is_active ? t('FAQ: đã xuất bản') : t('FAQ: bản nháp')}</span></div><h3>{faq.question}</h3><p>{faq.answer}</p></div><div className="admin-faq-actions"><button className="secondary" type="button" onClick={() => edit(faq)}>{t('FAQ: sửa')}</button><button className="secondary destructive" type="button" onClick={() => setDeleting(faq)}>{t('FAQ: xóa')}</button></div></article>)}
      </div> : <p>{t('FAQ: chưa có mục nào phù hợp.')}</p>}
      {query.data && query.data.meta.last_page > 1 && <nav className="admin-faq-pagination" aria-label={t('FAQ: phân trang')}><button className="secondary" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t('FAQ: trang trước')}</button><span>{t('FAQ: trang {{page}} / {{lastPage}}', { page, lastPage: query.data.meta.last_page })}</span><button className="secondary" type="button" disabled={page >= query.data.meta.last_page} onClick={() => setPage((value) => value + 1)}>{t('FAQ: trang sau')}</button></nav>}
    </section>
    <ConfirmDialog open={Boolean(deleting)} title={t('FAQ: xóa mục?')} description={deleting ? t('FAQ: “{{question}}” sẽ bị xóa.', { question: deleting.question }) : ''} confirmLabel={t('FAQ: xóa')} busy={remove.isPending} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null) }} onConfirm={() => { if (deleting) remove.mutate(deleting) }} />
  </div>
}
