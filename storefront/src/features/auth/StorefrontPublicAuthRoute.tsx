import { lazy } from 'react'
import type { useStorefrontLogin } from './useStorefrontLogin'

const RegistrationFlowPage = lazy(() => import('./RegistrationFlowPage').then((module) => ({ default: module.RegistrationFlowPage })))
const PasswordRecoveryPage = lazy(() => import('./PasswordRecoveryPage').then((module) => ({ default: module.PasswordRecoveryPage })))
const LoginPage = lazy(() => import('./LoginPage').then((module) => ({ default: module.LoginPage })))

type LoginState = ReturnType<typeof useStorefrontLogin>

type StorefrontPublicAuthRouteProps = {
  path: string
  login: LoginState
  registrationEnabled: boolean
}

export function StorefrontPublicAuthRoute({ path, login, registrationEnabled }: StorefrontPublicAuthRouteProps) {
  if (path === '/login') {
    return <LoginPage passwordVisible={login.passwordVisible} busy={login.busy} passkeyBusy={login.passkeyBusy} passkeySupported={login.passkeySupported} error={login.error} registrationEnabled={registrationEnabled} onTogglePassword={login.togglePassword} onSubmit={login.submit} onPasskeyLogin={login.submitPasskey} />
  }
  if (path === '/forgot-password') return <PasswordRecoveryPage page="request" />
  if (path === '/forgot-password/sent') return <PasswordRecoveryPage page="sent" />
  if (path === '/reset-password/done') return <PasswordRecoveryPage page="done" />
  if (path.startsWith('/reset-password/')) return <PasswordRecoveryPage page="reset" />
  if (path === '/register') return <RegistrationFlowPage page="register" />
  if (path === '/pending-approval') return <RegistrationFlowPage page="pending" />
  if (path === '/verify-email') return <RegistrationFlowPage page="verified" />
  return null
}
