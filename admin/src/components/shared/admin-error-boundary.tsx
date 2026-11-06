import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '../../lib/i18n'
import { AdminAuthLayout } from '../../features/auth/AdminAuthLayout'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State { return { hasError: true } }

  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Admin UI error', error, info) }

  render() {
    if (!this.state.hasError) return this.props.children
    return <AdminAuthLayout><section className="login-card"><p className="eyebrow">{i18n.t('KHU QUẢN TRỊ')}</p><h1>{i18n.t('Đã xảy ra lỗi')}</h1><p className="login-lede">{i18n.t('Trang quản trị gặp lỗi không mong muốn.')}</p><button className="primary" type="button" onClick={() => window.location.reload()}>{i18n.t('Thử lại')}</button></section></AdminAuthLayout>
  }
}
