import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../shared/api/client.ts';
import { type SessionUser, sessionKey } from './session.ts';

interface Credentials {
  email: string;
  password: string;
}

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Credentials) => {
      const { data, error } = await api.POST('/auth/login', { body });
      if (error) throw error;
      return data.user;
    },
    // write the user we were handed rather than invalidating and awaiting a
    // refetch. the caller redirects as soon as this resolves, and while that
    // refetch was in flight the session still read null, so a guarded
    // destination bounced straight back to login.
    onSuccess: (user) => queryClient.setQueryData<SessionUser | null>(sessionKey, user),
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Credentials & { name: string }) => {
      const { data, error } = await api.POST('/auth/register', { body });
      if (error) throw error;
      return data.user;
    },
    onSuccess: (user) => queryClient.setQueryData<SessionUser | null>(sessionKey, user),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.POST('/auth/logout');
    },
    // clear, not invalidate: refetching everything as an anonymous user is
    // wasted work. onSettled, because a logout that never reached the server
    // still means this browser is done, and a cached user would leave a
    // signed-in header in front of somebody who just asked to leave.
    onSettled: () => queryClient.clear(),
  });
};
