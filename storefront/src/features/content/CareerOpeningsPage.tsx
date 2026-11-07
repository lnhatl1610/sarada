import { useState } from 'react'
import type { useStorefrontContentPage } from './content-api'
import { StorefrontContentPageError } from './content-api'
import { sanitizePageContent } from '../../lib/sanitize-page-content'
import { useCareerOpenings } from './career-api'

export function CareerOpeningsPage({ query }: { query: ReturnType<typeof useStorefrontContentPage> }) {
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [page, setPage] = useState(1)
  const openings = useCareerOpenings(department, location, page)
  const pageNotFound = query.error instanceof StorefrontContentPageError && query.error.status === 404
  const lastPage = openings.data?.meta.last_page ?? 1

  function changeDepartment(value: string) {
    setDepartment(value)
    setPage(1)
  }

  function changeLocation(value: string) {
    setLocation(value)
    setPage(1)
  }

  return <div className="container subpage content-page-public grid gap-10">
    <header className="max-w-3xl">
      <h1>{query.data?.title ?? 'Cơ hội nghề nghiệp'}</h1>
      {query.data && <article className="content-page-body" dangerouslySetInnerHTML={{ __html: sanitizePageContent(query.data.content) }} />}
      {query.isPending && <p className="text-sm text-muted-foreground" role="status">Đang tải phần giới thiệu…</p>}
      {query.isError && !pageNotFound && <p className="text-sm text-muted-foreground" role="status">Phần giới thiệu chưa tải được. <button className="text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button" onClick={() => void query.refetch()}>Thử tải lại</button></p>}
    </header>

    <section className="grid gap-5" aria-labelledby="career-opening-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div><h2 className="text-2xl font-medium" id="career-opening-heading">Vị trí đang tuyển</h2><p className="mt-1 text-sm text-muted-foreground">{openings.data?.meta.total ?? 0} vị trí phù hợp</p></div>
        {(Boolean(openings.data?.filter_options.departments.length) || Boolean(openings.data?.filter_options.locations.length)) && <div className="flex flex-wrap gap-3">
          {Boolean(openings.data?.filter_options.departments.length) && <label className="grid gap-1 text-sm font-medium">Phòng ban<select className="min-h-11 min-w-48 rounded-md border border-input bg-background px-3 font-normal" value={department} onChange={(event) => changeDepartment(event.target.value)}><option value="">Tất cả phòng ban</option>{openings.data?.filter_options.departments.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>}
          {Boolean(openings.data?.filter_options.locations.length) && <label className="grid gap-1 text-sm font-medium">Địa điểm<select className="min-h-11 min-w-48 rounded-md border border-input bg-background px-3 font-normal" value={location} onChange={(event) => changeLocation(event.target.value)}><option value="">Tất cả địa điểm</option>{openings.data?.filter_options.locations.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>}
        </div>}
      </div>

      {openings.isPending ? <p className="py-6 text-sm text-muted-foreground" role="status">Đang tải vị trí tuyển dụng…</p>
        : openings.isError ? <div className="grid justify-items-start gap-2 py-6" role="alert"><p>Chưa tải được danh sách vị trí.</p><button className="min-h-11 text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button" onClick={() => void openings.refetch()}>Thử tải lại</button></div>
          : openings.data?.data.length ? <div className="divide-y divide-border">
            {openings.data.data.map((opening) => <details key={opening.id} className="group py-5">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <div><h3 className="text-lg font-medium group-open:text-primary">{opening.title}</h3><p className="mt-1 text-sm text-muted-foreground">{opening.department} · {opening.location} · {opening.employment_type === 'full_time' ? 'Toàn thời gian' : 'Bán thời gian'}</p>{opening.summary && <p className="mt-2 max-w-2xl text-sm leading-6">{opening.summary}</p>}</div>
                <span className="text-sm font-medium text-primary group-open:underline"><span className="group-open:hidden">Xem chi tiết</span><span className="hidden group-open:inline">Thu gọn</span></span>
              </summary>
              <div className="mt-5 grid max-w-3xl gap-5 pl-0 sm:pl-2">
                <section><h4 className="font-medium">Mô tả công việc</h4><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{opening.description}</p></section>
                {opening.requirements && <section><h4 className="font-medium">Yêu cầu</h4><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{opening.requirements}</p></section>}
                {opening.benefits && <section><h4 className="font-medium">Quyền lợi</h4><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">{opening.benefits}</p></section>}
              </div>
            </details>)}
          </div> : <div className="py-10 text-center"><h3 className="text-lg font-medium">{department || location ? 'Không có vị trí phù hợp với bộ lọc' : 'Hiện chưa có vị trí đang tuyển'}</h3><p className="mt-2 text-sm text-muted-foreground">{department || location ? 'Hãy thay đổi bộ lọc để xem các vị trí khác.' : 'Các cơ hội mới sẽ được cập nhật tại đây.'}</p>{(department || location) && <button className="mt-3 min-h-11 text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button" onClick={() => { changeDepartment(''); changeLocation('') }}>Xóa bộ lọc</button>}</div>}

      {openings.data && lastPage > 1 && <nav className="flex items-center justify-center gap-4" aria-label="Phân trang vị trí tuyển dụng"><button className="min-h-11 px-3 text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trang trước</button><span className="text-sm text-muted-foreground">Trang {page} / {lastPage}</span><button className="min-h-11 px-3 text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button" disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)}>Trang sau</button></nav>}
    </section>
  </div>
}
