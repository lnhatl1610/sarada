import { RotateCcw } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useRef, useState } from 'react'
import { defaultMenuLayout, menuGroupOptions, type MenuGroupId, type MenuLayout } from './menu-layout'
import { defaultAdminShortcuts, formatKeyboardShortcut, type AdminShortcuts } from '../../lib/keyboard-shortcuts'
import { formatVnd } from '../../lib/date-format'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '../../components/shared/confirm-dialog'
import '../../AdminPreferences.css'
import { clearLocalTableColumns, readLocalTableColumns, readTableRegistry } from '../../lib/table-column-preferences'
import { dashboardWidgetOptions, sidebarDestinationOptions, type DashboardWidgetId, type SidebarDestinationId } from './preferences-options'

export type AdminPreferences = {
  locale: 'vi' | 'en'
  theme: 'light' | 'dark' | 'system'
  accent: 'burgundy' | 'blue' | 'emerald' | 'violet' | 'teal' | 'amber'
  fontSize: 14 | 16 | 18
  zoom: 90 | 100 | 110 | 125
  showBreadcrumbs: boolean
  highContrast: boolean
  strongFocus: boolean
  dateFormat: 'dmy' | 'ymd' | 'relative'
  timeFormat: '24h' | '12h'
  numberLocale: 'vi-VN' | 'en-US'
  currencyPosition: 'suffix' | 'prefix'
  weekStart: 1 | 7
  dashboardDefaultPeriod: '7' | '30' | '90'
  dashboardComparePrevious: boolean
  rememberCollapsedGroups: boolean
  pinnedPages: SidebarDestinationId[]
  dashboardWidgets: DashboardWidgetId[]
  defaultLandingPage: SidebarDestinationId
  tableDensity: 'comfortable' | 'compact'
  tableColumnDefaults: Record<string, string[]>
  reduceMotion: boolean
  pageSize: 10 | 20 | 50 | 100
  sidebarCollapsed: boolean
  menuLayout: MenuLayout
  shortcuts: AdminShortcuts
  shortcutsEnabled: boolean
}

export type { MenuLayout } from './menu-layout'

type AdminPreferencesPageProps = {
  value: AdminPreferences
  userId: string | number
  permissions: string[]
  onChange: <Key extends keyof AdminPreferences>(key: Key, value: AdminPreferences[Key]) => void
  onReset: () => void
  onExportSettings: () => Promise<void>
  onImportSettings: (file: File) => Promise<void>
}

const themeOptions: { value: AdminPreferences['theme']; title: string; description: string }[] = [
  { value: 'light', title: 'Sáng', description: 'Nền sáng, dễ đọc trong môi trường nhiều ánh sáng.' },
  { value: 'dark', title: 'Tối', description: 'Nền tối, phù hợp môi trường thiếu sáng.' },
  { value: 'system', title: 'Theo thiết bị', description: 'Tự đổi theo cài đặt sáng/tối của hệ điều hành.' },
]

const accentOptions: { value: AdminPreferences['accent']; label: string; color: string }[] = [
  { value: 'burgundy', label: 'Đỏ rượu', color: '#7f2638' },
  { value: 'blue', label: 'Xanh lam', color: '#2457a7' },
  { value: 'emerald', label: 'Xanh lục', color: '#087a55' },
  { value: 'violet', label: 'Tím', color: '#7045a5' },
  { value: 'teal', label: 'Xanh ngọc', color: '#087e8b' },
  { value: 'amber', label: 'Hổ phách', color: '#a65d06' },
]

export function AdminPreferencesPage({ value, userId, permissions, onChange, onReset, onExportSettings, onImportSettings }: AdminPreferencesPageProps) {
  const { t } = useTranslation()
  const importFileRef = useRef<HTMLInputElement>(null)
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupMessage, setBackupMessage] = useState('')
  const [backupError, setBackupError] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const registeredTables = readTableRegistry(userId)
  const updateTableColumns = (tableId: string, columnId: string, visible: boolean) => {
    const entry = registeredTables.find((table) => table.id === tableId)
    if (!entry) return
    const current = value.tableColumnDefaults[tableId] ?? readLocalTableColumns(userId, tableId) ?? entry.columns.filter((column) => column.hideable).map((column) => column.id)
    const next = visible ? [...new Set([...current, columnId])] : current.filter((id) => id !== columnId)
    onChange('tableColumnDefaults', { ...value.tableColumnDefaults, [tableId]: next })
  }
  const availableLandingPages = sidebarDestinationOptions.filter((option) => option.permission === 'authenticated' || permissions.includes(option.permission))
  const defaultLandingSelection = availableLandingPages.some((option) => option.id === value.defaultLandingPage) ? value.defaultLandingPage : availableLandingPages[0]?.id ?? 'dashboard'
  const moveMenuGroup = (index: number, offset: -1 | 1) => {
    const target = index + offset
    if (target < 0 || target >= value.menuLayout.order.length) return
    const order = [...value.menuLayout.order]
    ;[order[index], order[target]] = [order[target], order[index]]
    onChange('menuLayout', { ...value.menuLayout, order })
  }
  const reorderMenuGroup = (source: MenuGroupId, target: MenuGroupId) => {
    if (source === target) return
    const order = [...value.menuLayout.order]
    const sourceIndex = order.indexOf(source)
    const targetIndex = order.indexOf(target)
    if (sourceIndex < 0 || targetIndex < 0) return
    order.splice(sourceIndex, 1)
    order.splice(targetIndex, 0, source)
    onChange('menuLayout', { ...value.menuLayout, order })
  }
  const exportSettings = async () => {
    setBackupBusy(true); setBackupMessage(''); setBackupError('')
    try { await onExportSettings(); setBackupMessage(t('Đã tải tệp sao lưu cài đặt.')) }
    catch (error) { setBackupError(error instanceof Error ? error.message : t('Không thể xuất cài đặt.')) }
    finally { setBackupBusy(false) }
  }
  const importSettings = async (file?: File) => {
    if (!file) return
    setImportFile(file)
  }
  const confirmImportSettings = async () => {
    if (!importFile) return
    setBackupBusy(true); setBackupMessage(''); setBackupError('')
    try { await onImportSettings(importFile); setBackupMessage(t('Đã nhập cài đặt. Đang tải lại giao diện…')); setImportFile(null) }
    catch (error) { setBackupError(error instanceof Error ? error.message : t('Không thể nhập cài đặt.')) }
    finally { setBackupBusy(false); if (importFileRef.current) importFileRef.current.value = ''; setImportFile(null) }
  }
  return <div className="admin-preferences-page">
    <section className="panel preferences-section" aria-labelledby="preferences-theme-title">
      <header className="preferences-section-heading">
        <div><h2 id="preferences-theme-title">{t('Giao diện')}</h2><p>{t('Thay đổi được áp dụng ngay và lưu theo tài khoản.')}</p></div>
      </header>
      <fieldset className="preferences-theme-options">
        <legend>{t('Chế độ màu')}</legend>
        {themeOptions.map((option) => <label className={`preference-choice${value.theme === option.value ? ' selected' : ''}`} key={option.value}>
          <input type="radio" name="admin-theme-preference" value={option.value} checked={value.theme === option.value} onChange={() => onChange('theme', option.value)} />
          <span><strong>{t(option.title)}</strong><small>{t(option.description)}</small></span>
        </label>)}
      </fieldset>
      <fieldset className="preferences-accent-options">
        <legend>{t('Màu nhấn')}</legend>
        <div>{accentOptions.map((option) => <label className={`preference-accent${value.accent === option.value ? ' selected' : ''}`} key={option.value}>
          <input type="radio" name="admin-accent-preference" value={option.value} checked={value.accent === option.value} onChange={() => onChange('accent', option.value)} />
          <span className="preference-accent-swatch" style={{ '--preference-accent-color': option.color } as CSSProperties} aria-hidden="true" />
          <span>{t(option.label)}</span>
        </label>)}</div>
      </fieldset>
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-language-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-language-title">{t('Ngôn ngữ')}</h2><p>{t('Thay đổi được áp dụng ngay và lưu theo tài khoản.')}</p></div></header>
      <label className="preferences-page-size">{t('Ngôn ngữ')}<select value={value.locale} onChange={(event) => onChange('locale', event.target.value as AdminPreferences['locale'])}><option value="vi">{t('Tiếng Việt')}</option><option value="en">{t('Tiếng Anh')}</option></select></label>
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-display-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-display-title">{t('Hiển thị')}</h2><p>{t('Điều chỉnh kích thước và thông tin điều hướng trong khu vực quản trị.')}</p></div></header>
      <label className="preferences-page-size">{t('Cỡ chữ')}<select value={value.fontSize} onChange={(event) => onChange('fontSize', Number(event.target.value) as AdminPreferences['fontSize'])}><option value={14}>{t('Nhỏ')} · 14px</option><option value={16}>{t('Vừa')} · 16px</option><option value={18}>{t('Lớn')} · 18px</option></select></label>
      <label className="preferences-page-size">{t('Thu phóng giao diện')}<select value={value.zoom} onChange={(event) => onChange('zoom', Number(event.target.value) as AdminPreferences['zoom'])}><option value={90}>90%</option><option value={100}>100%</option><option value={110}>110%</option><option value={125}>125%</option></select></label>
      <label className="preference-toggle"><input type="checkbox" checked={value.showBreadcrumbs} onChange={(event) => onChange('showBreadcrumbs', event.target.checked)} /><span><strong>{t('Hiện đường dẫn điều hướng')}</strong><small>{t('Ẩn hoặc hiện breadcrumb ở đầu trang.')}</small></span></label>
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-format-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-format-title">{t('Định dạng')}</h2><p>{t('Chọn cách hiển thị thời gian, ngày và giá trị tiền trên admin.')}</p></div></header>
      <label className="preferences-page-size">{t('Ngày')}<select value={value.dateFormat} onChange={(event) => onChange('dateFormat', event.target.value as AdminPreferences['dateFormat'])}><option value="dmy">DD/MM/YYYY</option><option value="ymd">YYYY-MM-DD</option><option value="relative">{t('Tương đối')}</option></select></label>
      <label className="preferences-page-size">{t('Giờ')}<select value={value.timeFormat} onChange={(event) => onChange('timeFormat', event.target.value as AdminPreferences['timeFormat'])}><option value="24h">24 {t('giờ')}</option><option value="12h">12 {t('giờ')}</option></select></label>
      <label className="preferences-page-size">{t('Dấu phân cách số')}<select value={value.numberLocale} onChange={(event) => onChange('numberLocale', event.target.value as AdminPreferences['numberLocale'])}><option value="vi-VN">1.234.567</option><option value="en-US">1,234,567</option></select></label>
      <label className="preferences-page-size">{t('Vị trí ký hiệu tiền')}<select value={value.currencyPosition} onChange={(event) => onChange('currencyPosition', event.target.value as AdminPreferences['currencyPosition'])}><option value="suffix">1.234.567 ₫</option><option value="prefix">₫1,234,567</option></select></label>
      <label className="preferences-page-size">{t('Ngày đầu tuần')}<select value={value.weekStart} onChange={(event) => onChange('weekStart', Number(event.target.value) as AdminPreferences['weekStart'])}><option value={1}>{t('Thứ Hai')}</option><option value={7}>{t('Chủ nhật')}</option></select></label>
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-dashboard-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-dashboard-title">{t('Tổng quan')}</h2><p>{t('Lưu khoảng thời gian và cách so sánh mặc định cho dashboard.')}</p></div></header>
      <label className="preferences-page-size">{t('Khoảng thời gian mặc định')}<select value={value.dashboardDefaultPeriod} onChange={(event) => onChange('dashboardDefaultPeriod', event.target.value as AdminPreferences['dashboardDefaultPeriod'])}><option value="7">7 {t('ngày')}</option><option value="30">30 {t('ngày')}</option><option value="90">90 {t('ngày')}</option></select></label>
      <label className="preference-toggle"><input type="checkbox" checked={value.dashboardComparePrevious} onChange={(event) => onChange('dashboardComparePrevious', event.target.checked)} /><span><strong>{t('So sánh với kỳ trước')}</strong><small>{t('Hiển thị số liệu kỳ trước trên dashboard khi có dữ liệu.')}</small></span></label>
      <div className="preferences-sidebar-pins"><h3>{t('Widget hiển thị và thứ tự')} <small>{t('Kéo thả hoặc dùng nút lên/xuống.')}</small></h3>{dashboardWidgetOptions.filter((option) => !('permission' in option) || permissions.includes(option.permission)).map((option) => {
        const index = value.dashboardWidgets.indexOf(option.id)
        const checked = index >= 0
        return <div className="preferences-sidebar-pin" key={option.id} draggable={checked} onDragStart={(event) => event.dataTransfer.setData('text/plain', option.id)} onDragOver={(event) => { if (checked) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData('text/plain') as DashboardWidgetId; const widgets = [...value.dashboardWidgets]; const sourceIndex = widgets.indexOf(source); const targetIndex = widgets.indexOf(option.id); if (sourceIndex < 0 || targetIndex < 0) return; widgets.splice(sourceIndex, 1); widgets.splice(targetIndex, 0, source); onChange('dashboardWidgets', widgets) }}><label><input type="checkbox" checked={checked} onChange={(event) => onChange('dashboardWidgets', event.target.checked ? [...value.dashboardWidgets, option.id] : value.dashboardWidgets.filter((id) => id !== option.id))} />{t(option.label)}</label>{checked && <span><button type="button" className="text-button" aria-label={t('Đưa {{label}} lên', { label: t(option.label) })} disabled={index === 0} onClick={() => { const widgets = [...value.dashboardWidgets]; [widgets[index - 1], widgets[index]] = [widgets[index], widgets[index - 1]]; onChange('dashboardWidgets', widgets) }}>↑</button><button type="button" className="text-button" aria-label={t('Đưa {{label}} xuống', { label: t(option.label) })} disabled={index === value.dashboardWidgets.length - 1} onClick={() => { const widgets = [...value.dashboardWidgets]; [widgets[index + 1], widgets[index]] = [widgets[index], widgets[index + 1]]; onChange('dashboardWidgets', widgets) }}>↓</button></span>}</div>
      })}</div>
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-sidebar-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-sidebar-title">{t('Sidebar và điều hướng')}</h2><p>{t('Điều chỉnh cách menu chính được mở khi sử dụng.')}</p></div></header>
      <label className="preferences-page-size">{t('Trang mặc định sau đăng nhập')}<select value={defaultLandingSelection} onChange={(event) => onChange('defaultLandingPage', event.target.value as SidebarDestinationId)}>{availableLandingPages.map((option) => <option key={option.id} value={option.id}>{t(option.label)}</option>)}</select></label>
      <label className="preference-toggle"><input type="checkbox" checked={value.rememberCollapsedGroups} onChange={(event) => onChange('rememberCollapsedGroups', event.target.checked)} /><span><strong>{t('Ghi nhớ nhóm sidebar đã gấp')}</strong><small>{t('Lưu trạng thái nhóm menu riêng cho tài khoản này trên trình duyệt.')}</small></span></label>
      <div className="preferences-sidebar-pins"><h3>{t('Mục ghim ở đầu sidebar')} <small>{t('Tối đa 8 mục; kéo thả hoặc dùng nút lên/xuống để sắp xếp.')}</small></h3>{sidebarDestinationOptions.filter((option) => option.permission === 'authenticated' || permissions.includes(option.permission)).map((option) => {
        const index = value.pinnedPages.indexOf(option.id)
        const checked = index >= 0
        return <div className="preferences-sidebar-pin" key={option.id} draggable={checked} onDragStart={(event) => event.dataTransfer.setData('text/plain', option.id)} onDragOver={(event) => { if (checked) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData('text/plain') as SidebarDestinationId; const pages = [...value.pinnedPages]; const sourceIndex = pages.indexOf(source); const targetIndex = pages.indexOf(option.id); if (sourceIndex < 0 || targetIndex < 0) return; pages.splice(sourceIndex, 1); pages.splice(targetIndex, 0, source); onChange('pinnedPages', pages) }}><label><input type="checkbox" checked={checked} disabled={!checked && value.pinnedPages.length >= 8} onChange={(event) => onChange('pinnedPages', event.target.checked ? [...value.pinnedPages, option.id] : value.pinnedPages.filter((id) => id !== option.id))} />{t(option.label)}</label>{checked && <span><button type="button" className="text-button" aria-label={t('Đưa {{label}} lên', { label: t(option.label) })} disabled={index === 0} onClick={() => { const pages = [...value.pinnedPages]; [pages[index - 1], pages[index]] = [pages[index], pages[index - 1]]; onChange('pinnedPages', pages) }}>↑</button><button type="button" className="text-button" aria-label={t('Đưa {{label}} xuống', { label: t(option.label) })} disabled={index === value.pinnedPages.length - 1} onClick={() => { const pages = [...value.pinnedPages]; [pages[index + 1], pages[index]] = [pages[index], pages[index + 1]]; onChange('pinnedPages', pages) }}>↓</button></span>}</div>
      })}</div>
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-preview-title">
      <header className="preferences-section-heading">
        <div><h2 id="preferences-preview-title">{t('Xem trước')}</h2><p>{t('Minh họa trực tiếp chế độ màu, màu nhấn và mật độ bảng đang chọn.')}</p></div>
      </header>
      <div className="preferences-preview" data-density={value.tableDensity}>
        <div className="preferences-preview-toolbar">
          <div><span className="preferences-preview-indicator" aria-hidden="true" /><span><strong>{t('Tổng quan cửa hàng')}</strong><small>{t('Dữ liệu minh họa')}</small></span></div>
          <span className="preferences-preview-primary">{t('Tạo mới')}</span>
        </div>
        <div className="preferences-preview-metrics">
          <article><small>{t('DOANH THU')}</small><strong>{formatVnd(12_450_000)}</strong><span>{t('Tăng 8,4% so với kỳ trước')}</span></article>
          <article><small>{t('ĐƠN HÀNG')}</small><strong>28</strong><span>{t('6 đơn chờ xác nhận')}</span></article>
        </div>
        <div className="preferences-preview-table-wrap">
          <table aria-label={t('Bảng đơn hàng minh họa')}>
            <thead><tr><th>{t('Mã đơn')}</th><th>{t('Khách hàng')}</th><th>{t('Trạng thái')}</th><th>{t('Tổng tiền')}</th></tr></thead>
            <tbody>
              <tr><td>#DH-2048</td><td>{t('Nguyễn Minh Anh')}</td><td><span className="preferences-preview-status">{t('Đang xử lý')}</span></td><td>{formatVnd(1_250_000)}</td></tr>
              <tr><td>#DH-2047</td><td>{t('Trần Gia Hân')}</td><td><span className="preferences-preview-status is-complete">{t('Hoàn tất')}</span></td><td>{formatVnd(890_000)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-table-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-table-title">{t('Danh sách')}</h2><p>{t('Chọn mật độ phù hợp với cách bạn làm việc.')}</p></div></header>
      <fieldset className="preferences-density-options">
        <legend>{t('Mật độ bảng')}</legend>
        <label className={`preference-choice${value.tableDensity === 'comfortable' ? ' selected' : ''}`}><input type="radio" name="table-density" checked={value.tableDensity === 'comfortable'} onChange={() => onChange('tableDensity', 'comfortable')} /><span><strong>{t('Thoải mái')}</strong><small>{t('Khoảng cách rộng, dễ đọc từng dòng.')}</small></span></label>
        <label className={`preference-choice${value.tableDensity === 'compact' ? ' selected' : ''}`}><input type="radio" name="table-density" checked={value.tableDensity === 'compact'} onChange={() => onChange('tableDensity', 'compact')} /><span><strong>{t('Gọn')}</strong><small>{t('Hiển thị được nhiều dòng hơn trên màn hình.')}</small></span></label>
      </fieldset>
      <label className="preferences-page-size">{t('Số dòng mặc định mỗi trang')}<select value={value.pageSize} onChange={(event) => onChange('pageSize', Number(event.target.value) as AdminPreferences['pageSize'])}><option value={10}>10 {t('dòng')}</option><option value={20}>20 {t('dòng')}</option><option value={50}>50 {t('dòng')}</option><option value={100}>100 {t('dòng')}</option></select></label>
      <label className="preference-toggle"><input type="checkbox" checked={value.sidebarCollapsed} onChange={(event) => onChange('sidebarCollapsed', event.target.checked)} /><span><strong>{t('Thu gọn sidebar mặc định')}</strong><small>{t('Áp dụng cho lần mở khu quản trị tiếp theo.')}</small></span></label>
      <div className="preferences-sidebar-pins"><h3>{t('Cột mặc định theo bảng')} <small>{t('Cài đặt được đồng bộ theo tài khoản.')}</small></h3>
        {registeredTables.length === 0 ? <p>{t('Mở một trang danh sách để ghi nhận các bảng có thể tùy chỉnh.')}</p> : registeredTables.map((table) => {
          const visible = new Set(value.tableColumnDefaults[table.id] ?? readLocalTableColumns(userId, table.id) ?? table.columns.filter((column) => column.hideable).map((column) => column.id))
          const selectable = table.columns.filter((column) => column.hideable)
          const resetTable = () => {
            clearLocalTableColumns(userId, table.id)
            const remaining = Object.fromEntries(Object.entries(value.tableColumnDefaults).filter(([tableId]) => tableId !== table.id))
            onChange('tableColumnDefaults', remaining)
            window.dispatchEvent(new CustomEvent('fashion-admin-apply-saved-columns', { detail: { tableId: table.id, columns: selectable.map((column) => column.id) } }))
          }
          return <fieldset className="preferences-table-columns" key={table.id}><legend>{t(table.label)}</legend>
            {selectable.map((column) => <label key={column.id}><input type="checkbox" checked={visible.has(column.id)} onChange={(event) => updateTableColumns(table.id, column.id, event.target.checked)} />{t(column.label)}</label>)}
            {selectable.length === 0 && <small>{t('Bảng này không có cột có thể ẩn.')}</small>}
            <button className="text-button" type="button" onClick={resetTable}>{t('Hiện tất cả cột')}</button>
          </fieldset>
        })}
      </div>
    </section>

    <section className="panel preferences-section preferences-accessibility" aria-labelledby="preferences-accessibility-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-accessibility-title">{t('Trợ năng')}</h2><p>{t('Giảm chuyển động trang trí trong giao diện quản trị.')}</p></div></header>
      <label className="preference-toggle"><input type="checkbox" checked={value.highContrast} onChange={(event) => onChange('highContrast', event.target.checked)} /><span><strong>{t('Tương phản cao')}</strong><small>{t('Tăng độ tương phản của đường viền và nội dung phụ.')}</small></span></label>
      <label className="preference-toggle"><input type="checkbox" checked={value.strongFocus} onChange={(event) => onChange('strongFocus', event.target.checked)} /><span><strong>{t('Vòng focus đậm')}</strong><small>{t('Làm rõ vị trí bàn phím đang thao tác.')}</small></span></label>
      <label className="preference-toggle"><input type="checkbox" checked={value.reduceMotion} onChange={(event) => onChange('reduceMotion', event.target.checked)} /><span><strong>{t('Giảm hiệu ứng chuyển động')}</strong><small>{t('Tắt animation và transition không thiết yếu.')}</small></span></label>
      <label className="preference-toggle"><input type="checkbox" checked={value.shortcutsEnabled} onChange={(event) => onChange('shortcutsEnabled', event.target.checked)} /><span><strong>{t('Bật phím tắt')}</strong><small>{t('Tắt để tránh phím tắt gây ảnh hưởng khi bạn đang dùng trình đọc màn hình.')}</small></span></label>
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-backup-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-backup-title">{t('Sao lưu cài đặt')}</h2><p>{t('Xuất hoặc nhập tệp JSON phiên bản 1 cho tùy chọn giao diện của tài khoản.')}</p></div></header>
      <div className="preferences-backup-actions"><button className="secondary" type="button" disabled={backupBusy} onClick={() => void exportSettings()}>{t('Xuất JSON')}</button><button className="secondary" type="button" disabled={backupBusy} onClick={() => importFileRef.current?.click()}>{t('Nhập JSON')}</button><input ref={importFileRef} type="file" accept="application/json,.json" hidden onChange={(event) => void importSettings(event.target.files?.[0])} /></div>
      {backupBusy && <p role="status">{t('Đang xử lý tệp cài đặt…')}</p>}{backupMessage && <p role="status">{backupMessage}</p>}{backupError && <p className="field-error" role="alert">{backupError}</p>}
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-shortcuts-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-shortcuts-title">{t('Phím tắt')}</h2><p>{t('Chọn tổ hợp riêng cho các thao tác thường dùng. Ctrl cũng nhận phím Command trên macOS.')}</p></div></header>
      {([
        ['search', 'Mở tìm kiếm', ['ctrl+k', 'ctrl+shift+k', 'alt+k']],
        ['sidebar', 'Thu gọn hoặc mở sidebar', ['ctrl+b', 'ctrl+shift+b', 'alt+b']],
        ['lock', 'Khóa màn hình quản trị', ['ctrl+l', 'ctrl+shift+l', 'alt+l']],
        ['help', 'Mở bảng phím tắt', ['?', 'ctrl+shift+?', 'alt+?']],
      ] as const).map(([key, label, options]) => <label className="preferences-page-size" key={key}>{t(label)}<select value={value.shortcuts[key] || defaultAdminShortcuts[key]} disabled={!value.shortcutsEnabled} onChange={(event) => onChange('shortcuts', { ...value.shortcuts, [key]: event.target.value } as AdminShortcuts)}>{options.map((option) => <option key={option} value={option}>{formatKeyboardShortcut(option)}</option>)}</select></label>)}
    </section>

    <section className="panel preferences-section" aria-labelledby="preferences-menu-title">
      <header className="preferences-section-heading"><div><h2 id="preferences-menu-title">{t('Menu tài khoản')}</h2><p>{t('Ẩn hoặc sắp xếp nhóm bằng cách kéo thả hoặc dùng nút di chuyển. Đăng xuất luôn được giữ lại.')}</p></div></header>
      <div className="preferences-menu-groups" aria-label={t('Thứ tự nhóm trong menu tài khoản')}>
        {value.menuLayout.order.map((id, index) => {
          const group = menuGroupOptions.find((item) => item.id === id)
          if (!group) return null
          const hidden = value.menuLayout.hidden.includes(id)
          return <div key={id} className="preferences-menu-group" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id) }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); reorderMenuGroup(event.dataTransfer.getData('text/plain') as MenuGroupId, id) }}>
            <span className="preferences-menu-drag" aria-hidden="true">⠿</span><strong>{t(group.label)}</strong>
            <label><input type="checkbox" checked={!hidden} onChange={(event) => onChange('menuLayout', { ...value.menuLayout, hidden: event.target.checked ? value.menuLayout.hidden.filter((item) => item !== id) : [...value.menuLayout.hidden, id] })} /> {t('Hiện')}</label>
            <button className="secondary" type="button" aria-label={t('Di chuyển {{label}} lên', { label: t(group.label) })} disabled={index === 0} onClick={() => moveMenuGroup(index, -1)}>{t('Lên')}</button>
            <button className="secondary" type="button" aria-label={t('Di chuyển {{label}} xuống', { label: t(group.label) })} disabled={index === value.menuLayout.order.length - 1} onClick={() => moveMenuGroup(index, 1)}>{t('Xuống')}</button>
          </div>
        })}
      </div>
      <button className="secondary" type="button" onClick={() => onChange('menuLayout', defaultMenuLayout)}>{t('Đặt lại thứ tự menu')}</button>
    </section>

    <div className="preferences-reset-row"><p>{t('Các tùy chọn này không thay đổi dữ liệu cửa hàng hay tài khoản.')}</p><button className="secondary" type="button" onClick={onReset}><RotateCcw size={15} aria-hidden="true" /> {t('Khôi phục mặc định')}</button></div>
    <ConfirmDialog open={Boolean(importFile)} title={t('Thay thế tùy chọn giao diện?')} description={t('Nhập tệp này sẽ thay thế các tùy chọn giao diện đang lưu cho tài khoản.')} confirmLabel={t('Nhập cài đặt')} destructive={false} busy={backupBusy} onConfirm={() => void confirmImportSettings()} onOpenChange={(open) => { if (!open && !backupBusy) { setImportFile(null); if (importFileRef.current) importFileRef.current.value = '' } }} />
  </div>
}
