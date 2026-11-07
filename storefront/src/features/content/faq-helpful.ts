import { readBrowserStorage, writeBrowserStorage } from '../../lib/browser-storage'

const votesStorageKey = 'storefront:faq-helpful-votes'
let fallbackVotes: Record<number, boolean> = {}

function readVotes(): Record<number, boolean> {
  const stored = readBrowserStorage(votesStorageKey)
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const votes = { ...fallbackVotes }
        for (const [rawId, helpful] of Object.entries(parsed)) {
          const id = Number(rawId)
          if (Number.isInteger(id) && typeof helpful === 'boolean') votes[id] = helpful
        }
        return votes
      }
    } catch {
      return fallbackVotes
    }
  }
  return fallbackVotes
}

export function getFaqHelpfulVote(faqId: number): boolean | null {
  const votes = readVotes()
  return Object.hasOwn(votes, faqId) ? votes[faqId] : null
}

export function rememberFaqHelpfulVote(faqId: number, helpful: boolean): void {
  fallbackVotes = { ...fallbackVotes, [faqId]: helpful }
  writeBrowserStorage(votesStorageKey, JSON.stringify({ ...readVotes(), [faqId]: helpful }))
}
