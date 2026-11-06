import { adminApiFetch } from '../../lib/admin-api'
/* eslint-disable react-hooks/incompatible-library -- react-hook-form drives the controlled wizard fields. */
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../../ProductForm.css'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { z } from 'zod'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { FormField } from '../../components/shared/form-field'
import { MoneyInput } from '../../components/shared/money'
import { ImageUploader } from '../../components/shared/image-uploader'
import { ProductSeoPreview } from './ProductSeoPreview'
import { ProductTagInput } from './ProductTagInput'
import { StatusBadge } from '../../components/shared/status-badge'
import { VariantBulkEditor } from './VariantBulkEditor'
import { mediaUrl } from '../../lib/media-url'

const schema = (t: (key: string) => string) => z.object({
  name: z.string().trim().min(1, t('Tên sản phẩm bắt buộc')).max(255),
  slug: z.string().trim().max(255).optional(),
  sku: z.string().trim().min(1, t('SKU sản phẩm bắt buộc')).max(64, t('SKU tối đa 64 ký tự')),
  category_id: z.string().min(1, t('Hãy chọn danh mục')),
  brand_id: z.string().optional(),
  target_gender: z.enum(['men', 'women', 'unisex', 'kids']),
  short_description: z.string().max(500).optional(),
  description: z.string().optional(),
  material: z.string().max(255).optional(),
  fit: z.string().max(80).optional(),
  care_instruction: z.string().max(500).optional(),
  base_price: z.string().regex(/^\d+$/, t('Giá phải là số nguyên không âm')),
  compare_at_price: z.string().regex(/^\d*$/, t('Giá phải là số nguyên không âm')).optional(),
  sale_starts_at: z.string().optional(),
  sale_ends_at: z.string().optional(),
  status: z.enum(['draft', 'active', 'hidden']),
  is_featured: z.boolean(),
  is_new: z.boolean(),
  collection_ids: z.array(z.string()),
  tags: z.array(z.string().trim().min(1).max(50)).max(20),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
}).refine((values) => !values.sale_starts_at || !values.sale_ends_at || values.sale_ends_at >= values.sale_starts_at, { path: ['sale_ends_at'], message: t('Thời điểm kết thúc phải sau hoặc bằng thời điểm bắt đầu.') })
const variantSchema = (t: (key: string) => string) => z.object({
  sku: z.string().trim().min(1, t('SKU biến thể bắt buộc')).max(64, t('SKU tối đa 64 ký tự')),
  barcode: z.string().max(100, t('Mã vạch tối đa 100 ký tự')),
  price: z.string().regex(/^\d+$/, t('Giá biến thể phải là số nguyên không âm')),
  compare_at_price: z.string().regex(/^\d*$/, t('Giá so sánh phải là số nguyên không âm')),
  color_value_id: z.string(),
  size_value_id: z.string(),
  initial_quantity: z.string().regex(/^\d+$/, t('Tồn khởi tạo phải là số nguyên không âm')),
  weight_gram: z.string().regex(/^\d*$/, t('Trọng lượng phải là số nguyên không âm')),
  is_active: z.boolean(),
}).refine((variant) => !variant.compare_at_price || Number(variant.compare_at_price) > Number(variant.price), { path: ['compare_at_price'], message: t('Giá so sánh phải lớn hơn giá bán.') })
type Values = z.infer<ReturnType<typeof schema>>
type Option = { id: number; name: string; parent_id?: number | null; sort_order?: number }
type Variant = z.infer<ReturnType<typeof variantSchema>>
type DraftImage = { id: string; kind: 'url' | 'file'; src: string; file?: File; alt: string; color_value_id: string; is_primary: boolean }
const isAiDemoImage = (alt?: string | null) => alt?.trim().toLocaleLowerCase('vi-VN').startsWith('ảnh ai demo:') ?? false
type Props = { apiUrl: string; accessToken: string; onCreated: (id: number) => void; onCancel: () => void }
const RichTextField = lazy(() => import('./RichTextField').then((module) => ({ default: module.RichTextField })))
const emptyVariant: Variant = { sku: '', price: '0', compare_at_price: '', color_value_id: '', size_value_id: '', initial_quantity: '0', barcode: '', weight_gram: '', is_active: true }
const makeSlug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function flattenCategoryOptions(categories: Option[]) {
  const children = new Map<number | null, Option[]>()
  for (const category of categories) {
    const key = category.parent_id ?? null
    children.set(key, [...(children.get(key) ?? []), category])
  }
  for (const values of children.values()) values.sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0) || left.name.localeCompare(right.name, 'vi'))
  const result: Array<Option & { depth: number }> = []
  const visited = new Set<number>()
  const addChildren = (parentId: number | null, depth: number) => {
    for (const category of children.get(parentId) ?? []) {
      if (visited.has(category.id)) continue
      visited.add(category.id)
      result.push({ ...category, depth })
      addChildren(category.id, depth + 1)
    }
  }
  addChildren(null, 0)
  for (const category of categories) if (!visited.has(category.id)) { visited.add(category.id); result.push({ ...category, depth: 0 }); addChildren(category.id, 1) }
  return result
}

function DraftImageCard({ image, index, colors, apiUrl, onChange, onRemove, onMakePrimary }: { image: DraftImage; index: number; colors: Option[]; apiUrl: string; onChange: (id: string, field: 'alt' | 'color_value_id', value: string) => void; onRemove: (image: DraftImage) => void; onMakePrimary: (id: string) => void }) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id })
  return <article ref={setNodeRef} className={`product-image-sortable${isDragging ? ' is-dragging' : ''}`} style={{ transform: CSS.Transform.toString(transform), transition }}>
    <img src={image.kind === 'file' ? image.src : mediaUrl(apiUrl, image.src)} alt={image.alt || t('Ảnh sản phẩm {{index}}', { index: index + 1 })} />
    <div className="product-image-sortable-content"><div className="product-image-sortable-heading">
      <button type="button" className="secondary product-image-drag-handle" aria-label={t('Kéo để sắp xếp ảnh {{index}}', { index: index + 1 })} {...attributes} {...listeners}><GripVertical size={16} aria-hidden="true" /><span>{t("Ảnh")}{index + 1}</span></button>
      {image.is_primary ? <strong className="product-image-primary-badge">{t("Ảnh chính")}</strong> : <button type="button" className="secondary" onClick={() => onMakePrimary(image.id)}>{t("Đặt ảnh chính")}</button>}
      {isAiDemoImage(image.alt) && <strong className="sr-only">{t("Ảnh AI demo")}</strong>}
    </div>
      <small>{image.kind === 'file' ? image.file?.name : image.src}</small>
      <FormField id={`product-image-${image.id}-alt`} label={t("Mô tả ảnh (alt text)")}><input maxLength={255} value={image.alt} onChange={(event) => onChange(image.id, 'alt', event.target.value)} /></FormField>
      <FormField id={`product-image-${image.id}-color`} label={t("Ảnh theo màu")}><select value={image.color_value_id} onChange={(event) => onChange(image.id, 'color_value_id', event.target.value)}><option value="">{t("Dùng cho mọi màu")}</option>{colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}</select></FormField>
      <button type="button" className="secondary" onClick={() => onRemove(image)}>{t("Xóa ảnh")}</button>
    </div>
  </article>
}

function VariantMatrixControls({ options, colors, sizes, onColors, onSizes, onGenerate }: { options?: Record<'colors' | 'sizes', Option[]>; colors: string[]; sizes: string[]; onColors: (values: string[]) => void; onSizes: (values: string[]) => void; onGenerate: () => void }) {
  const { t } = useTranslation()
  return <fieldset className="reference-form-grid"><legend>{t("Ma trận màu × kích cỡ")}</legend><FormField id="product-variant-matrix-colors" label={t("Màu (chọn nhiều)")}><select multiple value={colors} onChange={(event) => onColors(Array.from(event.target.selectedOptions, (option) => option.value))}>{options?.colors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><FormField id="product-variant-matrix-sizes" label={t("Kích cỡ (chọn nhiều)")}><select multiple value={sizes} onChange={(event) => onSizes(Array.from(event.target.selectedOptions, (option) => option.value))}>{options?.sizes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><button type={'button'} className={'secondary'} onClick={onGenerate}>{t("Tạo biến thể theo ma trận")}</button></fieldset>
}

function VariantFields({ variants, variantErrors, options, onChange, onRemove, onAdd, onBulkChange }: {
  variants: Variant[]
  variantErrors: Record<string, string>
  options?: Record<'colors' | 'sizes', Option[]>
  onChange: (index: number, field: keyof Variant, value: string | boolean) => void
  onRemove: (index: number) => void
  onAdd: () => void
  onBulkChange: (field: keyof Variant, value: string | boolean) => void
}) {
  const { t } = useTranslation()
  return <>
    <VariantBulkEditor includeInitialQuantity onApply={onBulkChange} />
    {variants.map((variant, index) => {
      const fieldId = (field: keyof Variant) => `product-variant-${index}-${field}`
      const fieldError = (field: keyof Variant) => variantErrors[`variants.${index}.${field}`]

      return <fieldset className="reference-form-grid product-create-variant" key={index}>
        <legend>{t("Biến thể")}{index + 1}</legend>
        <FormField id={fieldId('sku')} label={t("SKU")} required error={fieldError('sku')}><input maxLength={64} value={variant.sku} onChange={(event) => onChange(index, 'sku', event.target.value)} /></FormField>
        <FormField id={fieldId('barcode')} label={t("Mã vạch")} error={fieldError('barcode')}><input maxLength={100} value={variant.barcode} onChange={(event) => onChange(index, 'barcode', event.target.value)} /></FormField>
        <MoneyInput id={fieldId('price')} label={t("Giá bán (VND)")} required error={fieldError('price')} value={variant.price} onChange={(event) => onChange(index, 'price', event.target.value)} />
        <MoneyInput id={fieldId('compare_at_price')} label={t("Giá so sánh (VND)")} error={fieldError('compare_at_price')} value={variant.compare_at_price} onChange={(event) => onChange(index, 'compare_at_price', event.target.value)} />
        <MoneyInput id={fieldId('initial_quantity')} label={t("Tồn khởi tạo")} error={fieldError('initial_quantity')} value={variant.initial_quantity} onChange={(event) => onChange(index, 'initial_quantity', event.target.value)} />
        <FormField id={fieldId('weight_gram')} label={t("Trọng lượng (gram)")} error={fieldError('weight_gram')}><input type="number" min="0" step="1" value={variant.weight_gram} onChange={(event) => onChange(index, 'weight_gram', event.target.value)} /></FormField>
        <FormField id={fieldId('color_value_id')} label={t("Màu")} error={fieldError('color_value_id')}><select value={variant.color_value_id} onChange={(event) => onChange(index, 'color_value_id', event.target.value)}><option value="">{t("Không chọn")}</option>{options?.colors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
        <FormField id={fieldId('size_value_id')} label={t("Kích cỡ")} error={fieldError('size_value_id')}><select value={variant.size_value_id} onChange={(event) => onChange(index, 'size_value_id', event.target.value)}><option value="">{t("Không chọn")}</option>{options?.sizes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
        <label className="reference-checkbox"><input type="checkbox" checked={variant.is_active} onChange={(event) => onChange(index, 'is_active', event.target.checked)} /> {t("Đang bán")}</label>
        {variants.length > 1 && <button type="button" className="secondary" onClick={() => onRemove(index)}>{t("Xóa biến thể")}</button>}
      </fieldset>
    })}
    <button type="button" className="secondary" onClick={onAdd}>{t("+ Thêm biến thể")}</button>
  </>
}

export function ProductCreatePage({ apiUrl, accessToken, onCreated, onCancel }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'general' | 'variants' | 'images' | 'seo'>('general')
  const [variants, setVariants] = useState<Variant[]>([{ ...emptyVariant }])
  const [pendingVariantMatrix, setPendingVariantMatrix] = useState<Variant[] | null>(null)
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([])
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([])
  const [images, setImages] = useState<DraftImage[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [createdProductId, setCreatedProductId] = useState<number | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)
  const [imageProgress, setImageProgress] = useState<{ name: string; percent: number } | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const imageDraftsRef = useRef(images)
  imageDraftsRef.current = images
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  useEffect(() => () => imageDraftsRef.current.forEach((image) => { if (image.kind === 'file') URL.revokeObjectURL(image.src) }), [])
  const form = useForm<Values>({ resolver: zodResolver(schema(t)), defaultValues: { target_gender: 'unisex', status: 'draft', is_featured: false, is_new: false, collection_ids: [], tags: [], base_price: '0', compare_at_price: '', sale_starts_at: '', sale_ends_at: '' } })
  const productName = form.watch('name')
  const hasUnsavedChanges = createdProductId === null && (form.formState.isDirty || imageUrl.trim() !== '' || images.length > 0 || selectedColorIds.length > 0 || selectedSizeIds.length > 0 || JSON.stringify(variants) !== JSON.stringify([emptyVariant]))
  const confirmDiscard = useUnsavedFormGuard(hasUnsavedChanges)
  useEffect(() => { if (!slugEdited) form.setValue('slug', makeSlug(productName ?? ''), { shouldValidate: true }) }, [form, productName, slugEdited])
  const requestCancel = () => { if (hasUnsavedChanges) setPendingNavigation('/products'); else onCancel() }
  const options = useQuery({ queryKey: ['admin', 'create-product-options'], queryFn: async () => {
     const kinds = ['categories', 'brands', 'colors', 'sizes', 'collections'] as const
    const result = await Promise.all(kinds.map(async (kind) => { const response = await adminApiFetch(`${apiUrl}/admin/catalog-options/${kind}?per_page=100`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }); if (!response.ok) throw new Error(t('Không tải được tùy chọn catalog.')); return [kind, (await response.json() as { data: Option[] }).data] as const }))
    return Object.fromEntries(result) as Record<typeof kinds[number], Option[]>
  }, enabled: Boolean(accessToken) })
  const categoryOptions = flattenCategoryOptions(options.data?.categories ?? [])
  const save = async (values: Values) => {
    if (createdProductId) return
    const checkedVariants = z.array(variantSchema(t)).min(1, t('Sản phẩm cần có ít nhất một biến thể.')).safeParse(variants)
    const nextVariantErrors: Record<string, string> = {}
    if (!checkedVariants.success) {
      for (const issue of checkedVariants.error.issues) {
        if (typeof issue.path[0] === 'number' && typeof issue.path[1] === 'string') nextVariantErrors[`variants.${issue.path[0]}.${issue.path[1]}`] = issue.message
      }
    }
    const seenSkus = new Set<string>()
    variants.forEach((variant, index) => {
      const sku = variant.sku.trim().toLocaleLowerCase('vi-VN')
      if (sku && seenSkus.has(sku)) nextVariantErrors[`variants.${index}.sku`] = t("SKU biến thể không được trùng nhau.")
      if (sku) seenSkus.add(sku)
    })
    if (Object.keys(nextVariantErrors).length) {
      setVariantErrors(nextVariantErrors)
      setTab('variants')
      setError(t("Vui lòng sửa các trường biến thể được đánh dấu."))
      return
    }
    setVariantErrors({})
    setSaving(true); setError('')
    let productId: number | null = null
    try {
       const payload = { ...values, slug: values.slug || undefined, category_id: Number(values.category_id), brand_id: values.brand_id ? Number(values.brand_id) : null, collection_ids: values.collection_ids.map(Number), compare_at_price: values.compare_at_price || null, sale_starts_at: values.sale_starts_at ? new Date(values.sale_starts_at).toISOString() : null, sale_ends_at: values.sale_ends_at ? new Date(values.sale_ends_at).toISOString() : null, variants: variants.map((variant) => ({ ...variant, price: Number(variant.price), compare_at_price: variant.compare_at_price ? Number(variant.compare_at_price) : null, color_value_id: variant.color_value_id ? Number(variant.color_value_id) : null, size_value_id: variant.size_value_id ? Number(variant.size_value_id) : null, initial_quantity: Number(variant.initial_quantity), weight_gram: variant.weight_gram ? Number(variant.weight_gram) : null })) }
      const response = await adminApiFetch(`${apiUrl}/admin/products`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const body = await response.json() as { data?: { id: number }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) {
        if (body.errors) {
          const productFieldMap: Record<string, keyof Values> = { name: 'name', slug: 'slug', sku: 'sku', category_id: 'category_id', brand_id: 'brand_id', collection_ids: 'collection_ids', short_description: 'short_description', description: 'description', material: 'material', fit: 'fit', care_instruction: 'care_instruction', target_gender: 'target_gender', base_price: 'base_price', compare_at_price: 'compare_at_price', sale_starts_at: 'sale_starts_at', sale_ends_at: 'sale_ends_at', status: 'status', meta_title: 'meta_title', meta_description: 'meta_description', tags: 'tags' }
          const serverVariantErrors: Record<string, string> = {}
          for (const [field, messages] of Object.entries(body.errors)) {
            const variantMatch = field.match(/^variants\.(\d+)\.(sku|barcode|price|compare_at_price|color_value_id|size_value_id|initial_quantity|weight_gram|is_active)$/)
            if (variantMatch) {
              const labels: Record<string, string> = { sku: t("SKU biến thể không hợp lệ."), barcode: t("Mã vạch không hợp lệ."), price: t("Giá biến thể không hợp lệ."), compare_at_price: t("Giá so sánh không hợp lệ."), color_value_id: t("Màu đã chọn không hợp lệ."), size_value_id: t("Kích cỡ đã chọn không hợp lệ."), initial_quantity: t("Tồn khởi tạo không hợp lệ."), weight_gram: t("Trọng lượng không hợp lệ."), is_active: t("Trạng thái biến thể không hợp lệ.") }
              serverVariantErrors[`variants.${variantMatch[1]}.${variantMatch[2]}`] = messages[0]?.includes('đã') || messages[0]?.includes('Vui lòng') ? messages[0] : labels[variantMatch[2]]
            } else if (productFieldMap[field.startsWith('tags.') ? 'tags' : field.startsWith('collection_ids.') ? 'collection_ids' : field]) {
              const labels: Record<string, string> = { name: t("Tên sản phẩm không hợp lệ."), slug: t("Slug đã tồn tại hoặc không hợp lệ."), sku: t("SKU sản phẩm đã tồn tại hoặc không hợp lệ."), category_id: t("Danh mục không hợp lệ."), brand_id: t("Thương hiệu không hợp lệ."), collection_ids: t("Bộ sưu tập đã chọn không hợp lệ."), short_description: t("Mô tả ngắn không hợp lệ."), description: t("Mô tả không hợp lệ."), material: t("Chất liệu không hợp lệ."), fit: t("Ki\u1ec3u d\u00e1ng kh\u00f4ng h\u1ee3p l\u1ec7."), care_instruction: t("Hướng dẫn bảo quản không hợp lệ."), target_gender: t("Đối tượng sản phẩm không hợp lệ."), base_price: t("Giá niêm yết không hợp lệ."), compare_at_price: t("Giá so sánh không hợp lệ."), sale_starts_at: t("Thời điểm bắt đầu khuyến mãi không hợp lệ."), sale_ends_at: t("Thời điểm kết thúc khuyến mãi không hợp lệ."), status: t("Trạng thái sản phẩm không hợp lệ."), meta_title: t("Tiêu đề SEO không hợp lệ."), meta_description: t("Mô tả SEO không hợp lệ."), tags: t("Danh sách tag không hợp lệ.") }
              const productField = field.startsWith('tags.') ? 'tags' : field.startsWith('collection_ids.') ? 'collection_ids' : field
              form.setError(productFieldMap[productField], { type: 'server', message: labels[productField] })
            }
          }
          setVariantErrors(serverVariantErrors)
          if (Object.keys(serverVariantErrors).length) setTab('variants')
          throw new Error(t("Vui lòng kiểm tra các trường được đánh dấu."))
        }
        throw new Error(body.message ?? t("Không thể tạo sản phẩm."))
      }
      productId = body.data.id
      setCreatedProductId(productId)
      for (const [index, image] of images.entries()) {
        const metadata = { alt: image.alt || '', color_value_id: image.color_value_id, sort_order: String(index), is_primary: String(image.is_primary) }
        if (image.kind === 'file' && image.file) {
          const imagePayload = new FormData()
          imagePayload.append('file', image.file)
          Object.entries(metadata).forEach(([key, value]) => imagePayload.append(key, value))
          setImageProgress({ name: image.file.name, percent: 0 })
          await new Promise<void>((resolve, reject) => {
            const request = new XMLHttpRequest()
            request.open('POST', `${apiUrl}/admin/products/${productId}/images/upload`)
            request.setRequestHeader('Authorization', `Bearer ${accessToken}`)
            request.setRequestHeader('Accept', 'application/json')
            request.upload.addEventListener('progress', (event) => { if (event.lengthComputable) setImageProgress({ name: image.file!.name, percent: Math.round(event.loaded / event.total * 100) }) })
            request.addEventListener('load', () => {
              let result: { message?: string; errors?: Record<string, string[]> }
              try { result = JSON.parse(request.responseText) as typeof result } catch { reject(new Error(t('Máy chủ trả về dữ liệu không hợp lệ khi tải “{{name}}”.', { name: image.file!.name }))); return }
              if (request.status < 200 || request.status >= 300) { reject(new Error(result.errors ? Object.values(result.errors).flat().join(' ') : result.message ?? t('Không thể tải ảnh “{{name}}”.', { name: image.file!.name }))); return }
              resolve()
            })
            request.addEventListener('error', () => reject(new Error(t('Mất kết nối khi tải “{{name}}”.', { name: image.file!.name }))))
            request.send(imagePayload)
          })
        } else {
          const imageResponse = await adminApiFetch(`${apiUrl}/admin/products/${productId}/images`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ url: image.src, alt: image.alt || null, color_value_id: image.color_value_id ? Number(image.color_value_id) : null, sort_order: index, is_primary: image.is_primary }) })
          const imageBody = await imageResponse.json() as { message?: string; errors?: Record<string, string[]> }
          if (!imageResponse.ok) throw new Error(imageBody.errors ? Object.values(imageBody.errors).flat().join(' ') : imageBody.message ?? t('Không thể gắn ảnh {{index}} vào sản phẩm.', { index: index + 1 }))
        }
      }
      setImageProgress(null)
      onCreated(productId)
    } catch (cause) {
      setImageProgress(null)
      const message = cause instanceof Error ? cause.message : t("Không thể tạo sản phẩm.")
      setError(productId ? t('Sản phẩm #{{id}} đã được tạo, nhưng chưa hoàn tất ảnh: {{message}}', { id: productId, message }) : message)
    } finally { setSaving(false) }
  }
  const updateVariant = (index: number, field: keyof Variant, value: string | boolean) => {
    setVariants((current) => current.map((variant, itemIndex) => itemIndex === index ? { ...variant, [field]: value } : variant))
    setVariantErrors((current) => { const next = { ...current }; delete next[`variants.${index}.${field}`]; return next })
  }
  const addImage = () => { const value = imageUrl.trim(); if (!value) return; setImages((current) => [...current, { id: crypto.randomUUID(), kind: 'url', src: value, alt: '', color_value_id: '', is_primary: current.length === 0 }]); setImageUrl('') }
  const addImageFiles = (files: File[]) => setImages((current) => [...current, ...files.map((file, index) => ({ id: crypto.randomUUID(), kind: 'file' as const, src: URL.createObjectURL(file), file, alt: '', color_value_id: '', is_primary: current.length === 0 && index === 0 }))])
  const updateImage = (id: string, field: 'alt' | 'color_value_id', value: string) => setImages((current) => current.map((image) => image.id === id ? { ...image, [field]: value } : image))
  const removeImage = (image: DraftImage) => { if (image.kind === 'file') URL.revokeObjectURL(image.src); setImages((current) => { const remaining = current.filter((item) => item.id !== image.id); return image.is_primary && remaining.length ? remaining.map((item, index) => ({ ...item, is_primary: index === 0 })) : remaining }) }
  const makePrimaryImage = (id: string) => setImages((current) => current.map((image) => ({ ...image, is_primary: image.id === id })))
  const reorderImages = (event: DragEndEvent) => { if (!event.over || event.active.id === event.over.id) return; const from = images.findIndex((image) => image.id === event.active.id); const to = images.findIndex((image) => image.id === event.over!.id); if (from >= 0 && to >= 0) setImages(arrayMove(images, from, to)) }
  const generateVariantMatrix = () => {
    const combinations = selectedColorIds.flatMap((color) => selectedSizeIds.length ? selectedSizeIds.map((size) => ({ color, size })) : [{ color, size: '' }])
    if (!combinations.length) return
    const basePrice = String(form.getValues('base_price') || 0)
    const nextVariants = combinations.map(({ color, size }) => ({ ...emptyVariant, price: basePrice, color_value_id: color, size_value_id: size, sku: `${form.getValues('slug') || 'SP'}-${color}${size ? `-${size}` : ''}` }))
    const hasVariantData = variants.length > 1 || variants.some((variant) => variant.sku || variant.barcode || variant.price !== emptyVariant.price || variant.compare_at_price || variant.initial_quantity !== '0' || variant.weight_gram || variant.color_value_id || variant.size_value_id || !variant.is_active)
    if (hasVariantData) setPendingVariantMatrix(nextVariants)
    else setVariants(nextVariants)
  }
  const primaryImage = images.find((image) => image.is_primary) ?? images[0]
  return <section className="panel reference-page product-create-wizard">
    {options.isLoading && <div className="shared-skeleton" role="status" aria-label={t("Đang tải danh mục, màu và kích cỡ")} />}
    {options.error && <p className="reference-error" role="alert">{options.error instanceof Error ? options.error.message : t("Không tải được dữ liệu danh mục.")} <button type="button" className="secondary" onClick={() => void options.refetch()}>{t("Thử lại")}</button></p>}
    {error && <p className="reference-error" role="alert">{error}</p>}
    {createdProductId && <a className="primary" href={`/products/${createdProductId}/images`}>{t("Tiếp tục quản lý ảnh sản phẩm #")}{createdProductId}</a>}
    <form onSubmit={form.handleSubmit(save)} className="reference-form product-create-form">
      <header className="product-create-sticky-header">
        <div className="product-create-header-title"><button type="button" className="link-button" onClick={requestCancel}>{t("← Danh sách sản phẩm")}</button><h2>{t("Tạo sản phẩm")}</h2><StatusBadge kind="product" status={form.watch('status')} /></div>
        <div className="reference-form-actions"><button type="button" className="secondary" onClick={requestCancel}>{t("Hủy")}</button><button type="button" className="secondary" disabled={saving || createdProductId !== null || !hasUnsavedChanges} onClick={() => { form.setValue('status', 'draft', { shouldDirty: true }); void form.handleSubmit((values) => save({ ...values, status: 'draft' }))() }}>{t("Lưu nháp")}</button><button className="primary" disabled={saving || createdProductId !== null || options.isLoading || options.isError || !hasUnsavedChanges}>{saving ? t("Đang lưu…") : createdProductId ? t("Sản phẩm đã tạo") : t("Lưu sản phẩm")}</button></div>
      </header>
      <div className="product-create-columns">
        <main className="product-create-main">
          <nav className="account-settings-tabs" aria-label={t("Các bước sản phẩm")}>{(['general', 'variants', 'images', 'seo'] as const).map((item) => <button key={item} type="button" className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'general' ? t("Thông tin chung") : item === 'variants' ? t("Giá & biến thể") : item === 'images' ? t("Hình ảnh") : 'SEO'}</button>)}</nav>
          {tab === 'general' && <div className="reference-form-grid"><FormField id="product-name" label={t("Tên sản phẩm")} error={form.formState.errors.name?.message} required><input {...form.register('name')} /></FormField><FormField id="product-sku" label={t("SKU sản phẩm")} error={form.formState.errors.sku?.message} required><input maxLength={64} {...form.register('sku')} /></FormField><FormField id="product-slug" label={t("Đường dẫn (slug)")} hint={t("Tự tạo từ tên sản phẩm; có thể chỉnh sửa.")} error={form.formState.errors.slug?.message} required><input {...form.register('slug', { onChange: () => setSlugEdited(true) })} /></FormField><div className="reference-wide"><FormField id="product-short-description" label={t("Mô tả ngắn")} error={form.formState.errors.short_description?.message}><textarea rows={2} maxLength={500} {...form.register('short_description')} /></FormField><small>{(form.watch('short_description') ?? '').length}{t("/500 ký tự")}</small></div><div className="reference-wide"><span className="reference-field-label">{t("Mô tả chi tiết")}</span><Controller name="description" control={form.control} render={({ field }) => <Suspense fallback={<div className="reference-rich-editor-loading" role="status">{t("Đang tải trình soạn thảo…")}</div>}><RichTextField value={field.value ?? ''} onChange={field.onChange} /></Suspense>} />{form.formState.errors.description && <small role="alert" className="reference-error">{form.formState.errors.description.message}</small>}</div><FormField id="product-material" label={t("Chất liệu")}><input {...form.register('material')} /></FormField><FormField id="product-fit" label={t("Ki\u1ec3u d\u00e1ng / form")} hint={t("V\u00ed d\u1ee5: su\u00f4ng, \u00f4m, oversized.")}><input maxLength={80} {...form.register('fit')} /></FormField><FormField id="product-care-instruction" label={t("Hướng dẫn bảo quản")}><input {...form.register('care_instruction')} /></FormField></div>}
    {tab === 'variants' && <div>
      <p>{t("Ở từng biến thể, nhập giá khuyến mãi tại Giá bán và giá gốc tại Giá so sánh. Thời gian dưới đây áp dụng chung cho các biến thể có giảm giá.")}</p>
      <div className="reference-form-grid">
        <MoneyInput label={t("Giá niêm yết (VND)")} error={form.formState.errors.base_price?.message} required {...form.register('base_price')} />
        <MoneyInput label={t("Giá so sánh sản phẩm (VND)")} {...form.register('compare_at_price')} />
        <FormField id="product-sale-starts-at" label={t("Bắt đầu khuyến mãi")} error={form.formState.errors.sale_starts_at?.message}><input type="datetime-local" {...form.register('sale_starts_at')} /></FormField>
        <FormField id="product-sale-ends-at" label={t("Kết thúc khuyến mãi")} hint={t("Để trống nếu không giới hạn thời gian. Lịch áp dụng cho các biến thể có giá so sánh cao hơn giá bán.")} error={form.formState.errors.sale_ends_at?.message}><input type="datetime-local" {...form.register('sale_ends_at')} /></FormField>
      </div>
      <VariantMatrixControls options={options.data} colors={selectedColorIds} sizes={selectedSizeIds} onColors={setSelectedColorIds} onSizes={setSelectedSizeIds} onGenerate={generateVariantMatrix} />
      <VariantFields
        variants={variants}
        variantErrors={variantErrors}
        options={options.data}
        onChange={updateVariant}
        onRemove={(index) => { setVariants((items) => items.filter((_, itemIndex) => itemIndex !== index)); setVariantErrors({}) }}
        onAdd={() => { setVariants((items) => [...items, { ...emptyVariant, price: String(form.getValues('base_price') || 0) }]); setVariantErrors({}) }}
        onBulkChange={(field, value) => {
          setVariants((current) => current.map((variant) => ({ ...variant, [field]: field === 'compare_at_price' && value === '0' ? '' : value })))
          setVariantErrors({})
        }}
      />
    </div>}
    {tab === 'images' && <div><div className="reference-form-grid"><FormField id="product-image-url" label={t("URL hình ảnh")} className="reference-wide"><input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." /></FormField><button type="button" className="secondary" onClick={addImage} disabled={!imageUrl.trim()}>{t("Thêm ảnh URL")}</button><ImageUploader label={t("Tải ảnh lên")} helperText={t("Ảnh AI chỉ dùng làm dữ liệu demo/UAT, chưa xác nhận là ảnh hàng đang bán. Khi kinh doanh, hãy thay bằng ảnh thật do cửa hàng cung cấp.")} maxFileSizeMb={5} onFiles={addImageFiles} /></div>{imageProgress && <div className="product-image-upload-progress" role="status" aria-live="polite"><span>{t("Đang tải")}{imageProgress.name} · {imageProgress.percent}%</span><progress max={100} value={imageProgress.percent} aria-label={t('Tiến độ tải {{name}}', { name: imageProgress.name })} /></div>}{!images.length ? <p className="empty-state">{t("Chưa có ảnh sản phẩm. Có thể dùng ảnh AI demo cho UAT; trước khi kinh doanh, hãy tải ảnh thật do cửa hàng cung cấp.")}</p> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderImages}><SortableContext items={images.map((image) => image.id)} strategy={verticalListSortingStrategy}><div className="product-image-sortable-list">{images.map((image, index) => <DraftImageCard key={image.id} image={image} index={index} colors={options.data?.colors ?? []} apiUrl={apiUrl} onChange={updateImage} onRemove={removeImage} onMakePrimary={makePrimaryImage} />)}</div></SortableContext></DndContext>}</div>}
    {tab === 'seo' && <div className="reference-form-grid">
      <FormField id="product-meta-title" label={t("Tiêu đề SEO")}><input maxLength={255} {...form.register("meta_title")} /></FormField>
      <small className="product-seo-character-count">{(form.watch("meta_title") ?? "").length}{t("/255 ký tự")}</small>
      <FormField id="product-meta-description" label={t("Mô tả SEO")} className="reference-wide"><textarea rows={3} maxLength={500} {...form.register("meta_description")} /></FormField>
      <small className="product-seo-character-count reference-wide">{(form.watch("meta_description") ?? "").length}{t("/500 ký tự")}</small>
    </div>}
        </main>
        <aside className="product-create-aside">
          <section className="product-create-side-card"><h3>{t("Trạng thái và nhãn")}</h3><FormField id="product-status" label={t("Trạng thái")} required><select {...form.register('status')}><option value="draft">{t("Bản nháp")}</option><option value="active">{t("Đang bán")}</option><option value="hidden">{t("Ẩn")}</option></select></FormField><label className="reference-checkbox reference-switch"><input type="checkbox" role="switch" {...form.register('is_featured')} /> {t("Nổi bật")}</label><label className="reference-checkbox reference-switch"><input type="checkbox" role="switch" {...form.register('is_new')} /> {t("Hàng mới")}</label></section>
          <section className="product-create-side-card"><h3>{t("Phân loại")}</h3><div className="product-create-side-fields"><FormField id="product-category" label={t("Danh mục")} error={form.formState.errors.category_id?.message} required><select {...form.register('category_id')}><option value="">{t("Chọn danh mục")}</option>{categoryOptions.map((item) => <option key={item.id} value={item.id}>{`${'— '.repeat(item.depth)}${item.name}`}</option>)}</select></FormField><FormField id="product-brand" label={t("Thương hiệu")}><select {...form.register('brand_id')}><option value="">{t("Không chọn")}</option>{options.data?.brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><FormField id="product-gender" label={t("Đối tượng")}><select {...form.register('target_gender')}><option value="unisex">{t("Phi giới tính")}</option><option value="men">{t("Nam")}</option><option value="women">{t("Nữ")}</option><option value="kids">{t("Trẻ em")}</option></select></FormField><FormField id="product-collections" label={t("Bộ sưu tập")} hint={t("Giữ Ctrl (hoặc Command trên Mac) để chọn nhiều.")} error={form.formState.errors.collection_ids?.message}><select aria-label={t("Chọn bộ sưu tập cho sản phẩm")} multiple value={form.watch('collection_ids') ?? []} onChange={(event) => form.setValue('collection_ids', Array.from(event.target.selectedOptions, (option) => option.value), { shouldDirty: true, shouldValidate: true })}>{options.data?.collections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField><ProductTagInput value={form.watch('tags') ?? []} error={form.formState.errors.tags?.message} onChange={(tags) => form.setValue('tags', tags, { shouldDirty: true, shouldValidate: true })} /></div></section>
          <section className="product-create-side-card"><h3>{t("Ảnh đại diện")}</h3>{primaryImage ? <img className="product-create-primary-image" src={primaryImage.kind === "file" ? primaryImage.src : mediaUrl(apiUrl, primaryImage.src)} alt={primaryImage.alt || t("Ảnh chính sản phẩm")} /> : <p>{t("Chưa có ảnh chính.")}</p>}<button type="button" className="secondary" onClick={() => setTab('images')}>{t("Quản lý hình ảnh")}</button></section>
          <section className="product-create-side-card"><h3>{t("Xem trước trên Google")}</h3><ProductSeoPreview title={form.watch('meta_title') || form.watch('name')} slug={form.watch('slug')} description={form.watch('meta_description') || form.watch('short_description')} /><button type="button" className="link-button" onClick={() => setTab('seo')}>{t("Chỉnh SEO")}</button></section>
        </aside>
      </div>
    </form>
    <ConfirmDialog open={pendingNavigation !== null} title={t("Rời khỏi biểu mẫu sản phẩm?")} description={t("Các thay đổi chưa lưu sẽ bị mất.")} confirmLabel={t("Rời trang")} onConfirm={() => { const href = pendingNavigation; setPendingNavigation(null); confirmDiscard.clear(); if (href) window.location.assign(href); else onCancel() }} onOpenChange={(open) => { if (!open) setPendingNavigation(null) }} />
    <ConfirmDialog open={pendingVariantMatrix !== null} title={t("Thay thế các biến thể hiện tại?")} description={t("Ma trận mới sẽ thay toàn bộ biến thể đang chỉnh sửa, gồm SKU, giá, tồn khởi tạo và trạng thái.")} confirmLabel={t("Thay thế biến thể")} onConfirm={() => { if (pendingVariantMatrix) setVariants(pendingVariantMatrix); setVariantErrors({}); setPendingVariantMatrix(null) }} onOpenChange={(open) => { if (!open) setPendingVariantMatrix(null) }} />
  </section>
}
