import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../test/msw.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { ModerationPage } from './moderation-page.tsx';

const API = 'http://localhost:3000';

const row = (id: string, description: string) => ({
  id,
  type: 'FOUND',
  status: 'PENDING',
  species: 'DOG',
  description,
  photoUrls: [],
  city: 'Lisboa',
  lat: 38.72,
  lng: -9.14,
  source: 'WEB',
  sourceRef: null,
  shelterId: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  rejectionReason: null,
});

const pending = [
  row('11111111-1111-1111-1111-111111111111', 'first pending listing'),
  row('22222222-2222-2222-2222-222222222222', 'second pending listing'),
];

beforeEach(() => {
  server.use(
    http.get(`${API}/admin/listings`, () =>
      HttpResponse.json({ items: pending, total: 2, page: 1, limit: 20 }),
    ),
  );
});

describe('moderation queue', () => {
  it('drops the row as soon as it is approved, without waiting for the server', async () => {
    server.use(http.post(`${API}/admin/listings/:id/approve`, () => new Promise(() => {})));

    renderWithProviders(<ModerationPage />);
    await screen.findByText('first pending listing');

    await userEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0] as HTMLElement);

    await waitFor(() =>
      expect(screen.queryByText('first pending listing')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('second pending listing')).toBeInTheDocument();
  });

  it('puts the row back when the server refuses', async () => {
    server.use(
      http.post(`${API}/admin/listings/:id/reject`, () =>
        HttpResponse.json({ code: 'FORBIDDEN', message: 'nope' }, { status: 403 }),
      ),
    );

    renderWithProviders(<ModerationPage />);
    await screen.findByText('first pending listing');

    await userEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0] as HTMLElement);
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm rejection' }));

    expect(await screen.findByText('first pending listing')).toBeInTheDocument();
  });

  it('does not resurrect a decided row when a different decision fails', async () => {
    const firstId = '11111111-1111-1111-1111-111111111111';
    server.use(
      http.post(`${API}/admin/listings/:id/approve`, ({ params }) =>
        params.id === firstId
          ? HttpResponse.json({ code: 'FORBIDDEN', message: 'nope' }, { status: 403 })
          : new Promise(() => {}),
      ),
    );

    renderWithProviders(<ModerationPage />);
    await screen.findByText('first pending listing');

    const approve = screen.getAllByRole('button', { name: 'Approve' });
    await userEvent.click(approve[0] as HTMLElement);
    await userEvent.click(approve[1] as HTMLElement);

    expect(await screen.findByText('first pending listing')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText('second pending listing')).not.toBeInTheDocument(),
    );
  });
});
