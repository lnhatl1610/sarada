import { getStorefrontVisitorId } from '../../lib/storefront-visitor-id'

const visitorStorageKey = 'storefront:review-helpful-visitor'
const votesStorageKey = 'storefront:review-helpful-votes'
const fallbackVotes = new Set<number>()

export function getReviewHelpfulVisitorId(): string | null {
  return getStorefrontVisitorId(visitorStorageKey)
}

export function hasVotedHelpful(reviewId: number): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = window.localStorage.getItem(votesStorageKey)
    const votes: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(votes) ? votes.includes(reviewId) : fallbackVotes.has(reviewId)
  } catch {
    return fallbackVotes.has(reviewId)
  }
}

export function rememberHelpfulVote(reviewId: number): void {
  fallbackVotes.add(reviewId)
  if (typeof window === 'undefined') return
  try {
    const stored = window.localStorage.getItem(votesStorageKey)
    const votes: unknown = stored ? JSON.parse(stored) : []
    const next = new Set(Array.isArray(votes) ? votes.filter((value): value is number => Number.isInteger(value)) : [])
    next.add(reviewId)
    window.localStorage.setItem(votesStorageKey, JSON.stringify([...next]))
  } catch {
    // The current page keeps the vote state in memory when browser storage is unavailable.
  }
}
