import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';

// the URL is the only place filters live. no zustand, no context: a filtered
// view is shareable, survives a reload, and gets back/forward for free.
//
// each field catches its own mistakes rather than the object failing whole. a
// hand-edited `?city=&type=LOST` used to fail on the empty city and drop the
// type with it, which looked like the bar ignoring a click.
const filtersSchema = z.object({
  type: z.enum(['FOUND', 'LOST', 'ADOPTION']).optional().catch(undefined),
  species: z.enum(['DOG', 'CAT', 'OTHER']).optional().catch(undefined),
  city: z.string().trim().min(1).optional().catch(undefined),
  page: z.coerce.number().int().positive().catch(1).default(1),
});

export type ListingFilters = z.infer<typeof filtersSchema>;

// no url, no view: land on Lisbon rather than on the whole globe at zoom 2.
// every listing on the board is here, and an empty world map is a bad first
// frame for a site whose whole content is pins.
const viewSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).catch(38.7223),
  lng: z.coerce.number().min(-180).max(180).catch(-9.1393),
  z: z.coerce.number().int().min(1).max(19).catch(12),
});

export type MapView = z.infer<typeof viewSchema>;

const readParams = (params: URLSearchParams) => Object.fromEntries(params.entries());

export const useListingFilters = () => {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => filtersSchema.parse(readParams(params)), [params]);

  const view = useMemo(() => viewSchema.parse(readParams(params)), [params]);

  const setFilters = useCallback(
    (next: Partial<ListingFilters>) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          for (const [key, value] of Object.entries(next)) {
            if (value === undefined || value === '') updated.delete(key);
            else updated.set(key, String(value));
          }
          if (!('page' in next)) updated.delete('page');
          return updated;
        },
        // ScrollRestoration treats every write as a new page and jumps to the top
        { replace: false, preventScrollReset: true },
      );
    },
    [setParams],
  );

  const setView = useCallback(
    (next: MapView) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          updated.set('lat', next.lat.toFixed(5));
          updated.set('lng', next.lng.toFixed(5));
          updated.set('z', String(next.z));
          return updated;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  return { filters, view, setFilters, setView };
};
