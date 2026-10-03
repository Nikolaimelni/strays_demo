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

// The bbox goes straight into a query key, so raw float bounds meant a dragged
// pixel was a fresh key, a cache miss and two more requests. Three decimals is
// roughly 100 m, and it is the same grid the API rounds a public listing to.
// Rounded outward, or the box comes out smaller than the screen and clips the
// pins at the edge.
const STEP = 1000;
const floorTo = (value: number) => Math.floor(value * STEP) / STEP;
const ceilTo = (value: number) => Math.ceil(value * STEP) / STEP;

const SETTLE_MS = 300;

// The map owns its viewport once mounted and the URL mirrors it. The ref is
// what breaks the loop: a URL value we wrote ourselves must not be pushed back
// into the map, one that came from elsewhere must.
export const ViewportSync = ({ view, onViewChange, onBboxChange }: ViewportSyncProps) => {
  const lastWritten = useRef<MapView | null>(null);
  const settling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const map = useMap();

  const publishView = useCallback(() => {
    const center = map.getCenter();
    const next: MapView = { lat: center.lat, lng: center.lng, z: map.getZoom() };
    lastWritten.current = next;
    onViewChange(next);
  }, [map, onViewChange]);

  const publishBbox = useCallback(() => {
    const bounds = map.getBounds();
    onBboxChange({
      minLat: floorTo(bounds.getSouth()),
      minLng: floorTo(bounds.getWest()),
      maxLat: ceilTo(bounds.getNorth()),
      maxLng: ceilTo(bounds.getEast()),
    });
  }, [map, onBboxChange]);

  // Only the bbox waits. react-router's setSearchParams closes over the query
  // string of the render it came from, so a URL write parked in a timer puts
  // back the query string from before, and a filter picked in those 300 ms
  // disappeared. The bbox is plain state and has no such snapshot; it is also
  // the expensive half, because it is what two query keys are built from.
  useMapEvents({
    moveend: () => {
      publishView();
      if (settling.current) clearTimeout(settling.current);
      settling.current = setTimeout(publishBbox, SETTLE_MS);
    },
  });

  useEffect(() => {
    publishView();
  }, [publishView]);

  // the feed is disabled until a bbox arrives, so the first one does not wait
  useEffect(() => {
    publishBbox();
  }, [publishBbox]);

  useEffect(
    () => () => {
      if (settling.current) clearTimeout(settling.current);
    },
    [],
  );

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
