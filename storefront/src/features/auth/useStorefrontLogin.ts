import { useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { api, getApiErrorMessage } from '../../lib/http'
import type { components } from '../../types/api'
import { resolveSafeStorefrontReturnTo } from './safeReturnTo'
import { getPasskeyLoginOptions, loginWithPasskey as authenticatePasskey } from './passkey-api'
import { decodeRequestOptions, passkeyCancellationMessage, serializePasskeyCredential, supportsPasskeys } from './passkey-credentials'

type Options = {
  setAccessToken: Dispatch<SetStateAction<string>>
  setCustomer: Dispatch<SetStateAction<components['schemas']['StorefrontUser'] | null>>
}

export function useStorefrontLogin({ setAccessToken, setCustomer }: Options) {
  const [error, setError] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passkeyBusy, setPasskeyBusy] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async (credentials: { identifier: string; password: string; remember_me: boolean }) => {
      const { data: body } = await api.post<components['schemas']['StorefrontLoginEnvelope']>(
        '/auth/login',
        credentials,
      )
      return body.data
    },
    onMutate: () => { setError('') },
    onSuccess: (data) => {
      setAccessToken(data.access_token)
      setCustomer(data.user)
      navigate(resolveSafeStorefrontReturnTo(new URLSearchParams(location.search).get('returnTo')))
    },
    onError: (requestError) => setError(getApiErrorMessage(requestError, 'Không thể đăng nhập. Hãy kiểm tra lại thông tin.')),
  })
  const submit = (credentials: { identifier: string; password: string; remember_me: boolean }) => loginMutation.mutate(credentials)
  const submitPasskey = async () => {
    if (!supportsPasskeys()) {
      setError('Trình duyệt hoặc thiết bị này chưa hỗ trợ passkey.')
      return
    }
    setError('')
    setPasskeyBusy(true)
    try {
      const challenge = await getPasskeyLoginOptions()
      const credential = await navigator.credentials.get({ publicKey: decodeRequestOptions(challenge.options) })
      if (!(credential instanceof PublicKeyCredential)) throw new Error('Thiết bị không xác thực được passkey.')
      const data = await authenticatePasskey({
        challenge_id: challenge.challenge_id,
        credential: serializePasskeyCredential(credential),
      })
      setAccessToken(data.access_token)
      setCustomer(data.user)
      navigate(resolveSafeStorefrontReturnTo(new URLSearchParams(location.search).get('returnTo')))
    } catch (requestError) {
      setError(passkeyCancellationMessage(requestError) ?? getApiErrorMessage(requestError, 'Không thể đăng nhập bằng passkey. Hãy thử mật khẩu hoặc đặt lại mật khẩu.'))
    } finally {
      setPasskeyBusy(false)
    }
  }

  return {
    passwordVisible,
    busy: loginMutation.isPending || passkeyBusy,
    passkeyBusy,
    passkeySupported: supportsPasskeys(),
    error,
    togglePassword: () => setPasswordVisible((visible) => !visible),
    submit,
    submitPasskey,
  }
}
