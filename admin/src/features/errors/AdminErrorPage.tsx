import { AdminAuthLayout } from '../auth/AdminAuthLayout'
import { useTranslation } from 'react-i18next'

type Props = { code: 403 | 404 | 500 }

export function AdminErrorPage({ code }: Props) {
  const { t } = useTranslation()
  const content: Record<Props['code'], { title: string; description: string }> = {
    403: { title: t('Không có quyền truy cập'), description: t('Tài khoản của bạn chưa được cấp quyền xem trang này.') },
    404: { title: t('Không tìm thấy trang'), description: t('Đường dẫn không tồn tại hoặc đã được thay đổi.') },
    500: { title: t('Có lỗi hệ thống'), description: t('Hệ thống gặp lỗi tạm thời. Vui lòng thử lại.') },
  }
  const item = content[code]
  return <AdminAuthLayout><section className="login-card"><a className="admin-brand login-brand" href="/" aria-label="NÉT Studio"><img className="login-brand-mark" src="/branding/net-studio-mark.png" alt="" /></a><p className="admin-state-code">{code}</p><h1>{item.title}</h1><p className="login-lede">{item.description}</p><div className="reference-form-actions"><a className="primary" href="/">{t('Về tổng quan')}</a>{code === 500 && <button className="secondary" type="button" onClick={() => window.location.reload()}>{t('Thử lại')}</button>}</div></section></AdminAuthLayout>
}
