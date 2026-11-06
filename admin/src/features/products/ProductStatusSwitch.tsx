import { useTranslation } from 'react-i18next'

type ProductStatusSwitchProps = {
  name: string
  status: string
  disabled?: boolean
  onChange: (active: boolean) => void
}

export function ProductStatusSwitch({ name, status, disabled = false, onChange }: ProductStatusSwitchProps) {
  const { t } = useTranslation()
  const active = status === 'active'
  const stateLabel = active ? t('Đang bán') : status === 'draft' ? t('Bản nháp') : status === 'archived' ? t('Lưu trữ') : t('Đang ẩn')

  return (
    <button
      type="button"
      className={`product-status-switch${active ? ' is-active' : ''}`}
      role="switch"
      aria-checked={active}
      aria-label={t('{{action}} sản phẩm {{name}}', { action: active ? t('Ẩn') : t('Hiển thị'), name })}
      aria-busy={disabled}
      disabled={disabled}
      onClick={() => onChange(!active)}
    >
      <span className="product-status-switch-track" aria-hidden="true">
        <span className="product-status-switch-thumb" />
      </span>
      <span className="product-status-switch-label">{disabled ? t('Đang lưu…') : stateLabel}</span>
    </button>
  )
}
