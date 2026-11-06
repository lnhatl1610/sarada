import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import './AddressBookPage.css'
import type { CustomerAddress } from './account-api'
import type { AddressOption } from '../checkout/address-api'

export type AddressFormValues = {
  label: 'home' | 'company' | 'other'
  recipient_name: string
  phone: string
  province_code: string
  district_code: string
  ward_code: string
  street: string
  is_default: boolean
  is_default_billing: boolean
}

const addressSchema = z.object({
  label: z.enum(['home', 'company', 'other']),
  recipient_name: z.string().trim().min(1, 'Vui lòng nhập tên người nhận.').max(160, 'Tên người nhận không được quá 160 ký tự.'),
  phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.'),
  province_code: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố.').max(32),
  district_code: z.string().max(32),
  ward_code: z.string().min(1, 'Vui lòng chọn xã/phường.').max(32),
  street: z.string().trim().min(1, 'Vui lòng nhập địa chỉ cụ thể.').max(255, 'Địa chỉ không được quá 255 ký tự.'),
  is_default: z.boolean(),
  is_default_billing: z.boolean(),
})

type AddressBookPageProps = {
  addresses: CustomerAddress[]
  loading: boolean
  error: string
  values: AddressFormValues
  editing: CustomerAddress | null
  provinceCode: string
  provinces: AddressOption[]
  wards: AddressOption[]
  provincesLoading: boolean
  provincesError: boolean
  locationsLoading: boolean
  locationsError: boolean
  busy: boolean
  busyDefaultAddressId?: number
  busyDeletingAddressId?: number
  pendingAddressDeletion: CustomerAddress | null
  fieldErrors: Record<string, string>
  onSubmit: (values: AddressFormValues) => void | Promise<void>
  onClearFieldError: (field: string) => void
  onProvinceChange: (provinceCode: string) => void
  onRetryLocations: () => void
  onMakeDefault: (address: CustomerAddress) => void
  onEdit: (address: CustomerAddress) => void
  onRemove: (address: CustomerAddress) => void
  onConfirmRemove: () => void | Promise<void>
  onCancelRemove: () => void
  onCancelEdit: () => void
}

export function AddressBookPage({
  addresses,
  loading,
  error,
  values,
  editing,
  provinceCode,
  provinces,
  wards,
  provincesLoading,
  provincesError,
  locationsLoading,
  locationsError,
  busy,
  busyDefaultAddressId,
  busyDeletingAddressId,
  pendingAddressDeletion,
  fieldErrors,
  onSubmit,
  onClearFieldError,
  onProvinceChange,
  onRetryLocations,
  onMakeDefault,
  onEdit,
  onRemove,
  onConfirmRemove,
  onCancelRemove,
  onCancelEdit,
}: AddressBookPageProps) {
  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const pageHeadingRef = useRef<HTMLHeadingElement>(null)
  const previousDeleteIdRef = useRef<number | null>(null)
  const deleteBusy = pendingAddressDeletion !== null && busyDeletingAddressId === pendingAddressDeletion.id
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: values,
  })
  useEffect(() => reset(values), [reset, values])
  useEffect(() => {
    const dialog = deleteDialogRef.current
    if (!dialog) return
    if (pendingAddressDeletion) {
      previousDeleteIdRef.current = pendingAddressDeletion.id
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      const deletedAddress = previousDeleteIdRef.current !== null
        && !addresses.some((address) => address.id === previousDeleteIdRef.current)
      previousDeleteIdRef.current = null
      dialog.close()
      if (deletedAddress) window.requestAnimationFrame(() => pageHeadingRef.current?.focus())
    }
  }, [addresses, pendingAddressDeletion])
  const recipientField = register('recipient_name')
  const phoneField = register('phone')
  const streetField = register('street')
  const provinceField = register('province_code')
  const wardField = register('ward_code')

  return (
    <div className="container subpage account-page">
      <Link className="back-link" to="/account">← Tài khoản</Link>
      <p className="eyebrow">SỔ ĐỊA CHỈ</p>
      <h1 ref={pageHeadingRef} tabIndex={-1}>Địa chỉ giao hàng</h1>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="address-list">
        {loading ? <p className="state" role="status">Đang tải sổ địa chỉ…</p> : addresses.map((address) => (
          <article className="saved-address" key={address.id}>
            <div>
              <b>{address.recipient_name}</b>
              <span className="default-address-label">{address.label === 'company' ? 'Công ty' : address.label === 'other' ? 'Khác' : 'Nhà'}</span>
              {address.is_default && <span className="default-address">Mặc định giao hàng</span>}
              {address.is_default_billing && <span className="default-address">Mặc định hóa đơn</span>}
              <p>{address.phone}</p>
              <p>{address.street}, {address.ward_name ?? address.ward_code}{address.district_code && <> · {address.district_code}</>}, {address.province_name ?? address.province_code}</p>
            </div>
            <div>
              {!address.is_default && <button className="link-button" type="button" disabled={busyDefaultAddressId !== undefined} onClick={() => onMakeDefault(address)}>{busyDefaultAddressId === address.id ? 'Đang cập nhật…' : 'Đặt mặc định'}</button>}
              <button className="link-button" type="button" onClick={() => onEdit(address)}>Sửa</button>
              <button className="link-button" type="button" disabled={busyDeletingAddressId !== undefined} onClick={() => onRemove(address)}>{busyDeletingAddressId === address.id ? 'Đang xóa…' : 'Xóa'}</button>
            </div>
          </article>
        ))}
        {!loading && !addresses.length && !error && <div className="address-empty"><img className="account-empty-illustration" src="/illustrations/empty-addresses.svg" alt="" aria-hidden="true" /><p className="auth-lede">Bạn chưa lưu địa chỉ nào. Thêm địa chỉ để checkout nhanh hơn.</p></div>}
      </div>
      <dialog
        ref={deleteDialogRef}
        className="address-delete-dialog"
        aria-labelledby="address-delete-title"
        aria-describedby="address-delete-description"
        onCancel={(event) => {
          event.preventDefault()
          if (!deleteBusy) onCancelRemove()
        }}
      >
        {pendingAddressDeletion && <>
          <p className="eyebrow">XÁC NHẬN THAO TÁC</p>
          <h2 id="address-delete-title">Xóa địa chỉ giao hàng?</h2>
          <p id="address-delete-description">Địa chỉ của <strong>{pendingAddressDeletion.recipient_name}</strong> tại <strong>{pendingAddressDeletion.street}</strong> sẽ bị xóa khỏi sổ địa chỉ.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="address-delete-actions">
            <button className="button light" type="button" disabled={deleteBusy} onClick={onCancelRemove}>Giữ lại</button>
            <button className="button address-delete-confirm" type="button" disabled={deleteBusy} onClick={() => void onConfirmRemove()}>{deleteBusy ? 'Đang xóa…' : 'Xóa địa chỉ'}</button>
          </div>
        </>}
      </dialog>
      <form className="auth-form address-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2>{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
        <input type="hidden" {...register('district_code')} />
        <label>Nhãn địa chỉ<select aria-invalid={Boolean(errors.label || fieldErrors.label)} aria-describedby={errors.label || fieldErrors.label ? 'address-label-error' : undefined} {...register('label', { onChange: () => onClearFieldError('label') })}><option value="home">Nhà</option><option value="company">Công ty</option><option value="other">Khác</option></select>{(errors.label?.message || fieldErrors.label) && <small id="address-label-error" className="field-error" role="alert">{errors.label?.message || fieldErrors.label}</small>}</label>
        <label>Người nhận<input maxLength={160} aria-invalid={Boolean(errors.recipient_name || fieldErrors.recipient_name)} aria-describedby={errors.recipient_name || fieldErrors.recipient_name ? 'address-recipient-name-error' : undefined} {...recipientField} onChange={(event) => { void recipientField.onChange(event); onClearFieldError('recipient_name') }} />{(errors.recipient_name?.message || fieldErrors.recipient_name) && <small id="address-recipient-name-error" className="field-error" role="alert">{errors.recipient_name?.message || fieldErrors.recipient_name}</small>}</label>
        <label>Số điện thoại<input type="tel" aria-invalid={Boolean(errors.phone || fieldErrors.phone)} aria-describedby={errors.phone || fieldErrors.phone ? 'address-phone-error' : undefined} {...phoneField} onChange={(event) => { void phoneField.onChange(event); onClearFieldError('phone') }} />{(errors.phone?.message || fieldErrors.phone) && <small id="address-phone-error" className="field-error" role="alert">{errors.phone?.message || fieldErrors.phone}</small>}</label>
        <label>Địa chỉ đường/phố<input maxLength={255} aria-invalid={Boolean(errors.street || fieldErrors.street)} aria-describedby={errors.street || fieldErrors.street ? 'address-street-error' : undefined} {...streetField} onChange={(event) => { void streetField.onChange(event); onClearFieldError('street') }} />{(errors.street?.message || fieldErrors.street) && <small id="address-street-error" className="field-error" role="alert">{errors.street?.message || fieldErrors.street}</small>}</label>
        <div className="address-code-fields">
          <label>Tỉnh / thành
            <select aria-invalid={Boolean(errors.province_code || fieldErrors.province_code)} aria-describedby={errors.province_code || fieldErrors.province_code ? 'address-province-error' : undefined} disabled={provincesLoading || provincesError} {...provinceField} onChange={(event) => { void provinceField.onChange(event); onClearFieldError('province_code'); onClearFieldError('ward_code'); setValue('ward_code', ''); onProvinceChange(event.target.value) }}>
              <option value="">Chọn tỉnh / thành</option>
              {values.province_code && !provinces.some((province) => province.code === values.province_code) && <option value={values.province_code}>Địa chỉ cũ · {values.province_code}</option>}
              {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
            </select>
            {(errors.province_code?.message || fieldErrors.province_code) && <small id="address-province-error" className="field-error" role="alert">{errors.province_code?.message || fieldErrors.province_code}</small>}
          </label>
          <label>Xã / phường
            <select aria-invalid={Boolean(errors.ward_code || fieldErrors.ward_code)} aria-describedby={errors.ward_code || fieldErrors.ward_code ? 'address-ward-error' : undefined} disabled={!provinceCode || locationsLoading || locationsError} {...wardField} onChange={(event) => { void wardField.onChange(event); onClearFieldError('ward_code') }}>
              <option value="">{!provinceCode ? 'Chọn tỉnh / thành trước' : locationsLoading ? 'Đang tải xã / phường…' : 'Chọn xã / phường'}</option>
              {values.ward_code && !wards.some((ward) => ward.code === values.ward_code) && <option value={values.ward_code}>Địa chỉ cũ · {values.ward_code}</option>}
              {wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
            </select>
            {(errors.ward_code?.message || fieldErrors.ward_code) && <small id="address-ward-error" className="field-error" role="alert">{errors.ward_code?.message || fieldErrors.ward_code}</small>}
          </label>
        </div>
        {locationsError && <div className="wide location-load-error" role="alert"><span>Không tải được danh mục địa chỉ.</span><button type="button" onClick={onRetryLocations}>Thử lại</button></div>}
        <label className="default-address-check"><input type="checkbox" {...register('is_default')} /> Đặt làm địa chỉ giao hàng mặc định</label>
        <label className="default-address-check"><input type="checkbox" {...register('is_default_billing')} /> Đặt làm địa chỉ hóa đơn mặc định</label>
        <button className="button dark" disabled={busy}>{busy ? 'Đang lưu…' : editing ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}</button>
        {editing && <button type="button" className="link-button" onClick={onCancelEdit}>Hủy sửa</button>}
      </form>
    </div>
  )
}
