import { adminApiFetch } from '../../lib/admin-api'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { applyServerValidationErrors, createApiResponseError } from '../../components/shared/api-validation'
import { FormField } from '../../components/shared/form-field'
import { ImageUploader } from '../../components/shared/image-uploader'
import { MoneyInput } from '../../components/shared/money'
import { useUnsavedFormGuard } from '../../lib/use-unsaved-form-guard'
import { mediaUrl } from '../../lib/media-url'
import '../../ReferenceData.css'
import { adminRoleOptions } from '../staff/roles'
import { useTranslation } from 'react-i18next'

type Props = { apiUrl: string; accessToken: string; isOwner?: boolean; section: 'general' | 'payments' | 'security' | 'email' | 'seo' | 'maintenance' }
type SettingsTranslator = ReturnType<typeof useTranslation>['t']
const homeSectionKeys = ['hero', 'categories', 'new_arrivals', 'campaign', 'best_sellers', 'recently_viewed', 'personalized', 'collections', 'service_strip', 'lookbook', 'newsletter', 'membership', 'instagram'] as const
type HomeSectionKey = typeof homeSectionKeys[number]
type HomeSection = { key: HomeSectionKey; enabled: boolean }
const homeSectionLabels: Record<HomeSectionKey, string> = { hero: 'Trang chủ: Ảnh đầu trang', categories: 'Trang chủ: Danh mục', new_arrivals: 'Trang chủ: Sản phẩm mới', campaign: 'Trang chủ: Chiến dịch', best_sellers: 'Trang chủ: Sản phẩm bán chạy', recently_viewed: 'Trang chủ: Sản phẩm đã xem gần đây', personalized: 'Trang chủ: Gợi ý dành cho bạn', collections: 'Trang chủ: Bộ sưu tập', service_strip: 'Trang chủ: Thông tin giao hàng', lookbook: 'Trang chủ: Lookbook', newsletter: 'Trang chủ: Đăng ký nhận tin', membership: 'Trang chủ: Chương trình thành viên', instagram: 'Trang chủ: Instagram' }
type InstagramPost = { post_url: string; image_url: string; alt: string }
const defaultHomeSections: HomeSection[] = homeSectionKeys.map((key) => ({ key, enabled: true }))
const nonNegativeInteger = (label: string, t: SettingsTranslator) => z.string().trim().min(1, t('Nhập {{label}}.', { label })).regex(/^\d+$/, t('{{label}} phải là số nguyên không âm.', { label }))
const boundedInteger = (label: string, min: number, max: number, t: SettingsTranslator) => nonNegativeInteger(label, t).refine((value) => Number(value) >= min && Number(value) <= max, t('{{label}} phải từ {{min}} đến {{max}}.', { label, min, max }))
const schemaFor = (t: SettingsTranslator) => z.object({
  store_name: z.string().trim().min(1, t('Vui lòng nhập tên cửa hàng.')),
  store_logo: z.string(),
  store_favicon: z.string(),
  store_email: z.union([z.literal(''), z.email({ error: t('Vui lòng nhập email hợp lệ.') })]),
  store_phone: z.string().max(32, t('Số điện thoại không được vượt quá {{count}} ký tự.', { count: 32 })),
  store_address: z.string().max(500, t('Địa chỉ không được vượt quá {{count}} ký tự.', { count: 500 })),
  business_hours: z.string().max(500, t('Giờ làm việc không được vượt quá {{count}} ký tự.', { count: 500 })),
  default_shipping_fee: boundedInteger(t('phí vận chuyển mặc định'), 0, 100000000, t),
  free_shipping_threshold: boundedInteger(t('ngưỡng miễn phí vận chuyển'), 0, 1000000000, t),
  low_stock_threshold: boundedInteger(t('ngưỡng tồn thấp'), 0, 100000, t),
  seo_title: z.string(), seo_description: z.string(), seo_og_image: z.string(), seo_analytics_id: z.string().regex(/^(|G-[A-Z0-9]{6,20})$/i, 'Nhập mã GA4 dạng G-XXXXXXXXXX hoặc để trống.'),
  social_facebook: z.string(), social_instagram: z.string(), social_tiktok: z.string(), social_zalo: z.string(), social_zalo_oa_id: z.string().regex(/^\d{0,32}$/, 'OA ID chỉ gồm tối đa 32 chữ số.'),
  payment_cod_enabled: z.boolean(), payment_bank_transfer_enabled: z.boolean(), payment_vnpay_enabled: z.boolean(), payment_momo_enabled: z.boolean(), payment_stripe_enabled: z.boolean(),
  payment_bank_bin: z.string().regex(/^$|^\d{6}$/, 'Mã BIN ngân hàng cần đúng 6 chữ số.'), payment_bank_name: z.string(), payment_bank_account: z.string(), payment_bank_holder: z.string(), payment_bank_note: z.string(),
  payment_cancel_unpaid_after_hours: boundedInteger(t('thời gian tự hủy đơn'), 0, 720, t),
  mail_from_name: z.string(),
  mail_from_address: z.union([z.literal(''), z.email({ error: t('Vui lòng nhập email hợp lệ.') })]),
  email_order_subject: z.string(), email_order_body: z.string(), email_shipment_subject: z.string(), email_shipment_body: z.string(),
  email_password_reset_subject: z.string(), email_password_reset_body: z.string(), email_invitation_subject: z.string(), email_invitation_body: z.string(),
  newsletter_welcome_coupon_code: z.string().max(64, t('Mã ưu đãi không được vượt quá 64 ký tự.')),
  new_order_alert_recipients: z.string(), low_stock_alert_recipients: z.string(), maintenance_enabled: z.boolean(), maintenance_message: z.string(), maintenance_expected_until: z.string(),
  password_min_length: boundedInteger(t('độ dài mật khẩu tối thiểu'), 8, 64, t),
  password_require_letter: z.boolean(), password_require_number: z.boolean(), password_require_special: z.boolean(), public_registration_enabled: z.boolean(),
  two_factor_required_roles: z.array(z.enum(['super_admin', 'admin', 'staff', 'sales_manager', 'warehouse_staff', 'customer_service', 'content_editor', 'accountant'])),
  session_duration_days: boundedInteger(t('thời hạn phiên'), 1, 90, t),
  login_max_attempts: boundedInteger(t('số lần đăng nhập tối đa'), 3, 20, t),
  password_max_age_days: boundedInteger(t('thời hạn mật khẩu'), 0, 3650, t),
  activity_retention_days: boundedInteger(t('thời hạn lưu nhật ký hoạt động'), 30, 3650, t),
  allow_non_expiring_api_tokens: z.boolean(),
  home_sections: z.array(z.object({ key: z.enum(homeSectionKeys), enabled: z.boolean() })).length(homeSectionKeys.length).refine((sections) => new Set(sections.map(({ key }) => key)).size === homeSectionKeys.length && sections.some(({ enabled }) => enabled), t('Danh sách khối trang chủ không hợp lệ.')),
  instagram_posts: z.array(z.object({ post_url: z.string().trim().url(t('Nhập liên kết bài đăng Instagram hợp lệ.')).regex(/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/i, t('Liên kết phải trỏ đến bài đăng hoặc reel Instagram.')), image_url: z.string().trim().url(t('Nhập URL ảnh hợp lệ.')).regex(/^https?:\/\//i, t('URL ảnh phải bắt đầu bằng HTTP hoặc HTTPS.')), alt: z.string().trim().min(1, t('Nhập mô tả ảnh.')).max(180, t('Mô tả ảnh tối đa 180 ký tự.')) })).max(6, t('Chỉ thêm tối đa 6 bài đăng.')),
})
type Form = z.infer<ReturnType<typeof schemaFor>>
const initial: Form = { store_name: '', store_logo: '', store_favicon: '', store_email: '', store_phone: '', store_address: '', business_hours: '', default_shipping_fee: '30000', free_shipping_threshold: '1500000', low_stock_threshold: '5', seo_title: '', seo_description: '', seo_og_image: '', seo_analytics_id: '', social_facebook: '', social_instagram: '', social_tiktok: '', social_zalo: '', social_zalo_oa_id: '', instagram_posts: [], payment_cod_enabled: true, payment_bank_transfer_enabled: false, payment_vnpay_enabled: false, payment_momo_enabled: false, payment_stripe_enabled: false, payment_bank_bin: '', payment_bank_name: '', payment_bank_account: '', payment_bank_holder: '', payment_bank_note: '', payment_cancel_unpaid_after_hours: '24', mail_from_name: 'Sarada', mail_from_address: '', email_order_subject: '', email_order_body: '', email_shipment_subject: '', email_shipment_body: '', email_password_reset_subject: '', email_password_reset_body: '', email_invitation_subject: '', email_invitation_body: '', newsletter_welcome_coupon_code: '', new_order_alert_recipients: '', low_stock_alert_recipients: '', maintenance_enabled: false, maintenance_message: 'Cửa hàng đang được bảo trì. Vui lòng quay lại sau.', maintenance_expected_until: '', password_min_length: '10', password_require_letter: true, password_require_number: true, password_require_special: false, password_max_age_days: '0', activity_retention_days: '365', public_registration_enabled: false, two_factor_required_roles: [], session_duration_days: '14', login_max_attempts: '5', allow_non_expiring_api_tokens: false, home_sections: defaultHomeSections }
type Data = Partial<Record<keyof Form, string | number | boolean | string[] | HomeSection[] | InstagramPost[] | null>> & { 'security.allow_non_expiring_api_tokens'?: boolean }
type SettingsData = Data & { timezone: string }
const editableSettings = (data: Data): Partial<Form> => Object.fromEntries(Object.keys(initial).filter((key) => key in data).map((key) => [key, data[key as keyof Form]])) as Partial<Form>
const normalize = (data: Data): Form => ({ ...initial, ...editableSettings(data), social_zalo_oa_id: String(data.social_zalo_oa_id ?? ''), allow_non_expiring_api_tokens: Boolean(data['security.allow_non_expiring_api_tokens']), default_shipping_fee: String(data.default_shipping_fee ?? initial.default_shipping_fee), free_shipping_threshold: String(data.free_shipping_threshold ?? initial.free_shipping_threshold), low_stock_threshold: String(data.low_stock_threshold ?? initial.low_stock_threshold), payment_cancel_unpaid_after_hours: String(data.payment_cancel_unpaid_after_hours ?? initial.payment_cancel_unpaid_after_hours), password_min_length: String(data.password_min_length ?? initial.password_min_length), password_max_age_days: String(data.password_max_age_days ?? initial.password_max_age_days), activity_retention_days: String(data.activity_retention_days ?? initial.activity_retention_days), session_duration_days: String(data.session_duration_days ?? initial.session_duration_days), login_max_attempts: String(data.login_max_attempts ?? initial.login_max_attempts), two_factor_required_roles: Array.isArray(data.two_factor_required_roles) ? data.two_factor_required_roles as Form['two_factor_required_roles'] : [], payment_cod_enabled: Boolean(data.payment_cod_enabled), payment_bank_transfer_enabled: Boolean(data.payment_bank_transfer_enabled), payment_vnpay_enabled: Boolean(data.payment_vnpay_enabled), payment_momo_enabled: Boolean(data.payment_momo_enabled), payment_stripe_enabled: Boolean(data.payment_stripe_enabled), maintenance_enabled: Boolean(data.maintenance_enabled), password_require_letter: Boolean(data.password_require_letter), password_require_number: Boolean(data.password_require_number), password_require_special: Boolean(data.password_require_special), public_registration_enabled: Boolean(data.public_registration_enabled), maintenance_expected_until: String(data.maintenance_expected_until ?? '') })

export function StoreSettingsPage({ apiUrl, accessToken, isOwner = false, section }: Props) {
  const { t } = useTranslation()
  const schema = useMemo(() => schemaFor(t), [t])
  const client = useQueryClient()
  const [notice, setNotice] = useState('')
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: initial })
  const instagramPosts = useFieldArray({ control: form.control, name: 'instagram_posts' })
  const { register, reset, handleSubmit, setValue, clearErrors, formState: { errors, isDirty } } = form
  const [mediaUploading, setMediaUploading] = useState<Record<'store_logo' | 'store_favicon' | 'seo_og_image', boolean>>({ store_logo: false, store_favicon: false, seo_og_image: false })
  const [mediaUploadErrors, setMediaUploadErrors] = useState<Record<'store_logo' | 'store_favicon' | 'seo_og_image', string>>({ store_logo: '', store_favicon: '', seo_og_image: '' })
  const mediaValues = useWatch({ control: form.control })
  const testRecipient = useWatch({ control: form.control, name: 'store_email' })
  const twoFactorRequiredRoles = useWatch({ control: form.control, name: 'two_factor_required_roles' })
  const homeSections = useWatch({ control: form.control, name: 'home_sections' })
  const changeHomeSections = (change: (sections: HomeSection[]) => HomeSection[]) => {
    const current = form.getValues('home_sections')
    setValue('home_sections', change(current), { shouldDirty: true, shouldValidate: true })
  }
  const allowNonExpiringApiTokens = useWatch({ control: form.control, name: 'allow_non_expiring_api_tokens' })
  useUnsavedFormGuard(isDirty)
  const settings = useQuery({ queryKey: ['admin', 'settings'], queryFn: async () => {
    const response = await adminApiFetch(`${apiUrl}/admin/settings`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json() as { data?: SettingsData; message?: string }
    if (!response.ok || !body.data) throw new Error(t('Không thể tải cài đặt.'))
    return body.data
  }, enabled: Boolean(accessToken) })
  useEffect(() => { if (settings.data) reset(normalize(settings.data)) }, [settings.data, reset])
  const uploadSettingImage = async (field: 'store_logo' | 'store_favicon' | 'seo_og_image', files: File[]) => {
    const file = files[0]
    if (!file) return
    setMediaUploading((current) => ({ ...current, [field]: true }))
    setMediaUploadErrors((current) => ({ ...current, [field]: '' }))
    const body = new FormData()
    body.append('file', file)
    try {
      const response = await adminApiFetch(`${apiUrl}/admin/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }, body })
      const result = await response.json() as { data?: { url?: string }; message?: string; errors?: Record<string, string[]> }
      if (!response.ok || !result.data?.url) throw createApiResponseError(result, response.status, t('Không thể tải ảnh lên.'))
      setValue(field, result.data.url, { shouldDirty: true, shouldValidate: true })
      clearErrors(field)
    } catch (cause) {
      setMediaUploadErrors((current) => ({ ...current, [field]: cause instanceof Error ? cause.message : t('Không thể tải ảnh lên.') }))
    } finally {
      setMediaUploading((current) => ({ ...current, [field]: false }))
    }
  }
  const save = useMutation({ mutationFn: async (values: Form) => {
    const payload: Record<string, unknown> = { ...values, default_shipping_fee: Number(values.default_shipping_fee), free_shipping_threshold: Number(values.free_shipping_threshold), low_stock_threshold: Number(values.low_stock_threshold), payment_cancel_unpaid_after_hours: Number(values.payment_cancel_unpaid_after_hours), password_min_length: Number(values.password_min_length), password_max_age_days: Number(values.password_max_age_days), activity_retention_days: Number(values.activity_retention_days), session_duration_days: Number(values.session_duration_days), login_max_attempts: Number(values.login_max_attempts) }
    if (!isOwner) {
      delete payload.allow_non_expiring_api_tokens
      delete payload.password_max_age_days
    }
    if (Object.values(payload).some((value) => typeof value === 'number' && (!Number.isInteger(value) || value < 0))) throw new Error(t("Các số tiền và ngưỡng tồn phải là số nguyên không âm."))
    const response = await adminApiFetch(`${apiUrl}/admin/settings`, { method: 'PATCH', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json() as { data?: Data; message?: string; errors?: Record<string, string[]> }
    if (!response.ok || !body.data) {
      const errors = Object.fromEntries(Object.entries(body.errors ?? {}).map(([field, messages]) => [field, messages.map((message) => t(message))]))
      throw createApiResponseError({ message: t('Không thể lưu cài đặt.'), errors }, response.status, t('Không thể lưu cài đặt.'))
    }
    return body.data
  }, onError: (error) => { applyServerValidationErrors(form, error) }, onSuccess: (data) => { void client.invalidateQueries({ queryKey: ['admin', 'settings'] }); reset(normalize(data)); setNotice(t('Đã lưu cài đặt cửa hàng.')) } })
  const testEmail = useMutation({ mutationFn: async (template: 'order' | 'shipment' | 'password_reset' | 'invitation') => { const email = form.getValues('store_email'); if (!email) throw new Error(t('Nhập email nhận thử trong mục Email gửi trước.')); const response = await adminApiFetch(`${apiUrl}/admin/settings/test-email`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ email, template }) }); if (!response.ok) throw new Error(t('Không gửi được email thử.')); return t('Đã gửi email thử nghiệm.') }, onSuccess: (message) => setNotice(message) })
  if (settings.isLoading) return <section className="panel reference-page"><div className="shared-skeleton" role="status" aria-label={t("Đang tải cài đặt cửa hàng")} /></section>
  if (settings.error) return <section className="panel reference-page" role="alert"><p>{t('Không thể tải cài đặt.')}</p><button className="secondary" onClick={() => void settings.refetch()}>{t('Thử lại')}</button></section>
  const titles = { general: t("Cài đặt chung"), payments: t("Cài đặt thanh toán"), security: t("Bảo mật và đăng ký"), email: t("Email và thông báo"), seo: 'SEO', maintenance: t("Bảo trì cửa hàng") }
  return <section className="panel reference-page"><div className="panel-heading"><div><h2>{titles[section]}</h2><p>{section === 'payments' ? t("Bật phương thức thanh toán và cấu hình thông tin chuyển khoản.") : section === 'security' ? t("Kiểm soát đăng ký công khai, chính sách 2FA và thời hạn phiên.") : section === 'email' ? t("Cấu hình email người gửi, nội dung mẫu và địa chỉ nhận cảnh báo.") : section === 'seo' ? t("Thiết lập metadata mặc định và mã đo lường.") : section === 'maintenance' ? t("Tạm ẩn storefront khi cần bảo trì.") : t("Thông tin cửa hàng, vận chuyển và mạng xã hội.")}</p></div></div>{notice && <p role="status" className="reference-notice">{notice}</p>}
    <form className="reference-form store-settings-form" onSubmit={handleSubmit((values) => save.mutate(values))}>
      {section === 'general' && <>
      <h3>{t('Homepage sections')}</h3>
      <p className="payment-config-note" role="note">{t('Choose which homepage sections appear and change their order.')}</p>
      <ol className="home-section-settings">
        {homeSections.map((item, index) => <li key={item.key}>
          <label className="reference-checkbox"><input type="checkbox" checked={item.enabled} disabled={homeSections.filter((candidate) => candidate.enabled).length === 1 && item.enabled} onChange={(event) => changeHomeSections((sections) => sections.map((candidate) => candidate.key === item.key ? { ...candidate, enabled: event.target.checked } : candidate))} /> {t(homeSectionLabels[item.key])}</label>
          <div>
            <button type="button" className="secondary" aria-label={t('Move {{section}} up', { section: t(homeSectionLabels[item.key]) })} disabled={index === 0} onClick={() => changeHomeSections((sections) => { const next = [...sections]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next })}>↑</button>
            <button type="button" className="secondary" aria-label={t('Move {{section}} down', { section: t(homeSectionLabels[item.key]) })} disabled={index === homeSections.length - 1} onClick={() => changeHomeSections((sections) => { const next = [...sections]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next })}>↓</button>
          </div>
        </li>)}
      </ol>
      <h3>{t("Thông tin chung")}</h3>
      <div className="reference-form-grid">
        <FormField id="store_name" label={t("Tên cửa hàng")} required error={errors.store_name?.message}><input id="store_name" {...register('store_name')} /></FormField>
        <FormField id="store_logo" label={t("Đường dẫn logo")} error={errors.store_logo?.message}><input id="store_logo" type="url" {...register('store_logo')} /></FormField>
        <ImageUploader label={t('Tải logo lên')} helperText={t('JPG, PNG hoặc WebP, tối đa 2 MB. Ảnh được lưu trong thư viện media của API.')} onFiles={(files) => void uploadSettingImage('store_logo', files)} multiple={false} disabled={mediaUploading.store_logo} error={mediaUploadErrors.store_logo} />
        {mediaValues.store_logo && <img className="store-settings-media-preview" src={mediaUrl(apiUrl, String(mediaValues.store_logo))} alt={t('Xem trước logo cửa hàng')} onError={(event) => { event.currentTarget.hidden = true }} />}
        <FormField id="store_favicon" label={t("Đường dẫn favicon")} error={errors.store_favicon?.message}><input id="store_favicon" type="url" {...register('store_favicon')} /></FormField>
        <ImageUploader label={t('Tải favicon lên')} helperText={t('JPG, PNG hoặc WebP, tối đa 2 MB.')} onFiles={(files) => void uploadSettingImage('store_favicon', files)} multiple={false} disabled={mediaUploading.store_favicon} error={mediaUploadErrors.store_favicon} />
        {mediaValues.store_favicon && <img className="store-settings-media-preview is-icon" src={mediaUrl(apiUrl, String(mediaValues.store_favicon))} alt={t('Xem trước favicon cửa hàng')} onError={(event) => { event.currentTarget.hidden = true }} />}
        <FormField id="store_email" label={t("Email")} error={errors.store_email?.message}><input id="store_email" type="email" {...register('store_email')} /></FormField>
        <FormField id="store_phone" label={t("Điện thoại")} error={errors.store_phone?.message}><input id="store_phone" {...register('store_phone')} /></FormField>
        <FormField id="store_address" label={t("Địa chỉ")} error={errors.store_address?.message}><input id="store_address" {...register('store_address')} /></FormField>
        <FormField id="business_hours" label={t("Giờ làm việc")} error={errors.business_hours?.message}><input id="business_hours" placeholder={t("Thứ 2–Thứ 7: 08:00–21:00")} {...register('business_hours')} /></FormField>
        <FormField id="store_timezone" label={t("Múi giờ (chỉ đọc)")}><input id="store_timezone" value={settings.data?.timezone ?? ''} readOnly /></FormField>
        <FormField id="store_currency" label={t("Tiền tệ (chỉ đọc)")}><input id="store_currency" value="VND" readOnly /></FormField>
      </div>
      <h3>{t("Vận chuyển và tồn kho")}</h3>
      <div className="reference-form-grid">
        <MoneyInput label={t("Phí vận chuyển mặc định (VND)")} required error={errors.default_shipping_fee?.message} {...register('default_shipping_fee')} />
        <MoneyInput label={t("Miễn phí vận chuyển từ (VND)")} required error={errors.free_shipping_threshold?.message} {...register('free_shipping_threshold')} />
        <FormField id="low_stock_threshold" label={t("Ngưỡng tồn thấp mặc định cho biến thể mới")} required error={errors.low_stock_threshold?.message}><input id="low_stock_threshold" type="number" min="0" step="1" {...register('low_stock_threshold')} /></FormField>
      </div>
      <h3>{t("SEO và mạng xã hội")}</h3>
      <div className="reference-form-grid">
        <FormField id="seo_title" label={t("Tiêu đề SEO")} error={errors.seo_title?.message}><input id="seo_title" {...register('seo_title')} /></FormField>
        <FormField id="seo_description" label={t("Mô tả SEO")} error={errors.seo_description?.message} className="reference-wide"><textarea id="seo_description" rows={2} {...register('seo_description')} /></FormField>
        <FormField id="social_facebook" label="Facebook" error={errors.social_facebook?.message}><input id="social_facebook" type="url" {...register('social_facebook')} /></FormField>
        <FormField id="social_instagram" label="Instagram" error={errors.social_instagram?.message}><input id="social_instagram" type="url" {...register('social_instagram')} /></FormField>
        <FormField id="social_tiktok" label="TikTok" error={errors.social_tiktok?.message}><input id="social_tiktok" type="url" {...register('social_tiktok')} /></FormField>
        <FormField id="social_zalo" label="Zalo" error={errors.social_zalo?.message}><input id="social_zalo" type="url" {...register('social_zalo')} /></FormField>
        <FormField id="social_zalo_oa_id" label="Zalo OA ID" error={errors.social_zalo_oa_id?.message}><input id="social_zalo_oa_id" inputMode="numeric" maxLength={32} {...register('social_zalo_oa_id')} /><small>Mã Official Account dùng cho nút chia sẻ Zalo trên trang sản phẩm.</small></FormField>
      </div>
      <h3>{t('Bài đăng Instagram trên trang chủ')}</h3>
      <p className="payment-config-note" role="note">{t('Chọn tối đa 6 bài đăng công khai. Dán URL ảnh đã tải lên thư viện media và URL bài đăng Instagram; storefront không tự lấy dữ liệu từ Instagram.')}</p>
      <div className="instagram-post-settings">
        {instagramPosts.fields.map((field, index) => <fieldset className="instagram-post-settings__item" key={field.id}>
          <legend>{t('Bài đăng {{number}}', { number: index + 1 })}</legend>
          <FormField id={`instagram-post-${index}-url`} label={t('URL bài đăng Instagram')} error={errors.instagram_posts?.[index]?.post_url?.message}><input type="url" {...register(`instagram_posts.${index}.post_url`)} placeholder="https://www.instagram.com/p/..." /></FormField>
          <FormField id={`instagram-image-${index}-url`} label={t('URL ảnh')} error={errors.instagram_posts?.[index]?.image_url?.message}><input type="url" {...register(`instagram_posts.${index}.image_url`)} placeholder="https://..." /></FormField>
          <FormField id={`instagram-image-${index}-alt`} label={t('Mô tả ảnh')} error={errors.instagram_posts?.[index]?.alt?.message}><input {...register(`instagram_posts.${index}.alt`)} maxLength={180} /></FormField>
          <button type="button" className="secondary" onClick={() => instagramPosts.remove(index)}>{t('Xóa bài đăng')}</button>
        </fieldset>)}
        {instagramPosts.fields.length < 6 && <button type="button" className="secondary" onClick={() => instagramPosts.append({ post_url: '', image_url: '', alt: '' })}>{t('Thêm bài đăng Instagram')}</button>}
      </div>
      </>}
      {section === 'seo' && <>
        <h3>{t("SEO mặc định")}</h3><div className="reference-form-grid">
          <FormField id="seo_title" label={t("Tiêu đề mặc định")} error={errors.seo_title?.message}><input id="seo_title" {...register('seo_title')} /></FormField>
          <FormField id="seo_description" label={t("Mô tả mặc định")} error={errors.seo_description?.message} className="reference-wide"><textarea id="seo_description" rows={3} {...register('seo_description')} /></FormField>
          <FormField id="seo_og_image" label={t("Ảnh chia sẻ (Open Graph)")} error={errors.seo_og_image?.message}><input id="seo_og_image" type="url" {...register('seo_og_image')} /></FormField>
          <ImageUploader label={t('Tải ảnh chia sẻ lên')} helperText={t('JPG, PNG hoặc WebP, tối đa 2 MB.')} onFiles={(files) => void uploadSettingImage('seo_og_image', files)} multiple={false} disabled={mediaUploading.seo_og_image} error={mediaUploadErrors.seo_og_image} />
          {mediaValues.seo_og_image && <img className="store-settings-media-preview is-og" src={mediaUrl(apiUrl, String(mediaValues.seo_og_image))} alt={t('Xem trước ảnh chia sẻ Open Graph')} onError={(event) => { event.currentTarget.hidden = true }} />}
          <FormField id="seo_analytics_id" label={t("Mã Google Analytics / đo lường")} hint={t("Mã GA4 dạng G-XXXXXXXXXX. Storefront chỉ nạp tracker sau khi khách đồng ý cookie phân tích.")} error={errors.seo_analytics_id?.message}><input id="seo_analytics_id" placeholder="G-XXXXXXXXXX" {...register('seo_analytics_id')} /></FormField>
        </div>
      </>}
      {section === 'email' && <>
        <h3>{t("Người gửi và người nhận cảnh báo")}</h3><div className="reference-form-grid">
          <FormField id="mail_from_name" label={t("Tên người gửi")} error={errors.mail_from_name?.message}><input id="mail_from_name" {...register('mail_from_name')} /></FormField>
          <FormField id="mail_from_address" label={t("Email người gửi")} error={errors.mail_from_address?.message}><input id="mail_from_address" type="email" {...register('mail_from_address')} /></FormField>
          <FormField id="store_email" label={t("Email nhận email thử")} error={errors.store_email?.message}><input id="store_email" type="email" {...register('store_email')} /></FormField>
          <FormField id="new_order_alert_recipients" label={t("Nhận cảnh báo đơn mới (các email, cách nhau bằng dấu phẩy)")} error={errors.new_order_alert_recipients?.message}><textarea {...register('new_order_alert_recipients')} rows={2} /></FormField>
          <FormField id="newsletter_welcome_coupon_code" label={t("Mã chào mừng cho người đăng ký nhận tin")} hint={t("Để trống nếu chưa có mã. Chỉ mã đang hoạt động trong Khuyến mãi mới được gửi.")} error={errors.newsletter_welcome_coupon_code?.message}><input id="newsletter_welcome_coupon_code" {...register('newsletter_welcome_coupon_code')} /></FormField><FormField id="low_stock_alert_recipients" label={t("Nhận cảnh báo tồn thấp (các email, cách nhau bằng dấu phẩy)")} error={errors.low_stock_alert_recipients?.message}><textarea {...register('low_stock_alert_recipients')} rows={2} /></FormField>
        </div>
        {(['order', 'shipment', 'password_reset', 'invitation'] as const).map((kind) => { const labels = { order: t("Xác nhận đơn hàng"), shipment: t("Thông báo giao hàng"), password_reset: t("Đặt lại mật khẩu"), invitation: t("Lời mời nhân viên") }; const subject = `email_${kind}_subject` as keyof Form; const body = `email_${kind}_body` as keyof Form; return <div key={kind}><h3>{labels[kind]}</h3><div className="reference-form-grid"><FormField id={subject} label={t("Tiêu đề email")}><input id={subject} {...register(subject)} /></FormField><FormField id={body} label={t("Nội dung (dùng biến trong mẫu)")} className="reference-wide"><textarea id={body} rows={4} {...register(body)} /></FormField><button type="button" className="secondary" disabled={testEmail.isPending || isDirty || !testRecipient} onClick={() => testEmail.mutate(kind)}>{t("Gửi thử mẫu này")}</button></div></div> })}
        {testEmail.error && <p role="alert" className="reference-error">{testEmail.error.message}</p>}
        <p className="payment-config-note" role="note">{t("Biến mẫu hỗ trợ:")} {'{store_name}, {customer_name}, {order_code}, {order_total}, {tracking_code}, {role}, {expires_at}, {reset_url}, {invite_url}.'}</p>
        <p className="payment-config-note" role="note">{t("Email thử dùng mẫu đã lưu và gửi tới địa chỉ nhận thử ở trên; hãy lưu thay đổi trước khi gửi. Mẫu xác nhận đơn, giao hàng, đặt lại mật khẩu và lời mời đều có thể gửi thử. Email xác nhận đơn và cập nhật vận chuyển cũng được gửi theo luồng tương ứng.")}</p>
      </>}
      {section === 'maintenance' && <>
        <h3>{t("Chế độ bảo trì storefront")}</h3><div className="reference-form-grid">
          <label className="reference-checkbox reference-wide"><input type="checkbox" {...register('maintenance_enabled')} />  {t("Bật bảo trì và hiển thị thông báo cho khách")}</label>
          <FormField id="maintenance_message" label={t("Thông báo bảo trì")} error={errors.maintenance_message?.message} className="reference-wide"><textarea id="maintenance_message" rows={3} {...register('maintenance_message')} /></FormField>
          <FormField id="maintenance_expected_until" label={t("Dự kiến hoạt động lại")} error={errors.maintenance_expected_until?.message}><input id="maintenance_expected_until" type="datetime-local" {...register('maintenance_expected_until')} /></FormField>
        </div>
        <p className="payment-config-note" role="note">{t("Chế độ này chỉ chặn giao diện storefront; trang quản trị và API vẫn hoạt động.")}</p>
      </>}
      {section === 'payments' && <>
      <h3>{t("Phương thức thanh toán")}</h3>
      <div className="reference-form-grid">
        <label className="reference-checkbox"><input type="checkbox" {...register('payment_cod_enabled')} /> COD<FieldErrorText message={errors.payment_cod_enabled?.message} /></label>
        <label className="reference-checkbox"><input type="checkbox" {...register('payment_bank_transfer_enabled')} />  {t("Chuyển khoản")}<FieldErrorText message={errors.payment_bank_transfer_enabled?.message} /></label>
        <label className="reference-checkbox"><input type="checkbox" {...register('payment_vnpay_enabled')} /> VNPay<FieldErrorText message={errors.payment_vnpay_enabled?.message} /></label>
        <label className="reference-checkbox"><input type="checkbox" {...register('payment_momo_enabled')} /> MoMo<FieldErrorText message={errors.payment_momo_enabled?.message} /></label>
        <label className="reference-checkbox"><input type="checkbox" {...register('payment_stripe_enabled')} /> Stripe<FieldErrorText message={errors.payment_stripe_enabled?.message} /></label>
        <p className="payment-config-note reference-wide" role="note">{t("Chuyển khoản/QR dùng VietQR để tạo mã và cần cửa hàng đối soát thủ công trước khi xác nhận đã thanh toán. VNPay, MoMo và Stripe hiện chỉ lưu công tắc cấu hình, chưa xử lý giao dịch; khóa cổng thanh toán phải được cấu hình trong")} <code>.env</code>.</p>
        <label>{t("Mã BIN ngân hàng (6 chữ số)")} <input inputMode="numeric" maxLength={6} {...register('payment_bank_bin')} /><FieldErrorText message={errors.payment_bank_bin?.message} /></label>
        <label>{t("Tên ngân hàng")} <input {...register('payment_bank_name')} /><FieldErrorText message={errors.payment_bank_name?.message} /></label>
        <label>{t("Số tài khoản")} <input {...register('payment_bank_account')} /><FieldErrorText message={errors.payment_bank_account?.message} /></label>
        <label>{t("Chủ tài khoản")} <input {...register('payment_bank_holder')} /><FieldErrorText message={errors.payment_bank_holder?.message} /></label>
        <label className="reference-wide">{t("Nội dung chuyển khoản mẫu")} <input {...register('payment_bank_note')} /><FieldErrorText message={errors.payment_bank_note?.message} /></label>
        <FormField id="payment_cancel_unpaid_after_hours" label={t("Tự hủy đơn chuyển khoản chưa thanh toán sau (giờ)")} required error={errors.payment_cancel_unpaid_after_hours?.message}><input id="payment_cancel_unpaid_after_hours" type="number" min="0" max="720" step="1" {...register('payment_cancel_unpaid_after_hours')} /></FormField>
        <p className="payment-config-note reference-wide" role="note">{t("Đặt 0 để tắt. Chỉ áp dụng cho đơn không phải COD; hủy qua luồng trạng thái và hoàn lại tồn kho/mã giảm giá.")}</p>
      </div>
      </>}
      {section === 'security' && <>
      <h3>{t("Đăng ký tài khoản")}</h3>
      <div className="reference-form-grid">
        <label className="reference-checkbox reference-wide"><input type="checkbox" {...register('public_registration_enabled')} />  {t("Cho phép khách hàng tự đăng ký tài khoản")}<FieldErrorText message={errors.public_registration_enabled?.message} /></label>
        <p className="payment-config-note reference-wide" role="note">{t("Mặc định tắt. Khi tắt, endpoint đăng ký công khai từ storefront sẽ bị từ chối.")}</p>
      </div>
      <h3>{t("Xác thực hai bước bắt buộc")}</h3>
      <div className="reference-form-grid">
        {([{ value: 'super_admin', label: t('Chủ cửa hàng') }, ...adminRoleOptions] as const).map((role) => <label className="reference-checkbox" key={role.value}><input type="checkbox" checked={twoFactorRequiredRoles.includes(role.value)} onChange={(event) => { const current = form.getValues('two_factor_required_roles'); form.setValue('two_factor_required_roles', event.target.checked ? [...current, role.value] : current.filter((item) => item !== role.value), { shouldDirty: true, shouldValidate: true }) }} /> {t(role.label)}</label>)}
        {errors.two_factor_required_roles?.message && <small role="alert" className="reference-error">{errors.two_factor_required_roles.message}</small>}
        <p className="payment-config-note reference-wide" role="note">{t("Chỉ áp dụng được khi mọi nhân viên đang hoạt động thuộc vai trò đã chọn đã bật 2FA trong tài khoản của họ. Đăng nhập sẽ yêu cầu mã xác thực.")}</p>
        {isOwner && <>
          <label className="reference-checkbox reference-wide"><input type="checkbox" checked={allowNonExpiringApiTokens} onChange={(event) => form.setValue('allow_non_expiring_api_tokens', event.target.checked, { shouldDirty: true })} />  {t("Cho phép nhân viên tạo API token không hết hạn")}</label>
        <p className="payment-config-note reference-wide" role="note">{t("Token không hết hạn làm tăng rủi ro nếu bị lộ. Chỉ bật khi tích hợp không thể tự gia hạn token.")}</p></>}
      </div>
      <h3>{t("Phiên đăng nhập và giới hạn thử")}</h3>
      <div className="reference-form-grid">
        <FormField id="session_duration_days" label={t("Thời hạn phiên (ngày)")} required error={errors.session_duration_days?.message}><input id="session_duration_days" type="number" min="1" max="90" step="1" {...register('session_duration_days')} /></FormField>
        <FormField id="login_max_attempts" label={t("Số lần đăng nhập tối đa mỗi phút")} required error={errors.login_max_attempts?.message}><input id="login_max_attempts" type="number" min="3" max="20" step="1" {...register('login_max_attempts')} /></FormField>
      </div>
      <h3>{t("Chính sách mật khẩu")}</h3>
      <div className="reference-form-grid">
        <FormField id="password_min_length" label={t("Độ dài tối thiểu")} required error={errors.password_min_length?.message}><input id="password_min_length" type="number" min="8" max="64" step="1" {...register('password_min_length')} /></FormField>
        <FormField id="password_max_age_days" label={t("Bắt buộc đổi mật khẩu sau (ngày)")} required error={errors.password_max_age_days?.message}><input id="password_max_age_days" type="number" min="0" max="3650" step="1" readOnly={!isOwner} {...register('password_max_age_days')} /></FormField>
        <FormField id="activity_retention_days" label={t('Giữ nhật ký hoạt động quản trị (ngày)')} required hint={t('Mặc định 365 ngày; nhật ký cũ hơn sẽ được dọn hằng ngày.')} error={errors.activity_retention_days?.message}><input id="activity_retention_days" type="number" min="30" max="3650" step="1" {...register('activity_retention_days')} /></FormField>
        <p className="payment-config-note reference-wide" role="note">{isOwner ? t("Chỉ chủ cửa hàng có thể đổi chính sách này. Đặt 0 để tắt; khi bật, tài khoản phải đổi mật khẩu khi đăng nhập sau hạn và được nhắc trước 14 ngày.") : t("Chính sách do chủ cửa hàng quản lý; 0 nghĩa là không áp dụng thời hạn đổi mật khẩu.")}</p>
        <label className="reference-checkbox"><input type="checkbox" {...register('password_require_letter')} />  {t("Bắt buộc có chữ cái")}</label>
        <label className="reference-checkbox"><input type="checkbox" {...register('password_require_number')} />  {t("Bắt buộc có chữ số")}</label>
        <label className="reference-checkbox"><input type="checkbox" {...register('password_require_special')} />  {t("Bắt buộc có ký tự đặc biệt")}</label>
        <p className="payment-config-note reference-wide" role="note">{t("Chính sách áp dụng cho đăng ký, đặt lại và đổi mật khẩu; mật khẩu nhân viên và lời mời luôn tối thiểu 10 ký tự.")}</p>
      </div>
      </>}
      {save.error && <p role="alert" className="reference-error">{t('Không thể lưu cài đặt.')}</p>}<div className="reference-form-actions"><button type="button" className="secondary" onClick={() => { if (settings.data) reset(normalize(settings.data)) }}>{t('Hủy thay đổi')}</button><button type="submit" className="primary" disabled={save.isPending || Object.values(mediaUploading).some(Boolean) || !isDirty}>{save.isPending ? t('Đang lưu...') : t('Lưu cài đặt')}</button></div>
    </form>
  </section>
}

function FieldErrorText({ message }: { message?: string }) {
  return message ? <small role="alert">{message}</small> : null
}
