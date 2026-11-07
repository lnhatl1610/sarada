import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getApiErrorMessage } from '../../lib/http'
import { getStorefrontVisitorId } from '../../lib/storefront-visitor-id'
import { getFaqHelpfulVote, rememberFaqHelpfulVote } from './faq-helpful'
import { markFaqHelpful } from './faq-api'

const visitorStorageKey = 'storefront:faq-helpful-visitor'

export function FaqHelpfulVote({ faqId }: { faqId: number }) {
  const [vote, setVote] = useState<boolean | null>(() => getFaqHelpfulVote(faqId))
  const mutation = useMutation({
    mutationFn: async (helpful: boolean) => {
      const visitorId = getStorefrontVisitorId(visitorStorageKey)
      if (!visitorId) throw new Error('Không xác định được phiên bình chọn. Hãy thử lại.')
      return markFaqHelpful(faqId, visitorId, helpful)
    },
    onSuccess: (result) => {
      setVote(result.helpful)
      rememberFaqHelpfulVote(faqId, result.helpful)
    },
  })

  return <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-sm text-foreground" role="group" aria-label="Phản hồi về câu trả lời">
    {vote === null ? <>
      <span>Câu trả lời này có hữu ích không?</span>
      <div className="flex gap-2">
        <button className="min-h-9 rounded-md border border-border bg-background px-3 py-1.5 text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65" type="button" aria-pressed="false" disabled={mutation.isPending} onClick={() => mutation.mutate(true)}>{mutation.isPending && mutation.variables ? 'Đang gửi…' : 'Có'}</button>
        <button className="min-h-9 rounded-md border border-border bg-background px-3 py-1.5 text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-65" type="button" aria-pressed="false" disabled={mutation.isPending} onClick={() => mutation.mutate(false)}>{mutation.isPending && mutation.variables === false ? 'Đang gửi…' : 'Không'}</button>
      </div>
    </> : <p className="m-0" role="status">Cảm ơn bạn đã phản hồi{mutation.data?.accepted === false ? ' trước đó' : ''}.</p>}
    {mutation.isError && <p className="w-full text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Chưa gửi được phản hồi. Vui lòng thử lại.')}</p>}
  </div>
}
