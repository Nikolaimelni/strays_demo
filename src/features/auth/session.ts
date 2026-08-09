import { useQuery } from '@tanstack/react-query';
import { api } from '../../shared/api/client.ts';
import type { components } from '../../shared/api/schema';

export const sessionKey = ['session'] as const;

export type SessionUser = components['schemas']['UserResponseDto']['user'];

export const useSession = () =>
  useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/users/me');
      // read before the branch: the OpenAPI document lists no failure response
      // for this route, so everything inside the error branch narrows to never
      const status = response.status;
      // a 401 is an answer: nobody is signed in. anything else is the request
      // failing, and calling that "signed out" hands a signed-in user the login
      // page because their wifi blinked.
      if (error) {
        if (status === 401) return null;
        throw error;
      }
      return data.user;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
