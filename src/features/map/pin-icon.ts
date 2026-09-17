import L from 'leaflet';
import type { ListingPin } from '../listings/queries.ts';

const SPECIES: Record<ListingPin['species'], string> = {
  DOG: 'pin-dog',
  CAT: 'pin-cat',
  OTHER: 'pin-other',
};

// leaflet calls createIcon() per marker, so one icon object can back any
// number of them. without the cache every pointer move rebuilds an icon for
// every pin on screen.
const cache = new Map<string, L.DivIcon>();

const icon = (classes: string) => {
  const existing = cache.get(classes);
  if (existing) return existing;

  const made = L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<span class="${classes}"></span>`,
  });
  cache.set(classes, made);
  return made;
};

export const pinIcon = (pin: ListingPin, active = false) =>
  icon(
    ['pin', SPECIES[pin.species], pin.type === 'LOST' && 'pin-lost', active && 'pin-active']
      .filter(Boolean)
      .join(' '),
  );

export const plainPinIcon = () => icon('pin pin-plain');
