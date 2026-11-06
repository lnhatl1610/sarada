import { Link } from 'react-router'

type StorefrontBrandProps = { name: string }

export function StorefrontBrand({ name }: StorefrontBrandProps) {
  return <Link className="logo storefront-brand" to="/" aria-label={name}>
    <img className="storefront-brand-image" src="/branding/net-studio-mark.png" alt="" aria-hidden="true" />
  </Link>
}
