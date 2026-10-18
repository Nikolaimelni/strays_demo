import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

const SECTIONS = [
  ['/admin', 'admin.queue'],
  ['/admin/reports', 'admin.reports'],
  ['/admin/users', 'admin.users'],
  ['/admin/shelters', 'admin.shelters'],
  ['/admin/audit', 'admin.audit'],
] as const;

export const AdminNav = () => {
  const { t } = useTranslation();

  return (
    <nav aria-label={t('admin.adminNav')} className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {SECTIONS.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `link-underline ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`
          }
        >
          {t(label)}
        </NavLink>
      ))}
    </nav>
  );
};
