import { Activity, Bell, KeyRound, LockKeyhole, Monitor, Palette, Shield, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export type AccountAreaSection = 'profile' | 'security' | 'sessions' | 'notifications' | 'activity' | 'appearance' | 'privacy' | 'tokens'

const links: { id: AccountAreaSection; label: string; href: string; icon: typeof UserRound }[] = [
  { id: 'profile', label: 'Hồ sơ của tôi', href: '/account/profile', icon: UserRound },
  { id: 'security', label: 'Bảo mật', href: '/account/security', icon: Shield },
  { id: 'sessions', label: 'Thiết bị & phiên đăng nhập', href: '/account/sessions', icon: Monitor },
  { id: 'notifications', label: 'Thông báo của tôi', href: '/account/notifications', icon: Bell },
  { id: 'activity', label: 'Hoạt động của tôi', href: '/account/activity', icon: Activity },
  { id: 'appearance', label: 'Giao diện & hiển thị', href: '/account/appearance', icon: Palette },
  { id: 'privacy', label: 'Quyền riêng tư & dữ liệu', href: '/settings/account/privacy', icon: LockKeyhole },
  { id: 'tokens', label: 'Mã truy cập API', href: '/settings/account/tokens', icon: KeyRound },
]

export function AccountAreaLayout({ active, onNavigate, children, canManageTokens = false }: { active: AccountAreaSection; onNavigate: (href: string) => void; children: ReactNode; canManageTokens?: boolean }) {
  const { t } = useTranslation()
  return <div className="account-area-layout">
    <nav className="account-area-nav" aria-label={t('Điều hướng cài đặt tài khoản')}>
      <h2>{t('Tài khoản')}</h2>
      {links.filter(({ id }) => id !== 'tokens' || canManageTokens).map(({ id, label, href, icon: Icon }) => <a key={id} id={id === 'profile' ? 'account-nav-profile' : `account-tab-${id}`} href={href} className={active === id ? 'active' : ''} aria-current={active === id ? 'page' : undefined} onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        onNavigate(href)
      }}><Icon size={16} aria-hidden="true" /><span>{t(label)}</span></a>)}
    </nav>
    <div className="account-area-content">{children}</div>
  </div>
}
