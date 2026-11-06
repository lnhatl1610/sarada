import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp'])
const defaultMaximumFileSizeMb = 2

type ImageUploaderProps = {
  label: string
  helperText: string
  onFiles: (files: File[]) => void
  children?: ReactNode
  error?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  maxFileSizeMb?: number
}

function isSupportedImage(file: File) {
  const extension = file.name.split('.').at(-1)?.toLowerCase()
  return imageTypes.has(file.type) || (Boolean(extension) && imageExtensions.has(extension!))
}

export function ImageUploader({ label, helperText, onFiles, children, error, accept = 'image/jpeg,image/png,image/webp', multiple = true, disabled = false, maxFileSizeMb = defaultMaximumFileSizeMb }: ImageUploaderProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [selectionError, setSelectionError] = useState('')

  const receiveFiles = (selected: File[]) => {
    if (disabled || !selected.length) return
    const candidates = multiple ? selected : selected.slice(0, 1)
    const maximumFileSize = maxFileSizeMb * 1024 * 1024
    const accepted = candidates.filter((file) => isSupportedImage(file) && file.size <= maximumFileSize)
    const rejectedCount = candidates.length - accepted.length
    setSelectionError(rejectedCount ? t('{{count}} ảnh không hợp lệ. Chỉ nhận JPG, PNG hoặc WebP tối đa {{max}} MB mỗi ảnh.', { count: rejectedCount, max: maxFileSizeMb }) : '')
    if (accepted.length) onFiles(accepted)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    receiveFiles(Array.from(event.dataTransfer.files))
  }

  return <section className={`shared-image-uploader${dragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`}>
    <div
      className="shared-image-uploader-dropzone"
      onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true) }}
      onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setDragging(false)
      }}
      onDrop={onDrop}
    >
      <div className="shared-image-uploader-copy"><strong>{label}</strong><small>{helperText}</small></div>
      <button className="secondary" type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>{t('Chọn ảnh')}</button>
      <input ref={inputRef} className="shared-image-uploader-input" type="file" accept={accept} multiple={multiple} disabled={disabled} aria-label={label} onChange={(event) => { receiveFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = '' }} />
    </div>
    {(selectionError || error) && <p className="shared-field-error" role="alert">{selectionError || error}</p>}
    {children}
  </section>
}
