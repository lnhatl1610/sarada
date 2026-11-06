import { useEffect, useRef } from 'react'
import { Link } from 'react-router'

type CategoryLink = { id: number; name: string; slug: string; children?: CategoryLink[] }
type CollectionLink = { id: number; name: string; slug: string }

type MobileNavigationSheetProps = {
  open: boolean
  categories: CategoryLink[]
  collections: CollectionLink[]
  storeName: string
  onClose: () => void
}

function leafCategories(categories: CategoryLink[]): CategoryLink[] {
  return categories.flatMap((category) => category.children?.length ? leafCategories(category.children) : category.slug === 'hang-moi' ? [] : [category])
}

export function MobileNavigationSheet({ open, categories, collections, storeName, onClose }: MobileNavigationSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return <dialog ref={dialogRef} id="storefront-mobile-menu" className="storefront-mobile-menu" aria-labelledby="storefront-mobile-menu-title" onClose={onClose} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close() }} onKeyDown={(event) => {
    if (event.key !== 'Tab') return

    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.closest('[hidden], [inert], [aria-hidden="true"]') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden')
    const first = focusable[0]
    const last = focusable.at(-1)

    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
      event.preventDefault()
      first?.focus()
    }
  }}>
    <div className="mobile-menu-heading"><h2 id="storefront-mobile-menu-title">Khám phá {storeName}</h2><button type="button" className="mobile-menu-close" aria-label="Đóng menu" onClick={() => dialogRef.current?.close()}>×</button></div>
    <Link className="mobile-menu-all" to="/products" onClick={onClose}>Tất cả sản phẩm</Link>
    <nav className="mobile-menu-links" aria-label="Khám phá"><h3>Khám phá</h3><Link to="/new-arrivals" onClick={onClose}>Hàng mới</Link><Link to="/best-sellers" onClick={onClose}>Bán chạy</Link><Link to="/sale" onClick={onClose}>Ưu đãi</Link><Link to="/brands" onClick={onClose}>Thương hiệu</Link><Link to="/collections" onClick={onClose}>Tất cả bộ sưu tập</Link></nav>
    <nav className="mobile-menu-links" aria-label="Danh mục sản phẩm">
      <h3>Danh mục</h3>
      {leafCategories(categories).map((category) => <Link key={category.id} to={`/categories/${encodeURIComponent(category.slug)}`} onClick={onClose}>{category.name}</Link>)}
    </nav>
    {collections.length > 0 && <nav className="mobile-menu-links" aria-label="Bộ sưu tập"><h3>Bộ sưu tập</h3>{collections.map((collection) => <Link key={collection.id} to={`/collections/${collection.slug}`} onClick={onClose}>{collection.name}</Link>)}</nav>}
    <div className="mobile-menu-account"><Link to="/account" onClick={onClose}>Tài khoản</Link><Link to="/cart" onClick={onClose}>Túi hàng</Link></div>
  </dialog>
}
