import { adminApiFetch, adminApiUpload, AdminApiUploadError } from '../../lib/admin-api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { z } from 'zod'
import { GripVertical } from 'lucide-react'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { FormField } from '../../components/shared/form-field'
import { ImageUploader } from '../../components/shared/image-uploader'
import { mediaUrl } from '../../lib/media-url'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'

type Image = { id: number; url: string; alt: string | null; sort_order: number; is_primary: boolean; color_value_id: number | null; is_360_frame: boolean }
const isAiDemoImage = (alt?: string | null) => alt?.trim().toLocaleLowerCase('vi-VN').startsWith('ảnh ai demo:') ?? false
type Color = { id: number; name: string }
export type ProductImageDraft = { images: Array<Pick<Image, 'id' | 'alt' | 'sort_order' | 'is_primary' | 'color_value_id' | 'is_360_frame'>>; delete_image_ids: number[] }
type ImageServerErrors = Partial<Record<'alt' | 'color_value_id' | 'sort_order' | 'is_primary', string>>
type Props = { productId: number; apiUrl: string; accessToken: string; staged?: boolean; onDraftChange?: (draft: ProductImageDraft | null) => void; serverValidationErrors?: Record<string, string> }
type Metadata = { alt: string; color_value_id: string; is_360_frame: boolean }
type UploadDraft = { id: number; file: File; previewUrl: string; sortOrder: number; error: string }
type ProductImagesData = { name: string; images: Image[]; colors: Color[] }

const metadataSchema = (t: (key: string) => string) => z.object({ alt: z.string().max(255, t('Mô tả ảnh (alt text) tối đa 255 ký tự')), color_value_id: z.string(), is_360_frame: z.boolean() })

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const body = await response.json() as T & { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw createApiResponseError(body, response.status, fallback)
  return body
}

type SortableImageCardProps = {
  image: Image
  index: number
  name: string
  apiUrl: string
  colors: Color[]
  busy: boolean
  staged: boolean
  serverErrors?: ImageServerErrors
  onSave: (image: Image, values: Metadata) => Promise<void>
  onSetPrimary: (image: Image) => Promise<void>
  onRemove: (image: Image) => void | Promise<void>
}

function SortableImageCard({ image, index, name, apiUrl, colors, busy, staged, serverErrors, onSave, onSetPrimary, onRemove }: SortableImageCardProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id, disabled: busy })
  const form = useForm<Metadata>({
    resolver: zodResolver(metadataSchema(t)),
    defaultValues: { alt: image.alt ?? '', color_value_id: image.color_value_id ? String(image.color_value_id) : '', is_360_frame: image.is_360_frame },
  })
  const { reset } = form
  useUnsavedFormGuard(form.formState.isDirty)

  useEffect(() => {
    reset({ alt: image.alt ?? '', color_value_id: image.color_value_id ? String(image.color_value_id) : '', is_360_frame: image.is_360_frame })
  }, [image.alt, image.color_value_id, image.is_360_frame, reset])

  return <article
    ref={setNodeRef}
    className={`product-image-sortable${isDragging ? ' is-dragging' : ''}`}
    style={{ transform: CSS.Transform.toString(transform), transition }}
  >
    <img src={mediaUrl(apiUrl, image.url)} alt={image.alt ?? name} loading="lazy" />
    <div className="product-image-sortable-content">
      <div className="product-image-sortable-heading">
        <button
          type="button"
          className="secondary product-image-drag-handle"
          aria-label={`Kéo để sắp xếp ảnh ${index + 1}`}
          title={t('Kéo để sắp xếp; dùng phím mũi tên khi nút được chọn')}
          {...attributes}
          {...listeners}
          disabled={busy}
        ><GripVertical size={16} aria-hidden="true" /><span>{t("Ảnh")}{index + 1}</span></button>
        {image.is_primary && <strong className="product-image-primary-badge">{t("Ảnh chính")}</strong>}
        {image.is_360_frame && <strong className="product-image-primary-badge">{t("Khung 360°")}</strong>}
        {isAiDemoImage(image.alt) && <strong className="sr-only">{t("Ảnh AI demo")}</strong>}
      </div>
      {(serverErrors?.sort_order || serverErrors?.is_primary) && <p className="shared-field-error" role="alert">{t([serverErrors.sort_order, serverErrors.is_primary].filter(Boolean).join(' '))}</p>}
      <form className="product-image-metadata" onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSave(image, values)
          form.reset(values)
        } catch (cause) {
          applyServerValidationErrors(form, cause)
        }
      })}>
        <FormField id={`product-image-${image.id}-alt`} label={t('Mô tả ảnh (alt text)')} error={t(form.formState.errors.alt?.message ?? serverErrors?.alt ?? '')}>
          <input maxLength={255} {...form.register('alt')} />
        </FormField>
        <FormField id={`product-image-${image.id}-color`} label={t('Ảnh theo màu')} error={t(form.formState.errors.color_value_id?.message ?? serverErrors?.color_value_id ?? '')}>
          <select {...form.register('color_value_id')}>
            <option value="">{t("Dùng cho mọi màu")}</option>
            {colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
          </select>
        </FormField>
        <label className="reference-checkbox"><input type="checkbox" {...form.register('is_360_frame')} /> {t('Dùng làm khung ảnh 360°')}</label>
        <div className="reference-actions">
          <button className="secondary" type="submit" disabled={busy || !form.formState.isDirty}>{staged ? t("Ghi nhận thay đổi") : t("Lưu thông tin")}</button>
          {!image.is_primary && <button className="secondary" type="button" disabled={busy || form.formState.isDirty} onClick={() => void onSetPrimary(image)}>{t("Đặt ảnh chính")}</button>}
          <button className="secondary" type="button" disabled={busy || form.formState.isDirty} onClick={() => void onRemove(image)}>{t("Xóa ảnh")}</button>
        </div>
      </form>
    </div>
  </article>
}

export function ProductImagesPage({ productId, apiUrl, accessToken, staged = false, onDraftChange, serverValidationErrors = {} }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ['admin', 'product-images', productId] as const
  const imagesQuery = useQuery({
    queryKey,
    enabled: Boolean(accessToken),
    queryFn: async ({ signal }): Promise<ProductImagesData> => {
      const [detailsResponse, colorsResponse] = await Promise.all([
        adminApiFetch(`${apiUrl}/admin/products/${productId}/details`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, signal }),
        adminApiFetch(`${apiUrl}/admin/catalog-options/colors?per_page=100`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, signal }),
      ])
      const [details, colorOptions] = await Promise.all([
        parseResponse<{ data: { name: string; images: Image[] } }>(detailsResponse, t("Không tải được ảnh sản phẩm.")),
        parseResponse<{ data: Color[] }>(colorsResponse, t("Không tải được danh sách màu.")),
      ])
      return {
        name: details.data.name,
        images: [...details.data.images].sort((left, right) => left.sort_order - right.sort_order),
        colors: colorOptions.data,
      }
    },
  })
  const name = imagesQuery.data?.name ?? ''
  const [stagedImages, setStagedImages] = useState<Image[] | null>(null)
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([])
  const images = staged && stagedImages !== null ? stagedImages : imagesQuery.data?.images ?? []
  const colors = imagesQuery.data?.colors ?? []
  const loading = imagesQuery.isPending
  const [busy, setBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; percent: number } | null>(null)
  const [uploadDrafts, setUploadDrafts] = useState<UploadDraft[]>([])
  const [uploadFieldError, setUploadFieldError] = useState('')
  const [imageToRemove, setImageToRemove] = useState<Image | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useUnsavedFormGuard(uploadDrafts.length > 0)
  const nextUploadId = useRef(0)
  const previewUrls = useRef(new Set<string>())
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const publishDraft = (nextImages: Image[], nextDeletedIds = deletedImageIds) => {
    const orderedImages = nextImages.map((image, index) => image.sort_order === index ? image : { ...image, sort_order: index })
    setStagedImages(orderedImages)
    setDeletedImageIds(nextDeletedIds)
    onDraftChange?.({
      images: orderedImages.map(({ id, alt, sort_order, is_primary, color_value_id, is_360_frame }) => ({ id, alt, sort_order, is_primary, color_value_id, is_360_frame })),
      delete_image_ids: nextDeletedIds,
    })
  }

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrls.current.clear()
  }, [])

  const load = async () => {
    setError('')
    const result = await imagesQuery.refetch()
    if (result.error) setError(result.error instanceof Error ? t(result.error.message) : t('Không tải được ảnh sản phẩm.'))
    else if (staged && stagedImages !== null && result.data) {
      const knownIds = new Set([...stagedImages.map((image) => image.id), ...deletedImageIds])
      const uploadedImages = result.data.images.filter((image) => !knownIds.has(image.id))
      if (uploadedImages.length) publishDraft([...stagedImages, ...uploadedImages])
    }
  }

  const updateCachedImages = (update: (current: Image[]) => Image[]) => {
    queryClient.setQueryData<ProductImagesData>(queryKey, (current) => current ? { ...current, images: update(current.images) } : current)
  }
  const pageError = error || (imagesQuery.error instanceof Error ? t(imagesQuery.error.message) : '')

  const uploadFile = async (draft: UploadDraft): Promise<void> => {
    const body = new FormData()
    body.append('file', draft.file)
    body.append('sort_order', String(draft.sortOrder))
    let response: Response
    try {
      response = await adminApiUpload(`${apiUrl}/admin/products/${productId}/images/upload`, body, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      }, (percent) => setUploadProgress({ fileName: draft.file.name, percent }))
    } catch (cause) {
      if (cause instanceof AdminApiUploadError) {
        const message = cause.reason === 'network'
          ? t('Mất kết nối khi tải “{{name}}”.', { name: draft.file.name })
          : cause.reason === 'timeout'
            ? t('Tải “{{name}}” quá thời gian chờ.', { name: draft.file.name })
            : t('Đã hủy tải “{{name}}”.', { name: draft.file.name })
        throw new Error(message, { cause })
      }
      throw new Error(cause instanceof Error ? cause.message : t('Không thể tải ảnh lên.'), { cause })
    }

    let result: { message?: string; errors?: Record<string, string[]> }
    try { result = await response.json() as typeof result } catch { throw new Error(t('Máy chủ trả về dữ liệu không hợp lệ khi tải “{{name}}”.', { name: draft.file.name })) }
    if (!response.ok) throw createApiResponseError(result, response.status, t('Không thể tải ảnh “{{name}}” lên.', { name: draft.file.name }))
  }

  const forgetUploadDraft = (draft: UploadDraft) => {
    previewUrls.current.delete(draft.previewUrl)
    URL.revokeObjectURL(draft.previewUrl)
    setUploadDrafts((current) => current.filter((item) => item.id !== draft.id))
  }

  const setUploadDraftError = (draft: UploadDraft, message: string) => {
    setUploadDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, error: message } : item))
    if (message && !draft.error) setUploadFieldError(message)
  }

  const upload = async (selectedFiles: File[]) => {
    if (!selectedFiles.length) return
    setBusy(true)
    setError('')
    setUploadFieldError('')
    setNotice('')
    const drafts = selectedFiles.map((file, index): UploadDraft => {
      const previewUrl = URL.createObjectURL(file)
      previewUrls.current.add(previewUrl)
      return { id: ++nextUploadId.current, file, previewUrl, sortOrder: images.length + index, error: '' }
    })
    setUploadDrafts((current) => [...current, ...drafts])
    let uploadedCount = 0
    try {
      for (const draft of drafts) {
        setUploadProgress({ fileName: draft.file.name, percent: 0 })
        try {
          await uploadFile(draft)
          uploadedCount += 1
          forgetUploadDraft(draft)
        } catch (cause) {
          const message = cause instanceof Error ? t(cause.message) : t('Không thể tải ảnh lên.')
          setUploadDraftError(draft, message)
        }
      }
      if (uploadedCount) {
        await load()
        setNotice(uploadedCount === selectedFiles.length
          ? t('Đã tải lên {{count}} ảnh.', { count: uploadedCount })
          : t('Đã tải lên {{uploaded}}/{{total}} ảnh. Ảnh lỗi vẫn có thể thử lại bên dưới.', { uploaded: uploadedCount, total: selectedFiles.length }))
      }
    } finally {
      setUploadProgress(null)
      setBusy(false)
    }
  }

  const retryUpload = async (draft: UploadDraft) => {
    setBusy(true)
    setError('')
    setUploadFieldError('')
    setUploadDraftError(draft, '')
    setUploadProgress({ fileName: draft.file.name, percent: 0 })
    try {
      await uploadFile(draft)
      forgetUploadDraft(draft)
      await load()
      setNotice(t('Đã tải lên “{{name}}”.', { name: draft.file.name }))
    } catch (cause) {
      const message = cause instanceof Error ? t(cause.message) : t('Không thể tải ảnh lên.')
      setUploadDraftError(draft, message)
    } finally {
      setUploadProgress(null)
      setBusy(false)
    }
  }

  const reorder = async (next: Image[]) => {
    if (staged) {
      publishDraft(next)
      setNotice(t("Thứ tự ảnh sẽ được lưu cùng thông tin sản phẩm."))
      return
    }
    const previous = images
    updateCachedImages(() => next)
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/products/${productId}/images/reorder`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: next.map((image, index) => ({ id: image.id, sort_order: index })) }),
      })
      const result = await parseResponse<{ data: Image[] }>(response, t("Không thể lưu thứ tự ảnh."))
      updateCachedImages(() => [...result.data].sort((left, right) => left.sort_order - right.sort_order))
      setNotice(t("Đã lưu thứ tự ảnh."))
    } catch (cause) {
      updateCachedImages(() => previous)
      setError(cause instanceof Error ? t(cause.message) : t('Không thể lưu thứ tự ảnh.'))
    } finally {
      setBusy(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = images.findIndex((image) => image.id === active.id)
    const to = images.findIndex((image) => image.id === over.id)
    if (from >= 0 && to >= 0) void reorder(arrayMove(images, from, to))
  }

  const saveMetadata = async (image: Image, values: Metadata) => {
    if (staged) {
      publishDraft(images.map((item) => item.id === image.id ? { ...item, alt: values.alt || null, color_value_id: values.color_value_id ? Number(values.color_value_id) : null, is_360_frame: values.is_360_frame } : item))
      setNotice(t("Thông tin ảnh sẽ được lưu cùng thông tin sản phẩm."))
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/products/${productId}/images/${image.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt: values.alt || null, color_value_id: values.color_value_id ? Number(values.color_value_id) : null, is_360_frame: values.is_360_frame }),
      })
      await parseResponse(response, t("Không thể lưu thông tin ảnh."))
      updateCachedImages((current) => current.map((item) => item.id === image.id ? { ...item, alt: values.alt || null, color_value_id: values.color_value_id ? Number(values.color_value_id) : null, is_360_frame: values.is_360_frame } : item))
      setNotice(t("Đã lưu alt text, màu và vai trò ảnh."))
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Không thể lưu thông tin ảnh.'))
      throw cause
    } finally {
      setBusy(false)
    }
  }

  const setPrimary = async (image: Image) => {
    if (staged) {
      publishDraft(images.map((item) => ({ ...item, is_primary: item.id === image.id })))
      setNotice(t("Ảnh chính sẽ được cập nhật khi lưu sản phẩm."))
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/products/${productId}/images/${image.id}/primary`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      await parseResponse(response, t("Không thể đặt ảnh chính."))
      updateCachedImages((current) => current.map((item) => ({ ...item, is_primary: item.id === image.id })))
      setNotice(t("Đã đặt ảnh chính."))
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Không thể đặt ảnh chính.'))
    } finally {
      setBusy(false)
    }
  }

  const remove = (image: Image) => setImageToRemove(image)

  const confirmRemove = async () => {
    if (!imageToRemove) return
    const image = imageToRemove
    if (staged) {
      const nextImages = images.filter((item) => item.id !== image.id)
      if (image.is_primary && nextImages.length) nextImages[0] = { ...nextImages[0], is_primary: true }
      const nextDeletedIds = [...new Set([...deletedImageIds, image.id])]
      publishDraft(nextImages, nextDeletedIds)
      setImageToRemove(null)
      setNotice(t("Ảnh sẽ được xóa khi lưu thông tin sản phẩm."))
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/products/${productId}/images/${image.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      await parseResponse(response, t("Không thể xóa ảnh."))
      updateCachedImages((current) => current.filter((item) => item.id !== image.id))
      setImageToRemove(null)
      setNotice(t("Đã xóa ảnh."))
      await queryClient.invalidateQueries({ queryKey })
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Không thể xóa ảnh.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <section className="panel reference-page" aria-busy="true"><div className="shared-skeleton" role="status" aria-label={t('Đang tải ảnh sản phẩm')} /></section>
  return <section className="panel reference-page">
    <div className="panel-heading"><div><h2>{t('Ảnh sản phẩm')}</h2><p>{name} · {t('Kéo thả để sắp xếp; dùng bàn phím để thao tác qua nút kéo.')}{staged ? ` ${t('Metadata, thứ tự, ảnh chính và xóa ảnh sẽ lưu bằng nút Lưu sản phẩm.')}` : ''}</p></div><a className="secondary" href={`/products/${productId}/edit`}>{t('Quay lại sản phẩm')}</a></div>
    <ImageUploader label={t('Tải ảnh lên')} helperText={t('Ảnh AI chỉ dùng làm dữ liệu demo/UAT, chưa xác nhận là ảnh hàng đang bán. Khi kinh doanh, hãy thay bằng ảnh thật do cửa hàng cung cấp.')} maxFileSizeMb={5} onFiles={(files) => void upload(files)} error={t(uploadFieldError)} disabled={busy}>
      {uploadProgress && <div className="product-image-upload-progress" role="status" aria-live="polite"><span>{t('Đang tải {{file}} · {{percent}}%', { file: uploadProgress.fileName, percent: uploadProgress.percent })}</span><progress max={100} value={uploadProgress.percent} aria-label={t('Tiến độ tải {{file}}', { file: uploadProgress.fileName })} /></div>}
      {uploadDrafts.length > 0 && <ul className="product-image-upload-queue" aria-label={t('Ảnh đang tải lên hoặc cần thử lại')}>{uploadDrafts.map((draft) => <li key={draft.id}><img src={draft.previewUrl} alt={t('Xem trước {{name}}', { name: draft.file.name })} /><span><strong>{draft.file.name}</strong><small>{draft.error ? t(draft.error) : uploadProgress?.fileName === draft.file.name ? t('Đang tải lên…') : t('Đang chờ tải lên')}</small></span>{draft.error && <button className="secondary" type="button" disabled={busy} onClick={() => void retryUpload(draft)}>{t('Thử tải lại')}</button>}<button className="secondary" type="button" disabled={busy} onClick={() => forgetUploadDraft(draft)}>{t('Bỏ ảnh')}</button></li>)}</ul>}
    </ImageUploader>
    {images.length > 0 && <p className="product-image-360-hint">{t('Đánh dấu 24–36 ảnh làm khung 360° rồi kéo sắp xếp theo vòng quay để hiển thị trình xem mượt và đủ các góc.')}</p>}
    {pageError && <p className="reference-error" role="alert">{t(pageError)} <button className="secondary" type="button" onClick={() => void load()}>{t('Tải lại')}</button></p>}
    {notice && <p className="reference-notice" role="status">{t(notice)}</p>}
    {imagesQuery.isSuccess && !images.length ? <div className="empty-state">{t("Chưa có ảnh sản phẩm. Có thể dùng ảnh AI demo cho UAT; trước khi kinh doanh, hãy tải ảnh thật do cửa hàng cung cấp.")}</div> : images.length > 0 && <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={images.map((image) => image.id)} strategy={verticalListSortingStrategy}>
        <div className="product-image-sortable-list" aria-label={t('Danh sách ảnh sản phẩm')}>{images.map((image, index) => {
            const prefix = `images.${index}.`
            const serverErrors: ImageServerErrors = {
              alt: serverValidationErrors[`${prefix}alt`],
              color_value_id: serverValidationErrors[`${prefix}color_value_id`],
              sort_order: serverValidationErrors[`${prefix}sort_order`],
              is_primary: serverValidationErrors[`${prefix}is_primary`],
            }
            return <SortableImageCard key={image.id} image={image} index={index} name={name} apiUrl={apiUrl} colors={colors} busy={busy} staged={staged} serverErrors={serverErrors} onSave={saveMetadata} onSetPrimary={setPrimary} onRemove={remove} />
          })}
        </div>
      </SortableContext>
    </DndContext>}
    <ConfirmDialog open={Boolean(imageToRemove)} title={staged ? t("Xóa ảnh khi lưu sản phẩm?") : t("Xóa ảnh sản phẩm?")} description={imageToRemove ? <>{t("Ảnh này sẽ")}{staged ? t("được xóa khi bạn lưu sản phẩm") : t("bị xóa khỏi sản phẩm")} <strong>{name}</strong>.</> : ''} confirmLabel={staged ? t("Xóa khi lưu") : t("Xóa ảnh")} onConfirm={() => void confirmRemove()} onOpenChange={(next) => { if (!next && !busy) setImageToRemove(null) }} busy={busy} />
  </section>
}
