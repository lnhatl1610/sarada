import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: ReactNode
  description: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, eyebrow = 'NÉT STUDIO / 2026', actions }: PageHeaderProps) {
  return <header className="page-title">
    <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
    <div className="title-actions">{actions}</div>
  </header>
}
