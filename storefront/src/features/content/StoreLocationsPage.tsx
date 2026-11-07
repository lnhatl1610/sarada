import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getLocationProvinces, getLocationWards, getStoreLocations, type StoreLocation } from './store-locations-api'
import './StoreLocationsPage.css'

const StoreLocationsMap = lazy(() => import('./StoreLocationsMap').then((module) => ({ default: module.StoreLocationsMap })))

type Coordinates = { latitude: number; longitude: number }

function distanceKm(a: Coordinates, b: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(b.latitude - a.latitude)
  const longitudeDelta = radians(b.longitude - a.longitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function StoreLocationsPage() {
  const [provinceCode, setProvinceCode] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [nearby, setNearby] = useState<Coordinates | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'loading-stores' | 'denied' | 'unavailable' | 'load-error'>('idle')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const locationRequestId = useRef(0)
  const provinces = useQuery({ queryKey: ['store-locations', 'provinces'], queryFn: ({ signal }) => getLocationProvinces(signal), staleTime: 60 * 60 * 1000 })
  const wards = useQuery({ queryKey: ['store-locations', 'wards', provinceCode], queryFn: ({ signal }) => getLocationWards(provinceCode, signal), enabled: Boolean(provinceCode), staleTime: 60 * 60 * 1000 })
  const locations = useInfiniteQuery({
    queryKey: ['storefront', 'store-locations', provinceCode, wardCode],
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) => getStoreLocations({ provinceCode: provinceCode || undefined, wardCode: wardCode || undefined, page: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.meta.current_page < lastPage.meta.last_page ? lastPage.meta.current_page + 1 : undefined,
  })
  const list = useMemo(() => locations.data?.pages.flatMap((result) => result.data) ?? [], [locations.data])
  const ordered = useMemo(() => nearby
    ? [...list].sort((a, b) => distanceKm(nearby, a) - distanceKm(nearby, b))
    : list,
  [list, nearby])
  const selected = ordered.find((location) => location.id === selectedId) ?? ordered[0]

  const changeProvince = (value: string) => {
    locationRequestId.current += 1
    setLocationStatus('idle')
    setProvinceCode(value)
    setWardCode('')
    setNearby(null)
    setSelectedId(null)
  }

  const changeWard = (value: string) => {
    locationRequestId.current += 1
    setLocationStatus('idle')
    setWardCode(value)
    setNearby(null)
    setSelectedId(null)
  }

  const clearNearby = () => {
    locationRequestId.current += 1
    setLocationStatus('idle')
    setNearby(null)
    setSelectedId(null)
  }

  const findNearby = () => {
    const requestId = ++locationRequestId.current
    if (!navigator.geolocation) {
      setLocationStatus('unavailable')
      return
    }
    setLocationStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestId !== locationRequestId.current) return
        setLocationStatus('loading-stores')
        void (async () => {
          let hasMore = locations.hasNextPage
          try {
            while (hasMore) {
              const result = await locations.fetchNextPage()
              if (requestId !== locationRequestId.current) return
              if (result.isError) {
                setLocationStatus('load-error')
                return
              }
              hasMore = result.hasNextPage
            }
            if (requestId !== locationRequestId.current) return
            setNearby({ latitude: coords.latitude, longitude: coords.longitude })
            setLocationStatus('idle')
            setSelectedId(null)
          } catch {
            if (requestId === locationRequestId.current) setLocationStatus('load-error')
          }
        })()
      },
      (error) => {
        if (requestId === locationRequestId.current) setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }

  return <div className="container subpage store-locations-page">
    <p className="eyebrow">ĐỊA ĐIỂM CỦA CHÚNG TÔI</p>
    <h1>Hệ thống cửa hàng</h1>
    <p className="store-locations-intro">Tìm địa chỉ, giờ mở cửa và đường đi đến cửa hàng gần bạn.</p>
    <div className="store-locations-controls">
      <label htmlFor="store-locations-province">Tỉnh / thành</label>
      <select id="store-locations-province" value={provinceCode} onChange={(event) => changeProvince(event.target.value)} disabled={provinces.isPending || provinces.isError}>
        <option value="">Tất cả tỉnh / thành</option>
        {provinces.data?.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
      </select>
      <label htmlFor="store-locations-ward">Xã / phường</label>
      <select id="store-locations-ward" value={wardCode} onChange={(event) => changeWard(event.target.value)} disabled={!provinceCode || wards.isPending || wards.isError}>
        <option value="">{!provinceCode ? 'Chọn tỉnh / thành trước' : wards.isPending ? 'Đang tải xã / phường…' : 'Tất cả xã / phường'}</option>
        {wards.data?.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}
      </select>
      <button className="button outline" type="button" disabled={locationStatus === 'requesting' || locationStatus === 'loading-stores' || locations.isPending} onClick={findNearby}>
        {locationStatus === 'requesting' ? 'Đang tìm vị trí…' : locationStatus === 'loading-stores' ? 'Đang tải danh sách cửa hàng…' : nearby ? 'Cập nhật cửa hàng gần tôi' : 'Gần tôi'}
      </button>
      {nearby && <button className="store-locations-clear-nearby" type="button" onClick={clearNearby}>Xóa sắp xếp theo vị trí</button>}
    </div>
    {locationStatus === 'denied' && <p className="store-locations-message" role="status">Bạn chưa cho phép truy cập vị trí. Hãy tiếp tục bằng cách chọn tỉnh / thành.</p>}
    {locationStatus === 'unavailable' && <p className="store-locations-message" role="status">Không xác định được vị trí trên thiết bị này. Bạn vẫn có thể lọc cửa hàng theo tỉnh / thành.</p>}
    {locationStatus === 'load-error' && <p className="store-locations-error" role="alert">Chưa tải đủ danh sách để sắp xếp cửa hàng theo khoảng cách. <button type="button" onClick={findNearby}>Thử lại</button></p>}
    {provinces.isError && <p className="store-locations-error" role="alert">Không tải được danh sách tỉnh / thành. <button type="button" onClick={() => void provinces.refetch()}>Thử lại</button></p>}
    {wards.isError && <p className="store-locations-error" role="alert">Không tải được danh sách xã / phường. <button type="button" onClick={() => void wards.refetch()}>Thử lại</button></p>}
    {locations.isPending ? <p className="store-locations-message" role="status">Đang tải cửa hàng…</p>
      : locations.isError ? <div className="store-locations-empty" role="alert"><h2>Chưa tải được danh sách cửa hàng</h2><p>{locations.error instanceof Error ? locations.error.message : 'Kiểm tra kết nối rồi thử lại.'}</p><button className="button dark" type="button" onClick={() => void locations.refetch()}>Thử lại</button></div>
      : ordered.length === 0 ? <div className="store-locations-empty"><h2>{provinceCode ? 'Chưa có cửa hàng tại khu vực này' : 'Thông tin cửa hàng đang được cập nhật'}</h2><p>{provinceCode ? 'Chọn tỉnh / thành khác để xem địa điểm.' : 'Hiện chưa có địa điểm nào được công bố.'}</p></div>
      : <div className="store-locations-layout">
        <section className="store-locations-list" aria-label="Danh sách cửa hàng">
          {ordered.map((location) => <StoreLocationCard key={location.id} location={location} selected={selected?.id === location.id} distance={nearby ? distanceKm(nearby, location) : null} onSelect={() => setSelectedId(location.id)} />)}
          {locations.hasNextPage && <button className="button outline" type="button" disabled={locations.isFetchingNextPage || locationStatus === 'loading-stores'} onClick={() => void locations.fetchNextPage()}>{locationStatus === 'loading-stores' || locations.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm cửa hàng'}</button>}
        </section>
        <section className="store-locations-map" aria-label="Bản đồ cửa hàng">
          <h2>{selected?.name}</h2>
          {selected ? <Suspense fallback={<p className="store-locations-map-loading" role="status">Đang tải bản đồ…</p>}><StoreLocationsMap selected={selected} locations={ordered} /></Suspense> : <p>Chọn cửa hàng để xem vị trí trên bản đồ.</p>}
          {selected && <a className="button dark" href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`} target="_blank" rel="noreferrer">Chỉ đường đến cửa hàng</a>}
        </section>
      </div>}
  </div>
}

function StoreLocationCard({ location, selected, distance, onSelect }: { location: StoreLocation; selected: boolean; distance: number | null; onSelect: () => void }) {
  return <article className={`store-location-card${selected ? ' is-selected' : ''}`}>
    <button className="store-location-card-select" type="button" aria-pressed={selected} onClick={onSelect}>
      <span className="eyebrow">{location.province_name}{location.ward_name ? ` · ${location.ward_name}` : ''}</span>
      <strong>{location.name}</strong>
      {distance !== null && <span className="store-location-distance">Cách bạn khoảng {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</span>}
    </button>
    <address>{location.address}</address>
    <p><span>Giờ mở cửa</span><br />{location.opening_hours}</p>
    {location.is_open_now !== null && <p><span>Trạng thái</span><br />{location.is_open_now ? 'Đang mở' : 'Đã đóng cửa'}</p>}
    <div className="store-location-card-links">
      <a href={`tel:${location.phone.replace(/[^\d+]/g, '')}`}>{location.phone}</a>
      {location.email && <a href={`mailto:${location.email}`}>Gửi email</a>}
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`} target="_blank" rel="noreferrer">Chỉ đường</a>
    </div>
  </article>
}
