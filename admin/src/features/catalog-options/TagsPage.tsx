import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { adminApiFetch } from '../../lib/admin-api'
import { FilterBar } from '../../components/shared/filter-bar'
import { FormField } from '../../components/shared/form-field'
import { PageHeader } from '../../components/shared/page-header'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { useListUrlState } from '../../lib/use-list-url-state'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { useTranslation } from 'react-i18next'

type Tag = { id: number; name: string; slug: string; products_count: number }
type Response = { data: Tag[]; meta: { current_page: number; last_page: number; total: number } }
type Values = { name: string; slug: string }

export function TagsPage({ apiUrl, accessToken, permissions }: { apiUrl: string; accessToken: string; permissions: string[] }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const pageSize = useAdminPageSize()
  const { state, queryState, setValue, clearFilters } = useListUrlState('tags', { q: '', page: '1', sort: 'name' })
  const [editing, setEditing] = useState<Tag | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [targetId, setTargetId] = useState('')
  const [message, setMessage] = useState('')
  const schema = useMemo(() => z.object({ name: z.string().trim().min(1, t('Nhập tên thẻ.')).max(50, t('Tên thẻ tối đa 50 ký tự.')), slug: z.string().trim().max(80, t('Slug tối đa 80 ký tự.')) }), [t])
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: '' } })
  const confirmDiscard = useUnsavedFormGuard(formOpen && form.formState.isDirty)
  const query = useQuery({ queryKey: ['admin-tags', queryState.q, state.page, state.sort, pageSize], queryFn: async ({ signal }) => {
    const params = new URLSearchParams({ per_page: String(pageSize), page: state.page, sort: state.sort }); if (queryState.q) params.set('q', queryState.q)
    const response = await adminApiFetch(`${apiUrl}/admin/tags?${params}`, { signal, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json() as Response & { message?: string }; if (!response.ok) throw createApiResponseError(body, response.status, t('Không tải được danh sách thẻ.'))
    return body
  } })
  const save = useMutation({ mutationFn: async (values: Values) => {
    const response = await adminApiFetch(`${apiUrl}/admin/tags${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    const body = await response.json() as { message?: string }; if (!response.ok) throw createApiResponseError(body, response.status, t('Không lưu được thẻ.'))
  }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin-tags'] }); setEditing(null); setFormOpen(false); form.reset({ name: '', slug: '' }); setMessage(t('Đã lưu thẻ.')) } })
  const merge = useMutation({ mutationFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/admin/tags/merge`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ target_id: Number(targetId), source_ids: selected.filter((id) => id !== Number(targetId)) }) })
    const body = await response.json() as { message?: string }; if (!response.ok) throw createApiResponseError(body, response.status, t('Không gộp được thẻ.'))
  }, onSuccess: () => { void client.invalidateQueries({ queryKey: ['admin-tags'] }); setSelected([]); setTargetId(''); setMessage(t('Đã gộp các thẻ.')) } })
  const canCreate = permissions.includes('products.create'); const canUpdate = permissions.includes('products.update')
  const openForm = (tag?: Tag) => { if (!confirmDiscard()) return; setEditing(tag ?? null); form.reset(tag ? { name: tag.name, slug: tag.slug } : { name: '', slug: '' }); setFormOpen(true) }
  const closeForm = () => { if (!confirmDiscard()) return; setEditing(null); setFormOpen(false) }
  const columns: DataTableColumn<Tag>[] = [
    { id: 'name', header: t('Tên thẻ'), cell: (tag) => tag.name, sortable: true },
    { id: 'slug', header: t('Slug'), cell: (tag) => tag.slug, sortable: true },
    { id: 'products_count', header: t('Sản phẩm'), cell: (tag) => tag.products_count, sortable: true, sortKey: 'products_count' },
    { id: 'actions', header: t('Thao tác'), cell: (tag) => canUpdate ? <RowActionsMenu label={t('Thao tác thẻ {{name}}', { name: tag.name })} actions={[{ id: 'edit', label: t('Sửa'), onSelect: () => openForm(tag) }]} /> : '—', hideable: false },
  ]
  return <section><PageHeader title={t('Thẻ sản phẩm')} description={t('Quản lý nhãn và gộp thẻ trùng nhau.')} actions={canCreate ? <button type="button" onClick={() => openForm()}>+ {t('Thêm thẻ')}</button> : null} />
    <FilterBar hasFilters={Boolean(state.q)} onClear={() => clearFilters(['q'])} activeFilters={state.q ? [{ id: 'q', label: t('Tìm: {{query}}', { query: state.q }), onRemove: () => setValue('q', '') }] : []}><label className="shared-search-field"><span className="sr-only">{t('Tìm thẻ')}</span><input aria-label={t('Tìm thẻ')} value={state.q} onChange={(event) => setValue('q', event.target.value)} placeholder={t('Tìm tên hoặc slug')} /></label></FilterBar>
    
    {selected.length > 1 && canUpdate && <div className="bulk-actions"><label>{t('Gộp vào')} <select aria-label={t('Gộp vào')} value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">{t('Chọn thẻ đích')}</option>{query.data?.data.filter((tag) => selected.includes(tag.id)).map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label><button type="button" disabled={!targetId || merge.isPending} onClick={() => merge.mutate()}>{merge.isPending ? t('Đang gộp…') : t('Gộp thẻ đã chọn')}</button></div>}
    <DataTable columns={columns} rows={query.data?.data ?? []} rowKey={(tag) => tag.id} loading={query.isPending} error={query.error?.message ?? null} onRetry={() => void query.refetch()} emptyTitle={state.q ? t('Không tìm thấy thẻ') : t('Chưa có thẻ')} emptyDescription={t('Thẻ sẽ xuất hiện tại đây sau khi được tạo.')} noResults={Boolean(state.q && query.data?.meta.total === 0)} page={query.data?.meta.current_page ?? 1} pageCount={query.data?.meta.last_page ?? 1} totalRows={query.data?.meta.total} pageSize={pageSize} onPageChange={(nextPage) => setValue('page', String(nextPage))} sortBy={state.sort.replace(/^-/, '')} sortDirection={state.sort.startsWith('-') ? 'desc' : 'asc'} onSortChange={(column, direction) => setValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${column}` : column)} selectedRowKeys={selected} onSelectionChange={(ids) => setSelected(ids.map(Number))} selectionLabel={(tag) => t('Chọn thẻ {{name}}', { name: tag.name })} />
    {formOpen && <dialog open className="shared-dialog"><form aria-labelledby="tag-editor-title" onSubmit={form.handleSubmit((values) => save.mutate(values))}><h2 id="tag-editor-title">{editing ? t('Sửa thẻ') : t('Thêm thẻ')}</h2><FormField id="tag-name" label={t('Tên thẻ')} required error={form.formState.errors.name?.message}><input {...form.register('name')} /></FormField><FormField id="tag-slug" label={t('Slug')} hint={t('Để trống để tự tạo từ tên.')} error={form.formState.errors.slug?.message}><input {...form.register('slug')} /></FormField>{save.isError && <p role="alert">{save.error.message}</p>}<footer><button type="button" className="secondary" onClick={closeForm}>{t('Hủy')}</button><button type="submit" disabled={save.isPending || !form.formState.isDirty}>{save.isPending ? t('Đang lưu…') : t('Lưu')}</button></footer></form></dialog>}
    {message && <p role="status">{message}</p>}{merge.isError && <p role="alert">{merge.error.message}</p>}
  </section>
}
