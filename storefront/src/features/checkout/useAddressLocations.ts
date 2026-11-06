import { useQuery } from '@tanstack/react-query'
import { fetchAddressProvinces, fetchAddressWards, fetchShippingFee } from './address-api'

type AddressLocationsOptions = {
  enabled: boolean
  provinceCode: string
  wardCode?: string
  shippingFeeEnabled?: boolean
  wardsEnabled?: boolean
}

export function useAddressLocations({ enabled, provinceCode, wardCode = '', shippingFeeEnabled = false, wardsEnabled = true }: AddressLocationsOptions) {
  const provincesQuery = useQuery({
    queryKey: ['locations', 'provinces'],
    queryFn: ({ signal }) => fetchAddressProvinces(signal),
    enabled,
    staleTime: Infinity,
  })
  const wardsQuery = useQuery({
    queryKey: ['locations', 'wards', provinceCode],
    queryFn: ({ signal }) => fetchAddressWards(provinceCode, signal),
    enabled: Boolean(provinceCode) && enabled && wardsEnabled,
    staleTime: Infinity,
  })
  const shippingFeeQuery = useQuery({
    queryKey: ['shipping', 'fee', provinceCode, wardCode],
    queryFn: ({ signal }) => fetchShippingFee(provinceCode, signal, wardCode || undefined),
    enabled: shippingFeeEnabled && Boolean(provinceCode),
    staleTime: 5 * 60 * 1000,
  })

  const retry = () => {
    if (provincesQuery.isError) void provincesQuery.refetch()
    else void wardsQuery.refetch()
  }

  return {
    provinces: provincesQuery.data?.data ?? [],
    wards: wardsQuery.data?.data ?? [],
    provincesLoading: provincesQuery.isLoading,
    provincesError: provincesQuery.isError,
    locationsLoading: provincesQuery.isLoading || Boolean(provinceCode && wardsQuery.isLoading),
    locationsError: provincesQuery.isError || wardsQuery.isError,
    shippingFee: shippingFeeQuery.data,
    shippingFeeLoading: shippingFeeQuery.isLoading,
    shippingFeeError: shippingFeeQuery.isError,
    retryShippingFee: shippingFeeQuery.refetch,
    retry,
  }
}
