import { createBrowserRouter, Outlet } from 'react-router';
import { LoginPage } from '../features/auth/login-page.tsx';
import { RedirectSignedIn } from '../features/auth/redirect-signed-in.tsx';
import { RegisterPage } from '../features/auth/register-page.tsx';
import { RequireAuth } from '../features/auth/require-auth.tsx';
import { Layout } from './layout.tsx';
import { NotFound } from './not-found.tsx';
import { RouteError } from './route-error.tsx';
// leaflet and markercluster are most of the bundle, so every route that draws
// a map loads on demand. login, register and the 404 stay eager: small, and
// where a cold cache usually lands.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('../features/listings/home-page.tsx')).HomePage,
        }),
      },
      {
        path: 'listings/:id',
        lazy: async () => ({
          Component: (await import('../features/listings/listing-page.tsx')).ListingPage,
        }),
      },
      {
        path: 'login',
        element: (
          <RedirectSignedIn>
            <LoginPage />
          </RedirectSignedIn>
        ),
      },
      {
        path: 'register',
        element: (
          <RedirectSignedIn>
            <RegisterPage />
          </RedirectSignedIn>
        ),
      },
      {
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          {
            path: 'new',
            lazy: async () => ({
              Component: (await import('../features/listings/new-listing-page.tsx')).NewListingPage,
            }),
          },
          {
            path: 'listings/:id/edit',
            lazy: async () => ({
              Component: (await import('../features/listings/edit-listing-page.tsx'))
                .EditListingPage,
            }),
          },
          {
            path: 'profile',
            lazy: async () => ({
              Component: (await import('../features/auth/profile-page.tsx')).ProfilePage,
            }),
          },
          {
            path: 'mine',
            lazy: async () => ({
              Component: (await import('../features/listings/my-listings-page.tsx')).MyListingsPage,
            }),
          },
        ],
      },

      {
        element: (
          <RequireAuth adminOnly>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          {
            path: 'admin',
            lazy: async () => ({
              Component: (await import('../features/admin/moderation-page.tsx')).ModerationPage,
            }),
          },
        ],
      },

      { path: '*', element: <NotFound /> },
    ],
  },
]);
