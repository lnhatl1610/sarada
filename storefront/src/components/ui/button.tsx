import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonVariantProps } from './button-variants'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariantProps

function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { Button }
