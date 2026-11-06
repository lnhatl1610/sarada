import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  file: File
  busy: boolean
  error: string
  onCrop: (file: File) => Promise<boolean>
  onCancel: () => void
}

function createOrientedCanvas(image: HTMLImageElement, rotation: number) {
  const swapsSides = rotation === 90 || rotation === 270
  const canvas = document.createElement('canvas')
  canvas.width = swapsSides ? image.naturalHeight : image.naturalWidth
  canvas.height = swapsSides ? image.naturalWidth : image.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.')
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate(rotation * Math.PI / 180)
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
  return canvas
}

export function AvatarCropDialog({ file, busy, error, onCrop, onCancel }: Props) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [orientedSize, setOrientedSize] = useState<{ width: number; height: number } | null>(null)
  const [orientedPreviewUrl, setOrientedPreviewUrl] = useState('')
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [positionX, setPositionX] = useState(50)
  const [positionY, setPositionY] = useState(50)
  const [processing, setProcessing] = useState(false)
  const [cropError, setCropError] = useState('')
  const [imageLoadError, setImageLoadError] = useState('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    // The browser creates this URL for the mounted file and the effect revokes it on cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(url)
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      URL.revokeObjectURL(url)
      if (dialog?.open) dialog.close()
    }
  }, [file])

  useEffect(() => {
    const image = imageRef.current
    if (!image || !imageSize) return
    try {
      const canvas = createOrientedCanvas(image, rotation)
      setOrientedSize({ width: canvas.width, height: canvas.height })
      setOrientedPreviewUrl(canvas.toDataURL(file.type))
    } catch (cause) {
      setCropError(cause instanceof Error ? t(cause.message) : t('Không thể xoay ảnh.'))
    }
  }, [file.type, imageSize, rotation, t])

  const createCroppedFile = () => new Promise<File>((resolve, reject) => {
    const image = imageRef.current
    if (!image || !imageSize) { reject(new Error(t('Ảnh chưa tải xong.'))); return }
    const oriented = createOrientedCanvas(image, rotation)
    const side = Math.min(oriented.width, oriented.height) / zoom
    const left = (oriented.width - side) * positionX / 100
    const top = (oriented.height - side) * positionY / 100
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) { reject(new Error(t('Trình duyệt không hỗ trợ cắt ảnh.'))); return }
    context.drawImage(oriented, left, top, side, side, 0, 0, canvas.width, canvas.height)
    const type = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg'
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error(t('Không thể tạo ảnh đã cắt.'))); return }
      const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
      resolve(new File([blob], `avatar.${extension}`, { type, lastModified: Date.now() }))
    }, type, 0.92)
  })

  const save = async () => {
    setProcessing(true)
    setCropError('')
    try { await onCrop(await createCroppedFile()) }
    catch (cause) { setCropError(cause instanceof Error ? t(cause.message) : t('Không thể cắt ảnh đại diện.')) }
    finally { setProcessing(false) }
  }

  const baseSide = orientedSize ? Math.min(orientedSize.width, orientedSize.height) : 1
  const imageWidthRatio = orientedSize ? orientedSize.width / baseSide * zoom : 1
  const imageHeightRatio = orientedSize ? orientedSize.height / baseSide * zoom : 1

  return <dialog ref={dialogRef} className="account-dialog avatar-crop-dialog" aria-labelledby="avatar-crop-title" onCancel={(event) => { event.preventDefault(); if (!busy && !processing) onCancel() }} onClick={(event) => { if (event.target === dialogRef.current && !busy && !processing) onCancel() }}>
    <div className="account-dialog-heading"><div><p className="eyebrow">{t('ẢNH ĐẠI DIỆN')}</p><h2 id="avatar-crop-title">{t('Cắt ảnh vuông')}</h2></div><button className="icon-button" type="button" aria-label={t('Đóng cắt ảnh')} disabled={busy || processing} onClick={onCancel}>×</button></div>
    <p className="account-dialog-description">{t('Điều chỉnh vùng ảnh sẽ hiển thị trong avatar. Ảnh được xuất thành hình vuông 512 × 512 px.')}</p>
    {previewUrl && <img ref={imageRef} className="avatar-crop-source" src={previewUrl} alt="" onLoad={(event) => {
      const { naturalWidth, naturalHeight } = event.currentTarget
      if (naturalWidth > 0 && naturalHeight > 0) {
        setImageLoadError('')
        setImageSize({ width: naturalWidth, height: naturalHeight })
      } else {
        setImageSize(null)
        setImageLoadError(t('Không thể đọc ảnh này. Hãy chọn một ảnh JPG, PNG hoặc WebP khác.'))
      }
    }} onError={() => {
      setImageSize(null)
      setImageLoadError(t('Không thể đọc ảnh này. Hãy chọn một ảnh JPG, PNG hoặc WebP khác.'))
    }} />}
    <div className="avatar-crop-layout">
      <div className="avatar-crop-preview" role="img" aria-label={t('Xem trước vùng ảnh đại diện hình vuông')}>
        {orientedPreviewUrl && <img src={orientedPreviewUrl} alt="" draggable={false} style={{ width: `${imageWidthRatio * 100}%`, height: `${imageHeightRatio * 100}%`, left: `${-(imageWidthRatio - 1) * positionX}%`, top: `${-(imageHeightRatio - 1) * positionY}%` }} />}
      </div>
      <div className="avatar-crop-controls">
        <button className="secondary" type="button" disabled={!imageSize || busy || processing} onClick={() => setRotation((value) => (value + 90) % 360)}>{t('Xoay 90°')}</button>
        <label htmlFor="avatar-crop-zoom">{t('Phóng to')} <output>{zoom.toFixed(1)}×</output></label>
        <input id="avatar-crop-zoom" type="range" min="1" max="3" step="0.1" value={zoom} disabled={!imageSize || busy || processing} onChange={(event) => setZoom(Number(event.target.value))} />
        <label htmlFor="avatar-crop-x">{t('Vị trí ngang')} <output>{positionX}%</output></label>
        <input id="avatar-crop-x" type="range" min="0" max="100" step="1" value={positionX} disabled={!imageSize || busy || processing} onChange={(event) => setPositionX(Number(event.target.value))} />
        <label htmlFor="avatar-crop-y">{t('Vị trí dọc')} <output>{positionY}%</output></label>
        <input id="avatar-crop-y" type="range" min="0" max="100" step="1" value={positionY} disabled={!imageSize || busy || processing} onChange={(event) => setPositionY(Number(event.target.value))} />
      </div>
    </div>
    {(imageLoadError || cropError || error) && <p className="account-form-error" role="alert">{t(imageLoadError || cropError || error)}</p>}
    <div className="account-dialog-actions"><button className="secondary" type="button" disabled={busy || processing} onClick={onCancel}>{t('Hủy')}</button><button className="primary" type="button" disabled={!imageSize || busy || processing} onClick={() => void save()}>{busy || processing ? t('Đang tải ảnh…') : t('Cắt và tải lên')}</button></div>
  </dialog>
}
