import { Activity, Bell, BellOff, CheckSquare, CircleHelp, Clock3, CreditCard, ExternalLink, Focus, Keyboard, KeyRound, Link2, LockKeyhole, LogOut, MessageSquareText, PackageCheck, Palette, Plus, RefreshCw, Search, Settings2, ShieldCheck, Star, Trash2, UserRound, Warehouse } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { ADMIN_STOREFRONT_URL } from '../../lib/storefront-base'
import { Badge } from '../../components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { menuGroupOptions, type MenuGroupId, type MenuLayout } from '../preferences/menu-layout'
import { readRecentAdminAccounts, rememberRecentAdminAccount } from './recent-admin-accounts'
import { ariaKeyboardShortcut, formatKeyboardShortcut, isKeyboardEditableTarget, matchesKeyboardShortcut, type AdminShortcuts } from '../../lib/keyboard-shortcuts'
import { adminApiFetch } from '../../lib/admin-api'
import { useTranslation } from 'react-i18next'
import type { SidebarMenuGroup } from './sidebar-menu-types'

const menuGroupLabels: Record<MenuGroupId, string> = Object.fromEntries(menuGroupOptions.map((group) => [group.id, group.label])) as Record<MenuGroupId, string>

export type AdminAccountMenuProps = {
  apiUrl: string
  accessToken: string
  userId?: number
  permissions: string[]
  navigationGroups: SidebarMenuGroup[]
  name: string
  email?: string
  avatar?: string | null
  role: string
  menuLayout: MenuLayout
  locale: 'vi' | 'en'
  onLocaleChange: (locale: 'vi' | 'en') => void
  shortcuts: AdminShortcuts
  shortcutsEnabled: boolean
  onLogout: () => void
  onSwitchAccount: (email: string) => void
  onToggleFocusMode: () => void
  focusModeActive: boolean
  onLockScreen: () => void
  previewRoleName?: string | null
  onRolePreview: (roleName: string | null, permissions?: string[]) => void
  onActionNotice: (message: string, tone?: 'success' | 'error') => void
  openOnMount?: boolean
  onOpenRequestConsumed?: () => void
}

type MenuSummary = {
  notifications_unread: number
  notifications_muted: boolean
  tasks_overdue: number
  tasks_today: number
  security_warnings: number
  password_expiry_warning: boolean
  password_expiry_days: number | null
  unrecognized_login: boolean
  changelog_unread: number
  failed_jobs: number
  quick_links: { orders_pending: number; orders_overdue: number; orders_cancel_return_requests: number; payments_failed: number; reviews_pending: number; low_stock: number; coupons_expiring: number }
  system_health: 'ok' | 'warning' | 'error' | 'unavailable'
  presence: string
  email_verified_at: string | null
  two_factor_enabled: boolean
  has_admin_role: boolean
  staff_code: string | null
  last_login_at: string | null
  last_login_ip: string | null
  last_login_user_agent: string | null
  timezone: string
  profile_checklist: { completed: number; total: number; items: Array<{ id: string; label: string; href: string; complete: boolean }> }
}

function formatLoginDevice(userAgent: string, t: (key: string) => string): string {
  const browser = userAgent.includes('Edg/') ? 'Edge' : userAgent.includes('Firefox/') ? 'Firefox' : userAgent.includes('Chrome/') ? 'Chrome' : userAgent.includes('Safari/') ? 'Safari' : t('Trình duyệt khác')
  const platform = /Android/i.test(userAgent) ? 'Android' : /iPhone|iPad|iPod/i.test(userAgent) ? 'iOS' : /Windows/i.test(userAgent) ? 'Windows' : /Mac OS/i.test(userAgent) ? 'macOS' : /Linux/i.test(userAgent) ? 'Linux' : t('Thiết bị khác')
  return `${browser} · ${platform}`
}

export function AdminAccountMenu({ apiUrl, accessToken, userId, permissions, navigationGroups, name, email, avatar, role, menuLayout, locale, onLocaleChange, shortcuts, shortcutsEnabled, onLogout, onSwitchAccount, onToggleFocusMode, focusModeActive, onLockScreen, onActionNotice, openOnMount = false, onOpenRequestConsumed }: AdminAccountMenuProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [helpSection, setHelpSection] = useState<'guide' | 'shortcuts' | 'version' | null>(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [switchAccountOpen, setSwitchAccountOpen] = useState(false)
  const [recentAccounts, setRecentAccounts] = useState(readRecentAdminAccounts)
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false)
  const [logoutAllBusy, setLogoutAllBusy] = useState(false)
  const [logoutAllError, setLogoutAllError] = useState('')
  const [verificationBusy, setVerificationBusy] = useState(false)
  const [avatarFallbackColor, setAvatarFallbackColor] = useState(() => {
    try { return localStorage.getItem(`fashion-store:admin-avatar-fallback:${userId ?? 'current'}`) ?? '' } catch { return '' }
  })
  const [menuOpen, setMenuOpen] = useState(openOnMount)
  const [isMobileMenu, setIsMobileMenu] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  useEffect(() => {
    const storageKey = `fashion-store:admin-avatar-fallback:${userId ?? 'current'}`
    const initialTimer = window.setTimeout(() => {
      try { setAvatarFallbackColor(localStorage.getItem(storageKey) ?? '') } catch { setAvatarFallbackColor('') }
    }, 0)
    const onColorChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: number; color: string }>).detail
      if (detail.userId === userId) setAvatarFallbackColor(detail.color)
    }
    window.addEventListener('admin-avatar-fallback-change', onColorChange)
    return () => { window.clearTimeout(initialTimer); window.removeEventListener('admin-avatar-fallback-change', onColorChange) }
  }, [userId])
  useEffect(() => {
    if (!email) return
    const timer = window.setTimeout(() => setRecentAccounts(rememberRecentAdminAccount({ name, email, avatar: avatar ?? null })), 0)
    return () => window.clearTimeout(timer)
  }, [name, email, avatar])
  const [sheetContainer, setSheetContainer] = useState<HTMLDivElement | null>(null)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)
  const setSheetContainerRef = useCallback((element: HTMLDivElement | null) => setSheetContainer(element), [])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)
  const [frequentItems, setFrequentItems] = useState<Array<{ href: string; count: number }>>(() => {
    try {
      const stored = localStorage.getItem(`fashion-admin-account-menu-usage:${userId ?? 'current'}`)
      const usage = stored ? JSON.parse(stored) as Record<string, number> : {}
      return Object.entries(usage).map(([href, count]) => ({ href, count })).sort((a, b) => b.count - a.count).slice(0, 3)
    } catch {
      return []
    }
  })
  const [presenceError, setPresenceError] = useState('')
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => {
      setIsMobileMenu(media.matches)
      setMenuOpen(false)
      setSheetContainer(null)
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])
  useEffect(() => {
    const openAccountMenu = (event: KeyboardEvent) => {
      if (isKeyboardEditableTarget(event.target) || !event.altKey || event.ctrlKey || event.metaKey || event.key.toLowerCase() !== 'a') return
      event.preventDefault()
      setMenuOpen(true)
    }
    window.addEventListener('keydown', openAccountMenu)
    return () => window.removeEventListener('keydown', openAccountMenu)
  }, [])
  useEffect(() => {
    const updateMenuLinks = () => {
      const links = document.querySelectorAll<HTMLAnchorElement>('.topbar-account-popover a[href^="/"]')
      links.forEach((link) => {
        if (isOnline) {
          link.removeAttribute('aria-disabled')
          link.removeAttribute('data-offline-disabled')
          if (link.title === 'Cần kết nối') link.removeAttribute('title')
        } else {
          link.setAttribute('aria-disabled', 'true')
          link.setAttribute('data-offline-disabled', 'true')
          link.title = 'Cần kết nối'
        }
      })
    }
    updateMenuLinks()
    if (isOnline) return
    const observer = new MutationObserver(updateMenuLinks)
    observer.observe(document.body, { childList: true, subtree: true })
    const preventOfflineNavigation = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest<HTMLAnchorElement>('.topbar-account-popover a[data-offline-disabled="true"]')
      if (!link) return
      event.preventDefault()
      event.stopPropagation()
      onActionNotice('Cần kết nối để mở mục này.', 'error')
    }
    document.addEventListener('click', preventOfflineNavigation, true)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', preventOfflineNavigation, true)
    }
  }, [isOnline, menuOpen, onActionNotice])
  const summary = useQuery({
    queryKey: ['admin-account-menu-summary', userId],
    enabled: menuOpen && Boolean(accessToken),
    staleTime: 60_000,
    refetchInterval: menuOpen ? 60_000 : false,
    queryFn: async () => {
      const response = await adminApiFetch(`${apiUrl}/account/menu-summary`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
      if (!response.ok) throw new Error('Không tải được tổng hợp menu')
      const json = await response.json() as { data: MenuSummary }
      return json.data
    },
  })
  const counts = summary.data
  useEffect(() => {
    if (!menuOpen) return
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [menuOpen])
  const groupOrder = (group: MenuGroupId) => menuLayout.order.indexOf(group)
  const groupVisible = (group: MenuGroupId) => !menuLayout.hidden.includes(group)
  const copyCurrentLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      onActionNotice(t('Đã sao chép liên kết trang hiện tại.'))
    } catch {
      onActionNotice(t('Trình duyệt không cho phép sao chép liên kết.'), 'error')
    }
  }
  const resendVerification = async () => {
    if (verificationBusy) return
    setVerificationBusy(true)
    try {
      const response = await adminApiFetch(`${apiUrl}/account/email/verification-notification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Không thể gửi email xác thực.')
      onActionNotice(t('Đã gửi email xác thực.'))
    } catch {
      onActionNotice(t('Không thể gửi email xác thực.'), 'error')
    } finally {
      setVerificationBusy(false)
    }
  }
  const refreshData = async () => {
    await queryClient.invalidateQueries()
    onActionNotice(t('Đã làm mới dữ liệu đang mở.'))
  }
  const clearUiCache = async () => {
    await queryClient.cancelQueries()
    queryClient.removeQueries({ type: 'inactive' })
    await queryClient.invalidateQueries()
    onActionNotice(t('Đã xóa cache không hoạt động và làm mới dữ liệu đang mở. Tài khoản vẫn đăng nhập.'))
  }
  const presenceLabel = counts?.presence === 'busy' ? 'Bận' : counts?.presence === 'away' ? 'Vắng mặt' : counts?.presence === 'hidden' ? 'Ẩn' : 'Sẵn sàng'
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN'
  const currentTimeLabel = counts ? new Intl.DateTimeFormat(dateLocale, { timeZone: counts.timezone, dateStyle: 'medium', timeStyle: 'short' }).format(clock) : ''
  const lastLoginLabel = counts?.last_login_at ? new Intl.DateTimeFormat(dateLocale, { timeZone: counts.timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(counts.last_login_at)) : ''
  const localHour = counts ? Number(new Intl.DateTimeFormat('en-US', { timeZone: counts.timezone, hour: '2-digit', hourCycle: 'h23' }).format(clock)) : 12
  const greetingLabel = localHour < 12 ? 'Chào buổi sáng' : localHour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const lastLoginDevice = counts?.last_login_user_agent ? formatLoginDevice(counts.last_login_user_agent, t) : t('Thiết bị chưa xác định')
  const lastLoginDetails = counts?.last_login_at ? [counts.last_login_ip, lastLoginDevice].filter(Boolean).join(' · ') : ''
  const menuWarning = !counts ? null
    : !counts.email_verified_at ? { kind: 'verify' as const, label: t('Xác thực email để bảo vệ tài khoản'), href: null }
      : counts.password_expiry_warning && counts.password_expiry_days === 0 ? { kind: 'link' as const, label: t('Mật khẩu đã hết hạn. Đổi mật khẩu ngay.'), href: '/account/security#password' }
        : counts.has_admin_role && !counts.two_factor_enabled ? { kind: 'link' as const, label: t('Bật xác thực hai bước để bảo vệ tài khoản'), href: '/account/security#2fa' }
          : counts.unrecognized_login ? { kind: 'link' as const, label: t('Đăng nhập từ thiết bị mới cần xem lại'), href: '/account/login-history' }
            : counts.password_expiry_warning && counts.password_expiry_days !== null ? { kind: 'link' as const, label: t('Mật khẩu sẽ hết hạn sau {{days}} ngày', { days: counts.password_expiry_days }), href: '/account/security#password' }
              : counts.system_health === 'error' && permissions.includes('system.health') ? { kind: 'link' as const, label: t('Hệ thống đang có lỗi. Xem trạng thái hệ thống.'), href: '/system/health' }
                : null
  const totalCount = counts ? counts.notifications_unread + counts.tasks_overdue + counts.security_warnings + counts.changelog_unread + (counts.system_health === 'error' ? 1 : 0) : 0
  const criticalCount = counts ? counts.security_warnings + Number(counts.unrecognized_login) + (counts.system_health === 'error' ? 1 : 0) : 0
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toLocaleUpperCase(dateLocale) ?? '').join('') || 'AD'
  const storefrontUrl = ADMIN_STOREFRONT_URL
  const menuItems = [
    { href: '/account/profile', label: 'Hồ sơ của tôi', aliases: 'profile tài khoản', visible: true },
    { href: '/account/security#password', label: 'Đổi mật khẩu', aliases: 'pass password', visible: true },
    { href: '/account/security#email', label: 'Email đăng nhập', aliases: 'email', visible: true },
    { href: '/account/security#2fa', label: 'Xác thực 2 bước', aliases: 'otp 2fa bảo mật', visible: true },
    { href: '/account/sessions', label: 'Thiết bị & phiên đăng nhập', aliases: 'sessions thiết bị', visible: true },
    { href: '/settings/account/tokens', label: 'Mã truy cập API', aliases: 'api token access key tích hợp', visible: permissions.includes('api_tokens.manage') },
    { href: '/settings/account/privacy', label: 'Quyền riêng tư & dữ liệu', aliases: 'privacy data export download deactivate', visible: true },
    { href: '/notifications', label: 'Thông báo của tôi', aliases: 'notifications', visible: true },
    { href: '/account/notifications', label: 'Tùy chọn thông báo', aliases: 'notification preferences security alerts', visible: true },
    { href: '/account/notifications#dnd', label: 'Không làm phiền', aliases: 'do not disturb quiet hours mute', visible: true },
    { href: '/account/activity', label: 'Hoạt động của tôi', aliases: 'activity audit', visible: true },
    { href: '/account/login-history', label: 'Lịch sử đăng nhập', aliases: 'login security devices', visible: true },
    { href: '/me/tasks', label: 'Việc cần làm', aliases: 'tasks todo việc', visible: true },
    { href: '/me/reminders', label: 'Nhắc việc', aliases: 'reminders nhắc lịch', visible: true },
    { href: '/me/performance', label: 'Hiệu suất của tôi', aliases: 'performance hiệu suất metrics', visible: true },
    { href: '/system/health', label: 'Trạng thái hệ thống', aliases: 'system health server dịch vụ', visible: permissions.includes('system.health') },
    { href: '/system/failed-jobs', label: 'Hàng đợi lỗi', aliases: 'failed jobs queue queue lỗi', visible: permissions.includes('system.health') },
    { href: '/settings/maintenance', label: 'Bảo trì cửa hàng', aliases: 'maintenance store', visible: permissions.includes('settings.manage') },
    { href: '/help/diagnostics', label: 'Chẩn đoán phiên bản', aliases: 'diagnostics version runtime', visible: true },
    { href: '/system/backups', label: 'Sao lưu hệ thống', aliases: 'backup sao lưu dữ liệu database media', visible: permissions.includes('system.backup') },
    { href: '/downloads', label: 'Trung tâm tải xuống', aliases: 'downloads exports files', visible: true },
    { href: '/imports', label: 'Lịch sử nhập kho', aliases: 'imports import history', visible: permissions.includes('inventory.view') },
    { href: '/reports/schedules', label: 'Báo cáo định kỳ', aliases: 'scheduled reports digest', visible: permissions.includes('reports.view') && permissions.includes('reports.schedule') },
    { href: '/account/appearance', label: 'Giao diện & hiển thị', aliases: 'dark theme appearance', visible: true },
    { href: '/orders', label: 'Đơn hàng', aliases: 'orders', visible: permissions.includes('orders.view') },
    { href: '/orders?orders_status=pending', label: 'Đơn chờ xác nhận', aliases: 'orders pending', visible: permissions.includes('orders.view') },
    { href: '/orders?orders_payment_status=failed', label: 'Thanh toán lỗi', aliases: 'payment failed', visible: permissions.includes('orders.view') },
    { href: '/reviews?reviews_status=pending', label: 'Đánh giá chờ duyệt', aliases: 'reviews pending', visible: permissions.includes('reviews.moderate') },
    { href: '/?page=inventory', label: 'Tồn kho', aliases: 'inventory stock', visible: permissions.includes('inventory.view') },
    { href: '/inventory?inventory_low_stock=1', label: 'Sản phẩm sắp hết hàng', aliases: 'inventory low stock', visible: permissions.includes('inventory.view') },
    { href: '/staff', label: 'Nhân sự & phân quyền', aliases: 'staff employees roles permissions', visible: permissions.includes('users.manage') },
    { href: '/staff#staff-security', label: 'Bảo mật nhân sự', aliases: 'staff security reset 2fa revoke sessions', visible: permissions.includes('users.manage') && permissions.includes('staff.security') },
    { href: '/activity-logs', label: 'Nhật ký hoạt động', aliases: 'activity logs audit system', visible: permissions.includes('settings.manage') },
    { href: '/settings/general', label: 'Cài đặt cửa hàng', aliases: 'store settings configuration', visible: permissions.includes('settings.manage') },
    { href: '/products/create', label: 'Thêm sản phẩm', aliases: 'create product new item', visible: permissions.includes('products.create') },
    { href: '/collections/create', label: 'Tạo bộ sưu tập', aliases: 'create collection', visible: permissions.includes('products.create') },
    { href: '/coupons/create', label: 'Tạo mã giảm giá', aliases: 'create coupon discount code', visible: permissions.includes('coupons.manage') },
    { href: '/?page=banners&create=1', label: 'Tạo banner', aliases: 'create banner promotion', visible: permissions.includes('content.manage') },
    { href: '/pages', label: 'Tạo trang nội dung', aliases: 'create content page policy page', visible: permissions.includes('content.manage') },
    { href: '/inventory/adjust', label: 'Điều chỉnh tồn kho', aliases: 'inventory adjustment stock adjust', visible: permissions.includes('inventory.adjust') },
    { href: '#help', label: 'Hướng dẫn sử dụng', aliases: 'help guide trợ giúp', visible: true },
    { href: '#switch-account', label: 'Đăng nhập bằng tài khoản khác', aliases: 'switch account đổi tài khoản', visible: true },
    { href: '#logout', label: 'Đăng xuất', aliases: 'logout sign out thoát', visible: true },
    { href: '#lock', label: 'Khóa màn hình', aliases: 'lock screen khóa màn hình', visible: true },
    { href: '#logout-all', label: 'Đăng xuất mọi thiết bị', aliases: 'logout all devices', visible: true },
  ].filter((item) => item.visible)

  const trackMenuUse = (href: string) => {
    try {
      const key = `fashion-admin-account-menu-usage:${userId ?? 'current'}`
      const stored = localStorage.getItem(key)
      const usage = stored ? JSON.parse(stored) as Record<string, number> : {}
      usage[href] = (usage[href] ?? 0) + 1
      localStorage.setItem(key, JSON.stringify(usage))
      setFrequentItems(Object.entries(usage).map(([itemHref, count]) => ({ href: itemHref, count })).sort((a, b) => b.count - a.count).slice(0, 3))
    } catch {
      // Personal usage tracking is optional and must never block navigation.
    }
  }

  const searchLocale = locale === 'en' ? 'en-US' : 'vi-VN'
  const searchTerm = searchText.trim().toLocaleLowerCase(searchLocale)
  const filteredMenuItems = menuItems.filter((item) => `${item.label} ${t(item.label)} ${item.aliases}`.toLocaleLowerCase(searchLocale).includes(searchTerm))
  const searchResultLinks = () => Array.from(searchResultsRef.current?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? [])

  const updatePresence = (status: 'available' | 'busy' | 'away' | 'invisible') => {
    setPresenceError('')
    void adminApiFetch(`${apiUrl}/account/presence`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((response) => {
      if (!response.ok) throw new Error('Không thể cập nhật trạng thái.')
      void queryClient.invalidateQueries({ queryKey: ['admin-account-menu-summary', userId] })
    }).catch((cause: unknown) => setPresenceError(cause instanceof Error ? cause.message : 'Không thể cập nhật trạng thái.'))
  }

  useEffect(() => {
    if (!shortcutsEnabled) return
    const openShortcuts = (event: KeyboardEvent) => {
      if (isKeyboardEditableTarget(event.target) || !matchesKeyboardShortcut(event, shortcuts.help)) return
      event.preventDefault()
      setHelpSection('shortcuts')
    }
    window.addEventListener('keydown', openShortcuts)
    return () => window.removeEventListener('keydown', openShortcuts)
  }, [shortcuts.help, shortcutsEnabled])

  return <><Sheet open={isMobileMenu && menuOpen} onOpenChange={(open) => { setMenuOpen(open); if (!open && openOnMount) onOpenRequestConsumed?.() }}>
    <SheetContent side="bottom" closeLabel={t('Đóng menu tài khoản')} className="account-menu-sheet" onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => { event.preventDefault(); accountTriggerRef.current?.focus() }}>
      <SheetHeader className="account-menu-sheet-header"><SheetTitle>{t('Menu tài khoản')}</SheetTitle><SheetDescription>{t('Truy cập cài đặt, công việc và công cụ quản trị.')}</SheetDescription></SheetHeader>
      <div ref={setSheetContainerRef} className="account-menu-sheet-body" />
    </SheetContent>
  </Sheet><DropdownMenu open={menuOpen} onOpenChange={(open) => { setMenuOpen(open); if (!open) { setSheetContainer(null); if (openOnMount) onOpenRequestConsumed?.() } }}>
    <DropdownMenuTrigger asChild>
      <button ref={accountTriggerRef} className="topbar-account-trigger" type="button" aria-label={t('Tài khoản {{name}}, {{role}}, trạng thái {{presence}}{{attention}}', { name, role: t(role), presence: t(presenceLabel), attention: totalCount > 0 ? t(', {{count}} mục cần chú ý', { count: totalCount }) : '' })}>
        <Avatar className="avatar topbar-user-avatar">
          <AvatarImage src={avatar ?? undefined} alt="" />
          <AvatarFallback style={avatarFallbackColor ? { backgroundColor: avatarFallbackColor, color: 'white' } : undefined}>{initials}</AvatarFallback>
          <i className="profile-presence" data-presence={counts?.presence ?? 'available'} title={t('Trạng thái: {{presence}}', { presence: t(presenceLabel) })} aria-hidden="true" />
        </Avatar>
        <span className="topbar-account-copy"><strong>{name}</strong><small>{role}</small></span>
        {totalCount > 0 && <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'} className="account-menu-count" aria-label={criticalCount > 0 ? t('Có {{critical}} cảnh báo bảo mật hoặc hệ thống trong {{total}} mục cần chú ý', { critical: criticalCount, total: totalCount }) : t('{{total}} mục cần chú ý', { total: totalCount })}>{totalCount}</Badge>}
      </button>
    </DropdownMenuTrigger>
    {(!isMobileMenu || sheetContainer) && <DropdownMenuContent align="end" sideOffset={8} collisionPadding={12} portalContainer={isMobileMenu ? sheetContainer : undefined} onCloseAutoFocus={(event) => { if (isMobileMenu) event.preventDefault() }} className="topbar-account-popover">
      {!isOnline && <DropdownMenuItem disabled className="profile-menu-item" role="status">{t('Mất kết nối; mục cần mạng đang bị tắt.')}</DropdownMenuItem>}
      <DropdownMenuLabel className="profile-menu-identity">
        <Avatar className="avatar profile-menu-avatar">
          <AvatarImage src={avatar ?? undefined} alt="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="profile-menu-user-copy"><strong>{name}</strong><small>{email ?? t('Đang tải thông tin tài khoản')}</small><Badge variant="secondary" className="profile-role-badge">{t(role)}</Badge></span>
      </DropdownMenuLabel>
      {counts && <DropdownMenuItem disabled className="profile-menu-item account-menu-time" aria-label={t('{{greeting}}, {{name}}. Giờ hiện tại {{time}}; đăng nhập gần nhất {{lastLogin}}; {{details}}', { greeting: t(greetingLabel), name, time: currentTimeLabel, lastLogin: counts.last_login_at ? lastLoginLabel : t('chưa ghi nhận'), details: lastLoginDetails })}>
        <Clock3 size={16} aria-hidden="true" /> <span>{t(greetingLabel)}, {name}<small>{currentTimeLabel}</small><small>{counts.last_login_at ? t('Đăng nhập gần nhất: {{date}}', { date: lastLoginLabel }) : t('Chưa ghi nhận lần đăng nhập trước')}</small>{lastLoginDetails && <small>{lastLoginDetails}</small>}</span>
      </DropdownMenuItem>}
      {counts?.staff_code && <DropdownMenuItem disabled className="profile-menu-item">{t('Mã nhân viên: {{code}}', { code: counts.staff_code })}</DropdownMenuItem>}
      {counts && <DropdownMenuItem disabled={Boolean(counts.email_verified_at) || verificationBusy || !isOnline} className="profile-menu-item account-menu-email-status" onSelect={() => { if (!counts.email_verified_at) void resendVerification() }}>
        <Badge variant={counts.email_verified_at ? 'secondary' : 'destructive'}>{counts.email_verified_at ? t('Email đã xác thực') : t('Email chưa xác thực')}</Badge><span>{email}</span>{!counts.email_verified_at && <small>{verificationBusy ? t('Đang gửi...') : t('Chọn để gửi lại')}</small>}
      </DropdownMenuItem>}
      {menuWarning?.kind === 'link' && menuWarning.href && <DropdownMenuItem asChild className="profile-menu-item account-menu-warning"><a href={menuWarning.href}>{menuWarning.label}</a></DropdownMenuItem>}
      {summary.isPending && <DropdownMenuItem disabled className="profile-menu-item" role="status" aria-busy="true"><span className="account-menu-summary-skeleton" aria-hidden="true" /> {t('Đang tải số lượng và trạng thái…')}</DropdownMenuItem>}
      {summary.isError && <DropdownMenuItem className="profile-menu-item" role="alert" onSelect={() => { void summary.refetch() }}>{t('Không tải được tổng hợp. Chọn để thử lại.')}</DropdownMenuItem>}
      <DropdownMenuSeparator />
      <div className="account-menu-layout-group" data-menu-group="profile" style={{ order: groupOrder("profile") }} hidden={!groupVisible("profile")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["profile"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
      {counts && counts.profile_checklist.completed < counts.profile_checklist.total && <DropdownMenuSub>
        <DropdownMenuSubTrigger className="profile-menu-item"><UserRound size={16} aria-hidden="true" /> {t('Hoàn thiện tài khoản')} <Badge variant="secondary" className="account-menu-count">{counts.profile_checklist.completed}/{counts.profile_checklist.total}</Badge></DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="topbar-account-popover">
          <DropdownMenuLabel>{t('Checklist tài khoản')}</DropdownMenuLabel>
          {counts.profile_checklist.items.map((item) => <DropdownMenuItem key={item.id} asChild className="profile-menu-item"><a href={item.href} aria-label={`${t(item.label)}: ${item.complete ? t('đã hoàn thành') : t('chưa hoàn thành')}`}><span aria-hidden="true">{item.complete ? '✓' : '○'}</span>{t(item.label)}</a></DropdownMenuItem>)}
        </DropdownMenuSubContent>
      </DropdownMenuSub>}
      <DropdownMenuSeparator />
      <DropdownMenuItem className="profile-menu-item" onSelect={() => { setSearchText(''); setSearchOpen(true) }}><Search size={16} aria-hidden="true" /> {t('Tìm trong menu')}</DropdownMenuItem>
      <DropdownMenuItem className="profile-menu-item" aria-pressed={focusModeActive} onSelect={onToggleFocusMode}><Focus size={16} aria-hidden="true" /> {t('Chế độ tập trung')}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>{t('Tiện ích nhanh')}</DropdownMenuLabel>
      <DropdownMenuItem className="profile-menu-item" onSelect={() => { void copyCurrentLink() }}><Link2 size={16} aria-hidden="true" /> {t('Sao chép liên kết trang')}</DropdownMenuItem>
      <DropdownMenuItem className="profile-menu-item" onSelect={() => { void refreshData() }}><RefreshCw size={16} aria-hidden="true" /> {t('Làm mới dữ liệu')}</DropdownMenuItem>
      <DropdownMenuItem className="profile-menu-item" onSelect={() => { void clearUiCache() }}><Trash2 size={16} aria-hidden="true" /> {t('Xóa bộ nhớ đệm giao diện')}</DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="profile-menu-item"><UserRound size={16} aria-hidden="true" /> {t(`Trạng thái: ${presenceLabel}`)}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="topbar-account-popover">
          <DropdownMenuLabel>{t('Chọn trạng thái hiện diện')}</DropdownMenuLabel>
          {(['available', 'busy', 'away', 'invisible'] as const).map((status) => <DropdownMenuItem key={status} className="profile-menu-item" onSelect={() => updatePresence(status)}>{t(status === 'available' ? 'Sẵn sàng' : status === 'busy' ? 'Bận' : status === 'away' ? 'Vắng mặt' : 'Ẩn')}{counts?.presence === (status === 'invisible' ? 'hidden' : status) && <Badge variant="secondary" className="account-menu-count">{t('Đang chọn')}</Badge>}</DropdownMenuItem>)}
          {presenceError && <DropdownMenuLabel className="account-form-error">{presenceError}</DropdownMenuLabel>}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      </DropdownMenuSubContent></DropdownMenuSub></div>
      {frequentItems.length > 0 && <>
        <div className="account-menu-layout-group" data-menu-group="frequent" style={{ order: groupOrder("frequent") }} hidden={!groupVisible("frequent")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["frequent"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
        <DropdownMenuLabel>{t('Hay dùng')}</DropdownMenuLabel>
        {frequentItems.map((item) => {
          const menuItem = menuItems.find((candidate) => candidate.href === item.href)
          return menuItem ? <DropdownMenuItem asChild className="profile-menu-item" key={item.href}><a href={item.href} onClick={() => trackMenuUse(item.href)}><Star size={16} aria-hidden="true" /> {t(menuItem.label)}</a></DropdownMenuItem> : null
        })}
        <DropdownMenuSeparator />
        </DropdownMenuSubContent></DropdownMenuSub></div>
      </>}
      <div className="account-menu-layout-group" data-menu-group="account" style={{ order: groupOrder("account") }} hidden={!groupVisible("account")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["account"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/profile" onClick={() => trackMenuUse('/account/profile')}><UserRound size={16} aria-hidden="true" /> {t('Hồ sơ của tôi')}</a></DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="profile-menu-item"><ShieldCheck size={16} aria-hidden="true" /> {t('Bảo mật')}{counts && counts.security_warnings > 0 && <Badge variant="destructive" className="account-menu-count">{counts.security_warnings}</Badge>}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="topbar-account-popover">
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/security#password" onClick={() => trackMenuUse('/account/security#password')}>{t('Đổi mật khẩu')}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/security#email" onClick={() => trackMenuUse('/account/security#email')}>{t('Email đăng nhập')}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/security#2fa" onClick={() => trackMenuUse('/account/security#2fa')}>{t('Xác thực 2 bước')}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/login-history" onClick={() => trackMenuUse('/account/login-history')}>{t('Lịch sử đăng nhập')}</a></DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/sessions" onClick={() => trackMenuUse('/account/sessions')}><Clock3 size={16} aria-hidden="true" /> {t('Thiết bị & phiên đăng nhập')}</a></DropdownMenuItem>
       <DropdownMenuItem className="profile-menu-item" onSelect={() => { setRecentAccounts(readRecentAdminAccounts()); setSwitchAccountOpen(true) }}><UserRound size={16} aria-hidden="true" /> {t('Đăng nhập bằng tài khoản khác')}</DropdownMenuItem>
       <DropdownMenuItem className="profile-menu-item" onSelect={() => { setLogoutAllError(''); setConfirmLogoutAll(true) }}><LogOut size={16} aria-hidden="true" /> {t('Đăng xuất mọi thiết bị')}</DropdownMenuItem>
      {permissions.includes('api_tokens.manage') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/settings/account/tokens" onClick={() => trackMenuUse('/settings/account/tokens')}><KeyRound size={16} aria-hidden="true" /> {t('Mã truy cập API')}</a></DropdownMenuItem>}
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/activity" onClick={() => trackMenuUse('/account/activity')}><Clock3 size={16} aria-hidden="true" /> {t('Hoạt động của tôi')}</a></DropdownMenuItem>
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/settings/account/privacy" onClick={() => trackMenuUse('/settings/account/privacy')}><ShieldCheck size={16} aria-hidden="true" /> {t('Quyền riêng tư & dữ liệu')}</a></DropdownMenuItem>
      </DropdownMenuSubContent></DropdownMenuSub></div>
      <div className="account-menu-layout-group" data-menu-group="notifications" style={{ order: groupOrder("notifications") }} hidden={!groupVisible("notifications")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["notifications"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/notifications" onClick={() => trackMenuUse('/notifications')}><Bell size={16} aria-hidden="true" /> {t('Thông báo của tôi')}{counts && counts.notifications_unread > 0 && <Badge variant="secondary" className="account-menu-count">{counts.notifications_unread}</Badge>}</a></DropdownMenuItem>
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/notifications#dnd" aria-label={t(counts?.notifications_muted ? 'Không làm phiền đang bật' : 'Không làm phiền đang tắt')} onClick={() => trackMenuUse('/account/notifications')}><BellOff size={16} aria-hidden="true" /> {t('Không làm phiền')}{counts?.notifications_muted && <Badge variant="secondary" className="account-menu-count">{t('Bật')}</Badge>}</a></DropdownMenuItem>
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/notifications" onClick={() => trackMenuUse('/account/notifications')}><Bell size={16} aria-hidden="true" /> {t('Tùy chọn thông báo')}</a></DropdownMenuItem>
      </DropdownMenuSubContent></DropdownMenuSub></div>
      <div className="account-menu-layout-group" data-menu-group="workspace" style={{ order: groupOrder("workspace") }} hidden={!groupVisible("workspace")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["workspace"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/me/tasks" onClick={() => trackMenuUse('/me/tasks')}><CheckSquare size={16} aria-hidden="true" /> {t('Việc cần làm')}{counts && counts.tasks_overdue + counts.tasks_today > 0 && <Badge variant="secondary" className="account-menu-count">{counts.tasks_overdue + counts.tasks_today}</Badge>}</a></DropdownMenuItem>
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/me/reminders" onClick={() => trackMenuUse('/me/reminders')}><Bell size={16} aria-hidden="true" /> {t('Nhắc việc')}</a></DropdownMenuItem>
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/me/performance" onClick={() => trackMenuUse('/me/performance')}><Activity size={16} aria-hidden="true" /> {t('Hiệu suất của tôi')}</a></DropdownMenuItem>
      </DropdownMenuSubContent></DropdownMenuSub></div>
      <div className="account-menu-layout-group" data-menu-group="appearance" style={{ order: groupOrder("appearance") }} hidden={!groupVisible("appearance")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["appearance"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
      <DropdownMenuItem asChild className="profile-menu-item"><a href="/account/appearance" onClick={() => trackMenuUse('/account/appearance')}><Palette size={16} aria-hidden="true" /> {t('Giao diện & hiển thị')}</a></DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="profile-menu-item">{t('Ngôn ngữ')}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem className="profile-menu-item" onSelect={() => onLocaleChange('vi')}>{locale === 'vi' ? '✓ ' : ''}{t('Tiếng Việt')}</DropdownMenuItem>
          <DropdownMenuItem className="profile-menu-item" onSelect={() => onLocaleChange('en')}>{locale === 'en' ? '✓ ' : ''}{t('Tiếng Anh')}</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      </DropdownMenuSubContent></DropdownMenuSub></div>
      <div className="account-menu-layout-group" data-menu-group="data" style={{ order: groupOrder("data") }} hidden={!groupVisible("data")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["data"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('Dữ liệu & tải xuống')}</DropdownMenuLabel>
        <DropdownMenuItem asChild className="profile-menu-item"><a href="/downloads" onClick={() => trackMenuUse('/downloads')}>{t('Trung tâm tải xuống')}</a></DropdownMenuItem>
        {permissions.includes('inventory.view') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/imports" onClick={() => trackMenuUse('/imports')}>{t('Lịch sử nhập kho')}</a></DropdownMenuItem>}
        {permissions.includes('reports.view') && permissions.includes('reports.schedule') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/reports/schedules" onClick={() => trackMenuUse('/reports/schedules')}>{t('Báo cáo định kỳ')}</a></DropdownMenuItem>}
      </DropdownMenuSubContent></DropdownMenuSub></div>
      {(navigationGroups.some((group) => group.items.some((item) => item.permission === 'authenticated' || permissions.includes(item.permission))) || permissions.includes('orders.view') || permissions.includes('inventory.view') || permissions.includes('reviews.moderate') || permissions.includes('coupons.view')) && <>
        <div className="account-menu-layout-group" data-menu-group="quick_navigation" style={{ order: groupOrder("quick_navigation") }} hidden={!groupVisible("quick_navigation")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["quick_navigation"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('Chuyển nhanh tới')}</DropdownMenuLabel>
        <DropdownMenuLabel>{t('Điều hướng theo sidebar')}</DropdownMenuLabel>
        {navigationGroups.map((group) => {
          const allowedItems = group.items.filter((item) => item.permission === 'authenticated' || permissions.includes(item.permission))
          if (allowedItems.length === 0) return null
          return <DropdownMenuSub key={group.label}>
            <DropdownMenuSubTrigger className="profile-menu-item">{t(group.label)}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="topbar-account-popover">
              {allowedItems.map((item) => {
                const href = item.href ?? `/?page=${item.page}`
                return <DropdownMenuItem asChild className="profile-menu-item" key={item.key ?? `${item.page}-${item.label}`}><a href={href} onClick={() => trackMenuUse(href)}>{t(item.label)}</a></DropdownMenuItem>
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        })}
        {permissions.includes('orders.view') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/orders?orders_status=pending" onClick={() => trackMenuUse('/orders?orders_status=pending')}><PackageCheck size={16} aria-hidden="true" /> {t('Đơn chờ xác nhận')}{counts && counts.quick_links.orders_pending > 0 && <Badge variant="secondary" className="account-menu-count">{counts.quick_links.orders_pending}</Badge>}</a></DropdownMenuItem>}
        {permissions.includes('orders.view') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/orders?orders_queue=overdue" onClick={() => trackMenuUse('/orders?orders_queue=overdue')}><Clock3 size={16} aria-hidden="true" /> {t('Đơn quá hạn xử lý (>24 giờ)')}{counts && counts.quick_links.orders_overdue > 0 && <Badge variant="destructive" className="account-menu-count">{counts.quick_links.orders_overdue}</Badge>}</a></DropdownMenuItem>}
        {permissions.includes('orders.view') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/orders?orders_queue=cancel_return" onClick={() => trackMenuUse('/orders?orders_queue=cancel_return')}><RefreshCw size={16} aria-hidden="true" /> {t('Yêu cầu hủy/trả cần xử lý')}{counts && counts.quick_links.orders_cancel_return_requests > 0 && <Badge variant="secondary" className="account-menu-count">{counts.quick_links.orders_cancel_return_requests}</Badge>}</a></DropdownMenuItem>}
        {permissions.includes('orders.view') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/orders?orders_payment_status=failed" onClick={() => trackMenuUse('/orders?orders_payment_status=failed')}><CreditCard size={16} aria-hidden="true" /> {t('Thanh toán lỗi')}{counts && counts.quick_links.payments_failed > 0 && <Badge variant="destructive" className="account-menu-count">{counts.quick_links.payments_failed}</Badge>}</a></DropdownMenuItem>}
        {permissions.includes('reviews.moderate') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/reviews?reviews_status=pending" onClick={() => trackMenuUse('/reviews?reviews_status=pending')}><MessageSquareText size={16} aria-hidden="true" /> {t('Đánh giá chờ duyệt')}{counts && counts.quick_links.reviews_pending > 0 && <Badge variant="secondary" className="account-menu-count">{counts.quick_links.reviews_pending}</Badge>}</a></DropdownMenuItem>}
        {permissions.includes('inventory.view') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/inventory?inventory_low_stock=1" onClick={() => trackMenuUse('/inventory?inventory_low_stock=1')}><Warehouse size={16} aria-hidden="true" /> {t('Sản phẩm sắp hết hàng')}{counts && counts.quick_links.low_stock > 0 && <Badge variant="secondary" className="account-menu-count">{counts.quick_links.low_stock}</Badge>}</a></DropdownMenuItem>}
        {permissions.includes('coupons.view') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/coupons?campaign_coupons_campaign_status=expiring" onClick={() => trackMenuUse('/coupons?campaign_coupons_campaign_status=expiring')}><Clock3 size={16} aria-hidden="true" /> {t('Mã giảm giá sắp hết hạn')}{counts && counts.quick_links.coupons_expiring > 0 && <Badge variant="secondary" className="account-menu-count">{counts.quick_links.coupons_expiring}</Badge>}</a></DropdownMenuItem>}
        </DropdownMenuSubContent></DropdownMenuSub></div>
      </>}
      {(permissions.includes('system.health') || permissions.includes('system.backup') || permissions.includes('users.manage') || permissions.includes('settings.manage')) && <div className="account-menu-layout-group" data-menu-group="system" style={{ order: groupOrder("system") }} hidden={!groupVisible("system")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["system"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('Quản trị hệ thống')}</DropdownMenuLabel>
        {permissions.includes('users.manage') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/staff" onClick={() => trackMenuUse('/staff')}>{t('Nhân sự & phân quyền')}</a></DropdownMenuItem>}
        {permissions.includes('users.manage') && permissions.includes('staff.security') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/staff#staff-security" onClick={() => trackMenuUse('/staff#staff-security')}>{t('Bảo mật nhân sự')}</a></DropdownMenuItem>}
        {permissions.includes('settings.manage') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/activity-logs" onClick={() => trackMenuUse('/activity-logs')}>{t('Nhật ký hoạt động')}</a></DropdownMenuItem>}
        {permissions.includes('settings.manage') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/settings/general" onClick={() => trackMenuUse('/settings/general')}>{t('Cài đặt cửa hàng')}</a></DropdownMenuItem>}
        {permissions.includes('system.health') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/system/health" onClick={() => trackMenuUse('/system/health')}><Settings2 size={16} aria-hidden="true" /> {t('Trạng thái hệ thống')}{counts && <Badge variant={counts.system_health === 'ok' ? 'secondary' : 'destructive'} className="account-menu-count">{counts.system_health === 'ok' ? 'OK' : '!'}</Badge>}</a></DropdownMenuItem>}
        {permissions.includes('system.health') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/system/failed-jobs" onClick={() => trackMenuUse('/system/failed-jobs')}>{t('Hàng đợi lỗi')}{counts && counts.failed_jobs > 0 && <Badge variant="destructive" className="account-menu-count">{counts.failed_jobs}</Badge>}</a></DropdownMenuItem>}
        {permissions.includes('system.backup') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/system/backups" onClick={() => trackMenuUse('/system/backups')}><Activity size={16} aria-hidden="true" /> {t('Sao lưu hệ thống')}</a></DropdownMenuItem>}
        {permissions.includes('settings.manage') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/settings/maintenance" onClick={() => trackMenuUse('/settings/maintenance')}><Settings2 size={16} aria-hidden="true" /> {t('Bảo trì cửa hàng')}</a></DropdownMenuItem>}
      </DropdownMenuSubContent></DropdownMenuSub></div>}
      <div className="account-menu-layout-group" data-menu-group="quick_create" style={{ order: groupOrder("quick_create") }} hidden={!groupVisible("quick_create")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["quick_create"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="profile-menu-item"><Plus size={16} aria-hidden="true" /> {t('Tạo nhanh')}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="topbar-account-popover">
          {permissions.includes('products.create') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/products/create">{t('Thêm sản phẩm')}</a></DropdownMenuItem>}
          {permissions.includes('products.create') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/collections/create">{t('Tạo bộ sưu tập')}</a></DropdownMenuItem>}
          {permissions.includes('coupons.manage') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/coupons/create">{t('Tạo mã giảm giá')}</a></DropdownMenuItem>}
          {permissions.includes('content.manage') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/?page=banners&create=1">{t('Tạo banner')}</a></DropdownMenuItem>}
          {permissions.includes('content.manage') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/pages">{t('Tạo trang nội dung')}</a></DropdownMenuItem>}
          {permissions.includes('inventory.adjust') && <DropdownMenuItem asChild className="profile-menu-item"><a href="/inventory/adjust">{t('Điều chỉnh tồn kho')}</a></DropdownMenuItem>}
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/me/tasks">{t('Tạo việc cần làm')}</a></DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      </DropdownMenuSubContent></DropdownMenuSub></div>
      <div className="account-menu-layout-group" data-menu-group="store" style={{ order: groupOrder("store") }} hidden={!groupVisible("store")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["store"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="profile-menu-item"><a href={storefrontUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" /> {t('Xem cửa hàng')}</a></DropdownMenuItem>
      </DropdownMenuSubContent></DropdownMenuSub></div>
      <div className="account-menu-layout-group" data-menu-group="help" style={{ order: groupOrder("help") }} hidden={!groupVisible("help")}><DropdownMenuSub><DropdownMenuSubTrigger className="profile-menu-item account-menu-section-trigger">{t(menuGroupLabels["help"])}</DropdownMenuSubTrigger><DropdownMenuSubContent className="topbar-account-popover account-menu-section-content">
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="profile-menu-item"><CircleHelp size={16} aria-hidden="true" /> {t('Trợ giúp')}</DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="topbar-account-popover">
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/help" onClick={() => trackMenuUse('/help')}>{t('Hướng dẫn sử dụng')}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/help/tour" onClick={() => trackMenuUse('/help/tour')}>{t('Chạy lại tour giới thiệu')}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/help/changelog" onClick={() => trackMenuUse('/help/changelog')}>{t('Có gì mới')}{counts?.changelog_unread ? <Badge variant="destructive" className="account-menu-count">{t('Mới')}</Badge> : null}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/help/licenses" onClick={() => trackMenuUse('/help/licenses')}>{t('Giấy phép phần mềm')}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/help/diagnostics" onClick={() => trackMenuUse('/help/diagnostics')}>{t('Thông tin phiên bản & chẩn đoán')}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/help/policy" onClick={() => trackMenuUse('/help/policy')}>{t('Điều khoản sử dụng')}</a></DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href="/help/privacy" onClick={() => trackMenuUse('/help/privacy')}>{t('Quyền riêng tư')}</a></DropdownMenuItem>
          <DropdownMenuItem className="profile-menu-item" aria-keyshortcuts={shortcutsEnabled ? ariaKeyboardShortcut(shortcuts.help) : undefined} onSelect={() => setHelpSection('shortcuts')}><Keyboard size={16} aria-hidden="true" /> {t('Phím tắt')} {shortcutsEnabled && <kbd>{formatKeyboardShortcut(shortcuts.help)}</kbd>}</DropdownMenuItem>
          <DropdownMenuItem asChild className="profile-menu-item"><a href={`${storefrontUrl}/pages/contact`} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" /> {t('Liên hệ cửa hàng')}</a></DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      </DropdownMenuSubContent></DropdownMenuSub></div>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="profile-menu-item" onSelect={onLockScreen}><LockKeyhole size={16} aria-hidden="true" /> {t('Khóa màn hình')} <kbd>Ctrl/Cmd+L</kbd></DropdownMenuItem>
      <DropdownMenuItem className="profile-menu-item profile-logout" onSelect={() => setConfirmLogout(true)}><LogOut size={16} aria-hidden="true" /> {t('Đăng xuất')}</DropdownMenuItem>
    </DropdownMenuContent>}
  </DropdownMenu>
  <Dialog open={switchAccountOpen} onOpenChange={setSwitchAccountOpen}>
    <DialogContent className="account-dialog account-switch-dialog">
      <DialogHeader><DialogTitle>{t('Đăng nhập bằng tài khoản khác')}</DialogTitle><DialogDescription>{t('Chọn tài khoản gần đây. Bạn sẽ đăng xuất phiên hiện tại; mật khẩu và token không được lưu trên thiết bị.')}</DialogDescription></DialogHeader>
      <div className="account-switch-list">
        {recentAccounts.map((account) => <button key={account.email} type="button" className="account-switch-option" onClick={() => { setSwitchAccountOpen(false); onSwitchAccount(account.email) }}>
          <Avatar className="avatar"><AvatarImage src={account.avatar ?? undefined} alt="" /><AvatarFallback>{account.name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toLocaleUpperCase('vi-VN') ?? '').join('')}</AvatarFallback></Avatar>
          <span><strong>{account.name}</strong><small>{account.email}</small></span>
          {account.email.toLocaleLowerCase() === email?.toLocaleLowerCase() && <Badge variant="secondary">{t('Đang dùng')}</Badge>}
        </button>)}
        {recentAccounts.length === 0 && <p>{t('Chưa có tài khoản gần đây trên thiết bị này.')}</p>}
      </div>
      <button type="button" className="secondary account-switch-new" onClick={() => { setSwitchAccountOpen(false); onSwitchAccount('') }}>{t('Nhập tài khoản khác')}</button>
    </DialogContent>
  </Dialog>
  <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
    <DialogContent className="account-menu-search-dialog">
      <DialogHeader><DialogTitle>{t('Tìm trong menu')}</DialogTitle><DialogDescription>{t('Tìm trang bằng tên hoặc từ khóa như “pass”, “dark” hoặc “otp”.')}</DialogDescription></DialogHeader>
      <label className="account-menu-search-label" htmlFor="account-menu-search">{t('Từ khóa')}</label>
      <input id="account-menu-search" ref={searchInputRef} autoFocus value={searchText} onChange={(event) => setSearchText(event.target.value)} onKeyDown={(event) => {
        if (event.key === 'Enter') {
          const first = searchResultLinks()[0]
          if (first) { event.preventDefault(); first.click() }
        } else if (event.key === 'ArrowDown') {
          const first = searchResultLinks()[0]
          if (first) { event.preventDefault(); first.focus() }
        }
      }} placeholder={t('Tìm mục tài khoản…')} />
      <div ref={searchResultsRef} className="account-menu-search-results" aria-label={t('Kết quả tìm kiếm')}>
        {filteredMenuItems.map((item) => <a key={item.href} href={item.href} onClick={(event) => {
          if (item.href === '#help') { event.preventDefault(); setHelpSection('guide') }
          if (item.href === '#switch-account') { event.preventDefault(); setRecentAccounts(readRecentAdminAccounts()); setSwitchAccountOpen(true) }
          if (item.href === '#logout') { event.preventDefault(); setConfirmLogout(true) }
          if (item.href === '#lock') { event.preventDefault(); onLockScreen() }
          if (item.href === '#logout-all') { event.preventDefault(); setLogoutAllError(''); setConfirmLogoutAll(true) }
          if (!item.href.startsWith('#')) trackMenuUse(item.href)
          setSearchOpen(false)
        }} onKeyDown={(event) => {
          const links = searchResultLinks()
          const index = links.indexOf(event.currentTarget)
          if (event.key === 'ArrowDown' && index < links.length - 1) { event.preventDefault(); links[index + 1]?.focus() }
          else if (event.key === 'ArrowUp') { event.preventDefault(); if (index > 0) links[index - 1]?.focus(); else searchInputRef.current?.focus() }
          else if (event.key === 'Home') { event.preventDefault(); links[0]?.focus() }
          else if (event.key === 'End') { event.preventDefault(); links.at(-1)?.focus() }
        }}>{t(item.label)}</a>)}
        {filteredMenuItems.length === 0 && <p role="status">{t('Không tìm thấy mục phù hợp.')}</p>}
      </div>
    </DialogContent>
  </Dialog>
  <Dialog open={helpSection !== null} onOpenChange={(open) => { if (!open) setHelpSection(null) }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{helpSection === 'guide' ? t('Hướng dẫn sử dụng') : helpSection === 'shortcuts' ? t('Phím tắt') : t('Phiên bản & cập nhật')}</DialogTitle>
        <DialogDescription>{helpSection === 'guide' ? t('Các thao tác cơ bản trong khu vực quản trị.') : helpSection === 'shortcuts' ? t('Điều hướng nhanh bằng bàn phím.') : t('Thông tin phiên bản khu vực quản trị.')}</DialogDescription>
      </DialogHeader>
      {helpSection === 'guide' && <div className="account-help-content"><p><strong>{t('Đơn hàng:')}</strong> {t('dùng bộ lọc trạng thái, mở từng đơn để xem lịch sử và cập nhật bước xử lý hợp lệ.')}</p><p><strong>{t('Sản phẩm và kho:')}</strong> {t('tìm theo tên hoặc SKU; thay đổi tồn kho qua chức năng điều chỉnh để lưu lịch sử.')}</p><p><strong>{t('Thông báo:')}</strong> {t('chuông hiển thị cảnh báo gần đây; trang')} <a href="/notifications">{t('Trung tâm thông báo')}</a> {t('lưu lịch sử, còn tùy chọn nhận tin nằm trong cài đặt tài khoản.')}</p></div>}
      {helpSection === 'shortcuts' && <div>{!shortcutsEnabled && <p className="account-help-note">{t('Phím tắt hiện đang tắt. Bật lại trong phần Trợ năng của tùy chọn giao diện.')}</p>}<ul className="account-help-shortcuts"><li><kbd>{formatKeyboardShortcut(shortcuts.search)}</kbd><span>{t('Mở tìm kiếm toàn cục')}</span></li><li><kbd>{formatKeyboardShortcut(shortcuts.sidebar)}</kbd><span>{t('Thu gọn hoặc mở sidebar')}</span></li><li><kbd>{formatKeyboardShortcut(shortcuts.lock)}</kbd><span>{t('Khóa màn hình quản trị')}</span></li><li><kbd>{formatKeyboardShortcut(shortcuts.help)}</kbd><span>{t('Mở bảng phím tắt')}</span></li><li><kbd>Esc</kbd><span>{t('Đóng menu hoặc hộp thoại đang mở')}</span></li></ul></div>}
      {helpSection === 'version' && <div className="account-help-content"><p><strong>NÉT Studio · {t('Khu quản trị')}</strong></p><p>{t('Phiên bản ứng dụng')}: {import.meta.env.VITE_APP_VERSION ?? '0.0.0'}.</p><p>{t('Ghi chú phát hành chưa được cấu hình cho phiên bản này.')}</p></div>}
    </DialogContent>
  </Dialog>
  <ConfirmDialog
    open={confirmLogout}
    title={t('Đăng xuất khỏi tài khoản?')}
    description={t('Phiên đăng nhập hiện tại sẽ bị thu hồi và bạn sẽ quay về trang đăng nhập.')}
    confirmLabel={t('Đăng xuất')}
    onConfirm={() => { setConfirmLogout(false); onLogout() }}
    onOpenChange={setConfirmLogout}
  />
  <ConfirmDialog
    open={confirmLogoutAll}
    title={t('Đăng xuất mọi thiết bị?')}
    description={<><p>{t('Tất cả phiên quản trị sẽ bị thu hồi; bạn sẽ quay về trang đăng nhập.')}</p>{logoutAllError && <p className="account-form-error" role="alert">{logoutAllError}</p>}</>}
    confirmLabel={t('Đăng xuất mọi thiết bị')}
    busy={logoutAllBusy}
    onConfirm={() => {
      setLogoutAllBusy(true)
      void adminApiFetch(`${apiUrl}/admin/auth/logout-all`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error(t('Không thể thu hồi các phiên. Hãy thử lại.'))
          setConfirmLogoutAll(false)
          onLogout()
        })
        .catch((cause: unknown) => setLogoutAllError(cause instanceof Error ? cause.message : t('Không thể thu hồi các phiên.')))
        .finally(() => setLogoutAllBusy(false))
    }}
    onOpenChange={setConfirmLogoutAll}
  />
  </>
}
