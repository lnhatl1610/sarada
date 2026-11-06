import { describe, expect, it } from 'vitest'
import { checkoutSchema } from './checkout-schema'

const validCheckout = {
  customer_name: 'Nguyễn An',
  customer_phone: '0912345678',
  customer_email: '',
  province_code: '01',
  district_code: '',
  ward_code: '00004',
  street: '12 Đường Mẫu',
  coupon_code: '',
  note: '',
}

describe('checkoutSchema', () => {
  it('accepts a valid Vietnamese COD address and trims the recipient name', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, customer_name: '  Nguyễn An  ' })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.customer_name).toBe('Nguyễn An')
  })

  it('rejects invalid Vietnamese phone numbers and malformed optional email', () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, customer_phone: '12345' }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...validCheckout, customer_email: 'not-an-email' }).success).toBe(false)
  })

  it('requires province, ward, street, and a recipient name', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, customer_name: ' ', province_code: '', ward_code: '', street: '' })

    expect(result.success).toBe(false)
  })
})
