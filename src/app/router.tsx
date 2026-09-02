import { createBrowserRouter } from 'react-router';
import { LoginPage } from '../features/auth/login-page.tsx';
import { RedirectSignedIn } from '../features/auth/redirect-signed-in.tsx';
import { RegisterPage } from '../features/auth/register-page.tsx';
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

      { path: '*', element: <NotFound /> },
    ],
  },
]);
