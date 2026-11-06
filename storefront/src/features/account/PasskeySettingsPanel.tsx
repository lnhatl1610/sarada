import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '../../lib/http'
import { getPasskeyRegistrationOptions, listPasskeys, registerPasskey, removePasskey } from '../auth/passkey-api'
import { decodeCreationOptions, serializePasskeyCredential, supportsPasskeys } from '../auth/passkey-credentials'
import './PasskeySettingsPanel.css'

const passkeyQueryKey = (customerId: number | null) => ['account', 'passkeys', customerId] as const

export function PasskeySettingsPanel({ accessToken, customerId }: { accessToken: string; customerId: number | null }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pendingRemovalId, setPendingRemovalId] = useState<number | null>(null)
  const passkeysQuery = useQuery({
    queryKey: passkeyQueryKey(customerId),
    queryFn: ({ signal }) => listPasskeys(accessToken, signal),
    enabled: Boolean(accessToken && customerId),
  })
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!supportsPasskeys()) throw new Error('Trình duyệt hoặc thiết bị này chưa hỗ trợ passkey.')
      const safeName = name.trim()
      if (!safeName || safeName.length > 80) throw new Error('Tên passkey cần từ 1 đến 80 ký tự.')
      const challenge = await getPasskeyRegistrationOptions(accessToken)
      const credential = await navigator.credentials.create({ publicKey: decodeCreationOptions(challenge.options) })
      if (!(credential instanceof PublicKeyCredential)) throw new Error('Thiết bị không tạo được passkey.')
      return registerPasskey(accessToken, {
        challenge_id: challenge.challenge_id,
        name: safeName,
        credential: serializePasskeyCredential(credential),
      })
    },
    onSuccess: async () => {
      setName('')
      setError('')
      setMessage('Đã thêm passkey. Bạn có thể dùng khóa này ở lần đăng nhập sau.')
      await queryClient.invalidateQueries({ queryKey: passkeyQueryKey(customerId) })
    },
    onError: (cause) => { setMessage(''); setError(getApiErrorMessage(cause, 'Không thể đăng ký passkey.')) },
  })
  const removeMutation = useMutation({
    mutationFn: (id: number) => removePasskey(accessToken, id),
    onSuccess: async () => {
      setPendingRemovalId(null)
      setError('')
      setMessage('Đã xóa passkey khỏi tài khoản.')
      await queryClient.invalidateQueries({ queryKey: passkeyQueryKey(customerId) })
    },
    onError: (cause) => { setMessage(''); setError(getApiErrorMessage(cause, 'Không thể xóa passkey.')) },
  })
  const busy = registerMutation.isPending || removeMutation.isPending

  return (
    <section className="account-settings-card passkey-settings" aria-labelledby="passkey-settings-title">
      <h2 id="passkey-settings-title">Passkey</h2>
      <p>Đăng nhập bằng xác thực sinh trắc học hoặc khóa bảo mật trên thiết bị. Bạn vẫn có thể đăng nhập bằng mật khẩu hoặc đặt lại mật khẩu nếu mất thiết bị.</p>
      {!supportsPasskeys() && <p className="passkey-support-note">Trình duyệt hoặc thiết bị hiện tại chưa hỗ trợ WebAuthn passkey.</p>}
      {passkeysQuery.isPending && <p role="status">Đang tải passkey…</p>}
      {passkeysQuery.isError && <div className="passkey-feedback" role="alert"><p>{getApiErrorMessage(passkeysQuery.error, 'Không thể tải danh sách passkey.')}</p><button className="button light" type="button" onClick={() => void passkeysQuery.refetch()}>Thử tải lại</button></div>}
      {passkeysQuery.isSuccess && <>
        {passkeysQuery.data.length > 0 ? <ul className="passkey-list" aria-label="Passkey đã đăng ký">{passkeysQuery.data.map((passkey) => (
          <li key={passkey.id}>
            <div><strong>{passkey.name}</strong><small>Thêm ngày {new Date(passkey.created_at).toLocaleDateString('vi-VN')}{passkey.last_used_at ? ` · Dùng lần cuối ${new Date(passkey.last_used_at).toLocaleDateString('vi-VN')}` : ' · Chưa sử dụng'}</small></div>
            {pendingRemovalId === passkey.id ? <div className="passkey-remove-confirm" role="group" aria-label={`Xác nhận xóa ${passkey.name}`}><button className="button light" type="button" disabled={busy} onClick={() => setPendingRemovalId(null)}>Giữ lại</button><button className="button danger" type="button" disabled={busy} onClick={() => removeMutation.mutate(passkey.id)}>{removeMutation.isPending ? 'Đang xóa…' : 'Xác nhận xóa'}</button></div> : <button className="link-button" type="button" disabled={busy} onClick={() => { setError(''); setMessage(''); setPendingRemovalId(passkey.id) }}>Xóa</button>}
          </li>
        ))}</ul> : <p>Chưa có passkey nào được đăng ký.</p>}
        {passkeysQuery.data.length < 10 && <form className="passkey-register-form" onSubmit={(event) => { event.preventDefault(); setError(''); setMessage(''); registerMutation.mutate() }}>
          <label htmlFor="passkey-name">Tên thiết bị<input id="passkey-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Ví dụ: iPhone cá nhân" /></label>
          <button className="button dark" type="submit" disabled={busy || !supportsPasskeys()}>{registerMutation.isPending ? 'Đang xác thực…' : 'Thêm passkey'}</button>
        </form>}
      </>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {message && <p className="passkey-success" role="status">{message}</p>}
    </section>
  )
}
