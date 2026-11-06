import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { markReviewHelpful } from './catalog-api'
import { getReviewHelpfulVisitorId, hasVotedHelpful, rememberHelpfulVote } from './review-helpful'

export function ReviewHelpfulButton({ reviewId, helpfulCount }: { reviewId: number; helpfulCount: number }) {
  const [count, setCount] = useState(helpfulCount)
  const [voted, setVoted] = useState(() => hasVotedHelpful(reviewId))
  const mutation = useMutation({
    mutationFn: async () => {
      const visitorId = getReviewHelpfulVisitorId()
      if (!visitorId) throw new Error('Không tạo được mã bình chọn. Hãy tải lại trang và thử lại.')
      return markReviewHelpful(reviewId, visitorId)
    },
    onSuccess: (result) => {
      setCount(result.helpful_count)
      setVoted(result.voted)
      if (result.voted) rememberHelpfulVote(reviewId)
    },
  })

  return <div className="review-helpful-control">
    <button type="button" className="review-helpful-button" aria-pressed={voted} disabled={voted || mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending ? 'Đang gửi…' : voted ? `Đã thấy hữu ích · ${count}` : `Hữu ích · ${count}`}
    </button>
    {mutation.isError && <small role="alert">{mutation.error instanceof Error ? mutation.error.message : 'Chưa gửi được bình chọn. Hãy thử lại.'}</small>}
  </div>
}
