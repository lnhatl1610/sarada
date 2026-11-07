import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { useBlogList } from '../content/blog-api'

const publishedDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' })

export function HomeLatestArticles() {
  const query = useBlogList('', 1)

  if (query.isLoading) return <section className="container home-journal" aria-labelledby="home-journal-title" aria-busy="true">
    <div className="section-title"><h2 id="home-journal-title">Tạp chí Sarada</h2></div>
    <div className="home-journal-skeleton" aria-hidden="true"><span /><span /><span /></div>
    <p className="sr-only" role="status">Đang tải bài viết…</p>
  </section>

  if (query.isError) return <section className="container home-journal" aria-labelledby="home-journal-title">
    <div className="section-title"><h2 id="home-journal-title">Tạp chí Sarada</h2></div>
    <div className="home-journal-error" role="alert"><p>Chưa tải được bài viết mới.</p><button className="button dark" type="button" onClick={() => void query.refetch()}>Thử tải lại</button></div>
  </section>

  const posts = query.data?.data.slice(0, 3) ?? []
  if (posts.length === 0) return null
  const [featured, ...remaining] = posts

  return <section className="container home-journal" aria-labelledby="home-journal-title">
    <div className="section-title"><h2 id="home-journal-title">Tạp chí Sarada</h2><Link to="/blog">Đọc tất cả ↗</Link></div>
    <div className="home-journal-layout">
      <article className="home-journal-feature">
        <Link className="home-journal-cover" to={`/blog/${encodeURIComponent(featured.slug)}`} aria-label={`Đọc bài: ${featured.title}`}>
          {featured.cover_image && <ResponsiveImage src={featured.cover_image} alt={featured.cover_alt || ''} width={1200} height={760} loading="lazy" sizes="(max-width: 760px) 100vw, 58vw" />}
        </Link>
        <div className="home-journal-feature-copy"><p>{featured.category_name}</p><h3><Link to={`/blog/${encodeURIComponent(featured.slug)}`}>{featured.title}</Link></h3><p>{featured.excerpt}</p>{featured.published_at && <time dateTime={featured.published_at}>{publishedDate.format(new Date(featured.published_at))}</time>}</div>
      </article>
      {remaining.length > 0 && <div className="home-journal-list" aria-label="Bài viết mới khác">{remaining.map((post) => <article className="home-journal-item" key={post.id}>
        <Link className="home-journal-item-cover" to={`/blog/${encodeURIComponent(post.slug)}`} aria-label={`Đọc bài: ${post.title}`}>
          {post.cover_image && <ResponsiveImage src={post.cover_image} alt={post.cover_alt || ''} width={360} height={440} loading="lazy" sizes="(max-width: 760px) 30vw, 15vw" />}
        </Link>
        <div><p>{post.category_name}</p><h3><Link to={`/blog/${encodeURIComponent(post.slug)}`}>{post.title}</Link></h3>{post.published_at && <time dateTime={post.published_at}>{publishedDate.format(new Date(post.published_at))}</time>}</div>
      </article>)}</div>}
    </div>
  </section>
}
