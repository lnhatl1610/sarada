import { z } from 'zod'

export const checkoutSchema = z.object({
  fulfillment_type: z.enum(['delivery', 'pickup']),
  pickup_location_id: z.string(),
  payment_method: z.enum(['cod', 'bank_transfer'], 'Chọn phương thức thanh toán.'),
  customer_name: z.string().trim().min(1, 'Nhập họ tên người nhận.').max(160, 'Họ tên không được vượt quá 160 ký tự.'),
  customer_phone: z.string().trim().regex(/^(0|\+84)\d{9}$/, 'Nhập số điện thoại Việt Nam gồm 10 chữ số hoặc bắt đầu bằng +84.'),
  customer_email: z.union([z.literal(''), z.string().trim().email('Email không đúng định dạng.')]),
  province_code: z.string(),
  district_code: z.string(),
  ward_code: z.string(),
  street: z.string().max(255, 'Địa chỉ không được vượt quá 255 ký tự.'),
  shipping_method_id: z.string(),
  coupon_code: z.string().max(100, 'Mã giảm giá không được vượt quá 100 ký tự.'),
  use_points: z.boolean(),
  note: z.string().max(2000, 'Ghi chú không được vượt quá 2.000 ký tự.'),
  invoice_requested: z.boolean(),
  invoice_tax_code: z.string(),
  invoice_company_name: z.string(),
  invoice_address: z.string(),
}).superRefine((values, context) => {
  if (values.fulfillment_type === 'delivery') {
    if (!values.province_code) context.addIssue({ code: 'custom', path: ['province_code'], message: 'Chọn tỉnh / thành.' })
    if (!values.ward_code) context.addIssue({ code: 'custom', path: ['ward_code'], message: 'Chọn xã / phường.' })
    if (!values.street.trim()) context.addIssue({ code: 'custom', path: ['street'], message: 'Nhập địa chỉ cụ thể.' })
  } else if (!values.pickup_location_id) context.addIssue({ code: 'custom', path: ['pickup_location_id'], message: 'Chọn cửa hàng nhận hàng.' })
  if (!values.invoice_requested) return
  if (!/^\d{10}(?:-\d{3})?$/.test(values.invoice_tax_code.trim())) context.addIssue({ code: 'custom', path: ['invoice_tax_code'], message: 'Mã số thuế gồm 10 chữ số hoặc 10 chữ số, dấu gạch nối và 3 chữ số.' })
  if (!values.invoice_company_name.trim()) context.addIssue({ code: 'custom', path: ['invoice_company_name'], message: 'Nhập tên công ty.' })
  if (!values.invoice_address.trim()) context.addIssue({ code: 'custom', path: ['invoice_address'], message: 'Nhập địa chỉ xuất hóa đơn.' })
  if (values.invoice_company_name.trim().length > 255) context.addIssue({ code: 'custom', path: ['invoice_company_name'], message: 'Tên công ty không được vượt quá 255 ký tự.' })
  if (values.invoice_address.trim().length > 500) context.addIssue({ code: 'custom', path: ['invoice_address'], message: 'Địa chỉ hóa đơn không được vượt quá 500 ký tự.' })
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
