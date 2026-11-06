import { cloneElement, isValidElement, useId, useState, type InputHTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
  children?: ReactNode
  controlAction?: ReactNode
  showPasswordToggle?: boolean
  className?: string
}

export function FormField({ id, label, hint, error, required, children, controlAction, showPasswordToggle = true, className, ...inputProps }: FormFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const generatedId = useId()
  const inputId = id ?? inputProps.name ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  const childControl = children as ReactElement<InputHTMLAttributes<HTMLInputElement>>
  const passwordField = showPasswordToggle && (isValidElement(children) ? childControl.props.type === 'password' : inputProps.type === 'password')
  const control = isValidElement(children)
    ? cloneElement(childControl, {
      id: childControl.props.id ?? inputId,
      required: childControl.props.required ?? required,
      'aria-invalid': Boolean(error),
      'aria-describedby': [childControl.props['aria-describedby'], describedBy].filter(Boolean).join(' '),
      ...(passwordField ? { type: passwordVisible ? 'text' : 'password' } : {}),
    })
    : children ?? <input {...inputProps} id={inputId} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} type={passwordField ? (passwordVisible ? 'text' : 'password') : inputProps.type} />
  const action = controlAction ?? (passwordField ? <PasswordVisibilityToggle inputId={inputId} visible={passwordVisible} onToggle={() => setPasswordVisible((visible) => !visible)} /> : null)
  return <div className={['shared-form-field', className].filter(Boolean).join(' ')}>
    <label htmlFor={inputId}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {action ? <div className="shared-form-field-control">{control}{action}</div> : control}
    {hint && <small id={hintId}>{hint}</small>}
    {error && <small id={errorId} className="shared-field-error" role="alert">{error}</small>}
  </div>
}

export function PasswordVisibilityToggle({ inputId, visible, onToggle }: { inputId: string; visible: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  return <button
    className="shared-password-toggle"
    type="button"
    aria-label={visible ? t('Ẩn mật khẩu') : t('Hiện mật khẩu')}
    aria-controls={inputId}
    aria-pressed={visible}
    onClick={onToggle}
  >{visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button>
}

type FormSectionProps = { id?: string; title: string; description?: string; children: ReactNode }

export function FormSection({ id, title, description, children }: FormSectionProps) {
  return <section className="shared-form-section" id={id} aria-labelledby={id ? `${id}-title` : undefined}>
    <header><h2 id={id ? `${id}-title` : undefined}>{title}</h2>{description && <p>{description}</p>}</header>
    <div className="shared-form-section-content">{children}</div>
  </section>
}
