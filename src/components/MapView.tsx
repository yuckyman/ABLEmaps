import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Place, Office } from '../types'

interface Props {
  places: Place[]
  office: Office | null
  routeCoords: [number, number][]
  selectedIndices: number[]
}

const officeIcon = L.divIcon({
  className: '',
  html: `<div style="background:#2563eb;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">O</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

const stopIcon = (index: number) =>
  L.divIcon({
    className: '',
    html: `<div style="background:#f59e0b;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${index}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

const defaultIcon = L.divIcon({
  className: '',
  html: `<div style="background:#6b7280;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})

function FitMap({ places, office, routeCoords }: { places: Place[]; office: Office | null; routeCoords: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = []
    if (office) points.push([office.lat, office.lng])
    for (const p of places) {
      if (p.latitude != null && p.longitude != null) {
        points.push([p.latitude, p.longitude])
      }
    }
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] })
    }
  }, [places, office, map])

  useEffect(() => {
    if (routeCoords.length > 1) {
      const bounds = L.latLngBounds(routeCoords)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [routeCoords, map])

  return null
}

export default function MapView({ places, office, routeCoords, selectedIndices }: Props) {
  return (
    <MapContainer
      center={[33.749, -84.388]}
      zoom={11}
      className="w-full h-full rounded-lg border border-gray-200"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitMap places={places} office={office} routeCoords={routeCoords} />

      {office && (
        <Marker position={[office.lat, office.lng]} icon={officeIcon}>
          <Popup>{office.name} (Start)</Popup>
        </Marker>
      )}

      {places.map((p, i) => {
        if (p.latitude == null || p.longitude == null) return null
        const isSelected = selectedIndices.includes(i)
        if (isSelected) {
          const order = selectedIndices.indexOf(i) + 1
          return (
            <Marker key={i} position={[p.latitude, p.longitude]} icon={stopIcon(order)}>
              <Popup><strong>{order}. </strong>{p.name}</Popup>
            </Marker>
          )
        }
        return (
          <Marker key={i} position={[p.latitude, p.longitude]} icon={defaultIcon}>
            <Popup>{p.name}</Popup>
          </Marker>
        )
      })}

      {routeCoords.length > 1 && (
        <Polyline
          key={`route-${routeCoords.length}-${routeCoords[0][0].toFixed(4)}`}
          positions={routeCoords}
          pathOptions={{ color: '#1d4ed8', weight: 6, opacity: 0.9 }}
        />
      )}
    </MapContainer>
  )
}
