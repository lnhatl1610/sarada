import { lazy, Suspense, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { adminApiFetch } from '../../lib/admin-api'
import { ADMIN_STOREFRONT_URL } from '../../lib/storefront-base'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { FormField } from '../../components/shared/form-field'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { useListUrlState } from '../../lib/use-list-url-state'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { sanitizePageContent } from '../../lib/sanitize-page-content'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '../../lib/date-format'
import './ContentPages.css'

const RichTextField = lazy(() => import('../products/RichTextField').then((module) => ({ default: module.RichTextField })))
type Page = { id: number; title: string; slug: string; content: string; meta_title: string | null; meta_description: string | null; is_published: boolean; updated_at: string }
type PageResponse = { data: Page[]; meta: { current_page: number; last_page: number; per_page: number; total: number }; message?: string }
type Form = { title: string; slug: string; content: string; meta_title: string; meta_description: string; is_published: boolean }
const empty: Form = { title: '', slug: '', content: '', meta_title: '', meta_description: '', is_published: false }
const templates = [
  { key: 'returns', label: 'Mẫu: Chính sách đổi trả', title: 'Chính sách đổi trả', slug: 'chinh-sach-doi-tra', seo: 'Chính sách đổi trả', content: '<h2>Điều kiện đổi trả</h2><p>[Điền điều kiện, thời hạn và tình trạng sản phẩm được chấp nhận.]</p><h2>Quy trình</h2><ol><li>[Cách gửi yêu cầu]</li><li>[Thời gian xử lý]</li><li>[Phương thức hoàn tiền hoặc đổi hàng]</li></ol><p>[Thông tin liên hệ hỗ trợ]</p>' },
  { key: 'shipping', label: 'Mẫu: Vận chuyển', title: 'Vận chuyển', slug: 'van-chuyen', seo: 'Chính sách vận chuyển', content: '<h2>Thời gian xử lý</h2><p>[Điền thời gian chuẩn bị đơn hàng.]</p><h2>Phí và thời gian giao hàng</h2><p>[Điền phí giao hàng và thời gian dự kiến theo khu vực.]</p><h2>Theo dõi đơn hàng</h2><p>Thông tin vận chuyển được cập nhật sau khi đơn hàng bàn giao cho đơn vị vận chuyển.</p>' },
  { key: 'privacy', label: 'Mẫu: Bảo mật và quyền riêng tư', title: 'Bảo mật', slug: 'bao-mat', seo: 'Chính sách bảo mật', content: '<h2>Thông tin được thu thập</h2><p>[Mô tả thông tin cần thiết khi khách hàng mua sắm hoặc liên hệ.]</p><h2>Cách sử dụng thông tin</h2><p>[Mô tả mục đích sử dụng, lưu trữ và các trường hợp chia sẻ.]</p><h2>Quyền của khách hàng</h2><p>[Hướng dẫn yêu cầu xem, cập nhật hoặc xóa thông tin.]</p>' },
  { key: 'terms', label: 'Mẫu: Điều khoản', title: 'Điều khoản', slug: 'dieu-khoan', seo: 'Điều khoản sử dụng', content: '<h2>Phạm vi áp dụng</h2><p>[Nêu phạm vi áp dụng của điều khoản.]</p><h2>Đặt hàng và thanh toán</h2><p>[Nêu quy trình đặt hàng, xác nhận và thanh toán.]</p><h2>Quyền và trách nhiệm</h2><p>[Nêu trách nhiệm của cửa hàng và khách hàng.]</p>' },
  { key: 'about', label: 'Mẫu: Giới thiệu cửa hàng', title: 'Giới thiệu', slug: 'gioi-thieu', seo: 'Giới thiệu cửa hàng', content: '<h2>Câu chuyện cửa hàng</h2><p>[Giới thiệu thương hiệu và lý do cửa hàng được thành lập.]</p><h2>Sản phẩm</h2><p>[Mô tả phong cách, chất liệu hoặc tiêu chí lựa chọn sản phẩm.]</p><h2>Giá trị theo đuổi</h2><p>[Chia sẻ cam kết và định hướng phục vụ khách hàng.]</p>' },
  { key: 'contact', label: 'Mẫu: Liên hệ', title: 'Liên hệ', slug: 'lien-he', seo: 'Liên hệ cửa hàng', content: '<h2>Thông tin liên hệ</h2><ul><li>Email: [địa chỉ email]</li><li>Điện thoại: [số điện thoại]</li><li>Địa chỉ: [địa chỉ cửa hàng]</li></ul><h2>Giờ hỗ trợ</h2><p>[Điền ngày và giờ làm việc.]</p>' },
]

async function request<T>(url: string, token: string, fallbackError: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json() as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, fallbackError)
  return body
}

export function ContentPagesPage({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const pageSize = useAdminPageSize()
  const { state, queryState, setValue, clearFilters } = useListUrlState('content_pages', { q: '', status: '', sort: 'title', page: '1' })
  const query = state.q
  const queryQ = queryState.q
  const status = state.status
  const sort = state.sort || 'title'
  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc'
  const pageNumber = Math.max(1, Number.parseInt(state.page, 10) || 1)
  const [editing, setEditing] = useState<Page | null>(null)
  const [deleting, setDeleting] = useState<Page | null>(null)
  const [preview, setPreview] = useState(false)
  const [notice, setNotice] = useState('')
  const schema = useMemo(() => z.object({
    title: z.string().trim().min(1, t('Vui lòng nhập tiêu đề.')).max(180, t('Tiêu đề không vượt quá 180 ký tự.')),
    slug: z.string().trim().min(1, t('Vui lòng nhập slug.')).max(180, t('Slug không vượt quá 180 ký tự.')).regex(/^[A-Za-z0-9_-]+$/, t('Slug chỉ gồm chữ không dấu, số, dấu gạch ngang hoặc dấu gạch dưới.')),
    content: z.string().trim().min(1, t('Vui lòng nhập nội dung.')).max(200000, t('Nội dung không vượt quá 200.000 ký tự.')),
    meta_title: z.string().max(180, t('Tiêu đề SEO không vượt quá 180 ký tự.')),
    meta_description: z.string().max(500, t('Mô tả SEO không vượt quá 500 ký tự.')),
    is_published: z.boolean(),
  }), [t])
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: empty })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)
  const previewValues = useWatch({ control: form.control })
  const previewContent = useMemo(
    () => sanitizePageContent(previewValues.content || `<p>${t('Nội dung trang sẽ hiển thị tại đây.')}</p>`),
    [previewValues.content, t],
  )
  const list = useQuery({ queryKey: ['admin', 'pages', queryQ, status, sort, pageNumber, pageSize], queryFn: () => { const params = new URLSearchParams({ q: queryQ, page: String(pageNumber), per_page: String(pageSize), sort }); if (status) params.set('status', status); return request<PageResponse>(`${apiUrl}/admin/pages?${params}`, accessToken, t('Không thể xử lý yêu cầu.')) }, enabled: Boolean(accessToken) })
  const save = useMutation({ mutationFn: (values: Form) => request(`${apiUrl}/admin/pages${editing ? `/${editing.id}` : ''}`, accessToken, t('Không thể xử lý yêu cầu.'), { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values) }), onError: (error) => { if (!applyServerValidationErrors(form, error)) setNotice(error instanceof Error ? error.message : t('Không lưu được trang.')) }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin', 'pages'] }); setNotice(t('Đã lưu trang nội dung.')); reset(true) } })
  const remove = useMutation({ mutationFn: (item: Page) => request(`${apiUrl}/admin/pages/${item.id}`, accessToken, t('Không thể xử lý yêu cầu.'), { method: 'DELETE' }), onError: (error) => setNotice(error instanceof Error ? error.message : t('Không xóa được trang.')), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin', 'pages'] }); setDeleting(null); setNotice(t('Đã xóa trang nội dung.')) } })

  function reset(force = false) { if (!force && !confirmDiscard()) return; setEditing(null); form.reset(empty); setPreview(false) }
  function edit(item: Page) { if (!confirmDiscard()) return; setEditing(item); form.reset({ title: item.title, slug: item.slug, content: item.content, meta_title: item.meta_title ?? '', meta_description: item.meta_description ?? '', is_published: item.is_published }); setPreview(false); setNotice('') }
  const columns: DataTableColumn<Page>[] = [
    { id: 'title', header: t('Tiêu đề').toLocaleUpperCase(), sortable: true, sortKey: 'title', cell: (item) => <div><strong>{item.title}</strong><small className="content-page-slug">/pages/{item.slug}</small></div> },
    { id: 'status', header: t('Trạng thái').toLocaleUpperCase(), sortable: true, sortKey: 'is_published', cell: (item) => <span className={`status-badge ${item.is_published ? 'status-badge-success' : 'status-badge-neutral'}`}>{item.is_published ? t('Đã xuất bản') : t('Bản nháp')}</span> },
    { id: 'updated_at', header: t('Cập nhật').toLocaleUpperCase(), sortable: true, sortKey: 'updated_at', cell: (item) => formatDateTime(item.updated_at) },
    { id: 'actions', header: t('Thao tác').toLocaleUpperCase(), cell: (item) => <RowActionsMenu label={t('Thao tác trang {{title}}', { title: item.title })} actions={[{ id: 'edit', label: t('Sửa'), onSelect: () => edit(item) }, ...(item.is_published ? [{ id: 'open', label: t('Mở trang'), href: `${ADMIN_STOREFRONT_URL}/pages/${item.slug}` }] : []), { id: 'delete', label: t('Xóa'), onSelect: () => setDeleting(item), destructive: true }]} /> },
  ]

  const activeFilterChips = [
    ...(query ? [{ id: 'q', label: t('Tìm: {{query}}', { query }), onRemove: () => setValue('q', '') }] : []),
    ...(status ? [{ id: 'status', label: status === 'published' ? t('Đã xuất bản') : t('Bản nháp'), onRemove: () => setValue('status', '') }] : []),
  ]
  return <div className="content-pages-page">
    {notice && <p role="status" className="reference-notice">{notice}</p>}
    <section className="panel" aria-label={t('Biên tập trang')}>
      <div className="panel-heading"><div><h2>{editing ? t('Sửa: {{title}}', { title: editing.title }) : t('Soạn trang')}</h2><p>{t('Trang được hiển thị công khai khi bật trạng thái xuất bản.')}</p></div><button className="secondary" type="button" onClick={() => { reset(); setNotice('') }}>{t('Trang mới')}</button></div>
      <form className="content-page-form" noValidate onSubmit={form.handleSubmit((values) => { setNotice(''); save.mutate(values) })}>
        <div className="form-grid">
          <FormField label={t('Tiêu đề')} required error={form.formState.errors.title?.message}><input maxLength={180} {...form.register('title')} /></FormField>
          <FormField label={t('Slug')} required hint={t('URL công khai: /pages/{{slug}}', { slug: previewValues.slug || 'slug' })} error={form.formState.errors.slug?.message}><input maxLength={180} placeholder="chinh-sach-doi-tra" {...form.register('slug')} /></FormField>
          {!editing && <FormField label={t('Mẫu gợi ý')}><select aria-label={t('Mẫu gợi ý')} defaultValue="" onChange={(event) => { const template = templates.find((item) => item.key === event.target.value); if (!template) return; form.setValue('title', template.title, { shouldDirty: true }); form.setValue('slug', template.slug, { shouldDirty: true }); form.setValue('content', template.content, { shouldDirty: true }); form.setValue('meta_title', template.seo, { shouldDirty: true }); form.setValue('meta_description', '', { shouldDirty: true }); event.target.value = '' }}><option value="">{t('Chọn mẫu để điền nội dung khởi đầu')}</option>{templates.map((template) => <option key={template.key} value={template.key}>{t(template.label)}</option>)}</select></FormField>}
        </div>
        <div className="page-editor-toolbar"><label className="inline-check"><input type="checkbox" {...form.register('is_published')} /> {t('Xuất bản')}</label><button className="secondary" type="button" onClick={() => setPreview((value) => !value)}>{preview ? t('Quay lại chỉnh sửa') : t('Xem trước')}</button></div>
        <div className="form-grid"><FormField label={t('Tiêu đề SEO')} hint={t('Để trống để dùng tiêu đề trang.')} error={form.formState.errors.meta_title?.message}><input maxLength={180} {...form.register('meta_title')} /></FormField><FormField label={t('Mô tả SEO')} hint={t('{{count}}/500 ký tự', { count: previewValues.meta_description?.length ?? 0 })} error={form.formState.errors.meta_description?.message}><textarea rows={3} maxLength={500} {...form.register('meta_description')} /></FormField></div>
        {preview ? <article className="page-content-preview"><h1>{previewValues.title || t('Tiêu đề trang')}</h1><div className="content-page-body" dangerouslySetInnerHTML={{ __html: previewContent }} /></article> : <div className="content-page-content-field"><label id="content-page-content-label">{t('Nội dung')} <span aria-hidden="true">*</span></label><Controller name="content" control={form.control} render={({ field }) => <Suspense fallback={<div className="reference-rich-editor-loading" role="status">{t('Đang tải trình soạn thảo…')}</div>}><RichTextField value={field.value} onChange={field.onChange} ariaLabel={t('Nội dung trang')} ariaDescribedBy={form.formState.errors.content ? 'content-page-content-error' : undefined} invalid={Boolean(form.formState.errors.content)} /></Suspense>} />{form.formState.errors.content?.message && <small id="content-page-content-error" className="shared-field-error" role="alert">{form.formState.errors.content.message}</small>}</div>}
        <div className="page-form-actions"><button className="primary" type="submit" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t('Đang lưu…') : editing ? t('Lưu thay đổi') : t('Tạo trang')}</button>{editing && <button className="secondary" type="button" onClick={() => reset()}>{t('Hủy sửa')}</button>}</div>
      </form>
    </section>
    <section className="panel"><div className="page-list-heading"><h2>{t('Danh sách trang')}</h2></div>
      <FilterBar hasFilters={Boolean(query || status)} onClear={() => clearFilters(['q', 'status'])} activeFilters={activeFilterChips}><input aria-label={t('Tìm trang')} placeholder={t('Tìm theo tiêu đề hoặc slug')} value={query} onChange={(event) => { setValue('q', event.target.value); setValue('page', '1') }} /><select aria-label={t('Lọc trạng thái trang')} value={status} onChange={(event) => setValue('status', event.target.value)}><option value="">{t('Tất cả trạng thái')}</option><option value="published">{t('Đã xuất bản')}</option><option value="draft">{t('Bản nháp')}</option></select></FilterBar>
      
      <DataTable columns={columns} rows={list.data?.data ?? []} rowKey={(item) => item.id} loading={list.isLoading} error={list.error instanceof Error ? list.error.message : null} onRetry={() => void list.refetch()} noResults={Boolean(query || status)} emptyTitle={t('Chưa có trang nội dung')} emptyDescription={t('Tạo trang đầu tiên để bắt đầu.')} page={list.data?.meta.current_page ?? pageNumber} pageCount={list.data?.meta.last_page ?? 1} totalRows={list.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setValue('page', String(nextPage))} sortBy={sortBy} sortDirection={sortDirection} onSortChange={(key, direction) => { setValue('sort', direction === 'none' ? 'title' : direction === 'desc' ? `-${key}` : key); setValue('page', '1') }} />
    </section>
    <ConfirmDialog open={Boolean(deleting)} title={t('Xóa trang nội dung?')} description={deleting ? t('Trang “{{title}}” sẽ bị xóa vĩnh viễn. Liên kết tới trang này sẽ trả về 404.', { title: deleting.title }) : ''} confirmLabel={t('Xóa trang')} busy={remove.isPending} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null) }} onConfirm={() => { if (deleting) remove.mutate(deleting) }} />
  </div>
}
