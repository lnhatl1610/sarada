import { useId, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

type ProductTagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
  error?: string
}

export function ProductTagInput({ value, onChange, disabled = false, error: fieldError }: ProductTagInputProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [draft, setDraft] = useState('')
  const [inputError, setInputError] = useState('')
  const error = inputError || fieldError

  const addDraft = () => {
    const tag = draft.trim()
    if (!tag) return
    if (tag.length > 50) {
      setInputError(t('Mỗi nhãn tối đa 50 ký tự.'))
      return
    }
    if (value.some((item) => item.toLocaleLowerCase('vi-VN') === tag.toLocaleLowerCase('vi-VN'))) {
      setInputError(t('Nhãn này đã có trong danh sách.'))
      return
    }
    if (value.length >= 20) {
      setInputError(t('Mỗi sản phẩm tối đa 20 nhãn.'))
      return
    }
    onChange([...value, tag])
    setDraft('')
    setInputError('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addDraft()
    } else if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
      setInputError('')
    }
  }

  return (
    <div className="shared-form-field product-tag-field">
      <label htmlFor={inputId}>{t('Nhãn sản phẩm')}</label>
      <div className="product-tag-control" aria-invalid={Boolean(error)}>
        {value.map((tag) => (
          <span className="product-tag-chip" key={tag}>
            {tag}
            <button type="button" disabled={disabled} aria-label={t('Xóa nhãn {{tag}}', { tag })} onClick={() => { onChange(value.filter((item) => item !== tag)); setInputError('') }}>×</button>
          </span>
        ))}
        <input
          id={inputId}
          value={draft}
          maxLength={50}
          disabled={disabled || value.length >= 20}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          placeholder={value.length >= 20 ? t('Đã đạt giới hạn 20 nhãn') : t('Nhập nhãn rồi nhấn Enter')}
          onChange={(event) => { setDraft(event.target.value); setInputError('') }}
          onKeyDown={handleKeyDown}
          onBlur={addDraft}
        />
      </div>
      <small>{t('Nhấn Enter hoặc dấu phẩy để thêm; tối đa 20 nhãn, mỗi nhãn 50 ký tự.')}</small>
      {error && <small id={errorId} className="shared-field-error" role="alert">{error}</small>}
    </div>
  )
}
