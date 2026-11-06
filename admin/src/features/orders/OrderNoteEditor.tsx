import { useState } from 'react'
import { createApiResponseError, ApiResponseError } from '../../components/shared/api-validation'
import { FormField } from '../../components/shared/form-field'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'

type Props = { orderId: number; initialNote: string; apiUrl: string; accessToken: string; onSaved: (order: unknown) => void }

export function OrderNoteEditor({ orderId, initialNote, apiUrl, accessToken, onSaved }: Props) {
  const { t } = useTranslation()
  const [note, setNote] = useState(initialNote ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [notice, setNotice] = useState('')

  const save = async () => {
    if (note.trim().length < 3) {
      setFieldError(t('Ghi chú cần có ít nhất 3 ký tự.'))
      setNotice('')
      return
    }
    setBusy(true)
    setError('')
    setFieldError('')
    setNotice('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/orders/${orderId}/note`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || null }),
      })
      const body = await response.json() as { data?: unknown; message?: string; errors?: Record<string, string[]> }
      if (!response.ok) throw createApiResponseError(body, response.status, t('Không thể lưu ghi chú.'))
      onSaved(body.data)
      setNote('')
      setNotice(t('Đã lưu ghi chú.'))
    } catch (cause) {
      if (cause instanceof ApiResponseError && cause.status === 422 && cause.fieldErrors?.note?.[0]) {
        setFieldError(cause.fieldErrors.note[0])
      } else {
        setError(cause instanceof Error ? cause.message : t('Không thể lưu ghi chú.'))
      }
    } finally {
      setBusy(false)
    }
  }

  return <section className="panel reference-page">
    <h3>{t('Ghi chú nội bộ')}</h3>
    <FormField id="order-internal-note" label={t('Ghi chú')} required error={fieldError}>
      <textarea required rows={4} minLength={3} maxLength={2000} aria-invalid={Boolean(fieldError)} value={note} onChange={(event) => { setNote(event.target.value); setFieldError('') }} placeholder={t('Chỉ nhân viên cửa hàng nhìn thấy ghi chú này.')} />
    </FormField>
    {error && <p className="reference-error" role="alert">{error}</p>}
    {notice && <p className="reference-notice" role="status">{notice}</p>}
    <button className="primary" type="button" disabled={busy} onClick={() => void save()}>{busy ? t('Đang lưu...') : t('Lưu ghi chú')}</button>
  </section>
}
