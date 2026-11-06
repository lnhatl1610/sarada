import { adminApiFetch } from '../../lib/admin-api'
import { formatVnd } from '../../lib/date-format'
/* eslint-disable react-hooks/incompatible-library -- react-hook-form powers the detail editor. */
import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { DataTable, type DataTableColumn } from '../../components/shared/data-table'
import { FormField } from '../../components/shared/form-field'
import { MoneyInput } from '../../components/shared/money'
import { ApiResponseError, applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { RowActionsMenu } from '../../components/shared/row-actions-menu'
import { ProductImagesPage, type ProductImageDraft } from './ProductImagesPage'
import { ProductVideosPage } from './ProductVideosPage'
import { ProductSeoPreview } from './ProductSeoPreview'
import { mediaUrl } from '../../lib/media-url'
import { ProductTagInput } from './ProductTagInput'
import { StatusBadge } from '../../components/shared/status-badge'
import { VariantBulkEditor } from './VariantBulkEditor'
import { SizeRecommendationsEditor, type SizeRecommendation } from './SizeRecommendationsEditor'
import '../../ReferenceData.css'

type Option = { id: number; name: string }
type Variant = { id: number; sku: string; barcode: string | null; price: number; compare_at_price: number | null; color_value_id: number | null; size_value_id: number | null; weight_gram: number | null; is_active: boolean; color?: { value: string }; size?: { value: string }; inventory?: { quantity: number; reserved: number } }
type Image = { id: number; url: string; alt: string | null; sort_order: number; is_primary: boolean; color_value_id: number | null; is_360_frame: boolean }
type Product = { id: number; name: string; slug: string; sku: string | null; category_id: number | null; brand_id: number | null; short_description: string | null; description: string | null; material: string | null; fit: string | null; care_instruction: string | null; target_gender: string; base_price: number; compare_at_price: number | null; sale_starts_at: string | null; sale_ends_at: string | null; thumbnail: string | null; status: 'draft' | 'active' | 'hidden'; is_featured: boolean; is_new: boolean; meta_title: string | null; meta_description: string | null; view_count: number; sold_count: number; rating_avg: string; rating_count: number; variants: Variant[]; images: Image[]; collections: Option[]; tags: { id: number; name: string; slug: string }[]; size_recommendations: SizeRecommendation[] }
type Props = { productId: number; apiUrl: string; accessToken: string; permissions: string[] }
const detailsSchema = (t: (key: string) => string) => z.object({ name: z.string().trim().min(1, t('Nhập tên sản phẩm.')), slug: z.string().trim().min(1, t('Nhập slug sản phẩm.')), sku: z.string().trim().min(1, t('Nhập SKU sản phẩm.')), category_id: z.string().min(1, t('Chọn danh mục.')), brand_id: z.string(), short_description: z.string(), description: z.string(), material: z.string(), fit: z.string().max(80), care_instruction: z.string(), target_gender: z.string(), base_price: z.string().trim().min(1, t('Nhập giá niêm yết.')).regex(/^\d+$/, t('Giá phải là số nguyên không âm.')), compare_at_price: z.string().regex(/^\d*$/, t('Giá so sánh phải là số nguyên không âm.')), sale_starts_at: z.string(), sale_ends_at: z.string(), thumbnail: z.string(), status: z.enum(['draft', 'active', 'hidden']), is_featured: z.boolean(), is_new: z.boolean(), tags: z.array(z.string().trim().min(1).max(50)).max(20), meta_title: z.string().max(255, t('Tiêu đề SEO tối đa 255 ký tự.')), meta_description: z.string().max(500, t('Mô tả SEO tối đa 500 ký tự.')), collection_ids: z.array(z.number()) }).refine((values) => !values.sale_starts_at || !values.sale_ends_at || values.sale_ends_at >= values.sale_starts_at, { path: ['sale_ends_at'], message: t('Thời điểm kết thúc phải sau hoặc bằng thời điểm bắt đầu.') })
type DetailsForm = z.infer<ReturnType<typeof detailsSchema>>
const variantSchema = (t: (key: string) => string) => z.object({ sku: z.string().trim().min(1, t('Nhập SKU biến thể.')), barcode: z.string(), price: z.string().trim().min(1, t('Nhập giá bán.')).regex(/^\d+$/, t('Giá bán phải là số nguyên không âm.')), compare_at_price: z.string(), color_value_id: z.string(), size_value_id: z.string(), weight_gram: z.string(), is_active: z.boolean(), initial_quantity: z.string() }).refine((variant) => !variant.compare_at_price || Number(variant.compare_at_price) > Number(variant.price), { path: ['compare_at_price'], message: t('Giá so sánh phải lớn hơn giá bán.') })
type VariantForm = z.infer<ReturnType<typeof variantSchema>>
type VariantDraft = { id?: number; draftKey?: string; sku: string; barcode: string | null; price: number; compare_at_price: number | null; color_value_id: number | null; size_value_id: number | null; weight_gram: number | null; is_active: boolean; initial_quantity?: number }
const emptyVariant: VariantForm = { sku: '', barcode: '', price: '0', compare_at_price: '', color_value_id: '', size_value_id: '', weight_gram: '', is_active: true, initial_quantity: '0' }
const money = (value: number) => formatVnd(value)
const toLocalDateTime = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const toApiDateTime = (value: string) => value ? new Date(value).toISOString() : null
const RichTextField = lazy(() => import('./RichTextField').then((module) => ({ default: module.RichTextField })))

async function request<T>(url: string, token: string, t: (key: string) => string, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData
  const response = await adminApiFetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(!isFormData && init?.body ? { 'Content-Type': 'application/json' } : {}) } })
  const body = await response.json() as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể xử lý yêu cầu.'))
  return body
}

export function ProductDetailsPage({ productId, apiUrl, accessToken, permissions }: Props) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [tab, setTab] = useState<'general' | 'variants' | 'images' | 'videos' | 'seo' | 'sizes'>('general')
  const [pendingVariantChanges, setPendingVariantChanges] = useState<VariantDraft[]>([])
  const [pendingImageChanges, setPendingImageChanges] = useState<ProductImageDraft | null>(null)
  const [serverDraftErrors, setServerDraftErrors] = useState<Record<string, string>>({})
  const [savedImageRevision, setSavedImageRevision] = useState(0)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [editingDraftKey, setEditingDraftKey] = useState<string | null>(null)
  const [variantOpen, setVariantOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const canUpdate = permissions.includes('products.update')
  const detailForm = useForm<DetailsForm>({ resolver: zodResolver(detailsSchema(t)) })
  const { reset: resetDetails, formState: { isDirty: detailsDirty } } = detailForm
  const variantForm = useForm<VariantForm>({ resolver: zodResolver(variantSchema(t)), defaultValues: emptyVariant })
  const hasUnsavedChanges = detailsDirty || pendingVariantChanges.length > 0 || pendingImageChanges !== null || (variantOpen && variantForm.formState.isDirty)
  const confirmDiscard = useUnsavedFormGuard(hasUnsavedChanges)
  const confirmVariantDiscard = useUnsavedFormGuard(variantOpen && variantForm.formState.isDirty)
  const product = useQuery({ queryKey: ['admin', 'product-details', productId], queryFn: async () => {
    const body = await request<{ data: Product }>(`${apiUrl}/admin/products/${productId}/details`, accessToken, t)
    return body.data
  }, enabled: Boolean(accessToken) })
  useEffect(() => {
    const item = product.data
    if (!item || detailsDirty) return
    resetDetails({ name: item.name, slug: item.slug, sku: item.sku ?? '', category_id: item.category_id ? String(item.category_id) : '', brand_id: item.brand_id ? String(item.brand_id) : '', short_description: item.short_description ?? '', description: item.description ?? '', material: item.material ?? '', fit: item.fit ?? '', care_instruction: item.care_instruction ?? '', target_gender: item.target_gender, base_price: String(item.base_price), compare_at_price: item.compare_at_price === null ? '' : String(item.compare_at_price), sale_starts_at: toLocalDateTime(item.sale_starts_at), sale_ends_at: toLocalDateTime(item.sale_ends_at), thumbnail: item.thumbnail ?? '', status: item.status, is_featured: item.is_featured, is_new: item.is_new, meta_title: item.meta_title ?? '', meta_description: item.meta_description ?? '', collection_ids: item.collections.map((collection) => collection.id), tags: item.tags.map((tag) => tag.name) })
  }, [product.data, detailsDirty, resetDetails])
  const optionKinds = ['categories', 'brands', 'colors', 'sizes', 'collections'] as const
  const options = useQuery({ queryKey: ['admin', 'product-detail-options'], queryFn: async () => {
    const entries = await Promise.all(optionKinds.map(async (kind) => [kind, (await request<{ data: Option[] }>(`${apiUrl}/admin/catalog-options/${kind}?per_page=100`, accessToken, t)).data] as const))
    return Object.fromEntries(entries) as Record<typeof optionKinds[number], Option[]>
  }, enabled: Boolean(accessToken) })
  const invalidate = () => { void client.invalidateQueries({ queryKey: ['admin', 'product-details', productId] }); void client.invalidateQueries({ queryKey: ['admin', 'products'] }) }
  const saveDetails = useMutation({ mutationFn: (values: DetailsForm & { variants?: VariantDraft[]; imageDraft?: ProductImageDraft | null }) => {
    const { imageDraft, ...formValues } = values
    const payload = { ...formValues, sku: values.sku || null, category_id: values.category_id ? Number(values.category_id) : null, brand_id: values.brand_id ? Number(values.brand_id) : null, short_description: values.short_description || null, description: values.description || null, material: values.material || null, fit: values.fit || null, care_instruction: values.care_instruction || null, base_price: Number(values.base_price), compare_at_price: values.compare_at_price ? Number(values.compare_at_price) : null, sale_starts_at: toApiDateTime(values.sale_starts_at), sale_ends_at: toApiDateTime(values.sale_ends_at), thumbnail: values.thumbnail || null, meta_title: values.meta_title || null, meta_description: values.meta_description || null, ...(imageDraft ? { images: imageDraft.images, delete_image_ids: imageDraft.delete_image_ids } : {}) }
    return request(`${apiUrl}/admin/products/${productId}/details`, accessToken, t, { method: 'PATCH', body: JSON.stringify(payload) })
  }, onError: (error) => {
    applyServerValidationErrors(detailForm, error)
    if (error instanceof ApiResponseError && error.fieldErrors) {
      const tagError = Object.entries(error.fieldErrors).find(([field]) => field === 'tags' || field.startsWith('tags.'))?.[1].find(Boolean)
      if (tagError) detailForm.setError('tags', { type: 'server', message: tagError })
      const draftErrors = Object.fromEntries(Object.entries(error.fieldErrors)
        .filter(([field]) => /^(?:variants|images)\.\d+\./.test(field))
        .map(([field, messages]) => [field, messages.find(Boolean)] as const)
        .filter((entry): entry is readonly [string, string] => Boolean(entry[1])))
      setServerDraftErrors(draftErrors)
    }
  }, onSuccess: () => { confirmDiscard.clear(); detailForm.reset(detailForm.getValues()); setPendingVariantChanges([]); setPendingImageChanges(null); setServerDraftErrors({}); setSavedImageRevision((revision) => revision + 1); invalidate(); void client.invalidateQueries({ queryKey: ['admin', 'product-images', productId] }); setNotice(t("Đã lưu thông tin sản phẩm, biến thể và ảnh.")) } })
  const saveSizeRecommendations = useMutation({ mutationFn: (recommendations: Omit<SizeRecommendation, 'size'>[]) => request(`${apiUrl}/admin/products/${productId}/size-recommendations`, accessToken, t, { method: 'PUT', body: JSON.stringify({ recommendations }) }), onSuccess: () => { invalidate(); setNotice(t('Đã lưu gợi ý size.')) } })
  const stageVariant = (values: VariantForm) => {
    const draft: VariantDraft = {
      ...(editingVariant ? { id: editingVariant.id } : { draftKey: editingDraftKey ?? crypto.randomUUID() }),
      sku: values.sku,
      barcode: values.barcode || null,
      price: Number(values.price),
      compare_at_price: values.compare_at_price ? Number(values.compare_at_price) : null,
      color_value_id: values.color_value_id ? Number(values.color_value_id) : null,
      size_value_id: values.size_value_id ? Number(values.size_value_id) : null,
      weight_gram: values.weight_gram ? Number(values.weight_gram) : null,
      is_active: values.is_active,
      ...(!editingVariant ? { initial_quantity: Number(values.initial_quantity) } : {}),
    }
    setPendingVariantChanges((current) => draft.id
      ? [...current.filter((item) => item.id !== draft.id), draft]
      : draft.draftKey
        ? [...current.filter((item) => item.draftKey !== draft.draftKey), draft]
        : [...current, draft])
    setServerDraftErrors({})
    setEditingDraftKey(null)
    confirmVariantDiscard.clear()
    setVariantOpen(false)
    setNotice(t("Biến thể đã được ghi nhận. Nhấn Lưu để áp dụng tất cả thay đổi."))
  }
  const applyBulkVariantChange = (field: 'price' | 'compare_at_price' | 'weight_gram' | 'initial_quantity' | 'is_active', value: string | boolean) => {
    const pendingById = new Map(pendingVariantChanges.filter((item) => item.id).map((item) => [item.id!, item]))
    const updateDraft = (draft: VariantDraft): VariantDraft => {
      if (field === 'is_active') return { ...draft, is_active: Boolean(value) }
      const numericValue = Number(value)
      if (field === 'initial_quantity') return draft.id ? draft : { ...draft, initial_quantity: numericValue }
      if (field === 'price') return { ...draft, price: numericValue }
      if (field === 'compare_at_price') return { ...draft, compare_at_price: numericValue === 0 ? null : numericValue }
      return { ...draft, weight_gram: numericValue === 0 ? null : numericValue }
    }
    const existing = (product.data?.variants ?? []).map((variant) => updateDraft(pendingById.get(variant.id) ?? {
      id: variant.id,
      sku: variant.sku,
      barcode: variant.barcode,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      color_value_id: variant.color_value_id,
      size_value_id: variant.size_value_id,
      weight_gram: variant.weight_gram,
      is_active: variant.is_active,
    }))
    const newDrafts = pendingVariantChanges.filter((item) => !item.id).map(updateDraft)
    setPendingVariantChanges([...existing, ...newDrafts])
    setNotice(t('Đã áp dụng {{value}} cho {{count}} biến thể. Nhấn Lưu để ghi nhận.', { value: field === 'is_active' ? (value ? t('Đang bật') : t('Đã tắt')) : value, count: existing.length + newDrafts.length }))
  }
  const closeVariantForm = () => { if (confirmVariantDiscard()) { variantForm.reset(); setVariantOpen(false) } }
  const openVariant = (variant?: Variant) => { const source = variant ? pendingVariantChanges.find((item) => item.id === variant.id) ?? variant : null; setEditingVariant(variant ?? null); setEditingDraftKey(null); variantForm.reset(source ? { sku: source.sku, barcode: source.barcode ?? '', price: String(source.price), compare_at_price: source.compare_at_price === null ? '' : String(source.compare_at_price), color_value_id: source.color_value_id ? String(source.color_value_id) : '', size_value_id: source.size_value_id ? String(source.size_value_id) : '', weight_gram: source.weight_gram === null ? '' : String(source.weight_gram), is_active: source.is_active, initial_quantity: '0' } : emptyVariant); setVariantOpen(true) }
  const openPendingVariant = (draft: VariantDraft) => {
    const sourceVariant = draft.id ? product.data?.variants.find((variant) => variant.id === draft.id) ?? null : null
    const draftIndex = pendingVariantChanges.indexOf(draft)
    setEditingVariant(sourceVariant)
    setEditingDraftKey(draft.draftKey ?? null)
    variantForm.reset({ sku: draft.sku, barcode: draft.barcode ?? '', price: String(draft.price), compare_at_price: draft.compare_at_price === null ? '' : String(draft.compare_at_price), color_value_id: draft.color_value_id ? String(draft.color_value_id) : '', size_value_id: draft.size_value_id ? String(draft.size_value_id) : '', weight_gram: draft.weight_gram === null ? '' : String(draft.weight_gram), is_active: draft.is_active, initial_quantity: String(draft.initial_quantity ?? 0) })
    variantForm.clearErrors()
    const variantFields = ['sku', 'barcode', 'price', 'compare_at_price', 'color_value_id', 'size_value_id', 'weight_gram', 'is_active', 'initial_quantity'] as const
    variantFields.forEach((field) => {
      const message = serverDraftErrors[`variants.${draftIndex}.${field}`]
      if (message) variantForm.setError(field, { type: 'server', message })
    })
    setVariantOpen(true)
  }
  const variantColumns: DataTableColumn<Variant>[] = [
    { id: 'sku', header: 'SKU', cell: (item) => item.sku }, { id: 'attributes', header: t("MÀU / SIZE"), cell: (item) => `${item.color?.value ?? '—'} / ${item.size?.value ?? '—'}` },
    { id: 'price', header: t("GIÁ"), cell: (item) => money(item.price) }, { id: 'stock', header: t("TỒN / GIỮ"), cell: (item) => `${item.inventory?.quantity ?? 0} / ${item.inventory?.reserved ?? 0}` },
    { id: 'status', header: t("TRẠNG THÁI"), cell: (item) => item.is_active ? t("Đang bật") : t("Đã tắt") },
    { id: 'actions', header: t("THAO TÁC"), cell: (item) => canUpdate ? <RowActionsMenu label={t('Thao tác biến thể {{sku}}', { sku: item.sku })} actions={[{ id: 'edit', label: t("Sửa"), onSelect: () => openVariant(item) }]} /> : '—' },
  ]
  const primaryImageUrl = detailForm.watch('thumbnail') || product.data?.images.find((image) => image.is_primary)?.url || product.data?.images[0]?.url || null
  const primaryImageAlt = product.data?.images.find((image) => image.url === primaryImageUrl)?.alt ?? ''
  if (product.isLoading) return <section className="panel reference-page"><div className="shared-skeleton" role="status" aria-label={t("Đang tải sản phẩm")} /></section>
  if (product.error || !product.data) return <section className="panel reference-page" role="alert"><p>{product.error?.message ?? t("Không tìm thấy sản phẩm.")}</p><button className="secondary" onClick={() => void product.refetch()}>{t("Thử lại")}</button></section>
  if (options.isLoading) return <section className="panel reference-page"><div className="shared-skeleton" role="status" aria-label={t("Đang tải danh mục và thuộc tính sản phẩm")} /></section>
  if (options.error) return <section className="panel reference-page" role="alert"><p>{options.error instanceof Error ? options.error.message : t("Không tải được danh mục và thuộc tính sản phẩm.")}</p><button className="secondary" onClick={() => void options.refetch()}>{t("Thử lại")}</button></section>
  return <div className="reports-page"><header className="product-create-sticky-header"><div className="product-create-header-title"><button type="button" className="link-button" onClick={() => { const href = "/?page=products"; if (hasUnsavedChanges) setPendingNavigation(new URL(href, window.location.origin).toString()); else window.location.assign(href) }}>{t("← Danh sách sản phẩm")}</button><div><h2>{product.data.name}</h2><small>#{productId} · {product.data.slug}</small></div><StatusBadge kind="product" status={detailForm.watch("status")} /></div>{canUpdate && <div className="reference-form-actions"><button type="button" className="secondary" onClick={() => { const href = '/?page=products'; if (hasUnsavedChanges) setPendingNavigation(new URL(href, window.location.origin).toString()); else window.location.assign(href) }}>{t("Hủy")}</button><button type="button" className="secondary" disabled={saveDetails.isPending || (!hasUnsavedChanges && detailForm.getValues('status') === 'draft')} onClick={() => { detailForm.setValue('status', 'draft'); void detailForm.handleSubmit((values) => saveDetails.mutate({ ...values, ...(pendingVariantChanges.length ? { variants: pendingVariantChanges } : {}), ...(pendingImageChanges ? { imageDraft: pendingImageChanges } : {}) }))() }}>{t("Lưu nháp")}</button><button type="button" className="primary" disabled={saveDetails.isPending || !hasUnsavedChanges} onClick={() => { void detailForm.handleSubmit((values) => saveDetails.mutate({ ...values, ...(pendingVariantChanges.length ? { variants: pendingVariantChanges } : {}), ...(pendingImageChanges ? { imageDraft: pendingImageChanges } : {}) }))() }}>{saveDetails.isPending ? t("Đang lưu...") : t("Lưu")}</button></div>}</header>{notice && <p role="status" className="reference-notice">{notice}</p>}<section className="panel reference-page"><div className="report-metrics"><article><span>{t("LƯỢT XEM")}</span><strong>{product.data.view_count}</strong></article><article><span>{t("ĐÃ BÁN")}</span><strong>{product.data.sold_count}</strong></article><article><span>{t("ĐÁNH GIÁ")}</span><strong>{product.data.rating_avg} · {product.data.rating_count} {t("lượt")}</strong></article><article><span>{t("BIẾN THỂ")}</span><strong>{product.data.variants.length}</strong></article></div><div className="product-create-columns"><main className="product-create-main"><nav className="account-settings-tabs product-edit-tabs" aria-label={t("Các mục chỉnh sửa sản phẩm")} role="tablist">{([{ id: 'general', label: t("Thông tin chung") }, { id: 'variants', label: t("Giá & biến thể") }, { id: 'images', label: t("Hình ảnh") }, { id: 'videos', label: t("Video") }, { id: 'sizes', label: t("Gợi ý size") }, { id: 'seo', label: 'SEO' }] as const).map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
    <div className="reference-form">{tab === 'general' && <><h3>{t("Thông tin chung")}</h3><div className="reference-form-grid"><FormField id="product-detail-name" label={t("Tên")} required error={detailForm.formState.errors.name?.message}><input disabled={!canUpdate} {...detailForm.register('name')} /></FormField><FormField id="product-detail-slug" label={t("Đường dẫn (slug)")} required error={detailForm.formState.errors.slug?.message}><input disabled={!canUpdate} {...detailForm.register('slug')} /></FormField><FormField id="product-detail-sku" label={t("SKU sản phẩm")} required error={detailForm.formState.errors.sku?.message}><input disabled={!canUpdate} {...detailForm.register('sku')} /></FormField><FormField id="product-detail-short-description" label={t("Mô tả ngắn")} error={detailForm.formState.errors.short_description?.message} className="reference-wide"><textarea rows={2} disabled={!canUpdate} {...detailForm.register('short_description')} /></FormField><div className="shared-form-field reference-wide"><label id="product-detail-description-label">{t("Mô tả")}</label><Controller name="description" control={detailForm.control} render={({ field }) => <Suspense fallback={<div className="reference-rich-editor-loading" role="status">{t("Đang tải trình soạn thảo…")}</div>}><RichTextField value={field.value ?? ''} onChange={field.onChange} disabled={!canUpdate} ariaLabel={t("Mô tả chi tiết sản phẩm")} ariaDescribedBy={detailForm.formState.errors.description ? 'product-detail-description-error' : undefined} invalid={Boolean(detailForm.formState.errors.description)} /></Suspense>} />{detailForm.formState.errors.description && <small id="product-detail-description-error" className="shared-field-error" role="alert">{detailForm.formState.errors.description.message}</small>}</div><FormField id="product-detail-material" label={t("Chất liệu")} error={detailForm.formState.errors.material?.message}><input disabled={!canUpdate} {...detailForm.register('material')} /></FormField><FormField id="product-detail-fit" label={t("Ki\u1ec3u d\u00e1ng / form")} hint={t("V\u00ed d\u1ee5: su\u00f4ng, \u00f4m, oversized.")} error={detailForm.formState.errors.fit?.message}><input disabled={!canUpdate} maxLength={80} {...detailForm.register('fit')} /></FormField><FormField id="product-detail-care" label={t("Hướng dẫn bảo quản")} error={detailForm.formState.errors.care_instruction?.message}><input disabled={!canUpdate} {...detailForm.register('care_instruction')} /></FormField></div></>}
    <div hidden={tab !== "variants"}>    <h3>{t("Giá và hiển thị")}</h3><p>{t("Ở từng biến thể, nhập giá khuyến mãi tại Giá bán và giá gốc tại Giá so sánh. Thời gian dưới đây áp dụng chung cho các biến thể có giảm giá.")}</p><div className="reference-form-grid"><MoneyInput label={t("Giá niêm yết (VND)")} error={detailForm.formState.errors.base_price?.message} required disabled={!canUpdate} {...detailForm.register('base_price')} /><MoneyInput label={t("Giá so sánh (VND)")} error={detailForm.formState.errors.compare_at_price?.message} disabled={!canUpdate} {...detailForm.register('compare_at_price')} /><FormField id="product-detail-sale-starts-at" label={t("Bắt đầu khuyến mãi")} error={detailForm.formState.errors.sale_starts_at?.message}><input type="datetime-local" disabled={!canUpdate} {...detailForm.register('sale_starts_at')} /></FormField><FormField id="product-detail-sale-ends-at" label={t("Kết thúc khuyến mãi")} hint={t("Để trống nếu không giới hạn thời gian. Lịch áp dụng cho các biến thể có giá so sánh cao hơn giá bán.")} error={detailForm.formState.errors.sale_ends_at?.message}><input type="datetime-local" disabled={!canUpdate} {...detailForm.register('sale_ends_at')} /></FormField></div></div>
    <div hidden={tab !== "seo"}>    <h3>{t("SEO và bộ sưu tập")}</h3><div className="reference-form-grid"><FormField id="product-detail-meta-title" label={t("Tiêu đề SEO")} error={detailForm.formState.errors.meta_title?.message}><input maxLength={255} disabled={!canUpdate} {...detailForm.register("meta_title")} /></FormField><small className="product-seo-character-count">{(detailForm.watch("meta_title") ?? "").length}{t("/255 ký tự")}</small><FormField id="product-detail-meta-description" label={t("Mô tả SEO")} error={detailForm.formState.errors.meta_description?.message}><textarea rows={3} maxLength={500} disabled={!canUpdate} {...detailForm.register("meta_description")} /></FormField><small className="product-seo-character-count">{(detailForm.watch("meta_description") ?? "").length}{t("/500 ký tự")}</small></div></div>{saveDetails.error && <p role="alert" className="reference-error">{saveDetails.error.message}</p>}</div><aside className="product-create-aside">
<section className="product-create-side-card"><h3>{t("Trạng thái và nhãn")}</h3><FormField id="product-detail-status" label={t("Trạng thái")} required error={detailForm.formState.errors.status?.message}><select disabled={!canUpdate} {...detailForm.register('status')}><option value="draft">{t("Bản nháp")}</option><option value="active">{t("Đang bán")}</option><option value="hidden">{t("Ẩn")}</option></select></FormField><label className="reference-checkbox reference-switch"><input type="checkbox" role="switch" disabled={!canUpdate} {...detailForm.register('is_featured')} /> {t("Nổi bật")}{detailForm.formState.errors.is_featured && <small role="alert">{detailForm.formState.errors.is_featured.message}</small>}</label><label className="reference-checkbox reference-switch"><input type="checkbox" role="switch" disabled={!canUpdate} {...detailForm.register('is_new')} /> {t("Hàng mới")}{detailForm.formState.errors.is_new && <small role="alert">{detailForm.formState.errors.is_new.message}</small>}</label></section>
<section className="product-create-side-card"><h3>{t("Phân loại")}</h3><div className="product-create-side-fields"><FormField id="product-detail-category" label={t("Danh mục")} required error={detailForm.formState.errors.category_id?.message}><select disabled={!canUpdate} {...detailForm.register('category_id')}><option value="">{t("Chưa chọn")}</option>{options.data?.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><FormField id="product-detail-brand" label={t("Thương hiệu")} error={detailForm.formState.errors.brand_id?.message}><select disabled={!canUpdate} {...detailForm.register('brand_id')}><option value="">{t("Chưa chọn")}</option>{options.data?.brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><FormField id="product-detail-gender" label={t("Đối tượng")} error={detailForm.formState.errors.target_gender?.message}><select disabled={!canUpdate} {...detailForm.register('target_gender')}><option value="unisex">{t("Phi giới tính")}</option><option value="men">{t("Nam")}</option><option value="women">{t("Nữ")}</option><option value="kids">{t("Trẻ em")}</option></select></FormField><ProductTagInput value={detailForm.watch('tags') ?? []} disabled={!canUpdate} error={detailForm.formState.errors.tags?.message} onChange={(tags) => detailForm.setValue('tags', tags, { shouldDirty: true, shouldValidate: true })} /><fieldset className="reference-wide"><legend>{t("Bộ sưu tập")}</legend>{options.data?.collections.map((item) => <label key={item.id}><input type="checkbox" disabled={!canUpdate} checked={detailForm.watch('collection_ids')?.includes(item.id) ?? false} onChange={(event) => { const current = detailForm.getValues('collection_ids') ?? []; detailForm.setValue('collection_ids', event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id), { shouldDirty: true }) }} /> {item.name}</label>)}</fieldset>{detailForm.formState.errors.collection_ids && <small role="alert">{detailForm.formState.errors.collection_ids.message}</small>}</div></section>
<section className="product-create-side-card"><h3>{t("Ảnh đại diện")}</h3>{primaryImageUrl ? <><img className="product-create-primary-image" src={mediaUrl(apiUrl, primaryImageUrl)} alt={primaryImageAlt || product.data.name} onError={(event) => { event.currentTarget.hidden = true }} />{primaryImageAlt.trim().toLocaleLowerCase('vi-VN').startsWith('ảnh ai demo:') && <strong className="product-image-demo-badge">{t("Ảnh AI demo")}</strong>}</> : <p>{t("Chưa có ảnh sản phẩm. Có thể dùng ảnh AI demo cho UAT; trước khi kinh doanh, hãy tải ảnh thật do cửa hàng cung cấp.")}</p>}<FormField id="product-detail-thumbnail" label={t("Ảnh đại diện URL")} hint={t('Ảnh AI chỉ dùng làm dữ liệu demo/UAT, chưa xác nhận là ảnh hàng đang bán. Khi kinh doanh, hãy thay bằng ảnh thật do cửa hàng cung cấp.')} error={detailForm.formState.errors.thumbnail?.message}><input type="url" disabled={!canUpdate} {...detailForm.register('thumbnail')} /></FormField><button type="button" className="secondary" onClick={() => setTab('images')}>{t("Quản lý hình ảnh")}</button><button type="button" className="secondary" onClick={() => setTab('videos')}>{t("Quản lý video")}</button></section>
<section className="product-create-side-card"><h3>{t("Xem trước trên Google")}</h3><ProductSeoPreview title={detailForm.watch('meta_title') || detailForm.watch('name')} slug={detailForm.watch('slug')} description={detailForm.watch('meta_description') || detailForm.watch('short_description')} /><button type="button" className="link-button" onClick={() => setTab('seo')}>{t("Chỉnh SEO")}</button></section>
</aside></main></div></section>
    <section hidden={tab !== "sizes"}><SizeRecommendationsEditor key={product.data.id} sizes={product.data.variants.flatMap((variant) => variant.size_value_id && variant.size ? [{ id: variant.size_value_id, value: variant.size.value }] : [])} recommendations={product.data.size_recommendations ?? []} disabled={!canUpdate} busy={saveSizeRecommendations.isPending} error={saveSizeRecommendations.error?.message} onSave={(items) => saveSizeRecommendations.mutate(items)} /></section>
    <section hidden={tab !== "variants"} className="panel reference-page"><div className="panel-heading"><div><h2>{t("Biến thể")}</h2><p>{t("Mỗi tổ hợp màu và kích cỡ chỉ được tạo một lần. Điều chỉnh tồn tại trang kho.")}</p></div>{permissions.includes('products.create') && <button className="primary" onClick={() => openVariant()}>{t("Thêm biến thể")}</button>}</div>{canUpdate && <VariantBulkEditor onApply={applyBulkVariantChange} />}<DataTable columns={variantColumns} rows={product.data.variants} rowKey={(item) => item.id} emptyTitle={t("Chưa có biến thể")} />{pendingVariantChanges.length > 0 && <div className="pending-variant-changes" aria-live="polite"><h3>{t("Thay đổi biến thể chờ lưu")}</h3>{pendingVariantChanges.map((draft) => <article key={draft.id ?? draft.draftKey}><span><strong>{draft.sku}</strong> · {draft.id ? t("Cập nhật") : t("Tạo mới")} · {money(draft.price)} {t("· tồn đầu")}{draft.initial_quantity ?? t("không đổi")}</span><div><button type="button" className="secondary" onClick={() => openPendingVariant(draft)}>{t("Sửa")}</button><button type="button" className="secondary" onClick={() => setPendingVariantChanges((current) => current.filter((item) => item.id !== draft.id && item.draftKey !== draft.draftKey))}>{t("Bỏ")}</button></div></article>)}</div>}{variantOpen && <form className="reference-form" onSubmit={variantForm.handleSubmit(stageVariant)}><h3>{editingVariant ? t("Sửa") : t("Thêm")} {t("biến thể")}</h3><div className="reference-form-grid"><FormField id="variant-sku" label={t("SKU")} required error={variantForm.formState.errors.sku?.message}><input {...variantForm.register('sku')} /></FormField><FormField id="variant-barcode" label={t("Mã vạch")} error={variantForm.formState.errors.barcode?.message}><input {...variantForm.register('barcode')} /></FormField><MoneyInput label={t("Giá bán (VND)")} error={variantForm.formState.errors.price?.message} required {...variantForm.register('price')} /><MoneyInput label={t("Giá so sánh (VND)")} error={variantForm.formState.errors.compare_at_price?.message} {...variantForm.register('compare_at_price')} /><FormField id="variant-color" label={t("Màu sắc")} error={variantForm.formState.errors.color_value_id?.message}><select {...variantForm.register('color_value_id')}><option value="">{t("Không chọn")}</option>{options.data?.colors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><FormField id="variant-size" label={t("Kích cỡ")} error={variantForm.formState.errors.size_value_id?.message}><select {...variantForm.register('size_value_id')}><option value="">{t("Không chọn")}</option>{options.data?.sizes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><FormField id="variant-weight" label={t("Trọng lượng (gram)")} error={variantForm.formState.errors.weight_gram?.message}><input type="number" min="0" step="1" {...variantForm.register('weight_gram')} /></FormField>{!editingVariant && <FormField id="variant-initial-stock" label={t("Tồn khởi tạo")} error={variantForm.formState.errors.initial_quantity?.message}><input type="number" min="0" step="1" {...variantForm.register('initial_quantity')} /></FormField>}<label className="reference-checkbox reference-switch"><input type="checkbox" role="switch" {...variantForm.register('is_active')} /> {t("Đang bán")}{variantForm.formState.errors.is_active && <small role="alert">{variantForm.formState.errors.is_active.message}</small>}</label></div><div className="reference-form-actions"><button type="button" className="secondary" onClick={closeVariantForm}>{t("Hủy")}</button><button className="primary" disabled={!variantForm.formState.isDirty}>{t("Lưu biến thể")}</button></div></form>}</section>
    <section hidden={tab !== "images"} className="panel reference-page"><ProductImagesPage key={savedImageRevision} productId={productId} apiUrl={apiUrl} accessToken={accessToken} staged serverValidationErrors={serverDraftErrors} onDraftChange={(draft) => { setPendingImageChanges(draft); setServerDraftErrors((errors) => Object.fromEntries(Object.entries(errors).filter(([field]) => !field.startsWith('images.')))) }} /></section><section hidden={tab !== 'videos'}><ProductVideosPage productId={productId} apiUrl={apiUrl} canUpdate={canUpdate} /></section><ConfirmDialog open={pendingNavigation !== null} title={t("Rời khỏi biểu mẫu sản phẩm?")} description={t("Các thay đổi chưa lưu sẽ bị mất.")} confirmLabel={t("Rời trang")} onConfirm={() => { const href = pendingNavigation; setPendingNavigation(null); confirmDiscard.clear(); confirmVariantDiscard.clear(); if (href) window.location.assign(href) }} onOpenChange={(next) => { if (!next) setPendingNavigation(null) }} /></div>
}
