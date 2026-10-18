import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { Alert } from '../../shared/ui/alert.tsx';
import { ButtonLink } from '../../shared/ui/button.tsx';
import { Skeleton } from '../../shared/ui/skeleton.tsx';
import { useSession } from './session.ts';

interface RequireAuthProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const RequireAuth = ({ children, adminOnly = false }: RequireAuthProps) => {
  const { t } = useTranslation();
  const { data: user, isPending, isError } = useSession();
  const location = useLocation();

  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (isError) return <Alert>{t('errors.UNKNOWN')}</Alert>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />;

  // the server answers every moderation route with 403 MFA_REQUIRED until the second
  // factor is on, so say that once here instead of rendering a page made of errors
  if (adminOnly && !user.mfaEnabled) {
    return (
      <div className="max-w-prose space-y-5 border-t border-rule/15 pt-5">
        <p className="text-lead text-muted">{t('admin.mfaGate')}</p>
        <ButtonLink to="/profile">{t('admin.mfaGateLink')}</ButtonLink>
      </div>
    );
  }

  return children;
};
