import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { i18next } from '../shared/i18n/i18n.ts';

export const renderWithProviders = (element: ReactElement, initialUrl = '/') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const router = createMemoryRouter([{ path: '*', element }], {
    initialEntries: [initialUrl],
  });

  return {
    router,
    ...render(
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </I18nextProvider>,
    ),
  };
};
