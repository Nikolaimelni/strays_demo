import L from 'leaflet';
import type { ListingPin } from '../listings/queries.ts';

const COLORS: Record<ListingPin['species'], string> = {
  DOG: '#b45309',
  CAT: '#7c3aed',
  OTHER: '#0f766e',
};

export const pinIcon = (pin: ListingPin) =>
  L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 3px rgb(0 0 0 / 0.4);background:${COLORS[pin.species]};opacity:${pin.type === 'LOST' ? 0.55 : 1}"></span>`,
  });

// same reasoning, without a species to colour by
export const plainPinIcon = () =>
  L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 3px rgb(0 0 0 / 0.4);background:#171717"></span>',
  });
