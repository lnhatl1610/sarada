import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Moon, Monitor, Plus, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MenuLayout } from '../../features/preferences/menu-layout'
import { GlobalSearch, type SearchPage } from '../../features/search/GlobalSearch'
import { NotificationBell } from '../../features/notifications/NotificationBell'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { SidebarTrigger } from '../ui/sidebar'
import type { AdminShortcuts } from '../../lib/keyboard-shortcuts'
import { isKeyboardEditableTarget } from '../../lib/keyboard-shortcuts'
import type { SidebarMenuGroup } from '../../features/account/sidebar-menu-types'

const loadAdminAccountMenu = () => import('../../features/account/AdminAccountMenu')
const LazyAdminAccountMenu = lazy(() => loadAdminAccountMenu().then((module) => ({ default: module.AdminAccountMenu })))

type Theme = 'system' | 'light' | 'dark'
type Props = {
  apiUrl: string
  accessToken: string
  userId?: number
  userName: string
  email?: string
  avatar: string
  userRole: string
  permissions: string[]
  navigationGroups: SidebarMenuGroup[]
  searchPages: SearchPage[]
  title: string
  fallbackPage?: string
  theme: Theme
  menuLayout: MenuLayout
  locale: 'vi' | 'en'
  showBreadcrumbs: boolean
  onLocaleChange: (locale: 'vi' | 'en') => void
  shortcuts: AdminShortcuts
  shortcutsEnabled: boolean
  onNavigate: (url: string) => void
  onToggleTheme: () => void
  onLogout: () => void
  onSwitchAccount: (email: string) => void
  onToggleFocusMode: () => void
  focusModeActive: boolean
  onLockScreen: () => void
  previewRoleName?: string | null
  onRolePreview: (roleName: string | null, permissions?: string[]) => void
  onActionNotice: (message: string, tone?: 'success' | 'error') => void
}

export function AppHeader({ apiUrl, accessToken, userId, userName, email, avatar, userRole, permissions, navigationGroups, searchPages, title, fallbackPage, theme, menuLayout, locale, showBreadcrumbs, onLocaleChange, shortcuts, shortcutsEnabled, onNavigate, onToggleTheme, onLogout, onSwitchAccount, onToggleFocusMode, focusModeActive, onLockScreen, previewRoleName, onRolePreview, onActionNotice }: Props) {
  const { t } = useTranslation()
  const [accountMenuReady, setAccountMenuReady] = useState(false)
  const [accountMenuOpenOnMount, setAccountMenuOpenOnMount] = useState(false)
  const themeLabel = theme === 'system' ? t('theo hệ thống') : theme === 'light' ? t('sáng') : t('tối')
  const openAccountMenu = useCallback(() => {
    setAccountMenuOpenOnMount(true)
    setAccountMenuReady(true)
  }, [])
  useEffect(() => {
    const handleAccountShortcut = (event: KeyboardEvent) => {
      if (accountMenuReady) return
      if (isKeyboardEditableTarget(event.target) || !event.altKey || event.ctrlKey || event.metaKey || event.key.toLowerCase() !== 'a') return
      event.preventDefault()
      openAccountMenu()
    }
    window.addEventListener('keydown', handleAccountShortcut)
    return () => window.removeEventListener('keydown', handleAccountShortcut)
  }, [accountMenuReady, openAccountMenu])
  const accountMenuFallback = <button className="topbar-account-trigger" type="button" aria-label={t('Tài khoản {{name}}, {{role}}', { name: userName, role: t(userRole) })} aria-haspopup="menu" aria-expanded={accountMenuOpenOnMount} title={t('Mở menu tài khoản')} onMouseEnter={() => { void loadAdminAccountMenu() }} onFocus={() => { void loadAdminAccountMenu() }} onClick={openAccountMenu}>
    <span className="avatar topbar-user-avatar">{avatar ? <img src={avatar} alt="" /> : userName.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(-2).join('').toUpperCase()}</span>
    <span className="topbar-account-copy"><strong>{userName}</strong><small>{userRole}</small></span>
  </button>
  return <><header className="admin-top">
    <div className="topbar-leading">
      <SidebarTrigger aria-label={t('Mở hoặc thu gọn menu điều hướng')} title={t('Mở hoặc thu gọn menu điều hướng')} className="admin-sidebar-trigger" />
      {showBreadcrumbs && <Breadcrumb className="breadcrumbs"><BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink asChild><a href={fallbackPage ? `/?page=${fallbackPage}` : '#admin-main-content'}>{t('Bảng điều khiển')}</a></BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>{title}</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList></Breadcrumb>}
    </div>
    <div className="top-actions">
      <GlobalSearch apiUrl={apiUrl} accessToken={accessToken} userId={userId} pages={searchPages} onNavigate={onNavigate} shortcut={shortcuts.search} shortcutsEnabled={shortcutsEnabled} />
      {(permissions.includes('orders.update_status') || permissions.includes('products.create') || permissions.includes('coupons.manage') || permissions.includes('content.manage')) && <DropdownMenu>
        <DropdownMenuTrigger asChild><button className="icon-button quick-create-trigger" type="button" aria-label={t('Tạo nhanh')} title={t('Tạo nhanh')}><Plus size={18} aria-hidden="true" /></button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="quick-create-popover">
          {permissions.includes('orders.update_status') && <DropdownMenuItem asChild><a href="/orders/create">{t('Tạo đơn thủ công')}</a></DropdownMenuItem>}
          {permissions.includes('products.create') && <DropdownMenuItem asChild><a href="/products/create">{t('Thêm sản phẩm')}</a></DropdownMenuItem>}
          {permissions.includes('coupons.manage') && <DropdownMenuItem asChild><a href="/coupons/create">{t('Thêm mã giảm giá')}</a></DropdownMenuItem>}
          {permissions.includes('content.manage') && <DropdownMenuItem asChild><a href="/?page=banners&create=1">{t('Thêm banner')}</a></DropdownMenuItem>}
          {permissions.includes('content.manage') && <DropdownMenuItem asChild><a href="/pages">{t('Tạo trang nội dung')}</a></DropdownMenuItem>}
          {permissions.includes('products.create') && <DropdownMenuItem asChild><a href="/collections/create">{t('Tạo bộ sưu tập')}</a></DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>}
      <NotificationBell key={userId ?? 'pending-account'} apiUrl={apiUrl} accessToken={accessToken} userId={userId} permissions={permissions} />
      <button className="icon-button theme-toggle" type="button" aria-label={t('Chế độ giao diện: {{theme}}', { theme: themeLabel })} title={t('Chế độ giao diện: {{theme}}. Nhấn để đổi.', { theme: themeLabel })} onClick={onToggleTheme}>
        {theme === 'system' ? <Monitor size={17} aria-hidden="true" /> : theme === 'light' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      </button>
      {accountMenuReady ? <Suspense fallback={accountMenuFallback}><LazyAdminAccountMenu apiUrl={apiUrl} accessToken={accessToken} userId={userId} permissions={permissions} navigationGroups={navigationGroups} name={userName} email={email} avatar={avatar} role={userRole} menuLayout={menuLayout} locale={locale} onLocaleChange={onLocaleChange} shortcuts={shortcuts} shortcutsEnabled={shortcutsEnabled} onLogout={onLogout} onSwitchAccount={onSwitchAccount} onToggleFocusMode={onToggleFocusMode} focusModeActive={focusModeActive} onLockScreen={onLockScreen} previewRoleName={previewRoleName} onRolePreview={onRolePreview} onActionNotice={onActionNotice} openOnMount={accountMenuOpenOnMount} onOpenRequestConsumed={() => setAccountMenuOpenOnMount(false)} /></Suspense> : accountMenuFallback}
    </div>
  </header>{previewRoleName && <div className="connection-note" role="status">{t('Đang xem trước menu với vai trò {{role}}. Các trang và thao tác vẫn dùng quyền thật của tài khoản.', { role: previewRoleName })} <button className="link-button" type="button" onClick={() => onRolePreview(null)}>{t('Thoát xem trước')}</button></div>}</>
}
