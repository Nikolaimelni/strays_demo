import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSession } from './session.ts';

interface RedirectSignedInProps {
  children: ReactNode;
}

// the mirror of RequireAuth. a guard and not a navigate() after the request
// resolves, because the session landing and the login screen going away have
// to be one render: as two, the header offered Moderation while the router was
// still on /login, and clicking it got undone a beat later.
export const RedirectSignedIn = ({ children }: RedirectSignedInProps) => {
  const { data: user } = useSession();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  if (user) return <Navigate to={from ?? '/'} replace />;

  return children;
};
