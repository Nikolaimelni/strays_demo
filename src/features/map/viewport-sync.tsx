import { useCallback, useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import type { MapView } from '../listings/filters.ts';
import type { Bbox } from '../listings/queries.ts';

interface ViewportSyncProps {
  view: MapView;
  onViewChange: (view: MapView) => void;
  onBboxChange: (bbox: Bbox) => void;
}

const sameView = (a: MapView, b: MapView) =>
  a.z === b.z && Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lng - b.lng) < 1e-4;

// The map owns its viewport once mounted and the URL mirrors it. The ref is
// what breaks the loop: a URL value we wrote ourselves must not be pushed back
// into the map, one that came from elsewhere must.
export const ViewportSync = ({ view, onViewChange, onBboxChange }: ViewportSyncProps) => {
  const lastWritten = useRef<MapView | null>(null);
  const map = useMap();

  const publish = useCallback(() => {
    const center = map.getCenter();
    const next: MapView = { lat: center.lat, lng: center.lng, z: map.getZoom() };
    lastWritten.current = next;
    onViewChange(next);

    const bounds = map.getBounds();
    onBboxChange({
      minLat: bounds.getSouth(),
      minLng: bounds.getWest(),
      maxLat: bounds.getNorth(),
      maxLng: bounds.getEast(),
    });
  }, [map, onViewChange, onBboxChange]);

  useMapEvents({ moveend: publish });

  useEffect(() => {
    publish();
  }, [publish]);

  useEffect(() => {
    if (lastWritten.current && sameView(lastWritten.current, view)) return;
    const current: MapView = {
      lat: map.getCenter().lat,
      lng: map.getCenter().lng,
      z: map.getZoom(),
    };
    if (sameView(current, view)) return;
    map.setView([view.lat, view.lng], view.z);
  }, [map, view]);

  return null;
};
