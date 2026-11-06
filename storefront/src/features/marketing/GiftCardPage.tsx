import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { formatVnd } from '../../lib/money'
import './GiftCardPage.css'

const suggestedAmounts = [200_000, 500_000, 1_000_000]
const cardDesigns = [
  { id: 'atelier', name: 'Nét tối giản', className: 'is-atelier', note: 'Một món quà tinh tế' },
  { id: 'botanical', name: 'Vườn mùa mới', className: 'is-botanical', note: 'Gửi chút dịu dàng' },
  { id: 'midnight', name: 'Đêm thanh lịch', className: 'is-midnight', note: 'Dành riêng cho bạn' },
] as const

type CardDesignId = (typeof cardDesigns)[number]['id']

function localDateValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function GiftCardPage({ storeName }: { storeName: string }) {
  const [amount, setAmount] = useState<number | 'custom'>(500_000)
  const [customAmount, setCustomAmount] = useState('')
  const [design, setDesign] = useState<CardDesignId>('atelier')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sendDate, setSendDate] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [feedback, setFeedback] = useState('')
  const selectedDesign = cardDesigns.find((item) => item.id === design) ?? cardDesigns[0]
  const selectedAmount = amount === 'custom' ? Number(customAmount) || 0 : amount
  const today = useMemo(() => localDateValue(new Date()), [])

  const updatePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    setShowMessage(true)
    setFeedback('Bản xem trước đã được cập nhật. Chưa có đơn hàng hay thẻ quà tặng nào được tạo.')
  }

  return <section className="gift-card-page container" aria-labelledby="gift-card-title">
    <nav className="catalog-breadcrumb" aria-label="Điều hướng đường dẫn">
      <Link to="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Thẻ quà tặng</span>
    </nav>
    <header className="gift-card-page__heading">
      <p className="eyebrow">MỘT MÓN QUÀ, NHIỀU CÁCH ĐỂ THƯƠNG</p>
      <h1 id="gift-card-title">Gửi người ấy <em>một lựa chọn.</em></h1>
      <p>Để người nhận tự chọn thiết kế mình yêu thích. Cá nhân hóa lời nhắn và ngày gửi thiệp ngay bên dưới.</p>
    </header>

    <div className="gift-card-page__layout">
      <form className="gift-card-builder" onSubmit={updatePreview}>
        <section className="gift-card-builder__section" aria-labelledby="gift-card-value-title">
          <div className="gift-card-builder__section-heading"><span>01</span><div><h2 id="gift-card-value-title">Chọn mệnh giá</h2><p>Giá trị thẻ quà tặng</p></div></div>
          <div className="gift-card-amounts" role="group" aria-label="Chọn mệnh giá thẻ">
            {suggestedAmounts.map((value) => <button key={value} type="button" className={amount === value ? 'is-selected' : ''} aria-pressed={amount === value} onClick={() => setAmount(value)}>{formatVnd(value)}</button>)}
            <button type="button" className={amount === 'custom' ? 'is-selected' : ''} aria-pressed={amount === 'custom'} onClick={() => setAmount('custom')}>Tùy chọn</button>
          </div>
          {amount === 'custom' && <label className="gift-card-field gift-card-field--amount">Mệnh giá tùy chọn
            <span><input type="number" inputMode="numeric" min="1" step="1" required value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} placeholder="Nhập số tiền" /><span>₫</span></span>
          </label>}
        </section>

        <section className="gift-card-builder__section" aria-labelledby="gift-card-design-title">
          <div className="gift-card-builder__section-heading"><span>02</span><div><h2 id="gift-card-design-title">Chọn thiết kế</h2><p>Ba sắc thái dành cho người nhận</p></div></div>
          <div className="gift-card-designs" role="group" aria-label="Chọn mẫu thẻ">
            {cardDesigns.map((item) => <button key={item.id} type="button" className={`gift-card-design ${item.className}${design === item.id ? ' is-selected' : ''}`} aria-pressed={design === item.id} onClick={() => setDesign(item.id)}>
              <span className="gift-card-design__art"><span>{storeName}</span><i aria-hidden="true">✳</i></span><span className="gift-card-design__name">{item.name}</span>
            </button>)}
          </div>
        </section>

        <section className="gift-card-builder__section" aria-labelledby="gift-card-recipient-title">
          <div className="gift-card-builder__section-heading"><span>03</span><div><h2 id="gift-card-recipient-title">Thông tin người nhận</h2><p>Thiệp được gửi đến đúng người bạn muốn</p></div></div>
          <div className="gift-card-fields">
            <label className="gift-card-field">Tên người nhận<input autoComplete="name" maxLength={120} required value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Tên người nhận" /></label>
            <label className="gift-card-field">Email người nhận<input autoComplete="email" type="email" maxLength={254} required value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} placeholder="ten@email.com" /></label>
            <label className="gift-card-field gift-card-field--wide">Lời nhắn <span className="gift-card-field__optional">(không bắt buộc)</span><textarea rows={3} maxLength={240} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Viết đôi điều dành riêng cho người nhận…" /><small>{message.length}/240 ký tự</small></label>
            <label className="gift-card-field gift-card-field--wide">Ngày gửi <span className="gift-card-field__optional">(không bắt buộc)</span><input type="date" min={today} value={sendDate} onChange={(event) => setSendDate(event.target.value)} /></label>
          </div>
        </section>

        <div className="gift-card-builder__actions">
          <button className="button dark" type="submit">Cập nhật bản xem trước <span aria-hidden="true">↗</span></button>
          <p role="status" aria-live="polite">{feedback}</p>
        </div>
      </form>

      <aside className="gift-card-preview" aria-label="Bản xem trước thẻ quà tặng">
        <div className="gift-card-preview__heading"><p className="eyebrow">BẢN XEM TRƯỚC</p><span>Không phát hành thẻ</span></div>
        <div className={`gift-card-preview__scene ${showMessage ? 'is-flipped' : ''}`}>
          <article className={`gift-card-preview__card ${selectedDesign.className}`} aria-label={`Thẻ ${selectedDesign.name}, trị giá ${formatVnd(selectedAmount)}`}>
            <div className="gift-card-preview__face gift-card-preview__front" aria-hidden={showMessage}>
              <span className="gift-card-preview__brand">{storeName}</span><span className="gift-card-preview__ornament" aria-hidden="true">✳</span>
              <span className="gift-card-preview__label">GIFT CARD</span><strong>{formatVnd(selectedAmount)}</strong><span className="gift-card-preview__caption">{selectedDesign.note}</span>
            </div>
            <div className="gift-card-preview__face gift-card-preview__back" aria-hidden={!showMessage}>
              <span className="gift-card-preview__brand">{storeName}</span><span className="gift-card-preview__back-label">GỬI TẶNG</span>
              <strong>{recipientName || 'Tên người nhận'}</strong><p>{message || 'Một món quà nhỏ, dành riêng cho bạn.'}</p>
              {sendDate && <small>Ngày gửi dự kiến · {new Date(`${sendDate}T12:00:00`).toLocaleDateString('vi-VN')}</small>}
            </div>
          </article>
        </div>
        <button type="button" className="gift-card-preview__flip" aria-pressed={showMessage} onClick={() => setShowMessage((current) => !current)}>{showMessage ? 'Xem mặt trước' : 'Lật xem lời nhắn'} <span aria-hidden="true">↻</span></button>
        <div className="gift-card-preview__summary"><span>Mệnh giá</span><strong>{formatVnd(selectedAmount)}</strong><span>Mẫu thiệp</span><strong>{selectedDesign.name}</strong><span>Người nhận</span><strong>{recipientName || 'Chưa nhập'}</strong></div>
        <p className="gift-card-preview__notice">Đây là bản xem trước giao diện. Thanh toán, gửi thiệp và phát hành thẻ sẽ được kết nối sau khi cửa hàng chốt chính sách vận hành.</p>
      </aside>
    </div>
  </section>
}
