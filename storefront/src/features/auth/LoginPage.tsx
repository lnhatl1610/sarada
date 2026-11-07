import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { StorefrontAuthLayout } from './StorefrontAuthLayout'

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Nhập email hoặc số điện thoại.').max(255, 'Thông tin đăng nhập quá dài.'),
  password: z.string().min(1, 'Nhập mật khẩu.'),
  remember_me: z.boolean(),
})
type LoginValues = z.infer<typeof loginSchema>

type LoginPageProps = {
  passwordVisible: boolean
  busy: boolean
  passkeyBusy: boolean
  passkeySupported: boolean
  error: string
  registrationEnabled: boolean
  sessionExpired?: boolean
  onTogglePassword: () => void
onSubmit: (values: LoginValues) => void | Promise<void>
  onPasskeyLogin: () => void | Promise<void>
}

export function LoginPage({
  passwordVisible,
  busy,
  passkeyBusy,
  passkeySupported,
  error,
  registrationEnabled,
  sessionExpired = false,
  onTogglePassword,
  onSubmit,
  onPasskeyLogin,
}: LoginPageProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember_me: false },
  })

  return (
    <StorefrontAuthLayout>
      <main className="container auth-page">
        <p className="eyebrow">TÀI KHOẢN SARADA</p>
        <h1>Chào mừng trở lại</h1>
        <p className="auth-lede">Đăng nhập để xem đơn hàng và thông tin cá nhân.</p>
        {sessionExpired && <p className="auth-session-expired" role="status">Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục; trang bạn đang xem sẽ được mở lại sau khi đăng nhập.</p>}
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="storefront-login-identifier">Email hoặc số điện thoại<input id="storefront-login-identifier" type="text" autoComplete="username" maxLength={255} aria-invalid={Boolean(errors.identifier)} aria-describedby={errors.identifier ? 'storefront-login-identifier-error' : undefined} {...register('identifier')} /></label>
          {errors.identifier && <p id="storefront-login-identifier-error" className="auth-error" role="alert">{errors.identifier.message}</p>}
          <div className="storefront-auth-password">
            <label htmlFor="storefront-login-password">Mật khẩu<input id="storefront-login-password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'storefront-login-password-error' : undefined} {...register('password')} /></label>
            <button className="storefront-auth-password-toggle" type="button" aria-label={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={passwordVisible} onClick={onTogglePassword}>{passwordVisible ? 'Ẩn' : 'Hiện'}</button>
          </div>
          {errors.password && <p id="storefront-login-password-error" className="auth-error" role="alert">{errors.password.message}</p>}
          <label className="storefront-remember-me"><input type="checkbox" {...register('remember_me')} /> Ghi nhớ tôi trên thiết bị này</label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button dark full" disabled={busy}>{busy ? 'Đang xử lý…' : sessionExpired ? 'Đăng nhập lại' : 'Đăng nhập'}</button>
          {passkeySupported && <button className="button light full" type="button" disabled={busy} onClick={() => void onPasskeyLogin()}>{passkeyBusy ? 'Đang xác thực passkey…' : 'Đăng nhập bằng passkey'}</button>}
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          {registrationEnabled && <p>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>}
        </form>
      </main>
    </StorefrontAuthLayout>
  )
}
