import { useState } from 'react'
import { FormField } from '../../components/shared/form-field'
import { useTranslation } from 'react-i18next'

export type EditableVariantField = 'price' | 'compare_at_price' | 'weight_gram' | 'initial_quantity' | 'is_active'

type Props = {
  disabled?: boolean
  includeInitialQuantity?: boolean
  onApply: (field: EditableVariantField, value: string | boolean) => void
}

export function VariantBulkEditor({ disabled = false, includeInitialQuantity = false, onApply }: Props) {
  const { t } = useTranslation()
  const [field, setField] = useState<EditableVariantField>('price')
  const [value, setValue] = useState('')
  const fields: EditableVariantField[] = ['price', 'compare_at_price', 'weight_gram', ...(includeInitialQuantity ? ['initial_quantity' as const] : []), 'is_active']
  const fieldLabels: Record<EditableVariantField, string> = {
    price: t('Giá bán (VND)'),
    compare_at_price: t('Giá so sánh (VND)'),
    weight_gram: t('Trọng lượng (gram)'),
    initial_quantity: t('Tồn khởi tạo'),
    is_active: t('Trạng thái'),
  }

  const apply = () => {
    if (field !== 'is_active' && !value.trim()) return
    onApply(field, field === 'is_active' ? value === 'true' : value.trim())
    setValue('')
  }

  return <fieldset className="product-variant-bulk-editor">
    <legend>{t('Áp dụng cho tất cả biến thể')}</legend>
    <FormField id="variant-bulk-field" label={t('Cột cần cập nhật')} required>
      <select disabled={disabled} value={field} onChange={(event) => { setField(event.target.value as EditableVariantField); setValue('') }}>
        {fields.map((item) => <option key={item} value={item}>{fieldLabels[item]}</option>)}
      </select>
    </FormField>
    <FormField id="variant-bulk-value" label={t('Giá trị')} required>
      {field === 'is_active'
        ? <select disabled={disabled} value={value} onChange={(event) => setValue(event.target.value)}><option value="">{t('Chọn trạng thái')}</option><option value="true">{t('Đang bật')}</option><option value="false">{t('Đã tắt')}</option></select>
        : <input disabled={disabled} type="number" min="0" step="1" value={value} onChange={(event) => setValue(event.target.value)} placeholder={field === 'compare_at_price' ? t('Nhập 0 để xóa giá so sánh') : t('Số nguyên không âm')} />}
    </FormField>
    <button type="button" className="secondary" disabled={disabled || !value.trim()} onClick={apply}>{t('Áp dụng hàng loạt')}</button>
    <small>{t('Thao tác ghi đè giá trị của tất cả biến thể; tồn kho đang có chỉ thay đổi tại trang Kho hàng.')}</small>
  </fieldset>
}
