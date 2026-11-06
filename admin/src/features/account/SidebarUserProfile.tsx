import { useId, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, CircleHelp, LogOut, Settings2, UserRound, Mail, Shield, Key, X } from 'lucide-react'

type SidebarUserProfileProps = {
  name: string
  email?: string
  avatar?: string | null
  role: string
  collapsed?: boolean
  helpLinks: { label: string; href: string }[]
  onChangePassword: () => void
  onLogout: () => void
}

export function SidebarUserProfile({
  name,
  email,
  avatar,
  role,
  collapsed = false,
  helpLinks,
  onChangePassword,
  onLogout,
}: SidebarUserProfileProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const menuId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toLocaleUpperCase('vi-VN') ?? '')
    .join('') || 'AD'

  // Close the account menu on Escape or when clicking outside it.
  useEffect(() => {
    if (!dialogOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDialogOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setDialogOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [dialogOpen])

  const triggerButton = (
    <button
      type="button"
      className="sidebar-profile-trigger"
      aria-label={t('Tài khoản {{name}}, {{role}}', { name, role })}
      title={collapsed ? t('{{name}} · {{role}}', { name, role }) : undefined}
      aria-haspopup="dialog"
      aria-expanded={dialogOpen}
      aria-controls={menuId}
      onClick={() => setDialogOpen((open) => !open)}
    >
      <span className="avatar sidebar-user-avatar">
        {avatar ? <img src={avatar} alt="" /> : initials}
        <i className="profile-presence" title={t('Phiên đang hoạt động')} />
      </span>
      {!collapsed && (
        <span className="sidebar-profile-copy">
          <strong>{name}</strong>
          <small>{role}</small>
        </span>
      )}
      {!collapsed && (
        <ChevronDown size={16} aria-hidden="true" />
      )}
    </button>
  )

  const dialogContent = (
    <>
      <div
        id={menuId}
        className="sidebar-user-dialog"
        role="dialog"
        aria-label={t('Tài khoản người dùng')}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="sidebar-user-dialog-header">
        <div className="profile-menu-identity">
          <span className="avatar profile-menu-avatar">
            {avatar ? <img src={avatar} alt="" /> : initials}
          </span>
          <span className="profile-menu-user-copy">
            <strong>{name}</strong>
            <small>{email ?? t('Đang tải thông tin tài khoản')}</small>
            <b className="profile-role-badge">{role}</b>
          </span>
        </div>
        <button
          type="button"
          className="sidebar-user-dialog-close"
          aria-label={t('Đóng')}
          onClick={() => setDialogOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-user-dialog-body">
        <div className="profile-info-grid">
          <a
            className="profile-info-item"
            href="/settings/account"
            onClick={() => setDialogOpen(false)}
          >
            <UserRound size={14} />
            <span>{t('Hồ sơ cá nhân')}</span>
          </a>
          <a
            className="profile-info-item"
            href="/settings/account"
            onClick={() => setDialogOpen(false)}
          >
            <Settings2 size={14} />
            <span>{t('Cài đặt tài khoản')}</span>
          </a>
          <button
            className="profile-info-item"
            type="button"
            onClick={() => {
              setDialogOpen(false)
              onChangePassword()
            }}
          >
            <Key size={14} />
            <span>{t('Đổi mật khẩu')}</span>
          </button>
        </div>

        <div className="profile-contact">
          <div className="profile-contact-row">
            <Mail size={13} />
            <span className="profile-contact-label">{t("Email")}</span>
            <span className="profile-contact-value">{email ?? '—'}</span>
          </div>
          <div className="profile-contact-row">
            <Shield size={13} />
            <span className="profile-contact-label">{t('Vai trò')}</span>
            <span className="profile-contact-value">{role}</span>
          </div>
        </div>

        <div className="profile-menu-separator" />

        <button
          className="profile-menu-item"
          type="button"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((v) => !v)}
        >
          <CircleHelp size={16} />
          {t('Hướng dẫn sử dụng')}
          <ChevronDown className={`help-chevron ${helpOpen ? 'rotated' : ''}`} size={12} />
        </button>
        {helpOpen && (
          <div className="profile-menu-details">
            {helpLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setDialogOpen(false)}>
                {link.label}
              </a>
            ))}
          </div>
        )}

        <button
          className="profile-menu-item"
          type="button"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <Settings2 size={16} />
          {t('Thông tin phiên bản')} <span className="profile-version-label">V1.0</span>
          <ChevronDown className={`help-chevron ${settingsOpen ? 'rotated' : ''}`} size={12} />
        </button>
        {settingsOpen && (
          <div className="profile-menu-details">
            <span>{t('NÉT STUDIO · Quản trị cửa hàng')}</span>
            <span>{t('Phiên bản giao diện {{version}}', { version: '1.0' })}</span>
          </div>
        )}

        <div className="profile-menu-separator" />
        <button
          className="profile-menu-item profile-logout"
          type="button"
          onClick={() => {
            setDialogOpen(false)
            onLogout()
          }}
        >
          <LogOut size={16} />
          {t('Đăng xuất')}
        </button>
      </div>
    </div>
  </>
  )

  return (
    <div ref={wrapperRef} className="sidebar-group sidebar-user-profile">
      <div className="sidebar-user-header">{triggerButton}</div>
      {dialogOpen && dialogContent}
    </div>
  )
}
