const visitorStorageKey = 'storefront:review-helpful-visitor'
const votesStorageKey = 'storefront:review-helpful-votes'
let fallbackVisitorId: string | null = null
const fallbackVotes = new Set<number>()

function newVisitorId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

export function getReviewHelpfulVisitorId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(visitorStorageKey)
    if (stored) return stored
    const visitorId = newVisitorId()
    window.localStorage.setItem(visitorStorageKey, visitorId)
    return visitorId
  } catch {
    fallbackVisitorId ??= newVisitorId()
    return fallbackVisitorId
  }
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
