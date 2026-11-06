import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AddressValidationError, deleteAddress, saveAddress, setDefaultAddress, type CustomerAddress } from './account-api'
import type { AddressFormValues } from './AddressBookPage'

const EMPTY_ADDRESS: AddressFormValues = {
  label: 'home',
  recipient_name: '',
  phone: '',
  province_code: '',
  district_code: '',
  ward_code: '',
  street: '',
  is_default: false,
  is_default_billing: false,
}

type Options = { accessToken: string; customerId: number | null }

export function useAddressBookActions({ accessToken, customerId }: Options) {
  const queryClient = useQueryClient()
  const [addressProvinceCode, setAddressProvinceCode] = useState('')
  const [addressError, setAddressError] = useState('')
  const [addressFieldErrors, setAddressFieldErrors] = useState<Record<string, string>>({})
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [pendingAddressDeletion, setPendingAddressDeletion] = useState<CustomerAddress | null>(null)
  const [addressValues, setAddressValues] = useState<AddressFormValues>(EMPTY_ADDRESS)
  const addressesQueryKey = ['account', 'addresses', customerId ?? 'current'] as const
  const saveMutation = useMutation({
    mutationFn: ({ values, address }: { values: AddressFormValues; address: CustomerAddress | null }) =>
      saveAddress({ accessToken, address: address ?? undefined, values }),
  })
  const defaultMutation = useMutation({
    mutationFn: (address: CustomerAddress) => setDefaultAddress({ accessToken, addressId: address.id }),
  })
  const deleteMutation = useMutation({
    mutationFn: (address: CustomerAddress) => deleteAddress({ accessToken, addressId: address.id }),
  })
  const addressBusy = saveMutation.isPending
  const busyDefaultAddressId = defaultMutation.isPending ? defaultMutation.variables?.id : undefined
  const busyDeletingAddressId = deleteMutation.isPending ? deleteMutation.variables?.id : undefined

  const resetDraft = () => {
    setAddressProvinceCode('')
    setAddressFieldErrors({})
    setEditingAddress(null)
    setAddressValues(EMPTY_ADDRESS)
  }

  const submitAddress = async (values: AddressFormValues) => {
    if (saveMutation.isPending) return
    setAddressError('')
    setAddressFieldErrors({})
    try {
      const saved = await saveMutation.mutateAsync({ values, address: editingAddress })
      queryClient.setQueryData<CustomerAddress[]>(addressesQueryKey, (current = []) => {
        const next = editingAddress
          ? current.map((item) => item.id === saved.id ? saved : { ...item, ...(saved.is_default ? { is_default: false } : {}), ...(saved.is_default_billing ? { is_default_billing: false } : {}) })
          : [...current.map((item) => ({ ...item, ...(saved.is_default ? { is_default: false } : {}), ...(saved.is_default_billing ? { is_default_billing: false } : {}) })), saved]
        return next.sort((a, b) => Number(b.is_default) - Number(a.is_default) || Number(b.is_default_billing) - Number(a.is_default_billing))
      })
      resetDraft()
    } catch (error) {
      if (error instanceof AddressValidationError) {
        const fieldErrors: Record<string, string> = {}
        const globalErrors: string[] = []
        for (const [field, messages] of Object.entries(error.fields)) {
          if (['label', 'recipient_name', 'phone', 'province_code', 'ward_code', 'street'].includes(field)) fieldErrors[field] = messages[0] ?? 'Giá trị chưa hợp lệ.'
          else globalErrors.push(messages[0] ?? 'Giá trị chưa hợp lệ.')
        }
        setAddressFieldErrors(fieldErrors)
        setAddressError(globalErrors.join(' · '))
      } else setAddressError(error instanceof Error ? error.message : 'Không thể lưu địa chỉ.')
    }
  }

  const makeAddressDefault = async (address: CustomerAddress) => {
    if (defaultMutation.isPending) return
    setAddressError('')
    try {
      await defaultMutation.mutateAsync(address)
      queryClient.setQueryData<CustomerAddress[]>(addressesQueryKey, (current = []) => current.map((item) => ({ ...item, is_default: item.id === address.id })))
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Không thể đặt địa chỉ mặc định.')
    }
  }

  const removeAddress = (address: CustomerAddress) => {
    if (deleteMutation.isPending) return
    setAddressError('')
    setPendingAddressDeletion(address)
  }

  const cancelAddressDeletion = () => {
    if (deleteMutation.isPending) return
    setPendingAddressDeletion(null)
    setAddressError('')
  }

  const confirmAddressDeletion = async () => {
    const address = pendingAddressDeletion
    if (!address || deleteMutation.isPending) return
    setAddressError('')
    try {
      await deleteMutation.mutateAsync(address)
      queryClient.setQueryData<CustomerAddress[]>(addressesQueryKey, (current = []) => {
        const next = current.filter((item) => item.id !== address.id)
        const fallback = next.reduce<CustomerAddress | null>((latest, item) => !latest || item.id > latest.id ? item : latest, null)
        return next.map((item) => item.id === fallback?.id ? {
          ...item,
          is_default: item.is_default || Boolean(fallback && address.is_default),
          is_default_billing: item.is_default_billing || Boolean(fallback && address.is_default_billing),
        } : item)
      })
      setPendingAddressDeletion(null)
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Không thể xóa địa chỉ.')
    }
  }

  const editAddress = (address: CustomerAddress) => {
    setEditingAddress(address)
    setAddressFieldErrors({})
    setAddressValues({
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone,
      province_code: address.province_code,
      district_code: address.district_code ?? '',
      ward_code: address.ward_code,
      street: address.street,
      is_default: address.is_default,
      is_default_billing: address.is_default_billing,
    })
    setAddressProvinceCode(address.province_code)
  }

  const changeProvince = (provinceCode: string) => {
    setAddressProvinceCode(provinceCode)
    setAddressFieldErrors((current) => { const next = { ...current }; delete next.province_code; delete next.ward_code; return next })
  }

  const clearAddressFieldError = (field: string) => {
    setAddressFieldErrors((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  return {
    addressProvinceCode,
    addressError,
    addressFieldErrors,
    addressBusy,
    busyDefaultAddressId,
    busyDeletingAddressId,
    editingAddress,
    pendingAddressDeletion,
    addressValues,
    submitAddress,
    clearAddressFieldError,
    makeAddressDefault,
    removeAddress,
    cancelAddressDeletion,
    confirmAddressDeletion,
    editAddress,
    changeProvince,
    resetDraft,
  }
}
