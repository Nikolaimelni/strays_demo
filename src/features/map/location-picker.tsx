import { MapContainer, Marker, useMapEvents } from 'react-leaflet';
import { Basemap } from './basemap.tsx';
import { plainPinIcon } from './pin-icon.ts';

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (position: { lat: number; lng: number }) => void;
}

const ClickToPlace = ({ onChange }: Pick<LocationPickerProps, 'onChange'>) => {
  useMapEvents({
    click: (event) => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
};

export const LocationPicker = ({ value, onChange }: LocationPickerProps) => (
  <MapContainer
    attributionControl={false}
    center={[value?.lat ?? 38.7223, value?.lng ?? -9.1393]}
    zoom={13}
    className="h-64 w-full rounded-sm border border-rule/15"
  >
    <Basemap />
    <ClickToPlace onChange={onChange} />
    {value ? <Marker position={[value.lat, value.lng]} icon={plainPinIcon()} /> : null}
  </MapContainer>
);
