import { useSyncExternalStore } from 'react';

const KEY = 'strays-map-tiles';

// storage can be off or blocked, in which case reading throws. then the choice lives in this
// module until the tab closes, and the visitor is asked again next time
const readStored = () => {
  try {
    return localStorage.getItem(KEY) === 'yes';
  } catch {
    return false;
  }
};

let allowed = readStored();
const listeners = new Set<() => void>();

export const allowTiles = () => {
  allowed = true;
  try {
    localStorage.setItem(KEY, 'yes');
  } catch {
    // remembered for this visit only, see above
  }
  for (const listener of listeners) listener();
};

// one answer for every map on the site: turning it on in the feed should not leave the
// listing page asking again
export const useTilesAllowed = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => allowed,
    () => false,
  );
