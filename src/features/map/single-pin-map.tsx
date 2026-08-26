import { MapContainer, Marker } from 'react-leaflet';
import { Basemap } from './basemap.tsx';
import { plainPinIcon } from './pin-icon.ts';

interface SinglePinMapProps {
  lat: number;
  lng: number;
}

export const SinglePinMap = ({ lat, lng }: SinglePinMapProps) => (
  <MapContainer
    attributionControl={false}
    center={[lat, lng]}
    zoom={15}
    className="h-56 w-full rounded-sm border border-rule/15"
    scrollWheelZoom={false}
  >
    <Basemap />
    <Marker position={[lat, lng]} icon={plainPinIcon()} />
  </MapContainer>
);
