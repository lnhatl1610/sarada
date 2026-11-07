import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '../../OnboardingTour.css'
import { Button } from '../../components/ui/button'
import { adminApiFetch } from '../../lib/admin-api'
import { ADMIN_API_BASE_URL } from '../../lib/api-base'
import { useTranslation } from 'react-i18next'

type TourStep = { title: string; description: string; href: string; action: string }
type Onboarding = { completed: string[]; dismissed: boolean; snoozed_until: string | null }
type PreferencesResponse = { data?: Record<string, unknown>; message?: string }
const apiBase = ADMIN_API_BASE_URL
const defaultState: Onboarding = { completed: [], dismissed: false, snoozed_until: null }

export function AccountOnboardingTour({ userId, roles, permissions, forceOpen = false }: { userId?: number; roles: string[]; permissions: string[]; forceOpen?: boolean }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [openOverride, setOpenOverride] = useState<boolean | null>(null)
  const [now, setNow] = useState(0)
  const finishTourRef = useRef<(completed: boolean) => void>(() => {})
  const snoozeTourRef = useRef<() => void>(() => {})
  const preference = useQuery({
    queryKey: ['account-preferences', userId, 'admin_onboarding'],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await adminApiFetch(`${apiBase}/account/preferences`, { headers: { Accept: 'application/json' } })
      const body = await response.json().catch(() => ({})) as PreferencesResponse
      if (!response.ok) throw new Error(body.message ?? t('Không tải được tiến độ hướng dẫn.'))
      const value = body.data?.admin_onboarding as Partial<Onboarding> | undefined
      const snoozedUntil = typeof value?.snoozed_until === 'string' && Number.isFinite(Date.parse(value.snoozed_until)) ? value.snoozed_until : null
      return { completed: Array.isArray(value?.completed) ? value.completed : [], dismissed: Boolean(value?.dismissed), snoozed_until: snoozedUntil }
    },
  })
  const steps = useMemo<TourStep[]>(() => {
    const common: TourStep[] = [
      { title: t('Bảng điều khiển'), description: t('Xem nhanh đơn hàng, doanh thu, tồn kho và các cảnh báo phù hợp với quyền tài khoản.'), href: '/', action: t('Mở bảng điều khiển') },
      { title: t('Tài khoản và bảo mật'), description: t('Cập nhật hồ sơ, bật xác thực hai bước, xem phiên đăng nhập và thiết bị tin cậy.'), href: '/account/security', action: t('Mở cài đặt bảo mật') },
      { title: t('Việc cần làm'), description: t('Ghi lại việc cá nhân, đặt hạn xử lý và nhận nhắc việc trong ứng dụng.'), href: '/me/tasks', action: t('Mở việc cần làm') },
      { title: t('Thông báo'), description: t('Theo dõi thông báo vận hành, đánh dấu đã đọc và quản lý các bản tin hệ thống.'), href: '/notifications', action: t('Mở trung tâm thông báo') },
    ]
    const roleSteps: TourStep[] = []
    if (permissions.includes('products.view')) roleSteps.push({ title: t('Sản phẩm'), description: t('Tìm sản phẩm theo tên hoặc SKU; quyền sửa và tạo được kiểm soát riêng.'), href: '/products', action: t('Mở sản phẩm') })
    if (permissions.includes('orders.view')) roleSteps.push({ title: t('Đơn hàng'), description: t('Theo dõi trạng thái đơn và xử lý theo đúng các bước nghiệp vụ được phép.'), href: '/orders', action: t('Mở đơn hàng') })
    if (permissions.includes('inventory.view')) roleSteps.push({ title: t('Kho hàng'), description: t('Xem tồn có thể bán và lịch sử biến động; điều chỉnh kho luôn ghi nhận người thực hiện.'), href: '/inventory', action: t('Mở kho hàng') })
    if (permissions.includes('reports.view')) roleSteps.push({ title: t('Báo cáo'), description: t('Xem các chỉ số và báo cáo mà vai trò của bạn được cấp quyền.'), href: '/reports', action: t('Mở báo cáo') })
    if (roles.includes('super_admin') || roles.includes('admin')) roleSteps.push({ title: t('Thiết lập cửa hàng'), description: t('Quản lý cấu hình vận chuyển, nhân viên và các thiết lập vận hành.'), href: '/settings/general', action: t('Mở thiết lập') })
    return [...common.slice(0, 1), ...roleSteps.slice(0, 3), ...common.slice(1)].slice(0, 8)
  }, [permissions, roles, t])
  const checklist = useMemo(() => [
    ...(permissions.includes('products.create') ? [{ id: 'product', label: t('Thêm sản phẩm đầu tiên'), href: '/products' }] : []),
    ...(permissions.includes('settings.manage') ? [{ id: 'shipping', label: t('Kiểm tra cấu hình vận chuyển'), href: '/settings/shipping' }] : []),
    ...(permissions.includes('users.manage') ? [{ id: 'staff', label: t('Mời hoặc thêm nhân viên'), href: '/staff' }] : []),
    { id: 'two_factor', label: t('Bật xác thực hai bước cho tài khoản'), href: '/account/security#2fa' },
  ], [permissions, t])
  const save = useMutation({
    mutationFn: async (value: Onboarding) => {
      const response = await adminApiFetch(`${apiBase}/account/preferences`, { method: 'PUT', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'admin_onboarding', value }) })
      const body = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
      if (!response.ok) {
        const validationMessage = Object.values(body.errors ?? {}).flat().find((message) => message.trim())
        throw new Error(validationMessage ?? body.message ?? t('Không thể lưu tiến độ hướng dẫn.'))
      }
      return value
    },
    onSuccess: (value) => { client.setQueryData(['account-preferences', userId, 'admin_onboarding'], value); void client.invalidateQueries({ queryKey: ['admin-account-menu-summary', userId] }) },
  })
  const savePreference = save.mutate
  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0)
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => { window.clearTimeout(initialTimer); window.clearInterval(timer) }
  }, [])
  const onboardingState = preference.data ?? defaultState
  const snoozedUntil = onboardingState.snoozed_until ? Date.parse(onboardingState.snoozed_until) : 0
  const shouldAutoOpen = Boolean(preference.data && !onboardingState.dismissed && !onboardingState.completed.includes('intro_tour') && now >= snoozedUntil)
  const open = openOverride ?? (forceOpen || shouldAutoOpen)
  useEffect(() => {
    if (!open) return
    let finished = false
    const tour = driver({
      showProgress: true,
      allowClose: true,
      allowKeyboardControl: true,
      overlayColor: 'var(--foreground)',
      overlayOpacity: 0.58,
      popoverClass: 'sarada-driver-popover',
      nextBtnText: t('Tiếp theo'),
      prevBtnText: t('Quay lại'),
      doneBtnText: t('Hoàn tất'),
      closeBtnLabel: t('Đóng hướng dẫn'),
      steps: steps.map((item) => ({
        element: item.href === '/' ? '#admin-main-content' : `[data-tour-href="${item.href}"]`,
        skipMissingElement: true,
        popover: { title: item.title, description: item.description, side: item.href === '/' ? 'bottom' as const : 'right' as const, align: 'start' as const },
      })),
      onPopoverRender: (popover, options) => {
        const current = steps[options.index ?? 0]
        if (!current) return
        const link = document.createElement('a')
        link.className = 'sarada-driver-action'
        link.href = current.href
        link.target = '_blank'
        link.rel = 'noreferrer'
        link.textContent = current.action
        popover.description.append(link)
        const snooze = document.createElement('button')
        snooze.type = 'button'
        snooze.className = 'sarada-driver-snooze'
        snooze.textContent = t('Tạm ẩn trong 1 giờ')
        snooze.addEventListener('click', () => {
          tour.destroy()
        snoozeTourRef.current()
        })
        popover.footer.prepend(snooze)
      },
      onDestroyed: (_element, _currentStep, options) => {
        if (finished) return
        finished = true
        if (options.reason === 'done') finishTourRef.current(true)
        else if (options.reason === 'close' || options.reason === 'escape' || options.reason === 'overlay') finishTourRef.current(false)
      },
    })
    tour.drive()
    return () => {
      finished = true
      tour.destroy()
    }
  }, [open, steps, t])

  const finish = useCallback((completed: boolean) => {
    setOpenOverride(false)
    const current = preference.data ?? defaultState
    savePreference({ completed: completed ? [...new Set([...current.completed, 'intro_tour'])] : current.completed, dismissed: !completed, snoozed_until: null })
  }, [preference.data, savePreference])

  const snoozeOneHour = useCallback(() => {
    const current = preference.data ?? defaultState
    savePreference({
      completed: current.completed,
      dismissed: false,
      snoozed_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }, { onSuccess: () => setOpenOverride(false) })
  }, [preference.data, savePreference])
  useEffect(() => {
    finishTourRef.current = finish
    snoozeTourRef.current = snoozeOneHour
  }, [finish, snoozeOneHour])

  if (!userId || (!forceOpen && (preference.isPending || preference.isError)) || steps.length === 0) return null
  if (forceOpen && preference.isPending) return <section className="onboarding-launcher" role="status" aria-busy="true">{t('Đang tải tiến độ hướng dẫn…')}</section>
  if (forceOpen && preference.isError) return <section className="onboarding-launcher" role="alert"><p>{t(preference.error.message)}</p><Button variant="outline" onClick={() => void preference.refetch()}>{t('Thử tải lại')}</Button></section>
  const onboarding = preference.data ?? defaultState
  const updateChecklist = (id: string, checked: boolean) => {
    const completed = new Set(onboarding.completed)
    if (checked) completed.add(id)
    else completed.delete(id)
    save.mutate({ completed: [...completed], dismissed: onboarding.dismissed, snoozed_until: onboarding.snoozed_until })
  }
  return <>
    {forceOpen && <section className="onboarding-launcher"><p className="eyebrow">{t('HƯỚNG DẪN BẮT ĐẦU')}</p><h1>{t('Tour giới thiệu trang quản trị')}</h1><p>{t('Đi qua các khu vực chính phù hợp với quyền tài khoản của bạn.')}</p><Button onClick={() => setOpenOverride(true)}>{open ? t('Tour đang mở') : t('Bắt đầu hoặc xem lại tour')}</Button>
      <h2>{t('Checklist bắt đầu')}</h2><p>{t('Đánh dấu các bước đã hoàn tất để lưu tiến độ cho tài khoản của bạn.')}</p>{save.isError && <p role="alert">{t(save.error.message)}</p>}<ul className="onboarding-checklist">{checklist.map((item) => <li key={item.id}><label><input type="checkbox" checked={onboarding.completed.includes(item.id)} onChange={(event) => updateChecklist(item.id, event.target.checked)} /> <a href={item.href}>{item.label}</a></label></li>)}</ul>
    </section>}
  </>
}
