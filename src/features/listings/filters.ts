import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';

// the URL is the only place filters live. no zustand, no context: a filtered
// view is shareable, survives a reload, and gets back/forward for free.
const filtersSchema = z.object({
  type: z.enum(['FOUND', 'LOST', 'ADOPTION']).optional(),
  species: z.enum(['DOG', 'CAT', 'OTHER']).optional(),
  city: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().catch(1).default(1),
});

export type ListingFilters = z.infer<typeof filtersSchema>;

const viewSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).catch(20),
  lng: z.coerce.number().min(-180).max(180).catch(0),
  z: z.coerce.number().int().min(1).max(19).catch(2),
});

export type MapView = z.infer<typeof viewSchema>;

const readParams = (params: URLSearchParams) => Object.fromEntries(params.entries());

export const useListingFilters = () => {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => {
    const parsed = filtersSchema.safeParse(readParams(params));
    // a hand-edited or stale URL should fall back to no filters rather than
    // blanking the page
    return parsed.success ? parsed.data : { page: 1 };
  }, [params]);

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
        { replace: false },
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
        { replace: true },
      );
    },
    [setParams],
  );

  return { filters, view, setFilters, setView };
};
