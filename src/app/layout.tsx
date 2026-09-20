import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { useLogout } from '../features/auth/mutations.ts';
import { useSession } from '../features/auth/session.ts';
import { LanguageSwitcher } from '../shared/i18n/language-switcher.tsx';
import { useDocumentLanguage } from '../shared/i18n/use-document-language.ts';
import { Button, ButtonLink } from '../shared/ui/button.tsx';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `link-underline whitespace-nowrap text-xs uppercase tracking-[0.14em] transition-colors ${
    isActive ? 'text-ink' : 'text-muted hover:text-ink'
  }`;

// 44px is the smallest target that does not need a second attempt on a phone
const panelLink = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center border-b border-rule/10 text-sm uppercase tracking-[0.14em] transition-colors ${
    isActive ? 'text-ink' : 'text-muted'
  }`;

export const Layout = () => {
  const { t } = useTranslation();
  const { data: user } = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(location.pathname);
  useDocumentLanguage();

  // A menu that survives navigation covers the page it just opened. During
  // render rather than in an effect, which would paint the old state first.
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  // the document is the outside thing here: escape has to close the panel from
  // wherever focus happens to be
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const signOut = async () => {
    setMenuOpen(false);
    // the cache clears either way and the cookie expires on its own. without
    // the catch the rejection escapes an onClick with nowhere to go.
    await logout.mutateAsync().catch(() => {});
    await navigate('/', { replace: true });
  };

  const links = (style: typeof navLink) => (
    <>
      <NavLink to="/" end className={style}>
        {t('nav.map')}
      </NavLink>
      {user ? (
        <NavLink to="/mine" className={style}>
          {t('nav.mine')}
        </NavLink>
      ) : null}
      {user?.role === 'ADMIN' ? (
        <NavLink to="/admin" className={style}>
          {t('nav.admin')}
        </NavLink>
      ) : null}
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      {/* without this a route change keeps the scroll position, so the map
          link from a scrolled page lands you in the footer */}
      <ScrollRestoration />
      {/* sticky because the map is tall and the nav is the only way out of it.
          z-index above 1000: leaflet puts its own control corners there, and
          the zoom buttons would otherwise slide over the header */}
      <header className="sticky top-0 z-1100 border-b border-rule/15 bg-page/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center gap-x-5 px-4 py-3 sm:px-6 sm:py-4">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
          >
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-full bg-brand text-brand-ink"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                <title>paw</title>
                <ellipse cx="7" cy="9" rx="2.1" ry="2.7" />
                <ellipse cx="12" cy="7" rx="2.1" ry="2.9" />
                <ellipse cx="17" cy="9" rx="2.1" ry="2.7" />
                <path d="M12 12c3 0 5.5 2.2 5.5 4.6 0 1.7-1.4 2.7-3.2 2.7-1 0-1.7-.4-2.3-.4s-1.3.4-2.3.4c-1.8 0-3.2-1-3.2-2.7C6.5 14.2 9 12 12 12Z" />
              </svg>
            </span>
            strays
          </NavLink>

          {/* one row, never wrapping: at 360px the wrapped version was three
              rows and 125px of sticky header, a third of the viewport */}
          <div className="ml-6 hidden items-center gap-x-5 md:flex">{links(navLink)}</div>

          <div className="ml-auto hidden items-center gap-x-5 md:flex">
            <LanguageSwitcher />
            {user ? (
              <>
                <NavLink to="/profile" className={navLink}>
                  {user.name}
                </NavLink>
                <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                  {t('auth.signOut')}
                </Button>
              </>
            ) : (
              <NavLink to="/login" className={navLink}>
                {t('auth.signIn')}
              </NavLink>
            )}
            <ButtonLink to="/new" size="sm" className="whitespace-nowrap">
              {t('nav.post')}
            </ButtonLink>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="ml-auto -mr-2 grid size-11 place-items-center md:hidden"
          >
            <span className="sr-only">{menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}</span>
            {/* two lines that become an X, cheaper than swapping icons */}
            <span aria-hidden className="relative block h-3 w-5">
              <span
                className={`absolute left-0 block h-px w-5 bg-ink transition-transform duration-300 ${
                  menuOpen ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-5 bg-ink transition-transform duration-300 ${
                  menuOpen ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </nav>

        {menuOpen ? (
          <div id="mobile-nav" className="menu-panel border-t border-rule/10 px-4 pb-5 md:hidden">
            <div className="flex flex-col">{links(panelLink)}</div>
            {user ? (
              <NavLink to="/profile" className={panelLink}>
                {user.name}
              </NavLink>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <LanguageSwitcher />
              {user ? (
                <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                  {t('auth.signOut')}
                </Button>
              ) : (
                <NavLink to="/login" className={panelLink}>
                  {t('auth.signIn')}
                </NavLink>
              )}
              <ButtonLink to="/new" size="sm" className="ml-auto whitespace-nowrap">
                {t('nav.post')}
              </ButtonLink>
            </div>
          </div>
        ) : null}

        {/* reading position on the hairline the header already has. a scroll
            timeline, so no listener and no state. */}
        <span
          aria-hidden
          className="scroll-progress absolute inset-x-0 -bottom-px h-px origin-left bg-brand"
        />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-14">
        <Outlet />
      </main>

      <footer className="mt-10 overflow-hidden border-t border-rule/15">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p className="max-w-prose text-xs leading-relaxed text-muted">{t('footer.note')}</p>
            <p className="section-index text-xs text-muted">{new Date().getFullYear()} · Lisboa</p>
          </div>
          {/* the wordmark is decoration at a contrast no text should have, so
              it is a graphic and not a paragraph. axe is right about that. */}
          <svg
            aria-hidden
            viewBox="0 0 246 86"
            preserveAspectRatio="xMinYMid meet"
            className="mt-6 w-full select-none fill-rule/10"
          >
            <text x="0" y="66" className="font-display text-[80px] font-semibold tracking-tight">
              strays
            </text>
          </svg>
        </div>
      </footer>
    </div>
  );
};
