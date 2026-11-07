import { api } from '../../lib/http'
import type { components } from '../../types/api'

export type NewsletterUnsubscribeReason = 'too_many_emails' | 'not_relevant' | 'signed_up_by_mistake' | 'other'

type Accepted = components['schemas']['NewsletterSubscriptionAccepted']

export async function subscribeToNewsletter(email: string, consent: boolean): Promise<string> {
  const response = await api.post<Accepted>('/newsletter/subscriptions', { email, consent })
  return response.data.data.message
}

export async function requestNewsletterUnsubscribe(email: string, reason: NewsletterUnsubscribeReason): Promise<Accepted> {
  const response = await api.post<Accepted>('/newsletter/unsubscribe-requests', { email, reason })
  return response.data
}

export async function confirmNewsletterUnsubscribe(token: string): Promise<Accepted> {
  const response = await api.post<Accepted>('/newsletter/unsubscribe-confirmations', { token })
  return response.data
}
