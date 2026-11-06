import { adminApiFetch } from '../../lib/admin-api'
import { enqueueAdminExportWhenLarge } from '../../lib/admin-exports'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = { apiUrl: string; accessToken: string; query?: string; total?: number }

export function CustomerExportButton({ apiUrl, accessToken, query = '', total = 0 }: Props) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const exportCsv = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      if (await enqueueAdminExportWhenLarge({ apiUrl, accessToken, type: 'customers', rowCount: total, filters: new URLSearchParams(query) })) {
        setNotice(t('Đã đưa tệp khách hàng vào Trung tâm tải xuống.'))
        return
      }
      const response = await adminApiFetch(apiUrl + '/admin/customers/export' + (query ? '?' + query : ''), { headers: { Authorization: 'Bearer ' + accessToken, Accept: 'text/csv' } })
      if (!response.ok) throw new Error(t('Không thể xuất CSV khách hàng.'))
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a'); link.href = url; link.download = 'customers-' + new Date().toISOString().slice(0, 10) + '.csv'; link.click(); URL.revokeObjectURL(url)
    } catch (cause) {
      setError(cause instanceof Error ? t(cause.message) : t('Không thể xuất CSV khách hàng.'))
    } finally { setBusy(false) }
  }

  return <span><button className="secondary" type="button" disabled={busy} onClick={() => void exportCsv()}>{busy ? t('Đang xuất...') : t('Xuất CSV khách hàng')}</button>{notice && <small role="status">{notice}</small>}{error && <small role="alert" className="reference-error">{t(error)}</small>}</span>
}
