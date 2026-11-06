import { Link, useLocation, useNavigate } from 'react-router'
import { BlogRequestError, useBlogList, type BlogPostCard, type useBlogPost } from './blog-api'
import { sanitizePageContent } from '../../lib/sanitize-page-content'
import './BlogPage.css'

function ArticleCard({ post }: { post: BlogPostCard }) {
  return <article className="blog-card">
    <Link to={`/blog/${encodeURIComponent(post.slug)}`} className="blog-card__cover" aria-label={`Đọc bài: ${post.title}`}>
      {post.cover_image ? <img src={post.cover_image} alt={post.cover_alt || ''} loading="lazy" /> : <span aria-hidden="true">SARADA · TẠP CHÍ</span>}
    </Link>
    <div className="blog-card__copy"><p className="blog-eyebrow">{post.category_name}</p><h2><Link to={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</Link></h2><p>{post.excerpt}</p>{post.published_at && <time dateTime={post.published_at}>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(post.published_at))}</time>}</div>
  </article>
}

export function BlogPage({ query: detail }: { query: ReturnType<typeof useBlogPost> }) {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search)
  const category = query.get('category') ?? ''
  const page = Math.max(1, Number(query.get('page') ?? 1) || 1)
  const list = useBlogList(category, page)
  const slug = location.pathname.startsWith('/blog/') ? decodeURIComponent(location.pathname.slice('/blog/'.length)) : ''
  const post = detail.data
  const missingArticle = detail.error instanceof BlogRequestError && detail.error.status === 404

  if (slug) {
    if (detail.isPending) return <main className="container subpage blog-page"><p role="status">Đang tải bài viết…</p></main>
    if (detail.isError) return <main className="container subpage blog-page"><section className="blog-state"><h1>{missingArticle ? 'Không tìm thấy bài viết' : 'Chưa tải được bài viết'}</h1><p>{missingArticle ? 'Bài viết chưa được xuất bản hoặc đường dẫn không còn tồn tại.' : 'Kiểm tra kết nối rồi thử lại.'}</p>{missingArticle ? <Link to="/blog">Xem các bài viết</Link> : <button type="button" onClick={() => void detail.refetch()}>Thử lại</button>}</section></main>
    if (!post) return null
    return <main className="container subpage blog-page blog-article">
      <nav className="blog-breadcrumbs" aria-label="Điều hướng"><Link to="/blog">Tạp chí</Link><span aria-hidden="true">/</span><Link to={`/blog?category=${encodeURIComponent(post.category_slug)}`}>{post.category_name}</Link></nav>
      <header className="blog-article__header"><p className="blog-eyebrow">{post.category_name}</p><h1>{post.title}</h1><p className="blog-article__excerpt">{post.excerpt}</p>{post.published_at && <time dateTime={post.published_at}>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(post.published_at))}</time>}</header>
      {post.cover_image && <img className="blog-article__cover" src={post.cover_image} alt={post.cover_alt || ''} />}
      <article className="content-page-body blog-article__body" dangerouslySetInnerHTML={{ __html: sanitizePageContent(post.content) }} />
      {post.products?.length > 0 && <section className="blog-linked-products"><h2>Sản phẩm trong bài viết</h2><div>{post.products.map((product) => <Link key={product.id} to={`/products/${encodeURIComponent(product.slug)}`}><span>{product.images?.[0]?.url && <img src={product.images[0].url} alt={product.images[0].alt || product.name} loading="lazy" />}</span><strong>{product.name}</strong></Link>)}</div></section>}
      {post.related_posts?.length > 0 && <section className="blog-related"><h2>Bài viết liên quan</h2><div>{post.related_posts.map((related) => <ArticleCard key={related.id} post={related} />)}</div></section>}
    </main>
  }

  return <main className="container subpage blog-page">
    <header className="blog-index-header"><p className="blog-eyebrow">SARADA · TẠP CHÍ</p><h1>Cảm hứng mặc đẹp</h1><p>Câu chuyện, gợi ý phối đồ và những lựa chọn cho tủ đồ mỗi ngày.</p></header>
    <nav className="blog-categories" aria-label="Danh mục bài viết"><button type="button" aria-pressed={!category} onClick={() => navigate('/blog')}>Tất cả</button>{(list.data?.categories ?? []).map((item) => <button key={item.category_slug} type="button" aria-pressed={category === item.category_slug} onClick={() => navigate(`/blog?category=${encodeURIComponent(item.category_slug)}`)}>{item.category_name}</button>)}</nav>
    {list.isPending ? <p role="status" className="blog-state">Đang tải bài viết…</p> : list.isError ? <section className="blog-state" role="alert"><p>Chưa tải được danh sách bài viết.</p><button type="button" onClick={() => void list.refetch()}>Thử lại</button></section> : !list.data?.data.length ? <section className="blog-state"><h2>Chưa có bài viết trong danh mục này</h2><button type="button" onClick={() => navigate('/blog')}>Xem tất cả bài viết</button></section> : <>
      <section className="blog-grid" aria-label="Danh sách bài viết">{list.data.data.map((item) => <ArticleCard key={item.id} post={item} />)}</section>
      {list.data.meta.last_page > 1 && <nav className="blog-pagination" aria-label="Phân trang"><button type="button" disabled={page <= 1} onClick={() => navigate(`/blog?${new URLSearchParams({ ...(category ? { category } : {}), page: String(page - 1) })}`)}>Bài mới hơn</button><span>Trang {page} / {list.data.meta.last_page}</span><button type="button" disabled={page >= list.data.meta.last_page} onClick={() => navigate(`/blog?${new URLSearchParams({ ...(category ? { category } : {}), page: String(page + 1) })}`)}>Bài cũ hơn</button></nav>}
    </>}
  </main>
}
