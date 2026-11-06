import { useEffect, useMemo, useRef, useState } from 'react'
import './AvatarCropDialog.css'

type Props = {
  file: File
  busy: boolean
  error: string
  onCrop: (file: File) => Promise<boolean>
  onCancel: () => void
}

function createOrientedCanvas(image: HTMLImageElement, rotation: number): HTMLCanvasElement {
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file])
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

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    closeButtonRef.current?.focus()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  useEffect(() => {
    const image = imageRef.current
    if (!image || !imageSize) return
    try {
      const canvas = createOrientedCanvas(image, rotation)
      setOrientedSize({ width: canvas.width, height: canvas.height })
      setOrientedPreviewUrl(canvas.toDataURL(file.type))
    } catch (cause) {
      setCropError(cause instanceof Error ? cause.message : 'Không thể xoay ảnh.')
    }
  }, [file.type, imageSize, rotation])

  const createCroppedFile = () => new Promise<File>((resolve, reject) => {
    const image = imageRef.current
    if (!image || !imageSize) {
      reject(new Error('Ảnh chưa tải xong.'))
      return
    }
    const oriented = createOrientedCanvas(image, rotation)
    const side = Math.min(oriented.width, oriented.height) / zoom
    const left = (oriented.width - side) * positionX / 100
    const top = (oriented.height - side) * positionY / 100
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) {
      reject(new Error('Trình duyệt không hỗ trợ cắt ảnh.'))
      return
    }
    context.drawImage(oriented, left, top, side, side, 0, 0, canvas.width, canvas.height)
    const type = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg'
    const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Không thể tạo ảnh đã cắt.'))
        return
      }
      if (blob.size > 2 * 1024 * 1024) {
        reject(new Error('Ảnh sau khi cắt vượt quá 2 MB. Hãy chọn ảnh khác có dung lượng nhỏ hơn.'))
        return
      }
      resolve(new File([blob], `avatar.${extension}`, { type, lastModified: Date.now() }))
    }, type, 0.92)
  })

  const save = async () => {
    setProcessing(true)
    setCropError('')
    try {
      await onCrop(await createCroppedFile())
    } catch (cause) {
      setCropError(cause instanceof Error ? cause.message : 'Không thể cắt ảnh đại diện.')
    } finally {
      setProcessing(false)
    }
  }

  const canDismiss = !busy && !processing
  const baseSide = orientedSize ? Math.min(orientedSize.width, orientedSize.height) : 1
  const imageWidthRatio = orientedSize ? orientedSize.width / baseSide * zoom : 1
  const imageHeightRatio = orientedSize ? orientedSize.height / baseSide * zoom : 1

  return <dialog
    ref={dialogRef}
    className="session-revocation-dialog avatar-crop-dialog"
    aria-labelledby="storefront-avatar-crop-title"
    aria-describedby="storefront-avatar-crop-description"
    onCancel={(event) => { event.preventDefault(); if (canDismiss) onCancel() }}
    onClick={(event) => { if (event.target === dialogRef.current && canDismiss) onCancel() }}
  >
    <div className="avatar-crop-heading">
      <div><p className="eyebrow">ẢNH ĐẠI DIỆN</p><h2 id="storefront-avatar-crop-title">Cắt ảnh vuông</h2></div>
      <button ref={closeButtonRef} className="avatar-crop-close" type="button" aria-label="Đóng cắt ảnh" disabled={!canDismiss} onClick={onCancel}>×</button>
    </div>
    <p id="storefront-avatar-crop-description" className="avatar-crop-description">Điều chỉnh vùng ảnh hiển thị trong avatar. Ảnh sẽ được tải lên ở kích thước 512 × 512 px.</p>
    <img ref={imageRef} className="avatar-crop-source" src={previewUrl} alt="" onLoad={(event) => {
      const { naturalWidth, naturalHeight } = event.currentTarget
      if (naturalWidth > 0 && naturalHeight > 0) {
        setImageLoadError('')
        setImageSize({ width: naturalWidth, height: naturalHeight })
      } else {
        setImageSize(null)
        setImageLoadError('Không thể đọc ảnh này. Hãy chọn ảnh JPG, PNG hoặc WebP khác.')
      }
    }} onError={() => {
      setImageSize(null)
      setImageLoadError('Không thể đọc ảnh này. Hãy chọn ảnh JPG, PNG hoặc WebP khác.')
    }} />
    <div className="avatar-crop-layout">
      <div className="avatar-crop-preview" role="img" aria-label="Xem trước vùng ảnh đại diện hình vuông">
        {orientedPreviewUrl && <img src={orientedPreviewUrl} alt="" draggable={false} style={{ width: `${imageWidthRatio * 100}%`, height: `${imageHeightRatio * 100}%`, left: `${-(imageWidthRatio - 1) * positionX}%`, top: `${-(imageHeightRatio - 1) * positionY}%` }} />}
      </div>
      <div className="avatar-crop-controls">
        <button className="button light" type="button" disabled={!imageSize || !canDismiss} onClick={() => setRotation((value) => (value + 90) % 360)}>Xoay 90°</button>
        <label htmlFor="storefront-avatar-crop-zoom">Phóng to <output>{zoom.toFixed(1)}×</output></label>
        <input id="storefront-avatar-crop-zoom" type="range" min="1" max="3" step="0.1" value={zoom} disabled={!imageSize || !canDismiss} onChange={(event) => setZoom(Number(event.target.value))} />
        <label htmlFor="storefront-avatar-crop-x">Vị trí ngang <output>{positionX}%</output></label>
        <input id="storefront-avatar-crop-x" type="range" min="0" max="100" step="1" value={positionX} disabled={!imageSize || !canDismiss} onChange={(event) => setPositionX(Number(event.target.value))} />
        <label htmlFor="storefront-avatar-crop-y">Vị trí dọc <output>{positionY}%</output></label>
        <input id="storefront-avatar-crop-y" type="range" min="0" max="100" step="1" value={positionY} disabled={!imageSize || !canDismiss} onChange={(event) => setPositionY(Number(event.target.value))} />
      </div>
    </div>
    {(imageLoadError || cropError || error) && <p className="auth-error avatar-crop-error" role="alert">{imageLoadError || cropError || error}</p>}
    <div className="session-revocation-actions avatar-crop-actions">
      <button className="button light" type="button" disabled={!canDismiss} onClick={onCancel}>Hủy</button>
      <button className="button dark" type="button" disabled={!imageSize || !canDismiss || Boolean(imageLoadError)} onClick={() => void save()}>{busy || processing ? 'Đang tải ảnh…' : 'Cắt và tải lên'}</button>
    </div>
  </dialog>
}
