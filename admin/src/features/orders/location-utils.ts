import locations from '../../../../shared/data/vietnam-addresses.json'

type Ward = { code: string; name: string }
type Province = { code: string; name: string; wards: Ward[] }

const provinces = locations.provinces as Province[]
export const addressProvinces = provinces

function normalizeName(value: string | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('vi-VN').replace(/^(tỉnh|thành phố|tp\.?|tx\.?|thị xã)\s+/u, '')
}

export function resolveProvinceCode(code?: string, name?: string) {
  if (provinces.some((province) => province.code === code)) return code ?? ''
  const normalized = normalizeName(name)
  return provinces.find((province) => normalizeName(province.name) === normalized)?.code ?? ''
}

export function resolveWardCode(provinceCode: string, code?: string, name?: string) {
  const province = provinces.find((item) => item.code === provinceCode)
  if (!province) return ''
  if (province.wards.some((ward) => ward.code === code)) return code ?? ''
  const normalized = normalizeName(name)
  return province.wards.find((ward) => normalizeName(ward.name) === normalized)?.code ?? ''
}

export function provinceNameForCode(code: string) {
  return provinces.find((province) => province.code === code)?.name ?? ''
}

export function wardNameForCode(provinceCode: string, wardCode: string) {
  const province = provinces.find((item) => item.code === provinceCode)
  return province?.wards.find((ward) => ward.code === wardCode)?.name ?? ''
}

export function formatOrderAddress(address: Record<string, string> | null | undefined) {
  return ['street', 'ward', 'district', 'province'].map((field) => address?.[field]?.trim()).filter(Boolean).join(', ')
}
