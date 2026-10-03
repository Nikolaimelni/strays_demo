import { Circle, MapContainer } from 'react-leaflet';
import { Basemap } from './basemap.tsx';

interface SinglePinMapProps {
  lat: number;
  lng: number;
}

// The API rounds a public listing's coordinates to three decimals, so the point it hands
// back is up to about seventy metres from the real one. A pin would draw that as a fact.
// The circle is the honest shape, and it is wide enough to cover the rounding.
const RADIUS_M = 150;

// The circle is styled from CSS through the container's own class, not through
// pathOptions.className: leaflet only reads className when it creates the path,
// react-leaflet applies pathOptions afterwards with setStyle, and setStyle does
// not touch the class. It works in dev, where StrictMode mounts twice, and ships
// a leaflet-blue circle to production.
export const SinglePinMap = ({ lat, lng }: SinglePinMapProps) => (
  <MapContainer
    attributionControl={false}
    center={[lat, lng]}
    zoom={15}
    className="spot-map h-56 w-full rounded-sm border border-rule/15"
    scrollWheelZoom={false}
  >
    <Basemap />
    <Circle center={[lat, lng]} radius={RADIUS_M} />
  </MapContainer>
);
