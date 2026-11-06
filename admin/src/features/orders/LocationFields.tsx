import type { ChangeEvent } from 'react'
import { addressProvinces } from './location-utils'
import { useTranslation } from 'react-i18next'

type Props = {
  idPrefix: string
  provinceCode: string
  wardCode: string
  onProvinceChange: (code: string) => void
  onWardChange: (code: string) => void
  provinceError?: string
  wardError?: string
  disabled?: boolean
}

export function LocationFields({ idPrefix, provinceCode, wardCode, onProvinceChange, onWardChange, provinceError, wardError, disabled = false }: Props) {
  const { t } = useTranslation()
  const selectedProvince = addressProvinces.find((province) => province.code === provinceCode)
  const wards = selectedProvince?.wards ?? []

  const changeProvince = (event: ChangeEvent<HTMLSelectElement>) => {
    onProvinceChange(event.target.value)
    onWardChange('')
  }

  return <div className="address-location-fields">
    <label className="address-location-field" htmlFor={`${idPrefix}-province`}>
      <span>{t('Tỉnh/Thành phố')} <span aria-hidden="true">*</span></span>
      <select id={`${idPrefix}-province`} required value={provinceCode} onChange={changeProvince} disabled={disabled} aria-invalid={Boolean(provinceError)} aria-describedby={provinceError ? `${idPrefix}-province-error` : undefined}>
        <option value="">{t('Chọn tỉnh/thành phố')}</option>
        {addressProvinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
      </select>
      {provinceError && <small id={`${idPrefix}-province-error`} className="shared-field-error" role="alert">{provinceError}</small>}
    </label>
    <label className="address-location-field" htmlFor={`${idPrefix}-ward`}>
      <span>{t('Phường/Xã/Đặc khu')} <span aria-hidden="true">*</span></span>
      <select id={`${idPrefix}-ward`} required value={wardCode} onChange={(event) => onWardChange(event.target.value)} disabled={disabled || !provinceCode} aria-invalid={Boolean(wardError)} aria-describedby={wardError ? `${idPrefix}-ward-error` : undefined}>
        <option value="">{provinceCode ? t('Chọn phường/xã/đặc khu') : t('Chọn tỉnh/thành phố trước')}</option>
        {wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
      </select>
      {wardError && <small id={`${idPrefix}-ward-error`} className="shared-field-error" role="alert">{wardError}</small>}
    </label>
  </div>
}
