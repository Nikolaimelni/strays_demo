import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../test/msw.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { HomePage } from './home-page.tsx';

// leaflet needs real layout boxes jsdom does not have, and the map is not
// what these tests are about. the stub keeps the contract: it reports a
// viewport once, the way the real one does on first paint.
vi.mock('../map/listings-map.tsx', () => ({
  ListingsMap: ({ onBboxChange }: { onBboxChange: (b: unknown) => void }) => {
    useEffect(() => {
      onBboxChange({ minLat: 38.6, minLng: -9.3, maxLat: 38.8, maxLng: -9.0 });
    }, [onBboxChange]);
    return <div data-testid="map" />;
  },
}));

const API = 'http://localhost:3000';

const listing = {
  id: '11111111-1111-1111-1111-111111111111',
  type: 'FOUND',
  status: 'APPROVED',
  species: 'DOG',
  description: 'friendly brown dog near the park',
  photoUrls: [],
  city: 'Lisboa',
  lat: 38.72,
  lng: -9.14,
  source: 'WEB',
  sourceRef: null,
  shelterId: null,
  createdAt: new Date().toISOString(),
};

const feedRequests: URLSearchParams[] = [];

beforeEach(() => {
  feedRequests.length = 0;
  server.use(
    http.get(`${API}/listings/pins`, () => HttpResponse.json({ items: [] })),
    http.get(`${API}/listings`, ({ request }) => {
      feedRequests.push(new URL(request.url).searchParams);
      return HttpResponse.json({ items: [listing], total: 1, page: 1, limit: 20 });
    }),
  );
});

describe('home page', () => {
  it('sends the map viewport as a bbox and renders what comes back', async () => {
    renderWithProviders(<HomePage />);

    expect(await screen.findByText(/friendly brown dog/)).toBeInTheDocument();

    const params = feedRequests.at(-1);
    expect(params?.get('minLat')).toBe('38.6');
    expect(params?.get('maxLng')).toBe('-9');
  });

  it('puts a chosen filter in the URL and asks the API for it', async () => {
    const { router } = renderWithProviders(<HomePage />);
    await screen.findByText(/friendly brown dog/);

    await userEvent.click(screen.getByRole('button', { name: 'Lost' }));

    await waitFor(() => expect(feedRequests.at(-1)?.get('type')).toBe('LOST'));
    expect(router.state.location.search).toContain('type=LOST');
  });

  it('asks for adoptions, which are not a lost animal at all', async () => {
    const { router } = renderWithProviders(<HomePage />);
    await screen.findByText(/friendly brown dog/);

    await userEvent.click(screen.getByRole('button', { name: 'Adoption' }));

    await waitFor(() => expect(feedRequests.at(-1)?.get('type')).toBe('ADOPTION'));
    expect(router.state.location.search).toContain('type=ADOPTION');
  });

  it('clears the type when the chosen segment is pressed again', async () => {
    const { router } = renderWithProviders(<HomePage />, '/?type=ADOPTION');
    await screen.findByText(/friendly brown dog/);

    await userEvent.click(screen.getByRole('button', { name: 'Adoption' }));

    await waitFor(() => expect(feedRequests.at(-1)?.has('type')).toBe(false));
    expect(router.state.location.search).not.toContain('type=');
  });

  it('drops the page back to 1 when a filter changes', async () => {
    const { router } = renderWithProviders(<HomePage />, '/?page=3');
    await screen.findByText(/friendly brown dog/);
    expect(feedRequests.at(-1)?.get('page')).toBe('3');

    await userEvent.click(screen.getByRole('button', { name: 'Found' }));

    await waitFor(() => expect(feedRequests.at(-1)?.get('page')).toBe('1'));
    expect(router.state.location.search).not.toContain('page=3');
  });
});

describe('feed pagination', () => {
  const manyResults = (page: number) =>
    HttpResponse.json({ items: [listing], total: 45, page, limit: 20 });

  it('stays hidden while everything fits on one page', async () => {
    renderWithProviders(<HomePage />);
    await screen.findByText(/friendly brown dog/);

    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('walks pages through the url so the position is shareable', async () => {
    server.use(
      http.get(`${API}/listings`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        feedRequests.push(params);
        return manyResults(Number(params.get('page') ?? 1));
      }),
    );

    const { router } = renderWithProviders(<HomePage />);
    await screen.findByText(/friendly brown dog/);
    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(feedRequests.at(-1)?.get('page')).toBe('2'));
    expect(router.state.location.search).toContain('page=2');
  });

  it('stops at the last page', async () => {
    server.use(
      http.get(`${API}/listings`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        feedRequests.push(params);
        return manyResults(Number(params.get('page') ?? 1));
      }),
    );

    renderWithProviders(<HomePage />, '/?page=3');
    expect(await screen.findByText('Page 3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
