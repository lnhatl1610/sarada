import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Search, X } from 'lucide-react'
import { FacebookShareButton } from 'react-share'
import { Button } from '../../components/ui/button'
import { BlogRequestError, useBlogList, type BlogPostCard, type BlogProduct, type useBlogPost } from './blog-api'
import { buttonVariants } from '../../components/ui/button-variants'
import { sanitizePageContent } from '../../lib/sanitize-page-content'
import { formatVnd } from '../../lib/money'
import { CatalogQuickView } from '../catalog/CatalogQuickView'
import { NewsletterForm } from '../home/NewsletterForm'
import '../../Catalog.css'
import './BlogPage.css'

type ArticleHeading = { id: string; title: string; level: number }

function prepareArticleContent(html: string): { html: string; headings: ArticleHeading[] } {
  const sanitized = sanitizePageContent(html)
  const document = new DOMParser().parseFromString(`<div id="article-content-root">${sanitized}</div>`, 'text/html')
  const root = document.getElementById('article-content-root')
  if (!root) return { html: '', headings: [] }

  const usedIds = new Set<string>()
  const headings = Array.from(root.querySelectorAll('h2, h3')).map((heading, index) => {
    const title = heading.textContent?.trim() ?? ''
    const baseId = title.toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `muc-${index + 1}`
    const base = `article-${baseId}`
    let id = base
    let suffix = 2
    while (usedIds.has(id)) id = `${base}-${suffix++}`
    usedIds.add(id)
    heading.id = id
    return { id, title, level: Number(heading.tagName.slice(1)) }
  }).filter((heading) => Boolean(heading.title))

  return { html: root.innerHTML, headings }
}

function ArticleCard({ post, featured = false }: { post: BlogPostCard; featured?: boolean }) {
  return <article className={featured ? 'blog-card blog-card--featured' : 'blog-card'}>
    <Link to={`/blog/${encodeURIComponent(post.slug)}`} className="blog-card__cover" aria-label={`Đọc bài: ${post.title}`}>
      {post.cover_image ? <img src={post.cover_image} alt={post.cover_alt || ''} loading="lazy" /> : <span aria-hidden="true">SARADA · TẠP CHÍ</span>}
    </Link>
    <div className="blog-card__copy"><p className="blog-eyebrow">{post.category_name}</p><h2><Link to={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</Link></h2><p>{post.excerpt}</p>{post.tags.length > 0 && <ul className="mb-3 flex flex-wrap gap-2" aria-label={`Tag bài viết: ${post.title}`}>{post.tags.map((tag) => <li key={tag.slug}><Link className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={`/blog?tag=${encodeURIComponent(tag.slug)}`}>{tag.name}</Link></li>)}</ul>}<div className="blog-card__meta">{post.author_name && <span>{post.author_name}</span>}{post.published_at && <time dateTime={post.published_at}>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(post.published_at))}</time>}<span>Khoảng {post.reading_minutes} phút đọc</span></div></div>
  </article>
}

function BlogSearchForm({ search, onSubmit }: { search: string; onSubmit: (value: string) => void }) {
  const [draft, setDraft] = useState(search)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(draft.trim())
  }

  return <form className="mx-auto mb-6 flex w-full max-w-2xl gap-2" role="search" aria-label="Tìm bài viết" onSubmit={submit}>
    <label className="sr-only" htmlFor="blog-search-input">Tìm trong tiêu đề, nội dung và chuyên mục</label>
    <input id="blog-search-input" className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="search" maxLength={120} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tìm bài viết…" />
    {draft && <Button className="size-11" variant="ghost" size="icon" type="button" aria-label="Xóa nội dung tìm kiếm" onClick={() => setDraft('')}><X aria-hidden="true" /></Button>}
    <Button className="size-11" variant="outline" size="icon" type="submit" aria-label="Tìm bài viết"><Search aria-hidden="true" /></Button>
  </form>
}

export function BlogPage({ query: detail, cartAddBusy, cartAddError, cartSyncLoading, onAddToCart }: {
  query: ReturnType<typeof useBlogPost>
  cartAddBusy: boolean
  cartAddError: string
  cartSyncLoading: boolean
  onAddToCart: (product: BlogProduct, variantId: number) => Promise<boolean>
}) {
  const [shareMessage, setShareMessage] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const urlQuery = new URLSearchParams(location.search)
  const category = urlQuery.get('category') ?? ''
  const tag = urlQuery.get('tag') ?? ''
  const search = urlQuery.get('q') ?? ''
  const page = Math.max(1, Number(urlQuery.get('page') ?? 1) || 1)
  const list = useBlogList(category, page, search, tag)
  const slug = location.pathname.startsWith('/blog/') ? decodeURIComponent(location.pathname.slice('/blog/'.length)) : ''
  const post = detail.data
  const articleContent = useMemo(() => prepareArticleContent(post?.content ?? ''), [post?.content])
  const missingArticle = detail.error instanceof BlogRequestError && detail.error.status === 404
  const blogIndexUrl = (next: { category?: string; q?: string; tag?: string; page?: number } = {}) => {
    const params = new URLSearchParams()
    const nextCategory = next.category ?? category
    const nextSearch = next.q ?? search
    const nextTag = next.tag ?? tag
    if (nextCategory) params.set('category', nextCategory)
    if (nextSearch) params.set('q', nextSearch)
    if (nextTag) params.set('tag', nextTag)
    if (next.page && next.page > 1) params.set('page', String(next.page))
    return params.size ? `/blog?${params.toString()}` : '/blog'
  }
  const copyArticleLink = async () => {
    setShareMessage('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable')
      await navigator.clipboard.writeText(window.location.href)
      setShareMessage('Đã sao chép liên kết bài viết.')
    } catch {
      setShareMessage('Không thể sao chép tự động. Hãy sao chép địa chỉ trên thanh trình duyệt.')
    }
  }
  const shareArticle = async () => {
    setShareMessage('')
    if (!navigator.share) {
      await copyArticleLink()
      return
    }
    try {
      await navigator.share({ title: post?.title, text: post?.excerpt || undefined, url: window.location.href })
      setShareMessage('Đã mở bảng chia sẻ.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareMessage('Không thể mở bảng chia sẻ. Bạn có thể sao chép liên kết bài viết.')
    }
  }

  if (slug) {
    if (detail.isPending) return <main className="container subpage blog-page"><p role="status">Đang tải bài viết…</p></main>
    if (detail.isError) return <main className="container subpage blog-page"><section className="blog-state"><h1>{missingArticle ? 'Không tìm thấy bài viết' : 'Chưa tải được bài viết'}</h1><p>{missingArticle ? 'Bài viết chưa được xuất bản hoặc đường dẫn không còn tồn tại.' : 'Kiểm tra kết nối rồi thử lại.'}</p>{missingArticle ? <Link to="/blog">Xem các bài viết</Link> : <button type="button" onClick={() => void detail.refetch()}>Thử lại</button>}</section></main>
    if (!post) return null
    return <main className="container subpage blog-page blog-article">
      <nav className="blog-breadcrumbs" aria-label="Điều hướng"><Link to="/blog">Tạp chí</Link><span aria-hidden="true">/</span><Link to={`/blog?category=${encodeURIComponent(post.category_slug)}`}>{post.category_name}</Link></nav>
      <header className="blog-article__header"><p className="blog-eyebrow">{post.category_name}</p><h1>{post.title}</h1><p className="blog-article__excerpt">{post.excerpt}</p><div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">{post.author_name && <span>Tác giả: {post.author_name}</span>}{post.author_name && post.published_at && <span aria-hidden="true">·</span>}{post.published_at && <time dateTime={post.published_at}>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(post.published_at))}</time>}<span aria-hidden="true">·</span><span>Khoảng {post.reading_minutes} phút đọc</span></div></header>
      {post.tags.length > 0 && <nav className="mb-8 flex flex-wrap justify-center gap-2" aria-label="Thẻ bài viết">{post.tags.map((tag) => <Link key={tag.slug} className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={`/blog?tag=${encodeURIComponent(tag.slug)}`}>{tag.name}</Link>)}</nav>}
      {post.cover_image && <img className="blog-article__cover" src={post.cover_image} alt={post.cover_alt || ''} />}
      <div className={articleContent.headings.length ? 'grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-12' : ''}>
        {Boolean(articleContent.headings.length) && <nav className="h-fit border-y border-border py-5 lg:sticky lg:top-24" aria-label="Mục lục bài viết">
          <h2 className="mb-3 text-base font-semibold">Trong bài viết</h2>
          <ul className="grid gap-2">{articleContent.headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? 'pl-4' : ''}><a className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`#${heading.id}`}>{heading.title}</a></li>)}</ul>
        </nav>}
        <article className="content-page-body blog-article__body min-w-0" dangerouslySetInnerHTML={{ __html: articleContent.html }} />
      </div>
      {post.author_name && post.author_bio && <section className="mx-auto mt-10 max-w-3xl border-t border-border pt-6" aria-label="Giới thiệu tác giả"><h2 className="mb-2 text-lg font-semibold">Về tác giả · {post.author_name}</h2><p className="text-muted-foreground">{post.author_bio}</p></section>}
      <section className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6" aria-label="Chia sẻ bài viết">
        <Button variant="outline" onClick={() => void copyArticleLink()}>Sao chép liên kết</Button>
        <Button variant="outline" onClick={() => void shareArticle()}>Chia sẻ qua ứng dụng</Button>
        <FacebookShareButton className={buttonVariants({ variant: 'outline' })} url={window.location.href} aria-label="Chia sẻ bài viết trên Facebook">Facebook</FacebookShareButton>
        {shareMessage && <p className="basis-full text-sm text-muted-foreground" role="status" aria-live="polite">{shareMessage}</p>}
      </section>
      {post.products?.length > 0 && <section className="blog-linked-products"><h2>Sản phẩm trong bài viết</h2><div>{post.products.map((product) => <article key={product.id}>
        <Link className="blog-linked-product__link" to={`/products/${encodeURIComponent(product.slug)}`}>
          <span className="blog-linked-product__image">{product.images?.[0]?.url && <img src={product.images[0].url} alt={product.images[0].alt || product.name} loading="lazy" />}</span>
          <strong>{product.name}</strong>
          <span className="blog-linked-product__price">{formatVnd(product.price)}{product.compare_at_price && product.compare_at_price > product.price && <> <del>{formatVnd(product.compare_at_price)}</del></>}</span>
        </Link>
        {product.variants?.length ? <CatalogQuickView product={product} busy={cartAddBusy} cartSyncLoading={cartSyncLoading} error={cartAddError} onAdd={onAddToCart} /> : null}
      </article>)}</div></section>}
      {(post.newer_post || post.older_post) && <nav className="mt-12 grid gap-4 border-y border-border py-6 sm:grid-cols-2" aria-label="Điều hướng bài viết theo thời gian">
        {post.newer_post ? <Link className="group min-w-0 rounded-md p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={`/blog/${encodeURIComponent(post.newer_post.slug)}`}><span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">← Bài mới hơn</span><strong className="line-clamp-2 text-foreground group-hover:underline">{post.newer_post.title}</strong></Link> : <span aria-hidden="true" />}
        {post.older_post ? <Link className="group min-w-0 rounded-md p-3 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={`/blog/${encodeURIComponent(post.older_post.slug)}`}><span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Bài cũ hơn →</span><strong className="line-clamp-2 text-foreground group-hover:underline">{post.older_post.title}</strong></Link> : <span aria-hidden="true" />}
      </nav>}
      {post.related_posts?.length > 0 && <section className="blog-related"><h2>Bài viết liên quan</h2><div>{post.related_posts.map((related) => <ArticleCard key={related.id} post={related} />)}</div></section>}
    </main>
  }

  const showFeatured = !search && !category && !tag && page === 1 && Boolean(list.data?.data.length)
  const featuredPost = showFeatured ? list.data?.data[0] : undefined
  const visiblePosts = featuredPost ? list.data?.data.slice(1) ?? [] : list.data?.data ?? []
  const hasActiveFilters = Boolean(search || category || tag)
  const popularPosts = list.data?.popular_posts ?? []

  return <main className="container subpage blog-page">
    <header className="blog-index-header"><p className="blog-eyebrow">SARADA · TẠP CHÍ</p><h1>Cảm hứng mặc đẹp</h1><p>Câu chuyện, gợi ý phối đồ và những lựa chọn cho tủ đồ mỗi ngày.</p></header>
    <BlogSearchForm key={location.search} search={search} onSubmit={(value) => navigate(blogIndexUrl({ q: value, page: 1 }))} />
    <nav className="blog-categories" aria-label="Danh mục bài viết"><button type="button" aria-pressed={!category} onClick={() => navigate(blogIndexUrl({ category: '', page: 1 }))}>Tất cả</button>{(list.data?.categories ?? []).map((item) => <button key={item.category_slug} type="button" aria-pressed={category === item.category_slug} onClick={() => navigate(blogIndexUrl({ category: item.category_slug, page: 1 }))}>{item.category_name}</button>)}</nav>
    {Boolean(list.data?.tags.length) && <nav className="blog-categories" aria-label="Lọc theo tag">{list.data!.tags.map((item) => <button key={item.slug} type="button" aria-pressed={tag === item.slug} onClick={() => navigate(blogIndexUrl({ tag: tag === item.slug ? '' : item.slug, page: 1 }))}>#{item.name}</button>)}</nav>}
    <div className="blog-content-layout">
      <div className="blog-content-layout__main">
        {list.isPending ? <p role="status" className="blog-state">Đang tải bài viết…</p> : list.isError ? <section className="blog-state" role="alert"><p>Chưa tải được danh sách bài viết.</p><button type="button" onClick={() => void list.refetch()}>Thử lại</button></section> : !list.data?.data.length ? <section className="blog-state"><h2>{search ? `Không tìm thấy bài viết phù hợp với “${search}”` : category ? 'Chưa có bài viết trong danh mục này' : tag ? 'Chưa có bài viết gắn tag này' : 'Chưa có bài viết'}</h2>{hasActiveFilters && <p>Thử từ khóa khác hoặc xóa bộ lọc để xem tất cả bài viết.</p>}<Button variant="outline" onClick={() => navigate('/blog')}>{hasActiveFilters ? 'Xóa bộ lọc' : 'Xem lại sau'}</Button></section> : <>
          {featuredPost && <section className="blog-featured" aria-label="Bài viết nổi bật"><ArticleCard post={featuredPost} featured /></section>}
          {visiblePosts.length > 0 && <section className="blog-grid" aria-label={search ? `Kết quả tìm kiếm: ${search}` : tag ? `Bài viết gắn tag ${tag}` : category ? 'Bài viết theo danh mục đã chọn' : 'Danh sách bài viết'}>{visiblePosts.map((item) => <ArticleCard key={item.id} post={item} />)}</section>}
          {list.data.meta.last_page > 1 && <nav className="blog-pagination" aria-label="Phân trang"><button type="button" disabled={page <= 1} onClick={() => navigate(blogIndexUrl({ page: page - 1 }))}>Bài mới hơn</button><span>Trang {page} / {list.data.meta.last_page}</span><button type="button" disabled={page >= list.data.meta.last_page} onClick={() => navigate(blogIndexUrl({ page: page + 1 }))}>Bài cũ hơn</button></nav>}
        </>}
      </div>
      <aside className="blog-sidebar" aria-label="Thông tin tạp chí">
        <section className="blog-sidebar__newsletter"><p className="blog-eyebrow">LÁ THƯ SARADA</p><h2>Ở lại cùng những điều mới.</h2><p>Nhận câu chuyện về bộ sưu tập, chất liệu và những thiết kế sắp ra mắt.</p><NewsletterForm storeName="Sarada" idPrefix="blog-newsletter" /></section>
        {popularPosts.length > 0 && <section className="blog-sidebar__recent"><h2>Đọc nhiều</h2><ul>{popularPosts.map((item) => <li key={item.id}><Link to={`/blog/${encodeURIComponent(item.slug)}`}>{item.title}</Link><span>{item.view_count.toLocaleString('vi-VN')} lượt đọc · {item.reading_minutes} phút</span></li>)}</ul></section>}
      </aside>
    </div>
  </main>
}
