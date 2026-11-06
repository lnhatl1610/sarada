import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useNotificationPreferences, type NotificationChannel, type NotificationEvent, type NotificationPreferences } from './notification-preferences-api'
import './NotificationPreferencesPage.css'

const eventLabels: Record<NotificationEvent, { title: string; description: string }> = {
  orders: { title: 'Đơn hàng', description: 'Xác nhận đơn và cập nhật giao hàng.' },
  promotions: { title: 'Ưu đãi', description: 'Tin khuyến mãi và chương trình của cửa hàng.' },
  price_drops: { title: 'Sản phẩm theo dõi giảm giá', description: 'Thông báo khi sản phẩm trong danh sách yêu thích giảm giá.' },
}
const channelLabels: Record<NotificationChannel, string> = { in_app: 'Trong tài khoản', email: 'Email', sms: 'SMS', zalo: 'Zalo ZNS', push: 'Đẩy trình duyệt' }
const events = Object.keys(eventLabels) as NotificationEvent[]
const channels = Object.keys(channelLabels) as NotificationChannel[]

export function NotificationPreferencesPage({ enabled }: { enabled: boolean }) {
  const { query, save, pushSubscriptions, registerPush, removePush } = useNotificationPreferences(enabled)
  const [draftOverride, setDraftOverride] = useState<NotificationPreferences | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const draft = draftOverride ?? query.data?.preferences ?? null

  const update = (event: NotificationEvent, channel: NotificationChannel, checked: boolean) => {
    setDraftOverride((current) => {
      const base = current ?? query.data?.preferences
      return base ? { ...base, [event]: { ...base[event], [channel]: checked } } : current
    })
    setNotice('')
    setError('')
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return
    setNotice('')
    setError('')
    try {
      const result = await save.mutateAsync(draft)
      setDraftOverride(result.preferences)
      setNotice('Đã lưu cài đặt nhận tin.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa lưu được cài đặt nhận tin.')
    }
  }

  if (!enabled) return <section className="container subpage notification-preferences"><h2>Cài đặt nhận tin</h2><p>Đăng nhập để quản lý kênh nhận thông báo.</p><Link to="/login?returnTo=%2Faccount%2Fnotifications%2Fpreferences">Đăng nhập</Link></section>

  return <section className="container subpage notification-preferences" aria-labelledby="notification-preferences-title">
    <div className="notification-preferences__heading"><div><p className="eyebrow">TÀI KHOẢN</p><h2 id="notification-preferences-title">Cài đặt nhận tin</h2><p>Chọn loại tin và kênh bạn muốn nhận.</p></div><Link to="/account/notifications">Quay lại hộp thư</Link></div>
    {query.isPending || (query.isSuccess && !draft) ? <p role="status">Đang tải cài đặt…</p> : query.isError || !draft || !query.data ? <div role="alert"><p>Chưa tải được cài đặt nhận tin.</p><button type="button" onClick={() => void query.refetch()}>Thử lại</button></div> : <>
      <form onSubmit={submit}>
        <div className="notification-preferences__table" role="group" aria-label="Chọn kênh thông báo theo loại tin">
          <div className="notification-preferences__row notification-preferences__row--header"><span>Loại tin</span>{channels.map((channel) => <span key={channel}>{channelLabels[channel]}</span>)}</div>
          {events.map((event) => <div className="notification-preferences__row" key={event}>
            <div><strong>{eventLabels[event].title}</strong><small>{eventLabels[event].description}</small></div>
            {channels.map((channel) => {
              const available = query.data.channels[channel].available
              return <label className="notification-preferences__toggle" key={channel} title={available ? undefined : query.data.channels[channel].reason ?? undefined}>
                <input type="checkbox" checked={draft[event][channel]} disabled={!available || save.isPending} onChange={(change) => update(event, channel, change.target.checked)} aria-label={`${eventLabels[event].title}: ${channelLabels[channel]}`} />
                {!available && <span className="sr-only">{query.data.channels[channel].reason}</span>}
              </label>
            })}
          </div>)}
        </div>
        {channels.filter((channel) => !query.data.channels[channel].available).map((channel) => <p className="notification-preferences__channel-note" key={channel}><strong>{channelLabels[channel]}:</strong> {query.data.channels[channel].reason}</p>)}
        {error && <p role="alert" className="notification-preferences__error">{error}</p>}{notice && <p role="status" className="notification-preferences__notice">{notice}</p>}
        <button className="button dark" type="submit" disabled={save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu cài đặt'}</button>
      </form>
      {pushSubscriptions.data?.configured && <section className="notification-preferences__push" aria-labelledby="push-devices-title">
        <h3 id="push-devices-title">Thiết bị nhận thông báo đẩy</h3>
        {!pushSubscriptions.isError && <button type="button" className="button secondary" disabled={pushSubscriptions.isPending || registerPush.isPending} onClick={() => { setError(''); registerPush.mutate(undefined, { onError: (cause) => setError(cause instanceof Error ? cause.message : 'Không bật được thông báo đẩy.') }) }}>{registerPush.isPending ? 'Đang đăng ký…' : 'Bật trên trình duyệt này'}</button>}
        {pushSubscriptions.isError && <div role="alert"><p>Chưa tải được thiết bị nhận thông báo.</p><button type="button" onClick={() => void pushSubscriptions.refetch()}>Thử lại</button></div>}
        {pushSubscriptions.data?.subscriptions.length === 0 && <p>Chưa có thiết bị nào được đăng ký.</p>}
        {pushSubscriptions.data?.subscriptions.map((item) => <div className="notification-preferences__device" key={item.id}><span>{item.device_name || 'Trình duyệt'} · {new Date(item.created_at).toLocaleString('vi-VN')}</span><button type="button" disabled={removePush.isPending} onClick={() => removePush.mutate(item, { onError: (cause) => setError(cause instanceof Error ? cause.message : 'Không hủy được thiết bị.') })}>Hủy</button></div>)}
      </section>}
    </>}
  </section>
}
