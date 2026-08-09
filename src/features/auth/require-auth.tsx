import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { Alert } from '../../shared/ui/alert.tsx';
import { useSession } from './session.ts';

interface RequireAuthProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const RequireAuth = ({ children, adminOnly = false }: RequireAuthProps) => {
  const { t } = useTranslation();
  const { data: user, isPending, isError } = useSession();
  const location = useLocation();

  if (isPending) return null;
  if (isError) return <Alert>{t('errors.UNKNOWN')}</Alert>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />;

  return children;
};
