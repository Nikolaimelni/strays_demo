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
  activeId: string | null;
  onViewChange: (view: MapView) => void;
  onBboxChange: (bbox: Bbox) => void;
  onActivate: (id: string | null) => void;
}

export const ListingsMap = ({
  view,
  pins,
  activeId,
  onViewChange,
  onBboxChange,
  onActivate,
}: ListingsMapProps) => {
  const navigate = useNavigate();

  return (
    <MapContainer
      attributionControl={false}
      center={[view.lat, view.lng]}
      zoom={view.z}
      // markercluster reads the map's maxZoom, which otherwise only arrives with the tile
      // layer, and the tile layer waits for the visitor to turn the map on
      maxZoom={19}
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
            icon={pinIcon(pin, pin.id === activeId)}
            eventHandlers={{
              click: () => void navigate(`/listings/${pin.id}`, { viewTransition: true }),
              mouseover: () => onActivate(pin.id),
              mouseout: () => onActivate(null),
            }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};
