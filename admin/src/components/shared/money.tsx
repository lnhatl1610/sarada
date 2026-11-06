import { forwardRef, type InputHTMLAttributes } from 'react'
import { FormField } from './form-field'

/* eslint-disable react-refresh/only-export-components -- formatting helper is intentionally colocated with money UI. */
export function formatVnd(amount: number) {
  return `${new Intl.NumberFormat('vi-VN').format(Math.trunc(amount))} ₫`
}

export function Money({ amount }: { amount: number }) {
  return <span>{formatVnd(amount)}</span>
}

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  error?: string
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput({ id, name, label, error, ...inputProps }, ref) {
  const inputId = id ?? name

  return <FormField id={inputId} label={label} error={error}>
    <input
      {...inputProps}
      id={inputId}
      name={name}
      ref={ref}
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      aria-invalid={Boolean(error)}
      aria-describedby={error && inputId ? `${inputId}-error` : undefined}
    />
  </FormField>
})
