import { adminApiFetch } from '../../lib/admin-api'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { useAdminPageSize } from '../../components/shared/admin-page-size'
import { FilterBar } from '../../components/shared/filter-bar'
import { AdvancedFilterSheet } from '../../components/shared/advanced-filter-sheet'
import { FormField } from '../../components/shared/form-field'
import { ImageUploader } from '../../components/shared/image-uploader'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { formatDateTime } from '../../lib/date-format'
import { mediaUrl } from '../../lib/media-url'
import { useListUrlState } from '../../lib/use-list-url-state'
import '../../ReferenceData.css'

export type ReferenceKind = 'categories' | 'brands' | 'colors' | 'sizes' | 'collections'
type ReferenceItem = { id: number; name: string; slug?: string; is_active?: boolean; is_lookbook?: boolean; status?: 'running' | 'upcoming' | 'expired' | 'disabled'; product_count?: number; usage_count?: number; parent_id?: number | null; parent_name?: string | null; group?: string | null; color_hex?: string | null; sort_order?: number; image?: string | null; image_alt?: string | null; logo?: string | null; description?: string | null; meta_title?: string | null; meta_description?: string | null; banner?: string | null; banner_alt?: string | null; starts_at?: string | null; ends_at?: string | null }
type Pagination = { current_page: number; last_page: number; total: number }
type ListResponse = { data: ReferenceItem[]; meta: Pagination }
type ReferenceDataPageProps = { kind: ReferenceKind; apiUrl: string; accessToken: string; permissions: string[]; initialItemId?: number; onNavigate?: (href: string) => void }
type TreeReferenceItem = ReferenceItem & { level: number }
const CATEGORY_ROOT_DROP_ID = 'category-parent-drop:root'
const categoryParentDropId = (id: number) => `category-parent-drop:${id}`

function flattenCategoryTree(items: ReferenceItem[]): TreeReferenceItem[] {
  const children = new Map<number | null, ReferenceItem[]>()
  for (const item of items) {
    const parentId = item.parent_id ?? null
    children.set(parentId, [...(children.get(parentId) ?? []), item])
  }
  const result: TreeReferenceItem[] = []
  const visited = new Set<number>()
  const visit = (parentId: number | null, level: number) => {
    for (const item of children.get(parentId) ?? []) {
      if (visited.has(item.id)) continue
      visited.add(item.id)
      result.push({ ...item, level })
      visit(item.id, level + 1)
    }
  }
  visit(null, 0)
  for (const item of items) if (!visited.has(item.id)) result.push({ ...item, level: 0 })
  return result
}

function descendantCategoryIds(items: ReferenceItem[], parentId: number): Set<number> {
  const descendants = new Set<number>([parentId])
  let changed = true
  while (changed) {
    changed = false
    for (const item of items) {
      if (item.parent_id && descendants.has(item.parent_id) && !descendants.has(item.id)) {
        descendants.add(item.id)
        changed = true
      }
    }
  }
  return descendants
}

function SortableReferenceRow({ item, kind, canUpdate, canDelete, busy, onEdit, onDelete }: {
  item: TreeReferenceItem
  kind: ReferenceKind
  canUpdate: boolean
  canDelete: boolean
  busy: boolean
  onEdit: (item: ReferenceItem) => void
  onDelete: (item: ReferenceItem) => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: busy })
  return <li ref={setNodeRef} className={`catalog-sortable-row${isDragging ? ' is-dragging' : ''}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
    <button className="catalog-sortable-handle" type="button" aria-label={t('Kéo để sắp xếp {{name}}', { name: item.name })} title={t('Kéo để sắp xếp')} disabled={busy} {...attributes} {...listeners}><GripVertical size={16} aria-hidden="true" /></button>
    <span className="catalog-sortable-name" style={kind === 'categories' ? { paddingInlineStart: item.level * 22 } : undefined}>{kind === 'categories' && <span aria-hidden="true">{item.level ? '↳ ' : ''}</span>}{kind === 'colors' && <i className="reference-color-swatch" style={{ background: item.color_hex ?? '#fff' }} aria-label={item.color_hex ?? t('Chưa đặt mã màu')} />}{item.name}</span>
    {kind === 'categories' && <span className="catalog-sortable-meta">{item.parent_name ?? t('Danh mục gốc')}</span>}
    {kind === 'categories' && canUpdate && <CategoryParentDropTarget item={item} disabled={busy} />}
    {kind === 'sizes' && <span className="catalog-sortable-meta">{t('Nhóm: {{group}} · Thứ tự {{order}}', { group: item.group ?? t('Kích cỡ'), order: item.sort_order ?? 0 })}</span>}
    <span className="catalog-sortable-meta">{t('{{count}} {{kind}}', { count: item.usage_count ?? item.product_count ?? 0, kind: t(kind === 'sizes' || kind === 'colors' ? 'biến thể' : kind === 'categories' ? 'sản phẩm' : 'mục') })}</span>
    <RowActionsMenu label={t('Thao tác {{name}}', { name: item.name })} actions={[...(canUpdate ? [{ id: 'edit', label: t('Sửa'), onSelect: () => onEdit(item) }] : []), ...(canDelete ? [{ id: 'delete', label: t('Xóa'), onSelect: () => onDelete(item), destructive: true }] : [])]} />
  </li>
}

function CategoryParentDropTarget({ item, disabled }: { item: ReferenceItem; disabled: boolean }) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: categoryParentDropId(item.id), disabled })
  return <span ref={setNodeRef} className={`catalog-parent-drop-target${isOver ? ' is-over' : ''}`} aria-label={t('Thả vào đây để đưa danh mục thành con của {{name}}', { name: item.name })}>
    {isOver ? t('Thả vào {{name}}', { name: item.name }) : t('Thả vào để làm danh mục con')}
  </span>
}

function CategoryRootDropTarget({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: CATEGORY_ROOT_DROP_ID, disabled })
  return <div ref={setNodeRef} className={`catalog-root-drop-target${isOver ? ' is-over' : ''}`} role="group" aria-label={t('Vùng danh mục gốc')}>
    {isOver ? t('Thả để chuyển danh mục về gốc') : t('Kéo danh mục vào đây để chuyển về danh mục gốc')}
  </div>
}

const labels: Record<ReferenceKind, { singular: string; plural: string; hint: string }> = {
  categories: { singular: 'danh mục', plural: 'Danh mục', hint: 'Sắp xếp và tổ chức các nhóm sản phẩm.' },
  brands: { singular: 'thương hiệu', plural: 'Thương hiệu', hint: 'Quản lý nhãn hàng xuất hiện trong catalog.' },
  colors: { singular: 'màu sắc', plural: 'Màu sắc', hint: 'Màu dùng cho các biến thể sản phẩm.' },
  sizes: { singular: 'kích cỡ', plural: 'Kích cỡ', hint: 'Kích cỡ dùng cho các biến thể sản phẩm.' },
  collections: { singular: 'bộ sưu tập', plural: 'Bộ sưu tập', hint: 'Nhóm sản phẩm theo chủ đề và thời gian hiển thị.' },
}

const formSchema = (t: (key: string) => string) => z.object({
  name: z.string().trim().min(1, t('Vui lòng nhập tên.')).max(255),
  slug: z.string().trim().max(255),
  is_active: z.boolean(),
  parent_id: z.string(),
  group: z.string().trim().max(255),
  color_hex: z.string(),
  sort_order: z.string(),
  image: z.string(),
  image_alt: z.string().trim().max(255, t('Alt text không vượt quá 255 ký tự.')),
  meta_title: z.string().max(255),
  meta_description: z.string().max(500),
  logo: z.string(),
  description: z.string(),
  banner: z.string(),
  banner_alt: z.string().trim().max(255, t('Alt text không vượt quá 255 ký tự.')),
  is_lookbook: z.boolean(),
  starts_at: z.string(),
  ends_at: z.string(),
}).superRefine((values, context) => {
  if (values.image.trim() && !values.image_alt.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['image_alt'], message: t('Hãy mô tả nội dung ảnh danh mục.') })
  }
  if (values.banner.trim() && !values.banner_alt.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['banner_alt'], message: t('Hãy mô tả nội dung ảnh bìa thương hiệu hoặc bộ sưu tập.') })
  }
  if (values.is_lookbook && !values.banner.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['banner'], message: t('Cần có ảnh bìa để hiển thị Lookbook.') })
  }
  if (values.is_lookbook && !values.is_active) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['is_lookbook'], message: t('Chỉ bộ sưu tập đang bật mới có thể hiển thị Lookbook.') })
  }
  if (values.is_lookbook && values.starts_at && new Date(values.starts_at).getTime() > Date.now()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['is_lookbook'], message: t('Bộ sưu tập phải bắt đầu hiệu lực trước khi chọn làm Lookbook.') })
  }
  if (values.is_lookbook && values.ends_at && new Date(values.ends_at).getTime() <= Date.now()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['is_lookbook'], message: t('Bộ sưu tập đã hết hiệu lực, không thể chọn làm Lookbook.') })
  }
})
type ReferenceForm = z.infer<ReturnType<typeof formSchema>>
const emptyForm: ReferenceForm = { name: '', slug: '', is_active: true, parent_id: '', group: 'Kích cỡ', color_hex: '#000000', sort_order: '0', image: '', image_alt: '', meta_title: '', meta_description: '', logo: '', description: '', banner: '', banner_alt: '', is_lookbook: false, starts_at: '', ends_at: '' }

async function apiRequest<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json() as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, 'Không thể xử lý yêu cầu.')
  return body
}

function toLocalDateTime(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '' : new Date(date.valueOf() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function ReferenceDataPage({ kind, apiUrl, accessToken, permissions, initialItemId, onNavigate }: ReferenceDataPageProps) {
  const { t } = useTranslation()
  const pageSize = useAdminPageSize()
  const queryClient = useQueryClient()
  const supportsTableSort = kind === 'categories' || kind === 'brands' || kind === 'colors' || kind === 'collections'
  const { state: urlState, queryState: queryUrlState, setValue: setUrlValue, applyValues: applyUrlValues, clearFilters } = useListUrlState(`catalog_${kind}`, { q: '', active: '', status: '', date_from: '', date_to: '', sort: supportsTableSort ? kind === 'colors' ? 'sort_order' : 'name' : '', view: kind === 'categories' ? 'tree' : 'table', parent_id: '', root_only: '', has_products: '', page: '1' })
  const q = urlState.q
  const active = urlState.active
  const collectionStatus = urlState.status
  const collectionDateFrom = urlState.date_from
  const collectionDateTo = urlState.date_to
  const collectionFiltersActive = Boolean(q || active || collectionStatus || collectionDateFrom || collectionDateTo)
  const categoryView = urlState.view === 'table' ? 'table' : 'tree'
  const parentId = urlState.parent_id
  const rootOnly = urlState.root_only
  const hasProducts = urlState.has_products
  const categoryFiltersActive = Boolean(q || active || parentId || rootOnly || hasProducts)
  const sort = supportsTableSort ? urlState.sort || (kind === 'colors' ? 'sort_order' : 'name') : ''
  const sortBy = sort.startsWith('-') ? sort.slice(1) : sort || (kind === 'colors' ? 'sort_order' : 'name')
  const sortDirection = sort.startsWith('-') ? 'desc' : 'asc'
  const page = Math.max(1, Number.parseInt(urlState.page, 10) || 1)
  const [editing, setEditing] = useState<ReferenceItem | null>(null)
  const [formOpen, setFormOpen] = useState(() => kind === 'collections' && (location.pathname === '/collections/create' || new URLSearchParams(location.search).get('create') === '1'))
  const [deleting, setDeleting] = useState<ReferenceItem | null>(null)
  const [notice, setNotice] = useState('')
  const [logoUploadError, setLogoUploadError] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const [categoryImageUploadError, setCategoryImageUploadError] = useState('')
  const [categoryImageUploading, setCategoryImageUploading] = useState(false)
  const [categoryImagePreview, setCategoryImagePreview] = useState('')
  const [bannerUploadError, setBannerUploadError] = useState('')
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerPreview, setBannerPreview] = useState('')
  const [orderBusy, setOrderBusy] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const canCreate = permissions.includes('products.create')
  const canUpdate = permissions.includes('products.update')
  const canDelete = permissions.includes('products.delete')
  const form = useForm<ReferenceForm>({ resolver: zodResolver(formSchema(t)), defaultValues: emptyForm })
  const categoryImageAlt = useWatch({ control: form.control, name: 'image_alt' })
  const collectionBannerAlt = useWatch({ control: form.control, name: 'banner_alt' })
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = form
  const confirmDiscard = useUnsavedFormGuard(formOpen && isDirty)
  const uploadBrandLogo = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setLogoUploading(true)
    setLogoUploadError('')
    const body = new FormData()
    body.append('file', file)
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, body })
      const result = await response.json() as { data?: { url?: string }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !result.data?.url) throw createApiResponseError(result, response.status, 'Không thể tải logo lên.')
      form.setValue('logo', result.data.url, { shouldDirty: true, shouldValidate: true })
      setLogoPreview(result.data.url)
    } catch (cause) {
      setLogoUploadError(cause instanceof Error ? cause.message : 'Không thể tải logo lên.')
    } finally {
      setLogoUploading(false)
    }
  }
  const uploadCategoryImage = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setCategoryImageUploading(true)
    setCategoryImageUploadError('')
    const body = new FormData()
    body.append('file', file)
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, body })
      const result = await response.json() as { data?: { url?: string }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !result.data?.url) throw createApiResponseError(result, response.status, 'Không thể tải ảnh danh mục lên.')
      form.setValue('image', result.data.url, { shouldDirty: true, shouldValidate: true })
      setCategoryImagePreview(result.data.url)
    } catch (cause) {
      setCategoryImageUploadError(cause instanceof Error ? cause.message : 'Không thể tải ảnh danh mục lên.')
    } finally {
      setCategoryImageUploading(false)
    }
  }
  const uploadCollectionBanner = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setBannerUploading(true)
    setBannerUploadError('')
    const body = new FormData()
    body.append('file', file)
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, body })
      const result = await response.json() as { data?: { url?: string }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !result.data?.url) throw createApiResponseError(result, response.status, 'Không thể tải banner lên.')
      form.setValue('banner', result.data.url, { shouldDirty: true, shouldValidate: true })
      setBannerPreview(result.data.url)
    } catch (cause) {
      setBannerUploadError(cause instanceof Error ? cause.message : 'Không thể tải banner lên.')
    } finally {
      setBannerUploading(false)
    }
  }
  const list = useQuery({
    queryKey: ['admin', 'catalog-options', kind, page, queryUrlState.q, active, collectionStatus, collectionDateFrom, collectionDateTo, sort, categoryView, parentId, rootOnly, hasProducts, pageSize],
    queryFn: () => {
      const treeView = (kind === 'categories' || kind === 'sizes' || kind === 'colors') && categoryView === 'tree'
      const params = new URLSearchParams({ page: String(page), per_page: String(treeView ? 100 : pageSize) })
      if (queryUrlState.q.trim()) params.set('q', queryUrlState.q.trim())
      if (active) params.set('active', active)
      if (kind === 'collections') {
        if (collectionStatus) params.set('status', collectionStatus)
        if (collectionDateFrom) params.set('date_from', collectionDateFrom)
        if (collectionDateTo) params.set('date_to', collectionDateTo)
      }
      if (kind === 'categories') {
        if (parentId) params.set('parent_id', parentId)
        if (rootOnly) params.set('root_only', rootOnly)
        if (hasProducts) params.set('has_products', hasProducts)
      }
      if (supportsTableSort && (kind !== 'categories' || categoryView === 'table')) params.set('sort', kind === 'colors' && categoryView === 'tree' ? 'sort_order' : sort)
      return apiRequest<ListResponse>(`${apiUrl}/admin/catalog-options/${kind}?${params}`, accessToken)
    },
    enabled: Boolean(accessToken),
  })
  const detail = useQuery({
    queryKey: ['admin', 'catalog-options', kind, 'detail', initialItemId],
    queryFn: () => apiRequest<{ data: ReferenceItem }>(`${apiUrl}/admin/catalog-options/${kind}/${initialItemId}`, accessToken),
    enabled: kind === 'collections' && Boolean(accessToken && initialItemId && canUpdate),
  })
  const categoryParentOptions = useQuery({
    queryKey: ['admin', 'catalog-options', 'categories', 'parent-options'],
    queryFn: () => apiRequest<ListResponse>(`${apiUrl}/admin/categories?page=1&per_page=100`, accessToken),
    enabled: kind === 'categories' && Boolean(accessToken),
  })
  const save = useMutation({
    mutationFn: async (values: ReferenceForm) => {
      const payload: Record<string, string | number | boolean | null> = {}
      if (kind === 'colors' || kind === 'sizes') {
        payload.value = values.name.trim()
        payload.sort_order = Number(values.sort_order || 0)
        if (kind === 'colors') payload.color_hex = values.color_hex || null
        if (kind === 'sizes') payload.group = values.group.trim()
      } else {
        payload.name = values.name.trim()
        if (values.slug.trim()) payload.slug = values.slug.trim()
        payload.is_active = values.is_active
        if (kind === 'categories') { payload.parent_id = values.parent_id ? Number(values.parent_id) : null; payload.sort_order = Number(values.sort_order || 0); payload.image = values.image || null; payload.image_alt = values.image_alt || null; payload.description = values.description || null; payload.meta_title = values.meta_title || null; payload.meta_description = values.meta_description || null }
        if (kind === 'brands') { payload.logo = values.logo || null; payload.banner = values.banner || null; payload.banner_alt = values.banner_alt || null; payload.description = values.description || null; payload.meta_title = values.meta_title || null; payload.meta_description = values.meta_description || null }
        if (kind === 'collections') { payload.description = values.description || null; payload.meta_title = values.meta_title || null; payload.meta_description = values.meta_description || null; payload.banner = values.banner || null; payload.banner_alt = values.banner_alt || null; payload.is_lookbook = values.is_lookbook; payload.starts_at = values.starts_at ? new Date(values.starts_at).toISOString() : null; payload.ends_at = values.ends_at ? new Date(values.ends_at).toISOString() : null }
      }
      const path = `${apiUrl}/admin/catalog-options/${kind}${editing ? `/${editing.id}` : ''}`
      return apiRequest<{ data: ReferenceItem }>(path, accessToken, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
    },
    onError: (error) => { applyServerValidationErrors(form, error, { value: 'name' }) },
    onSuccess: () => { confirmDiscard.clear(); void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog-options', kind] }); setFormOpen(false); setEditing(null); setNotice(t('Đã lưu {{name}}.', { name: t(labels[kind].singular) })); if (initialItemId || location.pathname === '/collections/create') onNavigate?.('/collections') },
  })
  const remove = useMutation({
    mutationFn: (item: ReferenceItem) => apiRequest<{ message: string }>(`${apiUrl}/admin/catalog-options/${kind}/${item.id}`, accessToken, { method: 'DELETE' }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog-options', kind] }); setDeleting(null); setNotice(t('Đã xóa {{name}}.', { name: t(labels[kind].singular) })) },
  })
  const reorderItems = async (items: ReferenceItem[]) => {
    setOrderBusy(true)
    setNotice('')
    try {
      await apiRequest(`${apiUrl}/admin/${kind}/reorder`, accessToken, { method: 'PATCH', body: JSON.stringify({ items: items.map((entry, index) => ({ id: entry.id, sort_order: entry.sort_order ?? index, ...(kind === 'categories' ? { parent_id: entry.parent_id ?? null } : {}) })) }) })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'catalog-options', kind] })
      setNotice(t('Đã lưu thứ tự hiển thị.'))
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : t('Không thể lưu thứ tự.'))
    } finally {
      setOrderBusy(false)
    }
  }
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id || !list.data || orderBusy || q || active) return
    const entries = list.data.data
    const from = entries.findIndex((entry) => entry.id === event.active.id)
    if (from < 0) return

    if (kind === 'categories') {
      const moving = entries[from]
      const overId = String(event.over.id)
      const moveToParent = (parentId: number | null) => {
        if ((moving.parent_id ?? null) === parentId) return
        const siblings = (parent: number | null) => entries
          .filter((entry) => (entry.parent_id ?? null) === parent && entry.id !== moving.id)
          .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0) || left.name.localeCompare(right.name, 'vi'))
        const previousSiblings = siblings(moving.parent_id ?? null)
        const nextSiblings = siblings(parentId)
        void reorderItems([
          ...previousSiblings.map((entry, index) => ({ ...entry, sort_order: index })),
          ...nextSiblings.map((entry, index) => ({ ...entry, sort_order: index })),
          { ...moving, parent_id: parentId, sort_order: nextSiblings.length },
        ])
      }

      if (overId === CATEGORY_ROOT_DROP_ID) {
        moveToParent(null)
        return
      }

      if (overId.startsWith('category-parent-drop:')) {
        const parentId = Number(overId.slice('category-parent-drop:'.length))
        if (!Number.isInteger(parentId) || parentId === moving.id) return
        if (descendantCategoryIds(entries, moving.id).has(parentId)) {
          setNotice(t('Không thể chuyển danh mục vào chính nó hoặc danh mục con.'))
          return
        }
        moveToParent(parentId)
        return
      }
    }

    const to = entries.findIndex((entry) => entry.id === event.over?.id)
    if (to < 0) return
    if (kind === 'categories' && (entries[from].parent_id ?? null) !== (entries[to].parent_id ?? null)) return
    if (kind === 'sizes' && (entries[from].group ?? 'Kích cỡ') !== (entries[to].group ?? 'Kích cỡ')) return
    const sortable = kind === 'categories'
      ? entries.filter((entry) => (entry.parent_id ?? null) === (entries[from].parent_id ?? null))
      : kind === 'sizes' ? entries.filter((entry) => (entry.group ?? 'Kích cỡ') === (entries[from].group ?? 'Kích cỡ')) : entries
    const oldIndex = sortable.findIndex((entry) => entry.id === event.active.id)
    const newIndex = sortable.findIndex((entry) => entry.id === event.over?.id)
    if (oldIndex >= 0 && newIndex >= 0) void reorderItems(arrayMove(sortable, oldIndex, newIndex).map((entry, index) => ({ ...entry, sort_order: index })))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the page instance is reused across reference kinds; discard the previous editor draft.
    setFormOpen(false)
    setEditing(null)
  }, [kind])
  const openForm = (item?: ReferenceItem) => {
    setEditing(item ?? null)
    setCategoryImagePreview(item?.image ?? '')
    setCategoryImageUploadError('')
    setLogoPreview(item?.logo ?? '')
    setLogoUploadError('')
    setBannerPreview(item?.banner ?? '')
    setBannerUploadError('')
    reset(item ? { name: item.name, slug: item.slug ?? '', is_active: item.is_active ?? true, parent_id: item.parent_id ? String(item.parent_id) : '', group: item.group ?? 'Kích cỡ', color_hex: item.color_hex ?? '#000000', sort_order: String(item.sort_order ?? 0), image: item.image ?? '', image_alt: item.image_alt ?? '', logo: item.logo ?? '', description: item.description ?? '', meta_title: item.meta_title ?? '', meta_description: item.meta_description ?? '', banner: item.banner ?? '', banner_alt: item.banner_alt ?? '', is_lookbook: item.is_lookbook ?? false, starts_at: toLocalDateTime(item.starts_at), ends_at: toLocalDateTime(item.ends_at) } : emptyForm)
    save.reset()
    setFormOpen(true)
  }
  useEffect(() => {
    if (kind === 'collections' && (location.pathname === '/collections/create' || new URLSearchParams(location.search).get('create') === '1') && !formOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the create route must open its editor after client-side navigation.
      openForm()
    }
  // Route changes can enter the create URL without remounting this feature page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, location.pathname, location.search, formOpen])
  useEffect(() => {
    if (detail.data?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the editor from the API detail query for direct edit links.
      openForm(detail.data.data)
    }
  // The route identifies a stable record; the detail query only changes when that record loads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.data?.data?.id])
  const closeForm = () => {
    if (!confirmDiscard()) return
    setFormOpen(false)
    setEditing(null)
    if (kind === 'collections' && (initialItemId || location.pathname === '/collections/create' || new URLSearchParams(location.search).get('create') === '1')) onNavigate?.('/collections')
  }
  const columns: DataTableColumn<ReferenceItem>[] = [
    ...(kind === 'brands' ? [{ id: 'logo', header: t('LOGO'), cell: (item: ReferenceItem) => item.logo ? <img className="reference-brand-logo" src={mediaUrl(apiUrl, item.logo)} alt={t('Logo {{name}}', { name: item.name })} loading="lazy" onError={(event) => event.currentTarget.remove()} /> : '—' }] : []),
    ...(kind === 'collections' ? [{ id: 'banner', header: t('BANNER'), cell: (item: ReferenceItem) => item.banner ? <img className="reference-collection-banner" src={mediaUrl(apiUrl, item.banner)} alt={item.banner_alt || t('Bìa bộ sưu tập {{name}}', { name: item.name })} loading="lazy" onError={(event) => event.currentTarget.remove()} /> : '—' }] : []),
    { id: 'name', header: t('TÊN'), sortKey: kind === 'colors' ? 'value' : 'name', sortable: supportsTableSort, cell: (item) => <span className="reference-name">{kind === 'colors' && <i style={{ background: item.color_hex ?? '#fff' }} />}{item.name}</span> },
    ...(kind === 'categories' ? [{ id: 'parent', header: t('DANH MỤC CHA'), cell: (item: ReferenceItem) => item.parent_name ?? t('Gốc') }] : []),
    ...(kind === 'sizes' ? [{ id: 'group', header: t('NHÓM'), cell: (item: ReferenceItem) => item.group ?? t('Kích cỡ') }] : []),
    ...(kind === 'collections' ? [{ id: 'validity', header: t('THỜI GIAN HIỆU LỰC'), sortKey: 'starts_at', sortable: true, cell: (item: ReferenceItem) => <span>{item.starts_at ? formatDateTime(item.starts_at) : t('Không giới hạn')}<br />{item.ends_at ? t('đến {{date}}', { date: formatDateTime(item.ends_at) }) : t('Không giới hạn kết thúc')}</span> }] : []),
    ...(kind === 'colors' || kind === 'sizes' ? [{ id: 'order', header: t('THỨ TỰ'), sortKey: 'sort_order', sortable: kind === 'colors', cell: (item: ReferenceItem) => item.sort_order ?? 0 }] : [{ id: 'slug', header: t('SLUG'), sortable: supportsTableSort && kind !== 'categories', cell: (item: ReferenceItem) => item.slug ?? '—' }]),
    ...(kind === 'categories' ? [{ id: 'order', header: t('THỨ TỰ'), cell: (item: ReferenceItem) => item.sort_order ?? 0 }] : []),
    { id: 'usage', header: kind === 'colors' || kind === 'sizes' ? t('BIẾN THỂ') : t('SẢN PHẨM'), sortKey: kind === 'colors' || kind === 'sizes' ? 'usage_count' : 'product_count', sortable: supportsTableSort, cell: (item) => item.usage_count ?? item.product_count ?? 0 },
    ...(kind === 'colors' || kind === 'sizes' ? [] : [{ id: 'status', header: t('TRẠNG THÁI'), sortKey: 'is_active', sortable: supportsTableSort && kind !== 'collections', cell: (item: ReferenceItem) => kind === 'collections' ? <span className={`collection-status collection-status-${item.status ?? 'disabled'}`}>{t(({ running: 'Đang chạy', upcoming: 'Sắp tới', expired: 'Hết hạn', disabled: 'Tắt' } as const)[item.status ?? 'disabled'])}</span> : <span className={item.is_active ? 'reference-active' : 'reference-inactive'}>{item.is_active ? t('Đang bật') : t('Đã tắt')}</span> }]),
    { id: 'actions', header: t('THAO TÁC'), cell: (item) => <RowActionsMenu label={t('Thao tác {{type}} {{name}}', { type: t(labels[kind].singular), name: item.name })} actions={[...(kind === 'collections' ? [{ id: 'products', label: t('Sản phẩm'), href: `/collections/${item.id}/products` }] : []), ...(canUpdate ? [{ id: 'edit', label: t('Sửa'), onSelect: () => openForm(item) }] : []), ...(canDelete ? [{ id: 'delete', label: t('Xóa'), onSelect: () => setDeleting(item), destructive: true }] : [])]} /> },
  ]

  const activeFilterChips: { id: string; label: string; onRemove: () => void }[] = []
  const addFilterChip = (id: string, label: string, remove: () => void) => activeFilterChips.push({ id, label, onRemove: remove })
  if (q) addFilterChip('q', t('Tìm kiếm: {{query}}', { query: q }), () => setUrlValue('q', ''))
  if (kind === 'categories' && active) addFilterChip('active', active === '1' ? t('Đang bật') : t('Đã tắt'), () => setUrlValue('active', ''))
  if (kind === 'categories' && (parentId || rootOnly)) addFilterChip('parent', rootOnly ? t('Danh mục gốc') : t('Danh mục cha #{{id}}', { id: parentId }), () => { setUrlValue('parent_id', ''); setUrlValue('root_only', '') })
  if (kind === 'categories' && hasProducts) addFilterChip('has_products', hasProducts === '1' ? t('Có sản phẩm') : t('Chưa có sản phẩm'), () => setUrlValue('has_products', ''))
  if (kind === 'collections' && collectionStatus) addFilterChip('status', t('Trạng thái: {{status}}', { status: t(collectionStatus) }), () => setUrlValue('status', ''))
  if (kind === 'collections' && collectionDateFrom) addFilterChip('date_from', t('Hiệu lực từ {{date}}', { date: collectionDateFrom }), () => setUrlValue('date_from', ''))
  if (kind === 'collections' && collectionDateTo) addFilterChip('date_to', t('Hiệu lực đến {{date}}', { date: collectionDateTo }), () => setUrlValue('date_to', ''))
  if (kind !== 'categories' && kind !== 'collections' && active) addFilterChip('active', active === '1' ? t('Đang bật') : t('Đã tắt'), () => setUrlValue('active', ''))

  return <section className="panel reference-page">
    <div className="panel-heading"><div><h2>{t(labels[kind].plural)}</h2><p>{t(labels[kind].hint)}</p></div>{canCreate && <button type="button" className="primary" onClick={() => openForm()}>{t('Thêm {{name}}', { name: t(labels[kind].singular) })}</button>}</div>
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    {initialItemId && detail.isLoading && <p className="shared-loading" role="status">{t('Đang tải bộ sưu tập…')}</p>}
    {initialItemId && detail.isError && <p className="reference-error" role="alert">{detail.error instanceof Error ? detail.error.message : t('Không tải được bộ sưu tập.')} <button type="button" className="secondary" onClick={() => void detail.refetch()}>{t('Thử lại')}</button></p>}
    <FilterBar hasFilters={kind === 'categories' ? categoryFiltersActive : kind === 'collections' ? collectionFiltersActive : Boolean(q || active)} onClear={() => clearFilters(kind === 'categories' ? ['q', 'active', 'parent_id', 'root_only', 'has_products'] : kind === 'collections' ? ['q', 'status', 'date_from', 'date_to'] : ['q', 'active'])} activeFilters={activeFilterChips}>
      <input aria-label={t('Tìm {{name}}', { name: t(labels[kind].singular) })} placeholder={t('Tìm {{name}}...', { name: t(labels[kind].singular) })} value={q} onChange={(event) => setUrlValue('q', event.target.value)} />
      {kind !== 'colors' && kind !== 'sizes' && kind !== 'collections' && <select aria-label={t('Lọc trạng thái')} value={active} onChange={(event) => setUrlValue('active', event.target.value)}><option value="">{t('Tất cả trạng thái')}</option><option value="1">{t('Đang bật')}</option><option value="0">{t('Đã tắt')}</option></select>}
      {kind === 'collections' && <>
        <select aria-label={t('Lọc trạng thái bộ sưu tập')} value={collectionStatus} onChange={(event) => setUrlValue('status', event.target.value)}><option value="">{t('Tất cả trạng thái')}</option><option value="running">{t('Đang chạy')}</option><option value="upcoming">{t('Sắp tới')}</option><option value="expired">{t('Hết hạn')}</option><option value="disabled">{t('Tắt')}</option></select>
      </>}
      {(kind === 'categories' || kind === 'sizes' || kind === 'colors') && <div className="reference-view-toggle" role="group" aria-label={t(kind === 'categories' ? 'Kiểu hiển thị danh mục' : kind === 'sizes' ? 'Kiểu hiển thị kích cỡ' : 'Kiểu hiển thị màu sắc')}><button type="button" className={categoryView === (kind === 'categories' ? 'tree' : 'table') ? 'active' : 'secondary'} aria-pressed={categoryView === (kind === 'categories' ? 'tree' : 'table')} onClick={() => { setUrlValue('view', kind === 'categories' ? 'tree' : 'table'); setUrlValue('page', '1') }}>{t(kind === 'categories' ? 'Cây' : 'Bảng')}</button><button type="button" className={categoryView === (kind === 'categories' ? 'table' : 'tree') ? 'active' : 'secondary'} aria-pressed={categoryView === (kind === 'categories' ? 'table' : 'tree')} onClick={() => { setUrlValue('view', kind === 'categories' ? 'table' : 'tree'); setUrlValue('page', '1') }}>{t(kind === 'categories' ? 'Bảng' : 'Sắp xếp')}</button></div>}
    </FilterBar>
    {(kind === 'categories' || kind === 'collections') && <AdvancedFilterSheet filters={kind === 'categories' ? { parent: parentId ? `parent:${parentId}` : rootOnly ? 'root' : '', has_products: hasProducts } : { date_from: collectionDateFrom, date_to: collectionDateTo }} defaults={kind === 'categories' ? { parent: '', has_products: '' } : { date_from: '', date_to: '' }} activeCount={kind === 'categories' ? [parentId || rootOnly, hasProducts].filter(Boolean).length : [collectionDateFrom, collectionDateTo].filter(Boolean).length} onApply={(values) => { if (kind === 'categories') applyUrlValues({ parent_id: values.parent.startsWith('parent:') ? values.parent.slice(7) : '', root_only: values.parent === 'root' ? '1' : '', has_products: values.has_products }); else applyUrlValues({ date_from: values.date_from, date_to: values.date_to }) }}>
      {(draft, setDraft) => kind === 'categories' ? <><label>{t('Cấp danh mục')}<select value={draft.parent} onChange={(event) => setDraft('parent', event.target.value)}><option value="">{t('Tất cả cấp')}</option><option value="root">{t('Danh mục gốc')}</option>{(categoryParentOptions.data?.data ?? []).map((item) => <option key={item.id} value={`parent:${item.id}`}>{item.name}</option>)}</select></label><label>{t('Sản phẩm')}<select value={draft.has_products} onChange={(event) => setDraft('has_products', event.target.value)}><option value="">{t('Có và chưa có sản phẩm')}</option><option value="1">{t('Có sản phẩm')}</option><option value="0">{t('Chưa có sản phẩm')}</option></select></label></> : <><label>{t('Hiệu lực từ')}<input type="date" value={draft.date_from} onChange={(event) => setDraft('date_from', event.target.value)} /></label><label>{t('Hiệu lực đến')}<input type="date" min={draft.date_from} value={draft.date_to} onChange={(event) => setDraft('date_to', event.target.value)} /></label></>}
    </AdvancedFilterSheet>}
    
    {(kind === 'categories' || kind === 'sizes' || kind === 'colors') && categoryView === 'tree' && canUpdate && <p className="catalog-reorder-hint">{t('Kéo tay nắm để đổi thứ tự cùng cấp.')}{kind === 'categories' ? ` ${t('Thả vào vùng tên danh mục để chuyển thành danh mục con; dùng vùng danh mục gốc để đưa ra cấp cao nhất.')}` : ''}</p>}
    {(kind === 'categories' || kind === 'sizes' || kind === 'colors') && categoryView === 'tree' && list.isLoading && <div className="shared-skeleton" role="status" aria-label={`Đang tải ${labels[kind].plural.toLowerCase()}`} />}
    {(kind === 'categories' || kind === 'sizes' || kind === 'colors') && categoryView === 'tree' && list.error && <p className="reference-error" role="alert">{list.error instanceof Error ? list.error.message : t('Không tải được dữ liệu.')} <button type="button" className="secondary" onClick={() => void list.refetch()}>{t('Thử lại')}</button></p>}
    {(kind === 'categories' || kind === 'sizes' || kind === 'colors') && categoryView === 'tree' && list.data?.data.length ? <>
      {(categoryFiltersActive || list.data.meta.last_page > 1) && <p className="catalog-reorder-hint">{list.data.meta.last_page > 1 ? t('Sắp xếp bị tắt khi danh sách vượt 100 mục để tránh ghi đè thứ tự ngoài trang đang xem.') : t('Xóa bộ lọc để sắp xếp toàn bộ danh sách.')}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        {kind === 'categories' && canUpdate && <CategoryRootDropTarget disabled={orderBusy || categoryFiltersActive || list.data.meta.last_page > 1} />}
        <SortableContext items={(kind === 'categories' ? flattenCategoryTree(list.data.data) : list.data.data).map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ol className="catalog-sortable-list" aria-label={`Thứ tự ${labels[kind].plural.toLowerCase()}`}>{(kind === 'categories' ? flattenCategoryTree(list.data.data) : list.data.data.map((item) => ({ ...item, level: 0 }))).map((item) => <SortableReferenceRow key={item.id} item={item} kind={kind} canUpdate={canUpdate} canDelete={canDelete} busy={orderBusy || !canUpdate || categoryFiltersActive || list.data.meta.last_page > 1} onEdit={openForm} onDelete={setDeleting} />)}</ol>
        </SortableContext>
      </DndContext>
      {list.data.meta.last_page > 1 && <div className="catalog-sortable-pagination"><button type="button" className="secondary" disabled={page <= 1 || orderBusy} onClick={() => setUrlValue('page', String(Math.max(1, page - 1)))}>{t('Trang trước')}</button><span>{t('Trang {{page}}/{{pages}} · {{count}} mục', { page: list.data.meta.current_page, pages: list.data.meta.last_page, count: list.data.meta.total })}</span><button type="button" className="secondary" disabled={page >= list.data.meta.last_page || orderBusy} onClick={() => setUrlValue('page', String(Math.min(list.data.meta.last_page, page + 1)))}>{t('Trang sau')}</button></div>}
    </> : (kind === 'categories' || kind === 'sizes' || kind === 'colors') && categoryView === 'tree' && !list.isLoading && !list.error ? <div className="empty-state"><strong>{q || active || kind === 'categories' && categoryFiltersActive ? t('Không tìm thấy {{name}} phù hợp', { name: t(labels[kind].singular) }) : t('Chưa có {{name}}', { name: t(labels[kind].singular) })}</strong>{q || active || kind === 'categories' && categoryFiltersActive ? <button type="button" className="secondary" onClick={() => clearFilters(kind === 'categories' ? ['q', 'active', 'parent_id', 'root_only', 'has_products'] : ['q', 'active'])}>{t('Xóa bộ lọc')}</button> : <p>{t('Thêm mục mới để bắt đầu quản lý dữ liệu gốc.')}</p>}</div> : (((kind === 'categories' || kind === 'sizes' || kind === 'colors') && categoryView === 'table') || kind !== 'categories' && kind !== 'sizes' && kind !== 'colors') && <DataTable columns={columns} rows={list.data?.data ?? []} rowKey={(item) => item.id} loading={list.isLoading} error={list.error instanceof Error ? list.error.message : null} onRetry={() => void list.refetch()} noResults={Boolean(q || active || categoryFiltersActive || collectionFiltersActive)} emptyTitle={t('Chưa có {{name}}', { name: t(labels[kind].singular) })} emptyDescription={t('Thêm mục mới để bắt đầu quản lý dữ liệu gốc.')} page={list.data?.meta.current_page ?? page} pageCount={list.data?.meta.last_page ?? 1} totalRows={list.data?.meta.total ?? 0} pageSize={pageSize} onPageChange={(nextPage) => setUrlValue('page', String(nextPage))} sortBy={sortBy} sortDirection={sortDirection} onSortChange={(key, direction) => setUrlValue('sort', direction === 'none' ? '' : direction === 'desc' ? `-${key}` : key)} />}
    {formOpen && <form className="reference-form" onSubmit={handleSubmit((values) => save.mutate(values))}><div className="panel-heading"><h3>{editing ? t('Chỉnh sửa') : t('Thêm')} {t(labels[kind].singular)}</h3><button type="button" className="secondary" onClick={closeForm}>{t('Đóng')}</button></div><div className="reference-form-grid">
      <FormField id="catalog-name" label={t(kind === 'colors' || kind === 'sizes' ? 'Giá trị' : 'Tên')} required error={errors.name?.message}><input {...register('name')} autoFocus /></FormField>
      {kind !== 'colors' && kind !== 'sizes' && <FormField id="catalog-slug" label={t("Đường dẫn (slug)")} error={errors.slug?.message}><input placeholder={t("Để trống để tự tạo")} {...register('slug')} /></FormField>}
      {kind === 'categories' && <><FormField id="catalog-parent" label={t("Danh mục cha")} error={errors.parent_id?.message}><select {...register('parent_id')}><option value="">{t("Danh mục gốc")}</option>{flattenCategoryTree(categoryParentOptions.data?.data ?? list.data?.data ?? []).filter((item) => !editing || !descendantCategoryIds(categoryParentOptions.data?.data ?? list.data?.data ?? [], editing.id).has(item.id)).map((item) => <option key={item.id} value={item.id}>{'　'.repeat(item.level)}{item.name}</option>)}</select></FormField><FormField id="catalog-category-order" label={t("Thứ tự")} error={errors.sort_order?.message}><input type="number" min="0" {...register('sort_order')} /></FormField><FormField id="catalog-category-image" label={t("Ảnh danh mục")} error={errors.image?.message}><input type="url" placeholder="https://..." {...register('image', { onChange: (event) => setCategoryImagePreview(event.target.value) })} /><ImageUploader label={t("Tải ảnh lên")} helperText={t("JPG, PNG hoặc WebP, tối đa 2 MB.")} multiple={false} disabled={categoryImageUploading} onFiles={(files) => void uploadCategoryImage(files)} error={categoryImageUploadError} /></FormField><FormField id="catalog-category-image-alt" label={t("Alt text ảnh danh mục")} hint={t("Bắt buộc khi có ảnh. Mô tả hình minh họa cho trình đọc màn hình.")} error={errors.image_alt?.message}><input maxLength={255} {...register('image_alt')} /></FormField>{categoryImagePreview && <img className="reference-category-image-preview" src={mediaUrl(apiUrl, categoryImagePreview)} alt={categoryImageAlt || t("Xem trước ảnh danh mục")} onError={(event) => event.currentTarget.remove()} />}<FormField id="catalog-category-description" label={t("Mô tả")} error={errors.description?.message} className="reference-wide"><textarea rows={4} {...register('description')} /></FormField><FormField id="catalog-category-meta-title" label={t("Tiêu đề meta")} error={errors.meta_title?.message}><input maxLength={255} {...register('meta_title')} /></FormField><FormField id="catalog-category-meta-description" label={t("Mô tả meta")} error={errors.meta_description?.message} className="reference-wide"><textarea rows={3} maxLength={500} {...register('meta_description')} /></FormField></>}
      {kind === 'brands' && <><FormField id="catalog-brand-logo" label={t("Logo") } error={errors.logo?.message}><input type="url" placeholder="https://..." {...register('logo', { onChange: (event) => setLogoPreview(event.target.value) })} /><ImageUploader label={t("Tải logo lên")} helperText={t("JPG, PNG hoặc WebP, tối đa 2 MB.")} multiple={false} disabled={logoUploading} onFiles={(files) => void uploadBrandLogo(files)} error={logoUploadError} />{logoPreview && <img className="reference-brand-logo-preview" src={mediaUrl(apiUrl, logoPreview)} alt={t("Xem trước logo thương hiệu")} onError={(event) => event.currentTarget.remove()} />}</FormField><FormField id="catalog-brand-banner" label={t("Ảnh banner")} error={errors.banner?.message}><input type="url" placeholder="https://..." {...register('banner', { onChange: (event) => setBannerPreview(event.target.value) })} /><ImageUploader label={t("Tải banner lên")} helperText={t("JPG, PNG hoặc WebP, tối đa 2 MB.")} multiple={false} disabled={bannerUploading} onFiles={(files) => void uploadCollectionBanner(files)} error={bannerUploadError} /></FormField><FormField id="catalog-brand-banner-alt" label={t("Alt text ảnh bìa")} hint={t("Bắt buộc khi có banner; mô tả nội dung ảnh cho trình đọc màn hình.")} error={errors.banner_alt?.message}><input maxLength={255} {...register('banner_alt')} /></FormField>{bannerPreview && <img className="reference-collection-banner-preview" src={mediaUrl(apiUrl, bannerPreview)} alt={collectionBannerAlt || t("Xem trước banner thương hiệu")} onError={(event) => event.currentTarget.remove()} />}<FormField id="catalog-brand-description" label={t("Câu chuyện thương hiệu")} error={errors.description?.message} className="reference-wide"><textarea rows={4} {...register('description')} /></FormField><FormField id="catalog-brand-meta-title" label={t("Tiêu đề meta")} error={errors.meta_title?.message}><input maxLength={255} {...register('meta_title')} /></FormField><FormField id="catalog-brand-meta-description" label={t("Mô tả meta")} error={errors.meta_description?.message} className="reference-wide"><textarea rows={3} maxLength={500} {...register('meta_description')} /></FormField></>}
      {kind === 'collections' && <label className="reference-checkbox reference-wide"><input type="checkbox" {...register('is_lookbook')} /> {t('Hiển thị bộ sưu tập tại khối Lookbook trang chủ')}<small>{t('Chỉ chọn được bộ sưu tập đang xuất bản; chọn mục này sẽ thay thế mục Lookbook hiện tại.')}</small></label>}
      {kind === 'colors' && <><FormField id="catalog-color" label={t("Mã màu")} error={errors.color_hex?.message}><input type="color" {...register('color_hex')} /></FormField><FormField id="catalog-color-order" label={t("Thứ tự")} error={errors.sort_order?.message}><input type="number" min="0" {...register('sort_order')} /></FormField></>}
      {kind === 'sizes' && <><FormField id="catalog-size-group" label={t("Nhóm")} hint={t("Ví dụ: Áo, giày, phụ kiện.")} error={errors.group?.message}><input placeholder={t("Kích cỡ")} {...register('group')} /></FormField><FormField id="catalog-size-order" label={t("Thứ tự")} error={errors.sort_order?.message}><input type="number" min="0" {...register('sort_order')} /></FormField></>}
      {kind === 'collections' && <><FormField id="catalog-collection-description" label={t("Mô tả")} error={errors.description?.message} className="reference-wide"><textarea rows={3} {...register('description')} /></FormField><FormField id="catalog-collection-banner" label={t("Ảnh banner")} error={errors.banner?.message}><input type="url" placeholder="https://..." {...register('banner', { onChange: (event) => setBannerPreview(event.target.value) })} /><ImageUploader label={t("Tải banner lên")} helperText={t("JPG, PNG hoặc WebP, tối đa 2 MB.")} multiple={false} disabled={bannerUploading} onFiles={(files) => void uploadCollectionBanner(files)} error={bannerUploadError} /></FormField><FormField id="catalog-collection-banner-alt" label={t("Alt text ảnh bìa")} hint={t("Bắt buộc khi có ảnh bìa. Mô tả nội dung ảnh cho trình đọc màn hình.")} error={errors.banner_alt?.message}><input maxLength={255} {...register('banner_alt')} /></FormField>{bannerPreview && <img className="reference-collection-banner-preview" src={mediaUrl(apiUrl, bannerPreview)} alt={collectionBannerAlt || t("Xem trước banner bộ sưu tập")} onError={(event) => event.currentTarget.remove()} />}<FormField id="catalog-collection-starts" label={t("Bắt đầu")} error={errors.starts_at?.message}><input type="datetime-local" {...register('starts_at')} /></FormField><FormField id="catalog-collection-ends" label={t("Kết thúc")} error={errors.ends_at?.message}><input type="datetime-local" {...register('ends_at')} /></FormField><FormField id="catalog-collection-meta-title" label={t("Tiêu đề meta")} error={errors.meta_title?.message}><input maxLength={255} {...register('meta_title')} /></FormField><FormField id="catalog-collection-meta-description" label={t("Mô tả meta")} error={errors.meta_description?.message} className="reference-wide"><textarea rows={3} maxLength={500} {...register('meta_description')} /></FormField></>}
      {kind !== 'colors' && kind !== 'sizes' && <label className="reference-checkbox"><input type="checkbox" {...register('is_active')} />  {t("Đang bật")}{errors.is_active && <small role="alert">{errors.is_active.message}</small>}</label>}
    </div>{save.error && <p className="reference-error" role="alert">{save.error.message}</p>}<div className="reference-form-actions"><button type="button" className="secondary" onClick={closeForm}>{t("Hủy")}</button><button type="submit" className="primary" disabled={save.isPending || !isDirty}>{save.isPending ? t('Đang lưu...') : t('Lưu')}</button></div></form>}
    <ConfirmDialog open={deleting !== null} title={t('Xóa {{name}}?', { name: t(labels[kind].singular) })} description={remove.error instanceof Error ? remove.error.message : kind === 'categories' ? t('Danh mục “{{name}}” chỉ xóa được khi đã chuyển toàn bộ sản phẩm và danh mục con sang nơi khác.', { name: deleting?.name ?? '' }) : t('Mục “{{name}}” sẽ bị xóa. Những mục đang được sử dụng sẽ được bảo vệ.', { name: deleting?.name ?? '' })} confirmLabel={t('Xóa')} busy={remove.isPending} onConfirm={() => { if (deleting) remove.mutate(deleting) }} onOpenChange={(value) => { if (!value) { setDeleting(null); remove.reset() } }} />
  </section>
}
