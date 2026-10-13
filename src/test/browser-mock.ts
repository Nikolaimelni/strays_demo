import { HttpResponse, http } from 'msw';
import { setupWorker } from 'msw/browser';
import { env } from '../env.ts';
import type { components } from '../shared/api/schema';

const API = env.VITE_API_URL;

// sessionStorage rather than a module variable: the real thing is a cookie
// that survives a reload, and a mock that forgets on every navigation makes
// every guarded route look broken
const SESSION_KEY = 'strays-mock-session';
const isSignedIn = () => sessionStorage.getItem(SESSION_KEY) === '1';
const setSignedIn = (value: boolean) => {
  if (value) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
};

// typed against the generated schema, so a field the API starts returning is a
// compile error here rather than a page that renders blank in e2e. that is how
// flaggedTerms got missed: the mock is the contract, and nothing was checking it.
const user: components['schemas']['UserResponseDto']['user'] = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'moderator@example.com',
  role: 'ADMIN',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const listing: components['schemas']['MyListingsResponseDto']['items'][number] = {
  photoKeys: [],
  rejectionReason: null,
  id: '22222222-2222-2222-2222-222222222222',
  type: 'FOUND',
  status: 'APPROVED',
  species: 'DOG',
  description: 'friendly brown dog near the park',
  photoUrls: [],
  city: 'Lisboa',
  lat: 38.7223,
  lng: -9.1393,
  source: 'WEB',
  shelterId: null,
  createdAt: '2026-08-01T00:00:00.000Z',
};

// the public routes stopped returning the name, the number and the keys, so the
// mock has to stop returning them too or e2e passes on data nobody gets
type Summary = components['schemas']['ListingListResponseDto']['items'][number];

const summaryOf = (row: typeof listing): Summary => ({
  id: row.id,
  type: row.type,
  status: row.status,
  species: row.species,
  description: row.description,
  photoUrls: row.photoUrls,
  city: row.city,
  lat: row.lat,
  lng: row.lng,
  source: row.source,
  shelterId: row.shelterId,
  createdAt: row.createdAt,
});

const feed: (typeof listing)[] = [
  listing,
  {
    ...listing,
    id: '77777777-7777-7777-7777-777777777777',
    type: 'LOST',
    species: 'CAT',
    description: 'Grey cat with a red collar, missing since Friday.',
  },
  {
    ...listing,
    id: '88888888-8888-8888-8888-888888888888',
    type: 'ADOPTION',
    shelterId: '99999999-9999-9999-9999-999999999999',
    description: 'Mestizo, four years old, house-trained and ready to go home.',
  },
];

const unauthorized = () =>
  HttpResponse.json({ code: 'UNAUTHORIZED', message: 'not signed in' }, { status: 401 });

export const startMockApi = async () => {
  const worker = setupWorker(
    http.get(`${API}/users/me`, () =>
      isSignedIn() ? HttpResponse.json({ user }) : unauthorized(),
    ),
    http.get(`${API}/users/me/export`, () =>
      isSignedIn()
        ? HttpResponse.json({ exportedAt: '2026-09-06T00:00:00.000Z', user, listings: [] })
        : unauthorized(),
    ),
    http.delete(`${API}/users/me`, () => {
      setSignedIn(false);
      return HttpResponse.json({ ok: true });
    }),

    http.post(`${API}/auth/login`, async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string };
      if (body.password !== 'demo') {
        return HttpResponse.json(
          { code: 'INVALID_CREDENTIALS', message: 'email or password is incorrect' },
          { status: 401 },
        );
      }
      setSignedIn(true);
      return HttpResponse.json({ user });
    }),

    http.post(`${API}/auth/verify-email`, () => HttpResponse.json({ ok: true })),
    http.post(`${API}/auth/forgot-password`, () =>
      HttpResponse.json({ ok: true }, { status: 202 }),
    ),
    http.post(`${API}/auth/reset-password`, () => HttpResponse.json({ ok: true })),
    http.post(`${API}/auth/verify-email/resend`, () =>
      HttpResponse.json({ ok: true }, { status: 202 }),
    ),
    http.post(`${API}/auth/logout`, () => {
      setSignedIn(false);
      return HttpResponse.json({ ok: true });
    }),

    http.post(`${API}/auth/refresh`, () => unauthorized()),

    http.get(`${API}/listings`, ({ request }) => {
      const type = new URL(request.url).searchParams.get('type');
      const items = feed.filter((row) => !type || row.type === type).map(summaryOf);
      return HttpResponse.json({ items, total: items.length, page: 1, limit: 20 });
    }),
    http.get(`${API}/listings/pins`, () =>
      HttpResponse.json({
        items: [
          { id: listing.id, lat: listing.lat, lng: listing.lng, species: 'DOG', type: 'FOUND' },
        ],
      }),
    ),
    // before /listings/:id on purpose: msw matches in registration order,
    // so the parameterised route would otherwise swallow this one and hand
    // back a single listing where the page expects a list
    http.get(`${API}/listings/mine`, () =>
      isSignedIn()
        ? HttpResponse.json({
            items: [
              { ...listing },
              {
                ...listing,
                id: '33333333-3333-3333-3333-333333333333',
                status: 'PENDING',
                description: 'Tabby kitten found by the tram stop, waiting for review.',
              },
              {
                ...listing,
                id: '44444444-4444-4444-4444-444444444444',
                status: 'REJECTED',
                type: 'LOST',
                description: 'Duplicate of an earlier listing.',
                rejectionReason: 'The same animal is already listed.',
              },
            ],
          })
        : unauthorized(),
    ),
    http.get(`${API}/listings/:id`, () => HttpResponse.json({ item: summaryOf(listing) })),
    http.post(`${API}/listings/:id/report`, () => HttpResponse.json({ ok: true }, { status: 202 })),
    http.get(`${API}/admin/audit`, () =>
      HttpResponse.json({
        items: [
          {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            actorId: user.id,
            action: 'LISTING_APPROVE',
            listingId: listing.id,
            reason: null,
            createdAt: '2026-08-21T09:15:00.000Z',
          },
          {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            actorId: user.id,
            action: 'LISTING_REJECT',
            listingId: '44444444-4444-4444-4444-444444444444',
            reason: 'The same animal is already listed.',
            createdAt: '2026-08-20T17:02:00.000Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      }),
    ),
    http.get(`${API}/admin/reports`, () =>
      HttpResponse.json({
        items: [
          {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            listingId: listing.id,
            listingStatus: 'APPROVED',
            listingDescription: listing.description,
            reason: 'WRONG_INFO',
            note: 'The dog on this one was found last week.',
            createdAt: '2026-08-20T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      }),
    ),
    http.get(`${API}/shelters`, () => HttpResponse.json({ items: [] })),
    http.get(`${API}/admin/listings`, () =>
      HttpResponse.json({
        items: [
          { ...listing, status: 'PENDING' },
          {
            ...listing,
            id: '66666666-6666-6666-6666-666666666666',
            status: 'PENDING',
            description: 'Found a dog, write me on telegram, price 50 euro.',
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      }),
    ),
  );

  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
};
