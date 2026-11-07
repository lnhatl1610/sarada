import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ResponsiveImage } from '../../components/shared/ResponsiveImage'
import { fetchRecentStorefrontReviews } from '../catalog/catalog-api'

export function HomeReviewRail() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const query = useQuery({
    queryKey: ['reviews', 'home'],
    queryFn: ({ signal }) => fetchRecentStorefrontReviews(signal),
  })
  const reviews = query.data?.data.slice(0, 3) ?? []
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit()
    const updateControls = () => {
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
    }
    updateControls()
    emblaApi.on('select', updateControls).on('reInit', updateControls)
    return () => { emblaApi.off('select', updateControls).off('reInit', updateControls) }
  }, [emblaApi, reviews.length])

  if (query.isLoading) return <section className="container home-review-rail" aria-labelledby="home-reviews-title" aria-busy="true">
    <h2 id="home-reviews-title">Cảm nhận từ khách hàng</h2>
    <div className="home-review-skeleton" aria-hidden="true"><span /><span /><span /></div>
    <p className="sr-only" role="status">Đang tải đánh giá…</p>
  </section>

  if (query.isError) return <section className="container home-review-rail" aria-labelledby="home-reviews-title">
    <h2 id="home-reviews-title">Cảm nhận từ khách hàng</h2>
    <div className="home-review-error" role="alert"><p>Chưa tải được đánh giá khách hàng.</p><button className="button dark" type="button" onClick={() => void query.refetch()}>Thử tải lại</button></div>
  </section>

  if (reviews.length === 0) return null

  return <section className="container home-review-rail" aria-labelledby="home-reviews-title">
    <div className="section-title"><h2 id="home-reviews-title">Cảm nhận từ khách hàng</h2><Link to="/products">Khám phá sản phẩm ↗</Link></div>
    <div className="home-review-carousel">
      {(canScrollPrev || canScrollNext) && <div className="home-review-controls" role="group" aria-label="Điều khiển đánh giá khách hàng">
        <button type="button" aria-label="Đánh giá trước" onClick={() => emblaApi?.scrollPrev()} disabled={!canScrollPrev}><ArrowLeft aria-hidden="true" size={18} /></button>
        <button type="button" aria-label="Đánh giá tiếp theo" onClick={() => emblaApi?.scrollNext()} disabled={!canScrollNext}><ArrowRight aria-hidden="true" size={18} /></button>
      </div>}
      <div className="home-review-viewport" ref={emblaRef} role="region" aria-roledescription="carousel" aria-label="Đánh giá mới nhất">
        <div className="home-review-track">
          {reviews.map((review, index) => {
            const image = review.images?.find((item) => item.media_type === 'image')
            const excerpt = review.content?.trim() || review.title?.trim()
            return <article className="home-review" key={review.id} role="group" aria-roledescription="slide" aria-label={`${index + 1} / ${reviews.length}`}>
          <p className="home-review-rating" aria-label={`${review.rating} trên 5 sao`}><span aria-hidden="true">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></p>
          {excerpt && <blockquote>{excerpt}</blockquote>}
          <div className="home-review-byline">
            {image && <ResponsiveImage src={image.url} alt={image.alt} width={56} height={56} loading="lazy" sizes="56px" />}
            <div><p>{review.customer?.name || 'Khách hàng'}</p>{review.verified_purchase && <small>Đã mua hàng</small>}{review.product?.slug ? <Link to={`/products/${encodeURIComponent(review.product.slug)}`}>{review.product.name}</Link> : review.product?.name && <small>{review.product.name}</small>}</div>
          </div>
          </article>
          })}
        </div>
      </div>
    </div>
  </section>
}
