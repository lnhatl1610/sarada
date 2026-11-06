import { Link } from 'react-router'

export type StorefrontBreadcrumbItem = { label: string; href?: string }

export function StorefrontBreadcrumbs({ items }: { items: StorefrontBreadcrumbItem[] }) {
  if (items.length < 2) return null

  return <nav className="storefront-breadcrumb-nav" aria-label="Điều hướng đường dẫn">
    <ol className="storefront-breadcrumbs">
      {items.map((item, index) => <li key={`${item.href ?? 'current'}-${index}`}>
        {index > 0 && <span className="storefront-breadcrumb-separator" aria-hidden="true">/</span>}
        {item.href && index < items.length - 1
          ? <Link to={item.href}>{item.label}</Link>
          : <span aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>}
      </li>)}
    </ol>
  </nav>
}
