import { MapContainer, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useNavigate } from 'react-router';
import type { MapView } from '../listings/filters.ts';
import type { Bbox, ListingPin } from '../listings/queries.ts';
import { Basemap } from './basemap.tsx';
import { pinIcon } from './pin-icon.ts';
import { ViewportSync } from './viewport-sync.tsx';

interface ListingsMapProps {
  view: MapView;
  pins: ListingPin[];
  onViewChange: (view: MapView) => void;
  onBboxChange: (bbox: Bbox) => void;
}

export const ListingsMap = ({ view, pins, onViewChange, onBboxChange }: ListingsMapProps) => {
  const navigate = useNavigate();

  return (
    <MapContainer
      attributionControl={false}
      center={[view.lat, view.lng]}
      zoom={view.z}
      className="h-[360px] w-full rounded-sm border border-rule/15 lg:h-[540px]"
      scrollWheelZoom
    >
      <Basemap />
      <ViewportSync view={view} onViewChange={onViewChange} onBboxChange={onBboxChange} />
      <MarkerClusterGroup chunkedLoading>
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={pinIcon(pin)}
            eventHandlers={{ click: () => void navigate(`/listings/${pin.id}`) }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};
