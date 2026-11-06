import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type StoreContactMessageValues = {
  name: string
  phone: string
  email: string
  topic: 'product' | 'order' | 'return' | 'other'
  order_code: string
  message: string
  attachment?: File | null
}

export async function sendStoreContactMessage(values: StoreContactMessageValues, signal?: AbortSignal) {
  const form = new FormData()
  form.set('name', values.name)
  form.set('phone', values.phone)
  form.set('email', values.email)
  form.set('topic', values.topic)
  form.set('order_code', values.order_code)
  form.set('message', values.message)
  if (values.attachment) form.set('attachment', values.attachment)

  const response = await api.post<components['schemas']['StoreContactMessageAccepted']>('/contact/messages', form, { signal })
  return response.data
}
