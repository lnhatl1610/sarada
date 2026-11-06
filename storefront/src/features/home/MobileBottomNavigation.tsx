import { Heart, House, Menu, Search, UserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router'

type Props = { categoriesOpen: boolean; onOpenCategories: () => void }

export function MobileBottomNavigation({ categoriesOpen, onOpenCategories }: Props) {
  return <nav className="storefront-bottom-navigation" aria-label="Điều hướng nhanh">
    <NavLink to="/" end aria-label="Trang chủ"><House aria-hidden="true" size={19} /><span>Trang chủ</span></NavLink>
    <button type="button" onClick={onOpenCategories} aria-label="Mở danh mục" aria-controls="storefront-mobile-menu" aria-expanded={categoriesOpen}><Menu aria-hidden="true" size={19} /><span>Danh mục</span></button>
    <NavLink to="/search" aria-label="Tìm kiếm"><Search aria-hidden="true" size={19} /><span>Tìm kiếm</span></NavLink>
    <NavLink to="/account/wishlist" aria-label="Yêu thích"><Heart aria-hidden="true" size={19} /><span>Yêu thích</span></NavLink>
    <Link to="/account" aria-label="Tài khoản"><UserRound aria-hidden="true" size={19} /><span>Tài khoản</span></Link>
  </nav>
}
