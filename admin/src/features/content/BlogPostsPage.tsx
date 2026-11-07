import { lazy, Suspense, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminApiFetch } from '../../lib/admin-api'
import { ADMIN_STOREFRONT_URL } from '../../lib/storefront-base'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { FormField } from '../../components/shared/form-field'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { sanitizePageContent } from '../../lib/sanitize-page-content'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { formatDateTime } from '../../lib/date-format'
import './ContentPages.css'

const RichTextField = lazy(() => import('../products/RichTextField').then((module) => ({ default: module.RichTextField })))
type Product = { id: number; name: string; sku?: string; status?: string }
type BlogTag = { name: string; slug: string }
type BlogPostSummary = { id: number; title: string; slug: string; category_name: string; category_slug: string; excerpt: string; author_name: string | null; cover_image: string | null; cover_alt: string | null; is_published: boolean; published_at: string | null; updated_at: string; tags: BlogTag[] }
type BlogPost = BlogPostSummary & { author_bio: string | null; content: string; meta_title: string | null; meta_description: string | null; products: Product[]; view_count: number }
type ListResponse = { data: BlogPostSummary[]; meta: { current_page: number; last_page: number; total: number } }
type Form = { title: string; slug: string; category_name: string; excerpt: string; author_name: string; author_bio: string; cover_image: string; cover_alt: string; content: string; meta_title: string; meta_description: string; published_at: string; is_published: boolean; product_ids: number[]; tags: string }
const empty: Form = { title: '', slug: '', category_name: '', excerpt: '', author_name: '', author_bio: '', cover_image: '', cover_alt: '', content: '', meta_title: '', meta_description: '', published_at: '', is_published: false, product_ids: [], tags: '' }

async function request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json() as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, 'Không thể xử lý yêu cầu.')
  return body
}

export function BlogPostsPage({ apiUrl, accessToken }: { apiUrl: string; accessToken: string }) {
  const client = useQueryClient()
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [deleting, setDeleting] = useState<BlogPostSummary | null>(null)
  const [preview, setPreview] = useState(false)
  const [listPage, setListPage] = useState(1)
  const [notice, setNotice] = useState('')
  const schema = useMemo(() => z.object({
    title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề.').max(180),
    slug: z.string().trim().min(1, 'Vui lòng nhập slug.').max(180).regex(/^[A-Za-z0-9_-]+$/, 'Slug chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới.'),
    category_name: z.string().trim().min(1, 'Vui lòng nhập danh mục.').max(100),
    excerpt: z.string().trim().min(1, 'Vui lòng nhập tóm tắt.').max(500),
    author_name: z.string().max(120), author_bio: z.string().max(500),
    cover_image: z.string().max(500), cover_alt: z.string().max(180),
    content: z.string().trim().min(1, 'Vui lòng nhập nội dung.').max(200000),
    meta_title: z.string().max(180), meta_description: z.string().max(500),
    published_at: z.string(), is_published: z.boolean(), product_ids: z.array(z.number()).max(12),
    tags: z.string().max(414).superRefine((value, context) => {
      const tags = value.split(',').map((tag) => tag.trim()).filter(Boolean)
      if (tags.length > 8) context.addIssue({ code: 'custom', message: 'Chỉ thêm tối đa 8 tag.' })
      if (tags.some((tag) => tag.length > 50)) context.addIssue({ code: 'custom', message: 'Mỗi tag tối đa 50 ký tự.' })
      if (new Set(tags.map((tag) => tag.normalize('NFC').toLocaleLowerCase('vi-VN'))).size !== tags.length) context.addIssue({ code: 'custom', message: 'Không nhập trùng tag.' })
    }),
  }).superRefine((values, context) => {
    if (values.author_bio.trim() && !values.author_name.trim()) context.addIssue({ code: 'custom', path: ['author_name'], message: 'Nhập tên tác giả khi có phần giới thiệu.' })
  }), [])
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: empty })
  const confirmDiscard = useUnsavedFormGuard(form.formState.isDirty)
  const posts = useQuery({ queryKey: ['admin', 'blog-posts', listPage], queryFn: () => request<ListResponse>(`${apiUrl}/admin/blog/posts?page=${listPage}&per_page=20`, accessToken), enabled: Boolean(accessToken) })
  const products = useQuery({ queryKey: ['admin', 'blog-product-options'], queryFn: () => request<{ data: Product[] }>(`${apiUrl}/admin/products?per_page=100&sort=name`, accessToken), enabled: Boolean(accessToken) })
  const save = useMutation({ mutationFn: (values: Form) => request(`${apiUrl}/admin/blog/posts${editing ? `/${editing.id}` : ''}`, accessToken, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ ...values, tags: values.tags.split(',').map((tag) => tag.trim().normalize('NFC')).filter(Boolean), author_name: values.author_name.trim() || null, author_bio: values.author_bio.trim() || null, cover_image: values.cover_image || null, cover_alt: values.cover_alt || null, meta_title: values.meta_title || null, meta_description: values.meta_description || null, published_at: values.published_at ? new Date(values.published_at).toISOString() : null }) }), onError: (error) => { if (!applyServerValidationErrors(form, error)) setNotice(error instanceof Error ? error.message : 'Không lưu được bài viết.') }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin', 'blog-posts'] }); form.reset(empty); setEditing(null); setPreview(false); setNotice('Đã lưu bài viết.') } })
  const loadPost = useMutation({ mutationFn: (post: BlogPostSummary) => request<{ data: BlogPost }>(`${apiUrl}/admin/blog/posts/${post.id}`, accessToken), onError: (error) => setNotice(error instanceof Error ? error.message : 'Không tải được bài viết.'), onSuccess: ({ data }) => { setEditing(data); form.reset({ ...empty, ...data, author_name: data.author_name ?? '', author_bio: data.author_bio ?? '', cover_image: data.cover_image ?? '', cover_alt: data.cover_alt ?? '', meta_title: data.meta_title ?? '', meta_description: data.meta_description ?? '', published_at: toLocalDateTime(data.published_at), product_ids: data.products.map((product) => product.id), tags: data.tags.map((tag) => tag.name).join(', ') }); setNotice('') } })
  const remove = useMutation({ mutationFn: (post: BlogPostSummary) => request(`${apiUrl}/admin/blog/posts/${post.id}`, accessToken, { method: 'DELETE' }), onError: (error) => setNotice(error instanceof Error ? error.message : 'Không xóa được bài viết.'), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['admin', 'blog-posts'] }); setDeleting(null); setNotice('Đã xóa bài viết.') } })
  function edit(post: BlogPostSummary) { if (!confirmDiscard()) return; loadPost.mutate(post) }

  return <div className="content-pages-page">
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    <section className="panel" aria-label="Biên tập bài viết">
      <div className="panel-heading"><div><h2>{editing ? `Sửa: ${editing.title}` : 'Soạn bài viết'}</h2><p>Bài viết đã xuất bản sẽ xuất hiện tại /blog. Bài đặt lịch chỉ hiển thị sau thời điểm xuất bản.</p></div><button className="secondary" type="button" onClick={() => { if (!confirmDiscard()) return; loadPost.reset(); setEditing(null); form.reset(empty); setPreview(false) }}>Bài mới</button></div>
      <form className="content-page-form" noValidate onSubmit={form.handleSubmit((values) => { setNotice(''); save.mutate(values) })}>
        <div className="form-grid">
          <FormField label="Tiêu đề" required error={form.formState.errors.title?.message}><input maxLength={180} {...form.register('title')} /></FormField>
          <FormField label="Slug" required hint={`/blog/${form.watch('slug') || 'slug'}`} error={form.formState.errors.slug?.message}><input maxLength={180} {...form.register('slug')} /></FormField>
          <FormField label="Danh mục" required error={form.formState.errors.category_name?.message}><input maxLength={100} placeholder="Phối đồ" {...form.register('category_name')} /></FormField>
          <FormField label="Tag" hint="Phân tách bằng dấu phẩy; tối đa 8 tag, mỗi tag 50 ký tự." error={form.formState.errors.tags?.message}><input maxLength={414} placeholder="Xu hướng, Phối đồ công sở" {...form.register('tags')} /></FormField>
          <FormField label="Tóm tắt" required error={form.formState.errors.excerpt?.message}><textarea rows={3} maxLength={500} {...form.register('excerpt')} /></FormField>
          <FormField label="Tác giả" error={form.formState.errors.author_name?.message}><input maxLength={120} placeholder="Tên hiển thị" {...form.register('author_name')} /></FormField>
          <FormField label="Giới thiệu tác giả" hint="Tùy chọn; tối đa 500 ký tự." error={form.formState.errors.author_bio?.message}><textarea rows={3} maxLength={500} {...form.register('author_bio')} /></FormField>
          <FormField label="Ảnh bìa (URL)"><input maxLength={500} {...form.register('cover_image')} /></FormField>
          <FormField label="Mô tả ảnh"><input maxLength={180} {...form.register('cover_alt')} /></FormField>
          <FormField label="Thời điểm xuất bản" hint="Để trống để xuất bản ngay khi bật trạng thái."><input type="datetime-local" {...form.register('published_at')} /></FormField>
        </div>
        <div className="page-editor-toolbar"><label className="inline-check"><input type="checkbox" {...form.register('is_published')} /> Xuất bản</label><button className="secondary" type="button" onClick={() => setPreview((value) => !value)}>{preview ? 'Quay lại chỉnh sửa' : 'Xem trước'}</button></div>
        <div className="form-grid"><FormField label="Tiêu đề SEO"><input maxLength={180} {...form.register('meta_title')} /></FormField><FormField label="Mô tả SEO"><textarea rows={3} maxLength={500} {...form.register('meta_description')} /></FormField></div>
        <div className="content-page-content-field"><label id="blog-content-label">Nội dung <span aria-hidden="true">*</span></label>{preview ? <article className="page-content-preview"><h1>{form.watch('title') || 'Tiêu đề bài viết'}</h1><div className="content-page-body" dangerouslySetInnerHTML={{ __html: sanitizePageContent(form.watch('content')) }} /></article> : <Controller name="content" control={form.control} render={({ field }) => <Suspense fallback={<p role="status">Đang tải trình soạn thảo…</p>}><RichTextField value={field.value} onChange={field.onChange} ariaLabel="Nội dung bài viết" invalid={Boolean(form.formState.errors.content)} /></Suspense>} />}{form.formState.errors.content?.message && <small className="shared-field-error" role="alert">{form.formState.errors.content.message}</small>}</div>
        <fieldset className="blog-products"><legend>Sản phẩm gắn với bài viết (tối đa 12)</legend>{products.isPending ? <p>Đang tải sản phẩm…</p> : products.isError ? <p role="alert">Không tải được danh sách sản phẩm.</p> : <div className="blog-product-options">{(products.data?.data ?? []).map((product) => <label key={product.id}><input type="checkbox" value={product.id} checked={form.watch('product_ids').includes(product.id)} onChange={(event) => form.setValue('product_ids', event.target.checked ? [...form.getValues('product_ids'), product.id].slice(0, 12) : form.getValues('product_ids').filter((id) => id !== product.id), { shouldDirty: true })} /> {product.name}{product.sku ? ` · ${product.sku}` : ''}</label>)}</div>}</fieldset>
        <div className="page-form-actions"><button className="primary" type="submit" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo bài viết'}</button>{editing && <button className="secondary" type="button" onClick={() => { if (!confirmDiscard()) return; setEditing(null); form.reset(empty) }}>Hủy sửa</button>}</div>
      </form>
    </section>
    <section className="panel"><h2>Danh sách bài viết</h2>{loadPost.isPending && <p role="status">Đang tải bài viết để chỉnh sửa…</p>}{posts.isPending ? <p role="status">Đang tải bài viết…</p> : posts.isError ? <p role="alert">Không tải được danh sách bài viết. <button className="link-button" type="button" onClick={() => void posts.refetch()}>Thử lại</button></p> : (posts.data?.data ?? []).length === 0 ? <p>Chưa có bài viết.</p> : <div className="blog-admin-list">{posts.data!.data.map((post) => <article key={post.id}><div><strong>{post.title}</strong><small>/{post.category_slug} · {post.is_published ? `Đã xuất bản · ${post.published_at ? formatDateTime(post.published_at) : ''}` : 'Bản nháp'}</small></div><div className="blog-admin-actions"><button className="secondary" type="button" disabled={loadPost.isPending} onClick={() => edit(post)}>Sửa</button>{post.is_published && <a className="secondary" href={`${ADMIN_STOREFRONT_URL}/blog/${post.slug}`} target="_blank" rel="noreferrer">Xem</a>}<button className="secondary" type="button" onClick={() => setDeleting(post)}>Xóa</button></div></article>)}</div>}{posts.data && posts.data.meta.last_page > 1 && <div className="catalog-sortable-pagination"><button className="secondary" type="button" disabled={listPage <= 1} onClick={() => setListPage((current) => current - 1)}>Trang trước</button><span>Trang {posts.data.meta.current_page} / {posts.data.meta.last_page} · {posts.data.meta.total} bài viết</span><button className="secondary" type="button" disabled={listPage >= posts.data.meta.last_page} onClick={() => setListPage((current) => current + 1)}>Trang sau</button></div>}</section>
    <ConfirmDialog open={Boolean(deleting)} title="Xóa bài viết?" description={deleting ? `Bài “${deleting.title}” sẽ bị xóa.` : ''} confirmLabel="Xóa bài viết" busy={remove.isPending} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null) }} onConfirm={() => { if (deleting) remove.mutate(deleting) }} />
  </div>
}

function toLocalDateTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
