import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { StoreLocation } from './store-locations-api'

function MapSelectionController({ selected }: { selected: StoreLocation }) {
  const map = useMap()

  useEffect(() => {
    map.setView([selected.latitude, selected.longitude], map.getZoom(), { animate: false })
  }, [map, selected.latitude, selected.longitude])

  return null
}

export function StoreLocationsMap({ selected, locations }: { selected: StoreLocation; locations: StoreLocation[] }) {
  const tileUrl = import.meta.env.VITE_STOREFRONT_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

  return <>
    <MapContainer className="store-locations-leaflet" style={{ height: 'min(55vh, 420px)', minHeight: 280, width: '100%' }} center={[selected.latitude, selected.longitude]} zoom={14} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url={tileUrl}
      />
      <MapSelectionController selected={selected} />
      {locations.map((location) => <CircleMarker
        key={location.id}
        center={[location.latitude, location.longitude]}
        radius={location.id === selected.id ? 9 : 6}
        pathOptions={{ color: '#3d3029', fillColor: location.id === selected.id ? '#9b6c3e' : '#f7f3ed', fillOpacity: 1, weight: 2 }}
      >
        <Popup>
          <strong>{location.name}</strong><br />
          {location.address}<br />
          <a href={`tel:${location.phone.replace(/[^\d+]/g, '')}`}>{location.phone}</a>
        </Popup>
      </CircleMarker>)}
    </MapContainer>
    <p className="store-locations-map-attribution">Bản đồ © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">Báo lỗi bản đồ</a></p>
  </>
}
