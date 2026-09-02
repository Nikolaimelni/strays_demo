import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/client.ts';
import type { components } from '../../shared/api/schema';

export type PublicShelter = components['schemas']['ShelterListResponseDto']['items'][number];

export const useShelters = () =>
  useQuery({
    queryKey: ['shelters'],
    queryFn: async () => {
      const { data, error } = await api.GET('/shelters');
      if (error) throw error;
      return data.items;
    },
    staleTime: 30 * 60 * 1000,
  });
