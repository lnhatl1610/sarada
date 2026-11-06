import { adminApiFetch } from '../../lib/admin-api'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '../../lib/use-debounced-value'
import { FormField } from '../../components/shared/form-field'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { useTranslation } from 'react-i18next'
import '../../InventoryControls.css'

type Props = { apiUrl: string; accessToken: string }
type CsvRow = { line: number; sku: string; quantity: string; note: string; error?: string }
type ImportIssue = { line: number; sku?: string; quantity?: string; note?: string; error: string }
type ImportResult = { updated: number; errors: ImportIssue[] }
type InventorySearchResult = { variant_id: number; sku: string; barcode: string | null; product_name: string; color_name: string | null; size_name: string | null; quantity: number; reserved: number }

function parseCsv(text: string, t: (key: string) => string): { line: number; cells: string[] }[] {
  const records: { line: number; cells: string[] }[] = []
  let cells: string[] = []
  let value = ''
  let quoted = false
  let line = 1
  let recordLine = 1

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        value += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        value += char
        if (char === '\n') line += 1
      }
      continue
    }

    if (char === '"' && value.length === 0) {
      quoted = true
    } else if (char === ',') {
      cells.push(value)
      value = ''
    } else if (char === '\r' || char === '\n') {
      cells.push(value)
      if (cells.some((cell) => cell.trim() !== '')) records.push({ line: recordLine, cells })
      cells = []
      value = ''
      if (char === '\r' && text[index + 1] === '\n') index += 1
      line += 1
      recordLine = line
    } else {
      value += char
    }
  }

  if (quoted) throw new Error(t('CSV có dấu ngoặc kép chưa được đóng.'))
  if (value.length || cells.length) {
    cells.push(value)
    if (cells.some((cell) => cell.trim() !== '')) records.push({ line: recordLine, cells })
  }
  return records
}

export function InventoryImportPage({ apiUrl, accessToken }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'manual' | 'csv'>('manual')
  const [manualSearch, setManualSearch] = useState('')
  const manualTerm = useDebouncedValue(manualSearch.trim())
  const [selectedVariant, setSelectedVariant] = useState<InventorySearchResult | null>(null)
  const [manualQuantity, setManualQuantity] = useState('')
  const [manualNote, setManualNote] = useState('')
  const [manualBusy, setManualBusy] = useState(false)
  const [manualConfirming, setManualConfirming] = useState(false)
  const [manualError, setManualError] = useState('')
  const [manualMessage, setManualMessage] = useState('')
  const [rows, setRows] = useState<CsvRow[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importErrors, setImportErrors] = useState<ImportResult['errors']>([])
  const [busy, setBusy] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  const invalidCount = useMemo(() => rows.filter((row) => row.error).length, [rows])
  const searchQuery = useQuery({
    queryKey: ['admin', 'inventory-manual-receive-search', manualTerm],
    enabled: Boolean(accessToken && mode === 'manual' && manualTerm.length >= 2),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ q: manualTerm, per_page: '10' })
      const response = await adminApiFetch(`${apiUrl}/admin/inventory?${params}`, { signal, headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      const body = await response.json() as { data?: InventorySearchResult[]; message?: string }
      if (!response.ok) throw new Error(body.message ?? t('Không tìm được SKU trong kho.'))
      return body.data ?? []
    },
  })

  const receiveManually = async () => {
    const quantity = Number(manualQuantity)
    if (!selectedVariant || !Number.isInteger(quantity) || quantity < 1 || quantity > 100000 || manualNote.trim().length < 3) {
      setManualError(t('Chọn SKU, nhập số nguyên từ 1 đến 100.000 và ghi chú ít nhất 3 ký tự.'))
      return
    }
    setManualBusy(true)
    setManualError('')
    setManualMessage('')
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/${selectedVariant.variant_id}/adjust`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'import', quantity_change: quantity, reason: manualNote.trim() }),
      })
      const body = await response.json() as { data?: { quantity: number }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !body.data) throw new Error(body.errors ? Object.values(body.errors).flat()[0] : body.message ?? t('Không thể nhập kho.'))
      setManualMessage(t('Đã nhập {{quantity}} sản phẩm cho SKU {{sku}}. Tồn mới: {{stock}}.', { quantity, sku: selectedVariant.sku, stock: body.data.quantity }))
      setManualConfirming(false)
      setSelectedVariant(null)
      setManualQuantity('')
      setManualNote('')
      setManualSearch('')
    } catch (cause) {
      setManualError(cause instanceof Error ? cause.message : t('Không thể nhập kho.'))
    } finally {
      setManualBusy(false)
    }
  }

  const choose = async (selected?: File) => {
    setFile(null)
    setRows([])
    setError('')
    setMessage('')
    setImportErrors([])
    if (!selected) return
    if (selected.size > 2 * 1024 * 1024) {
      setError(t('File CSV không được vượt quá 2 MB.'))
      return
    }

    try {
      const records = parseCsv((await selected.text()).replace(/^\uFEFF/, ''), t)
      const header = records[0]?.cells.map((cell) => cell.trim().toLowerCase()) ?? []
      if (header.length !== 3 || header[0] !== 'sku' || header[1] !== 'quantity' || header[2] !== 'note') {
        throw new Error(t('CSV phải có đúng ba cột theo thứ tự: sku, quantity, note.'))
      }

      const parsedRows = records.slice(1).map(({ line, cells }): CsvRow => {
        if (cells.length !== 3) return { line, sku: cells[0]?.trim() ?? '', quantity: cells[1]?.trim() ?? '', note: cells[2]?.trim() ?? '', error: t('Dòng phải có đúng 3 cột.') }
        const [sku, quantity, note] = cells.map((cell) => cell.trim())
        if (!sku) return { line, sku, quantity, note, error: t('Thiếu SKU.') }
        if (!/^[1-9]\d*$/.test(quantity) || Number(quantity) > 100000) return { line, sku, quantity, note, error: t('Số lượng phải là số nguyên từ 1 đến 100000.') }
        return { line, sku, quantity, note }
      })

      if (!parsedRows.length) throw new Error(t('CSV chưa có dòng dữ liệu để nhập.'))
      setFile(selected)
      setRows(parsedRows)
      setPreviewing(true)
      const body = new FormData()
      body.append('file', selected)
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/import-csv?preview=1`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        body,
      })
      const result = await response.json() as { data?: ImportResult; message?: string }
      if (!response.ok || !result.data) throw new Error(result.message ?? t('Không thể kiểm tra các SKU trong tệp CSV.'))
      const errorsByLine = new Map(result.data.errors.map((item) => [item.line, item]))
      const previewRows = parsedRows.map((row) => {
        const serverError = errorsByLine.get(row.line)
        return serverError ? { ...row, error: serverError.error } : row
      })
      setRows(previewRows)
      const sourceRowsByLine = new Map(parsedRows.map((row) => [row.line, row]))
      setImportErrors(result.data.errors.map((item) => {
        const source = sourceRowsByLine.get(item.line)
        return { ...item, sku: item.sku ?? source?.sku, quantity: source?.quantity, note: source?.note }
      }))
      setMessage(t('Đã kiểm tra {{total}} dòng. {{invalid}} dòng cần sửa; các dòng hợp lệ có thể được nhập.', { total: parsedRows.length, invalid: result.data.errors.length }))
    } catch (cause) {
      setFile(null)
      setRows([])
      setError(cause instanceof Error ? cause.message : t('Không đọc được nội dung CSV.'))
    } finally {
      setPreviewing(false)
    }
  }

  const submit = async () => {
    if (!file || !rows.length || busy) return
    setBusy(true)
    setError('')
    setMessage('')
    setImportErrors([])
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await adminApiFetch(`${apiUrl}/admin/inventory/import-csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        body,
      })
      const result = await response.json() as { data?: ImportResult; message?: string }
      if (!response.ok && response.status !== 207) throw new Error(result.message ?? t('Không thể nhập kho.'))

      const imported = result.data?.updated ?? 0
      const sourceRowsByLine = new Map(rows.map((row) => [row.line, row]))
      const rejected = (result.data?.errors ?? []).map((item) => {
        const source = sourceRowsByLine.get(item.line)
        return { ...item, sku: item.sku ?? source?.sku, quantity: source?.quantity, note: source?.note }
      })
      setMessage(t('Đã nhập {{imported}} dòng{{rejected}}.', { imported, rejected: rejected.length ? t('; {{count}} dòng cần xử lý', { count: rejected.length }) : '' }))
      setImportErrors(rejected)
      // A 207 response may already have applied some rows. Clear the upload to prevent duplicate receipts.
      setFile(null)
      setRows([])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Không thể nhập kho.'))
    } finally {
      setBusy(false)
    }
  }

  const downloadImportErrors = () => {
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`
    const content = ['line,sku,quantity,note,error', ...importErrors.map((row) => [row.line, row.sku ?? '', row.quantity ?? '', row.note ?? '', row.error].map((value) => escapeCell(String(value))).join(','))].join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `inventory-import-errors-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    const blob = new Blob(['\uFEFFsku,quantity,note\r\nSKU-THAY-THE,10,"Nhập kho từ nhà cung cấp"\r\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return <section className="panel reference-page">
      <div className="panel-heading">
      <div><h2>{t('Nhập kho thủ công hoặc CSV')}</h2><p>{t('Chọn một biến thể để nhập nhanh hoặc dùng file CSV để ghi nhận nhiều SKU cùng lúc.')}</p></div>
      <div className="list-actions"><a className="secondary" href="/imports">{t('Lịch sử nhập')}</a><a className="secondary" href="/inventory">{t('Quay lại kho')}</a></div>
    </div>
    <div className="inventory-import-tabs" role="group" aria-label={t('Chọn cách nhập kho')}><button type="button" className={mode === 'manual' ? 'active' : ''} aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>{t('Nhập thủ công')}</button><button type="button" className={mode === 'csv' ? 'active' : ''} aria-pressed={mode === 'csv'} onClick={() => setMode('csv')}>{t('Nhập CSV')}</button></div>
    {mode === 'manual' && <div className="inventory-manual-receive">
      <FormField id="inventory-manual-search" label={t('Tìm SKU')} hint={t('Nhập ít nhất 2 ký tự của SKU, barcode hoặc tên sản phẩm.')}>
        <input value={manualSearch} disabled={manualBusy} onChange={(event) => { setManualSearch(event.target.value); setSelectedVariant(null); setManualError('') }} placeholder={t('SKU, barcode hoặc tên sản phẩm')} />
      </FormField>
      {searchQuery.isFetching && <p role="status">{t('Đang tìm SKU…')}</p>}
      {searchQuery.error instanceof Error && <p className="reference-error" role="alert">{searchQuery.error.message} <button className="secondary" type="button" onClick={() => void searchQuery.refetch()}>{t('Thử lại')}</button></p>}
      {(searchQuery.data?.length ?? 0) > 0 && !selectedVariant && <div className="inventory-manual-results" role="listbox" aria-label={t('SKU tìm thấy')}>{searchQuery.data?.map((item) => <button key={item.variant_id} type="button" role="option" aria-selected="false" onClick={() => { setSelectedVariant(item); setManualSearch(item.sku); setManualError('') }}><strong>{item.sku}</strong><span>{item.product_name} · {[item.color_name, item.size_name].filter(Boolean).join(' / ') || t('Biến thể mặc định')}</span><small>{t('Tồn {{quantity}} · Giữ {{reserved}}', { quantity: item.quantity, reserved: item.reserved })}</small></button>)}</div>}
      {manualTerm.length >= 2 && searchQuery.isSuccess && !searchQuery.data?.length && <p className="empty-state">{t('Không tìm thấy SKU phù hợp.')}</p>}
      {selectedVariant && <section className="inventory-manual-selected"><h3>{selectedVariant.product_name}</h3><p>{t('SKU {{sku}} · {{variant}} · Tồn hiện tại {{quantity}} · Đang giữ {{reserved}}', { sku: selectedVariant.sku, variant: [selectedVariant.color_name, selectedVariant.size_name].filter(Boolean).join(' / ') || t('Biến thể mặc định'), quantity: selectedVariant.quantity, reserved: selectedVariant.reserved })}</p><FormField id="inventory-manual-quantity" label={t('Số lượng nhập')} required hint={t('Số nguyên dương, tối đa 100.000.')}><input type="number" min="1" max="100000" step="1" value={manualQuantity} disabled={manualBusy} onChange={(event) => setManualQuantity(event.target.value)} /></FormField><FormField id="inventory-manual-note" label={t('Ghi chú')} required hint={t('Ví dụ: nhập hàng từ nhà cung cấp A.')}><textarea required minLength={3} rows={3} maxLength={500} value={manualNote} disabled={manualBusy} onChange={(event) => setManualNote(event.target.value)} /></FormField><button className="primary" type="button" disabled={manualBusy || !/^[1-9]\d*$/.test(manualQuantity) || Number(manualQuantity) > 100000 || manualNote.trim().length < 3} onClick={() => setManualConfirming(true)}>{t('Xem lại và nhập kho')}</button></section>}
      {manualError && <p className="reference-error" role="alert">{manualError}</p>}{manualMessage && <p className="reference-notice" role="status">{manualMessage}</p>}
      <ConfirmDialog open={manualConfirming} title={t('Xác nhận nhập kho?')} description={selectedVariant ? t('Nhập {{quantity}} sản phẩm cho SKU {{sku}}. Tồn {{before}} → {{after}}. Ghi chú: {{note}}.', { quantity: manualQuantity, sku: selectedVariant.sku, before: selectedVariant.quantity, after: selectedVariant.quantity + Number(manualQuantity), note: manualNote || t('không có') }) : ''} confirmLabel={t('Nhập kho')} busy={manualBusy} onConfirm={() => void receiveManually()} onOpenChange={(open) => { if (!open && !manualBusy) setManualConfirming(false) }} />
    </div>}
    {mode === 'csv' && <>
    <button className="secondary" type="button" onClick={downloadTemplate}>{t('Tải file mẫu CSV')}</button>
    <FormField id="inventory-import-file" label={t('Chọn file CSV')} hint={t('CSV UTF-8, tối đa 2 MB; cột: sku, quantity, note.')}>
      <input type="file" accept=".csv,text/csv" disabled={busy || previewing} onChange={(event) => { void choose(event.currentTarget.files?.[0]); event.currentTarget.value = '' }} />
    </FormField>
    {file && <p role="status">{previewing ? t('Đang kiểm tra SKU trong {{file}}…', { file: file.name }) : t('Đã đọc {{file}}: {{total}} dòng dữ liệu, {{invalid}} dòng cần sửa.', { file: file.name, total: rows.length, invalid: invalidCount })}</p>}
    {rows.length > 0 && <div className="table-wrap"><table>
      <thead><tr><th>{t('Dòng')}</th><th>SKU</th><th>{t('Số lượng')}</th><th>{t('Ghi chú')}</th><th>{t('Kiểm tra')}</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={`${row.line}-${row.sku}`}>
        <td>{row.line}</td><td>{row.sku || '—'}</td><td>{row.quantity || '—'}</td><td>{row.note || '—'}</td><td>{row.error ?? t('Sẵn sàng')}</td>
      </tr>)}</tbody>
    </table></div>}
    {error && <p className="reference-error" role="alert">{error}</p>}
    {importErrors.length > 0 && <div className="reference-error" role="alert"><p>{t('Các dòng cần sửa trước khi nhập:')}</p><ul>{importErrors.map((item, index) => <li key={`${item.line}-${index}`}>{t('Dòng {{line}}{{sku}}: {{error}}', { line: item.line, sku: item.sku ? ` · ${item.sku}` : '', error: item.error })}</li>)}</ul><button className="secondary" type="button" onClick={downloadImportErrors}>{t('Tải CSV dòng lỗi')}</button></div>}
    {message && <p className="reference-notice" role="status">{message}</p>}
    <button className="primary" type="button" disabled={!file || !rows.length || busy || previewing || rows.every((row) => row.error)} onClick={() => void submit()}>
      {busy ? t('Đang nhập...') : t('Xác nhận nhập {{count}} dòng hợp lệ', { count: rows.filter((row) => !row.error).length })}
    </button>
    </>}
  </section>
}
