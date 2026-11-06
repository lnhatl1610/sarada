import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { adminApiFetch, adminApiUpload } from '../../lib/admin-api'
import { mediaUrl } from '../../lib/media-url'

type ProductVideo = { id: number; url: string; caption: string | null; color_value_id: number | null; sort_order: number }
type Color = { id: number; name: string }

export function ProductVideosPage({ productId, apiUrl, canUpdate }: { productId: number; apiUrl: string; canUpdate: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [colorValueId, setColorValueId] = useState('')
  const colors = useQuery({ queryKey: ['admin', 'catalog-options', 'colors'], queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/admin/catalog-options/colors?per_page=100`)
    if (!response.ok) throw new Error(t('Không tải được danh sách màu.'))
    const body = await response.json() as { data: Color[] }
    return body.data
  } })
  const videos = useQuery({ queryKey: ['admin', 'product-videos', productId], queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/admin/products/${productId}/details`)
    if (!response.ok) throw new Error(t('Không tải được video sản phẩm.'))
    const body = await response.json() as { data: { videos?: ProductVideo[] } }
    return body.data.videos ?? []
  } })
  const upload = useMutation({ mutationFn: async () => {
    if (!file) throw new Error(t('Chọn video cần tải lên.'))
    const form = new FormData()
    form.set('file', file)
    if (caption.trim()) form.set('caption', caption.trim())
    if (colorValueId) form.set('color_value_id', colorValueId)
    const response = await adminApiUpload(`${apiUrl}/admin/products/${productId}/videos/upload`, form, { method: 'POST' })
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string[]> } | null
      throw new Error(body?.errors?.file?.[0] ?? body?.message ?? t('Không tải được video sản phẩm.'))
    }
  }, onSuccess: async () => {
    setFile(null)
    setCaption('')
    setColorValueId('')
    await queryClient.invalidateQueries({ queryKey: ['admin', 'product-videos', productId] })
    await queryClient.invalidateQueries({ queryKey: ['admin', 'product-details', productId] })
  } })
  const remove = useMutation({ mutationFn: async (videoId: number) => {
    const response = await adminApiFetch(`${apiUrl}/admin/products/${productId}/videos/${videoId}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(t('Không xóa được video.'))
  }, onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'product-videos', productId] })
    await queryClient.invalidateQueries({ queryKey: ['admin', 'product-details', productId] })
  } })

  return <section className="panel reference-page"><div className="panel-heading"><div><h2>{t('Video sản phẩm')}</h2><p>{t('Tải video MP4 hoặc WebM, tối đa 5 MB. Video sẽ xuất hiện trong trang chi tiết sản phẩm.')}</p></div></div>
    {canUpdate && <form className="reference-form" onSubmit={(event) => { event.preventDefault(); upload.mutate() }}><label className="shared-form-field"><span>{t('Tệp video')}</span><input type="file" accept="video/mp4,video/webm,.mp4,.webm" onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)} /><small>{t('Chỉ nhận MP4/WebM, tối đa 5 MB.')}</small></label><label className="shared-form-field"><span>{t('Chú thích (không bắt buộc)')}</span><input maxLength={255} value={caption} onChange={(event) => setCaption(event.currentTarget.value)} /></label><label className="shared-form-field"><span>{t('Áp dụng cho màu')}</span><select value={colorValueId} onChange={(event) => setColorValueId(event.currentTarget.value)}><option value="">{t('Dùng cho mọi màu')}</option>{colors.data?.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}</select></label><button className="primary" type="submit" disabled={!file || upload.isPending}>{upload.isPending ? t('Đang tải lên…') : t('Tải video lên')}</button></form>}
    {upload.error && <p role="alert" className="reference-error">{upload.error.message}</p>}{remove.error && <p role="alert" className="reference-error">{remove.error.message}</p>}
    {videos.isLoading ? <p role="status">{t('Đang tải video…')}</p> : videos.error ? <p role="alert">{videos.error.message}</p> : videos.data?.length ? <div className="reference-form-grid">{videos.data.map((video) => <article className="panel" key={video.id}><video controls preload="metadata" src={mediaUrl(apiUrl, video.url)} aria-label={video.caption || t('Video sản phẩm')} style={{ display: 'block', width: '100%', maxHeight: 360 }} />{video.caption && <p>{video.caption}</p>}<p>{video.color_value_id ? colors.data?.find((color) => color.id === video.color_value_id)?.name || t('Video theo màu') : t('Dùng cho mọi màu')}</p>{canUpdate && <button type="button" className="secondary" disabled={remove.isPending} onClick={() => remove.mutate(video.id)}>{t('Xóa video')}</button>}</article>)}</div> : <p>{t('Chưa có video sản phẩm.')}</p>}
  </section>
}
