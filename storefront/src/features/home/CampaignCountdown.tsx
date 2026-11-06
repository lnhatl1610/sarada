import { useEffect, useState } from 'react'
import type { StorefrontBanner } from './home-api'

type CampaignCountdownProps = { banner: StorefrontBanner }

const formatEndDate = (value: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(new Date(value)).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value
    return result
  }, {})

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}

export function CampaignCountdown({ banner }: CampaignCountdownProps) {
  const target = banner.ends_at ? new Date(banner.ends_at).getTime() : Number.NaN
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!Number.isFinite(target)) return
    if (target <= Date.now()) return

    const update = () => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) window.clearInterval(timer)
    }
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [target])

  if (!banner.show_countdown || !banner.ends_at) return null

  const staticEndDate = formatEndDate(banner.ends_at)
  if (secondsLeft === null) return <p className="campaign-countdown">Kết thúc lúc {staticEndDate}</p>
  if (secondsLeft === 0) return <p className="campaign-countdown">Chiến dịch đã kết thúc</p>

  const days = Math.floor(secondsLeft / 86400)
  const hours = Math.floor((secondsLeft % 86400) / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60
  const remaining = `${days ? `${days} ngày ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return <p className="campaign-countdown" role="timer" aria-label={`Thời gian còn lại: ${remaining}`}>
    <span aria-hidden="true">Còn lại {remaining}</span>
  </p>
}
