import { useState } from 'react'

export type SizeRecommendation = {
  size_value_id: number
  size?: { value: string } | null
  height_min_cm: number
  height_max_cm: number
  weight_min_kg: number
  weight_max_kg: number
}

type SizeOption = { id: number; value: string }
type SizeRangeDraft = { height_min_cm: string; height_max_cm: string; weight_min_kg: string; weight_max_kg: string }
const emptyRange: SizeRangeDraft = { height_min_cm: '', height_max_cm: '', weight_min_kg: '', weight_max_kg: '' }

export function SizeRecommendationsEditor({ sizes, recommendations, disabled, busy, error, onSave }: {
  sizes: SizeOption[]
  recommendations: SizeRecommendation[]
  disabled: boolean
  busy: boolean
  error?: string
  onSave: (items: Omit<SizeRecommendation, 'size'>[]) => void
}) {
  const uniqueSizes = [...new Map(sizes.map((size) => [size.id, size])).values()]
  const [rows, setRows] = useState<Record<number, SizeRangeDraft>>(() => Object.fromEntries(recommendations.map((item) => [item.size_value_id, {
    height_min_cm: String(item.height_min_cm),
    height_max_cm: String(item.height_max_cm),
    weight_min_kg: String(item.weight_min_kg),
    weight_max_kg: String(item.weight_max_kg),
  }])))
  const [validationMessage, setValidationMessage] = useState('')

  const setValue = (id: number, field: keyof SizeRangeDraft, value: string) => {
    setRows((current) => ({ ...current, [id]: { ...(current[id] ?? emptyRange), [field]: value } }))
  }

  const save = () => {
    const drafts = uniqueSizes.map((size) => ({ size_value_id: size.id, values: rows[size.id] }))
    const partial = drafts.some(({ values }) => values && Object.values(values).some(Boolean) && Object.values(values).some((value) => !value))
    if (partial) {
      setValidationMessage('Hãy điền đủ bốn khoảng đo hoặc xóa toàn bộ số đo của size.')
      return
    }
    setValidationMessage('')
    onSave(drafts.flatMap(({ size_value_id, values }) => !values || Object.values(values).every((value) => !value) ? [] : [{
      size_value_id,
      height_min_cm: Number(values.height_min_cm),
      height_max_cm: Number(values.height_max_cm),
      weight_min_kg: Number(values.weight_min_kg),
      weight_max_kg: Number(values.weight_max_kg),
    }]))
  }

  return <section className="panel reference-page">
    <div className="panel-heading"><div><h2>Gợi ý chọn size</h2><p>Nhập khoảng chiều cao và cân nặng do cửa hàng xác nhận. Để trống cả hàng nếu không áp dụng size đó.</p></div></div>
    {uniqueSizes.length === 0 ? <p>Sản phẩm chưa có biến thể size để cấu hình.</p> : <div className="table-scroll"><table>
      <thead><tr><th>Size</th><th>Chiều cao từ (cm)</th><th>Đến (cm)</th><th>Cân nặng từ (kg)</th><th>Đến (kg)</th></tr></thead>
      <tbody>{uniqueSizes.map((size) => {
        const row = rows[size.id] ?? emptyRange
        return <tr key={size.id}><th>{size.value}</th>{(['height_min_cm', 'height_max_cm', 'weight_min_kg', 'weight_max_kg'] as const).map((field) => <td key={field}>
          <input aria-label={`${size.value}, ${field}`} type="number" min="1" step="0.1" disabled={disabled} value={row[field]} onChange={(event) => setValue(size.id, field, event.target.value)} />
        </td>)}</tr>
      })}</tbody>
    </table></div>}
    {validationMessage && <p role="alert">{validationMessage}</p>}
    {error && <p role="alert">{error}</p>}
    {!disabled && <div className="reference-form-actions"><button className="primary" type="button" disabled={busy || uniqueSizes.length === 0} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu gợi ý size'}</button></div>}
  </section>
}
