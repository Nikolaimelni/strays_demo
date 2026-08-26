import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/client.ts';
import type { components } from '../../shared/api/schema';
import type { ListingFilters } from './filters.ts';

export type ListingSummary = components['schemas']['ListingListResponseDto']['items'][number];
export type ListingPin = components['schemas']['PinsResponseDto']['items'][number];
export type ListingDetail = components['schemas']['ListingDetailResponseDto']['item'];

export interface Bbox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

const spatialParams = (bbox: Bbox | null) =>
  bbox
    ? {
        minLat: bbox.minLat,
        minLng: bbox.minLng,
        maxLat: bbox.maxLat,
        maxLng: bbox.maxLng,
      }
    : {};

const filterParams = (filters: ListingFilters) => ({
  ...(filters.type ? { type: filters.type } : {}),
  ...(filters.species ? { species: filters.species } : {}),
  ...(filters.city ? { city: filters.city } : {}),
});

export const useListings = (filters: ListingFilters, bbox: Bbox | null) =>
  useQuery({
    queryKey: ['listings', filters, bbox],
    queryFn: async () => {
      const { data, error } = await api.GET('/listings', {
        params: { query: { ...filterParams(filters), ...spatialParams(bbox), page: filters.page } },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: (previous) => previous,
  });

export const usePins = (filters: ListingFilters, bbox: Bbox | null) =>
  useQuery({
    queryKey: ['pins', filterParams(filters), bbox],
    queryFn: async () => {
      const { data, error } = await api.GET('/listings/pins', {
        params: { query: { ...filterParams(filters), ...spatialParams(bbox) } },
      });
      if (error) throw error;
      return data.items;
    },
    placeholderData: (previous) => previous,
    enabled: bbox !== null,
  });

export const useListing = (id: string) =>
  useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await api.GET('/listings/{id}', { params: { path: { id } } });
      if (error) throw error;
      return data.item;
    },
  });

// the whole board, not the current viewport: a viewport count would say "3
// listings" on a site with twenty. one request per number, limit=1, reading
// only `total`.
//
// TODO: one /stats endpoint when the backend gets one. four requests for four
// integers is silly, it is just not silly enough to block on.
export const useSiteStats = () =>
  useQuery({
    queryKey: ['site-stats'],
    queryFn: async () => {
      const counts = await Promise.all(
        ([undefined, 'FOUND', 'LOST', 'ADOPTION'] as const).map(async (type) => {
          const { data, error } = await api.GET('/listings', {
            params: { query: { limit: 1, ...(type ? { type } : {}) } },
          });
          if (error) throw error;
          return data.total;
        }),
      );
      return {
        total: counts[0] ?? 0,
        found: counts[1] ?? 0,
        lost: counts[2] ?? 0,
        adoption: counts[3] ?? 0,
      };
    },
    staleTime: 60_000,
  });
