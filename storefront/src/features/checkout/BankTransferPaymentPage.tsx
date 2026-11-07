import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/http'
import type { components } from '../../types/api'
import './BankTransferPaymentPage.css'

type PaymentInstructions = components['schemas']['BankTransferInstructions']

function qrImageUrl(instructions: PaymentInstructions): string {
  const bank = instructions.bank
  const image = new URL(`https://img.vietqr.io/image/${encodeURIComponent(bank.bin)}-${encodeURIComponent(bank.account)}-compact2.svg`)
  image.searchParams.set('amount', String(instructions.amount))
  image.searchParams.set('addInfo', bank.transfer_content)
  image.searchParams.set('accountName', bank.holder)
  return image.toString()
}

export function BankTransferPaymentPage({ code, formatMoney, newsletterMessage }: { code: string; formatMoney: (amount: number) => string; newsletterMessage?: string }) {
  const [copied, setCopied] = useState('')
  const accessToken = window.location.hash.slice(1)
  const query = useQuery({
    queryKey: ['bank-transfer-instructions', code, accessToken],
    enabled: Boolean(code && /^[a-f0-9]{64}$/.test(accessToken)),
    queryFn: async ({ signal }) => {
      const response = await api.post<components['schemas']['BankTransferInstructionsEnvelope']>(
        `/orders/${encodeURIComponent(code)}/payment-instructions`,
        { access_token: accessToken },
        { signal },
      )
      if (!response.data.data) throw new Error('Không tải được hướng dẫn chuyển khoản.')
      return response.data.data
    },
    refetchInterval: (state) => state.state.data?.payment_status === 'unpaid' ? 15_000 : false,
  })
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
    } catch {
      setCopied('')
    }
  }
  const instructions = query.data
  const imageUrl = instructions ? qrImageUrl(instructions) : ''

  return <div className="container subpage bank-transfer-page">
    <p className="eyebrow">THANH TOÁN</p>
    <h1>Chuyển khoản ngân hàng</h1>
    {newsletterMessage && <p className="bank-transfer-status" role="status">{newsletterMessage}</p>}
    {query.isLoading ? <p role="status">Đang tải hướng dẫn thanh toán…</p>
      : !/^[a-f0-9]{64}$/.test(accessToken) ? <section className="bank-transfer-state" role="alert"><h2>Liên kết thanh toán không hợp lệ</h2><p>Mở lại liên kết trên trang đặt hàng thành công để xem hướng dẫn thanh toán.</p><Link className="button dark" to="/track-order">Tra cứu đơn hàng</Link></section>
        : query.isError ? <section className="bank-transfer-state" role="alert"><h2>Chưa tải được hướng dẫn</h2><p>{query.error instanceof Error ? query.error.message : 'Kiểm tra kết nối rồi thử lại.'}</p><button className="button dark" type="button" onClick={() => void query.refetch()}>Thử lại</button></section>
          : instructions ? <>
            {instructions.payment_status === 'paid' ? <p className="bank-transfer-status is-paid" role="status">Cửa hàng đã xác nhận thanh toán đơn {instructions.code}.</p>
              : instructions.payment_status === 'unpaid' ? <p className="bank-transfer-status" role="status">{instructions.expires_at
                ? `Đơn ${instructions.code} đang chờ thanh toán. Hãy chuyển khoản trước hạn hiển thị bên dưới để tránh đơn bị tự hủy.`
                : `Đơn ${instructions.code} đang chờ thanh toán. Cửa hàng chưa đặt hạn tự hủy cho đơn này; liên hệ cửa hàng nếu bạn cần xác nhận thời hạn chuyển khoản.`}</p>
                : <p className="bank-transfer-status" role="status">Đơn hàng đang ở trạng thái {instructions.payment_status}. Hãy tra cứu hoặc liên hệ cửa hàng nếu cần hỗ trợ.</p>}
            <div className="bank-transfer-layout">
              <section className="bank-transfer-qr" aria-label="Mã QR chuyển khoản">
                <img src={imageUrl} alt={`Mã VietQR chuyển ${formatMoney(instructions.amount)} tới ${instructions.bank.name}`} referrerPolicy="no-referrer" />
                <p>Quét mã bằng ứng dụng ngân hàng. Kiểm tra đúng số tiền và nội dung trước khi xác nhận.</p>
              </section>
              <section className="bank-transfer-details" aria-labelledby="bank-transfer-details-title">
                <h2 id="bank-transfer-details-title">Thông tin chuyển khoản</h2>
                <dl>
                  <div><dt>Số tiền</dt><dd>{formatMoney(instructions.amount)} <button type="button" onClick={() => void copy('amount', String(instructions.amount))}>Sao chép</button></dd></div>
                  <div><dt>Ngân hàng</dt><dd>{instructions.bank.name}</dd></div>
                  <div><dt>Số tài khoản</dt><dd>{instructions.bank.account} <button type="button" onClick={() => void copy('account', instructions.bank.account)}>Sao chép</button></dd></div>
                  <div><dt>Chủ tài khoản</dt><dd>{instructions.bank.holder}</dd></div>
                  <div><dt>Nội dung chuyển khoản</dt><dd><strong>{instructions.bank.transfer_content}</strong> <button type="button" onClick={() => void copy('reference', instructions.bank.transfer_content)}>Sao chép</button></dd></div>
                  {instructions.bank.note && <div><dt>Lưu ý</dt><dd>{instructions.bank.note}</dd></div>}
                  {instructions.expires_at && <div><dt>Hạn thanh toán</dt><dd>{new Date(instructions.expires_at).toLocaleString('vi-VN')}</dd></div>}
                </dl>
                {copied && <p role="status">Đã sao chép {copied === 'amount' ? 'số tiền' : copied === 'account' ? 'số tài khoản' : 'nội dung chuyển khoản'}.</p>}
                <p>Thanh toán sẽ được cập nhật sau khi cửa hàng đối soát giao dịch.</p>
                <Link className="button secondary" to={`/track-order?code=${encodeURIComponent(instructions.code)}`}>Theo dõi đơn hàng</Link>
              </section>
            </div>
          </> : null}
  </div>
}
