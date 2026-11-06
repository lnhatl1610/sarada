import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getApiErrorMessage } from '../../lib/http'
import { createPersonalDataExport, downloadPersonalDataExport, getPersonalDataExports } from './account-settings-api'

const labels = {
  queued: 'Đang chờ',
  running: 'Đang tạo tệp',
  ready: 'Sẵn sàng tải',
  failed: 'Tạo tệp thất bại',
  expired: 'Đã hết hạn',
} as const

export function PersonalDataExportPanel({ accessToken, customerId }: { accessToken: string; customerId: number | null }) {
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const queryKey = ['storefront-account-privacy-exports', customerId] as const
  const exports = useQuery({
    queryKey,
    queryFn: ({ signal }) => getPersonalDataExports(accessToken, signal),
    enabled: Boolean(accessToken && customerId),
    refetchInterval: (query) => query.state.data?.some((item) => item.status === 'queued' || item.status === 'running') ? 2500 : false,
  })
  const create = useMutation({
    mutationFn: () => createPersonalDataExport(accessToken),
    onSuccess: async (result) => {
      setError('')
      setNotice(result.message)
      await queryClient.invalidateQueries({ queryKey })
    },
    onError: (cause) => {
      setNotice('')
      setError(getApiErrorMessage(cause, 'Không thể yêu cầu xuất dữ liệu.'))
    },
  })

  async function download(id: number, url: string | null | undefined) {
    if (!url) return
    setError('')
    try {
      const blob = await downloadPersonalDataExport(accessToken, url)
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `fashion-store-personal-data-${id}.zip`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Tệp chưa sẵn sàng hoặc đã hết hạn. Hãy tải lại danh sách.'))
    }
  }

  return <section className="account-settings-card personal-data-export" aria-labelledby="personal-data-export-title">
    <h2 id="personal-data-export-title">Tải dữ liệu cá nhân</h2>
    <p>Tạo tệp ZIP gồm hồ sơ, tùy chọn tài khoản, công việc cá nhân và lịch sử đăng nhập/hoạt động. Tệp không chứa mật khẩu, token hoặc mã xác thực; liên kết tải có hiệu lực trong 7 ngày.</p>
    {notice && <p className="account-settings-message" role="status">{notice}</p>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="button dark" type="button" disabled={create.isPending} onClick={() => create.mutate()}>
      {create.isPending ? 'Đang gửi yêu cầu…' : 'Tạo bản sao dữ liệu'}
    </button>
    {exports.isPending && <p role="status">Đang tải danh sách yêu cầu…</p>}
    {exports.isError && <p role="alert">{getApiErrorMessage(exports.error, 'Không tải được danh sách yêu cầu.')}</p>}
    {exports.data && <div className="personal-data-export-list" aria-live="polite">
      {exports.data.map((item) => <article className="personal-data-export-row" key={item.id}>
        <div>
          <strong>{labels[item.status]}</strong>
          <small>Yêu cầu lúc {new Date(item.created_at).toLocaleString('vi-VN')} · {item.progress}%</small>
          {item.expires_at && item.status === 'ready' && <small>Liên kết hết hạn {new Date(item.expires_at).toLocaleString('vi-VN')}</small>}
          {item.error && <small role="alert">{item.error}</small>}
        </div>
        {item.status === 'ready' && <button className="button light" type="button" onClick={() => void download(item.id, item.download_url)}>Tải ZIP</button>}
      </article>)}
      {exports.data.length === 0 && <p>Bạn chưa yêu cầu xuất dữ liệu.</p>}
    </div>}
    {exports.isError && <button className="link-button" type="button" onClick={() => void exports.refetch()}>Thử tải lại</button>}
  </section>
}
