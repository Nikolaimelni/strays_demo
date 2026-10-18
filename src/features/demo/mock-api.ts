import { HttpResponse, http } from 'msw';
import { setupWorker } from 'msw/browser';
import { env } from '../../env.ts';
import type { components } from '../../shared/api/schema';

type Schemas = components['schemas'];

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

const PASSWORD = 'demo';
const CODE = '123456';
// signing in with this address asks for the second step, so a visitor can see it
const TWO_STEP_EMAIL = 'two-step@example.com';

// typed against the generated schema, so a field the API starts returning is a
// compile error here rather than a page that renders blank in e2e. that is how
// flaggedTerms got missed: the mock is the contract, and nothing was checking it.
let user: Schemas['UserResponseDto']['user'] = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'moderator@example.com',
  role: 'ADMIN',
  emailVerified: true,
  mfaEnabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const listing: Schemas['MyListingsResponseDto']['items'][number] = {
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
  sourceUrl: null,
  createdAt: '2026-08-01T00:00:00.000Z',
};

// the public routes stopped returning the name, the number and the keys, so the
// mock has to stop returning them too or e2e passes on data nobody gets
type Summary = Schemas['ListingListResponseDto']['items'][number];

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
  sourceUrl: row.sourceUrl,
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
    source: 'FEED',
    shelterId: '99999999-9999-9999-9999-999999999999',
    sourceUrl: 'https://abrigo.example.pt/animais/tejo',
    description: 'Mestizo, four years old, house-trained and ready to go home.',
  },
];

const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ code, message }, { status });
const unauthorized = () => fail(401, 'UNAUTHORIZED', 'not signed in');
const notFound = () => fail(404, 'NOT_FOUND', 'no such thing');
const wrongPassword = () => fail(422, 'WRONG_PASSWORD', 'that is not the password');
const wrongCode = () => fail(401, 'MFA_CODE_INVALID', 'that code is not right');

type Listing = typeof listing;
type CreateListing = Schemas['CreateListingDto'];

// plain module state, unlike the session flag: these carry a contact name somebody typed,
// which has no business in browser storage, and a reload starting over is fine. without
// it an approved row comes straight back on the refetch and the queue never empties
let mine: Listing[] = [
  listing,
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
];

let others: Listing[] = [
  { ...listing, id: '55555555-5555-5555-5555-555555555555', status: 'PENDING' },
  {
    ...listing,
    id: '66666666-6666-6666-6666-666666666666',
    status: 'PENDING',
    description: 'Found a dog, write me on telegram, price 50 euro.',
  },
];

const change = (id: string, patch: Partial<Listing>) => {
  mine = mine.map((row) => (row.id === id ? { ...row, ...patch } : row));
  others = others.map((row) => (row.id === id ? { ...row, ...patch } : row));
  return [...mine, ...others].find((row) => row.id === id);
};

type Session = Schemas['SessionListResponseDto']['items'][number];
let sessions: Session[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    createdAt: '2026-10-01T09:12:00.000Z',
    lastSeenAt: new Date().toISOString(),
    current: true,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    createdAt: '2026-09-28T19:40:00.000Z',
    lastSeenAt: '2026-10-02T08:05:00.000Z',
    current: false,
  },
];

type Account = Schemas['AdminUserListResponseDto']['items'][number];
let accounts: Account[] = [
  {
    id: user.id,
    email: user.email,
    role: 'ADMIN',
    emailVerified: true,
    mfaEnabled: true,
    blockedAt: null,
    blockReason: null,
    listings: 3,
    createdAt: user.createdAt,
  },
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    email: 'ana@example.com',
    role: 'USER',
    emailVerified: true,
    mfaEnabled: false,
    blockedAt: null,
    blockReason: null,
    listings: 2,
    createdAt: '2026-08-14T10:00:00.000Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    email: 'seller@example.com',
    role: 'USER',
    emailVerified: true,
    mfaEnabled: false,
    blockedAt: '2026-09-30T18:20:00.000Z',
    blockReason: 'Kept posting puppies for sale after two rejections.',
    listings: 0,
    createdAt: '2026-09-02T12:00:00.000Z',
  },
];

const updateAccount = (id: string, patch: Partial<Account>) => {
  accounts = accounts.map((row) => (row.id === id ? { ...row, ...patch } : row));
  return accounts.find((row) => row.id === id);
};

type Shelter = Schemas['AdminShelterListResponseDto']['items'][number];
let shelters: Shelter[] = [
  {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'Abrigo do Tejo',
    city: 'Lisboa',
    sourceUrl: 'https://abrigo.example.pt',
    createdAt: '2026-08-10T10:00:00.000Z',
    feedUrl: 'https://abrigo.example.pt/strays-feed.json',
    feedConsentAt: '2026-09-01T15:30:00.000Z',
    feedConsentNote: 'Email from the director, 1 September 2026',
    lastImportAt: '2026-10-01T06:00:00.000Z',
    lastImport: {
      startedAt: '2026-10-01T06:00:00.000Z',
      finishedAt: '2026-10-01T06:00:04.000Z',
      created: 1,
      updated: 3,
      unchanged: 11,
      removed: 0,
      invalid: 0,
      failed: 0,
      message: null,
    },
    importRunning: false,
  },
  {
    id: 'aaaaaaaa-0000-0000-0000-000000000001',
    name: 'Patas de Almada',
    city: 'Almada',
    sourceUrl: null,
    createdAt: '2026-09-20T10:00:00.000Z',
    feedUrl: 'https://patas.example.pt/feed.json',
    feedConsentAt: null,
    feedConsentNote: null,
    lastImportAt: null,
    lastImport: null,
    importRunning: false,
  },
];

const updateShelter = (id: string, patch: Partial<Shelter>) => {
  shelters = shelters.map((row) => (row.id === id ? { ...row, ...patch } : row));
  return shelters.find((row) => row.id === id);
};

// a few seconds of "running", then a result, so the page's polling has something to show
const runImport = (id: string) => {
  const startedAt = new Date().toISOString();
  updateShelter(id, { importRunning: true });
  setTimeout(() => {
    const finishedAt = new Date().toISOString();
    updateShelter(id, {
      importRunning: false,
      lastImportAt: finishedAt,
      lastImport: {
        startedAt,
        finishedAt,
        created: 0,
        updated: 1,
        unchanged: 14,
        removed: 0,
        invalid: 0,
        failed: 0,
        message: null,
      },
    });
  }, 3000);
};

type Report = Schemas['ReportListResponseDto']['items'][number];
let reports: Report[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    listingId: listing.id,
    listingStatus: 'APPROVED',
    listingDescription: listing.description,
    openReportsOnListing: 1,
    reporterId: 'e0000000-0000-0000-0000-000000000001',
    notice: false,
    reason: 'WRONG_INFO',
    note: 'The dog on this one was found last week.',
    status: 'OPEN',
    closedAt: null,
    closedById: null,
    createdAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
    listingId: '66666666-6666-6666-6666-666666666666',
    listingStatus: 'PENDING',
    listingDescription: 'Found a dog, write me on telegram, price 50 euro.',
    openReportsOnListing: 1,
    reporterId: null,
    notice: true,
    reason: 'ILLEGAL',
    note: 'This is somebody selling a dog, which the terms do not allow.',
    status: 'OPEN',
    closedAt: null,
    closedById: null,
    createdAt: '2026-10-02T11:00:00.000Z',
  },
];

type AuditEntry = Schemas['AuditListResponseDto']['items'][number];
const audit: AuditEntry[] = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    actorId: user.id,
    action: 'LISTING_APPROVE',
    listingId: listing.id,
    userId: null,
    shelterId: null,
    reason: null,
    createdAt: '2026-08-21T09:15:00.000Z',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    actorId: user.id,
    action: 'LISTING_REJECT',
    listingId: '44444444-4444-4444-4444-444444444444',
    userId: null,
    shelterId: null,
    reason: 'The same animal is already listed.',
    createdAt: '2026-08-20T17:02:00.000Z',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccd',
    actorId: user.id,
    action: 'USER_BLOCK',
    listingId: null,
    userId: 'e0000000-0000-0000-0000-000000000002',
    shelterId: null,
    reason: 'Kept posting puppies for sale after two rejections.',
    createdAt: '2026-09-30T18:20:00.000Z',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-ccccccccccce',
    actorId: user.id,
    action: 'SHELTER_CONSENT_RECORD',
    listingId: null,
    userId: null,
    shelterId: '99999999-9999-9999-9999-999999999999',
    reason: 'Email from the director, 1 September 2026',
    createdAt: '2026-09-01T15:30:00.000Z',
  },
];

const RECOVERY_CODES = Array.from({ length: 10 }, (_, i) => `demo-${String(i).padStart(4, '0')}`);

export const startMockApi = async () => {
  // set by a right password on the two-step address, spent by the code
  let challenged = false;

  const worker = setupWorker(
    http.get(`${API}/users/me`, () =>
      isSignedIn() ? HttpResponse.json({ user }) : unauthorized(),
    ),
    http.get(`${API}/users/me/export`, () =>
      isSignedIn()
        ? HttpResponse.json({
            exportedAt: new Date().toISOString(),
            user,
            listings: [],
            reports: [],
            sessions,
          })
        : unauthorized(),
    ),
    http.delete(`${API}/users/me`, async ({ request }) => {
      const body = (await request.json()) as { password?: string };
      if (body.password !== PASSWORD) return wrongPassword();
      setSignedIn(false);
      return HttpResponse.json({ ok: true });
    }),
    http.get(`${API}/users/me/sessions`, () =>
      isSignedIn() ? HttpResponse.json({ items: sessions }) : unauthorized(),
    ),
    http.post(`${API}/users/me/sessions/end`, async ({ request }) => {
      const body = (await request.json()) as { password?: string; sessionId?: string };
      if (body.password !== PASSWORD) return wrongPassword();
      sessions = sessions.filter((s) => s.current || (body.sessionId && s.id !== body.sessionId));
      return HttpResponse.json({ ok: true });
    }),

    // the demo signs a new account straight in as the moderator, which is the only way a
    // reviewer gets to see the moderation queue without a second account
    http.post(`${API}/auth/register`, () => {
      setSignedIn(true);
      return HttpResponse.json({ user }, { status: 201 });
    }),

    http.post(`${API}/auth/login`, async ({ request }) => {
      const body = (await request.json()) as { email: string; password: string };
      if (body.password !== PASSWORD) {
        return fail(401, 'INVALID_CREDENTIALS', 'email or password is incorrect');
      }
      if (body.email.toLowerCase() === TWO_STEP_EMAIL) {
        challenged = true;
        return HttpResponse.json({ mfaRequired: true, user: null });
      }
      setSignedIn(true);
      return HttpResponse.json({ mfaRequired: false, user });
    }),
    http.post(`${API}/auth/mfa/verify`, async ({ request }) => {
      const body = (await request.json()) as { code: string };
      if (!challenged) return fail(401, 'MFA_CHALLENGE_INVALID', 'sign in again');
      if (body.code !== CODE && !RECOVERY_CODES.includes(body.code)) return wrongCode();
      challenged = false;
      setSignedIn(true);
      return HttpResponse.json({ user });
    }),
    http.post(`${API}/auth/mfa/setup`, () =>
      HttpResponse.json({
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        uri: 'otpauth://totp/strays:demo?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=strays',
      }),
    ),
    http.post(`${API}/auth/mfa/enable`, async ({ request }) => {
      const body = (await request.json()) as { code: string };
      if (body.code !== CODE) return wrongCode();
      user = { ...user, mfaEnabled: true };
      return HttpResponse.json({ recoveryCodes: RECOVERY_CODES });
    }),
    http.post(`${API}/auth/mfa/disable`, async ({ request }) => {
      const body = (await request.json()) as { password: string; code: string };
      if (body.password !== PASSWORD) return wrongPassword();
      if (body.code !== CODE) return wrongCode();
      user = { ...user, mfaEnabled: false };
      return HttpResponse.json({ ok: true });
    }),
    http.post(`${API}/auth/mfa/recovery-codes`, async ({ request }) => {
      const body = (await request.json()) as { password: string; code: string };
      if (body.password !== PASSWORD) return wrongPassword();
      if (body.code !== CODE) return wrongCode();
      return HttpResponse.json({ recoveryCodes: RECOVERY_CODES });
    }),
    http.post(`${API}/auth/change-password`, async ({ request }) => {
      const body = (await request.json()) as { currentPassword: string };
      if (body.currentPassword !== PASSWORD) return wrongPassword();
      sessions = sessions.filter((s) => s.current);
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

    http.post(`${API}/listings/photos`, () =>
      isSignedIn()
        ? HttpResponse.json({ key: `listings/${crypto.randomUUID()}` }, { status: 201 })
        : unauthorized(),
    ),

    http.post(`${API}/listings`, async ({ request }) => {
      if (!isSignedIn()) return unauthorized();
      const body = (await request.json()) as CreateListing;
      const item: Listing = {
        ...listing,
        ...body,
        id: crypto.randomUUID(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      mine = [item, ...mine];
      return HttpResponse.json({ item }, { status: 201 });
    }),

    http.patch(`${API}/listings/:id`, async ({ request, params }) => {
      if (!isSignedIn()) return unauthorized();
      const body = (await request.json()) as Partial<CreateListing>;
      const item = change(String(params.id), { ...body, status: 'PENDING' });
      return item ? HttpResponse.json({ item }) : notFound();
    }),

    // the owner deletes with no reason, a moderator taking somebody else's down has to give one
    http.delete(`${API}/listings/:id`, ({ params }) => {
      if (!isSignedIn()) return unauthorized();
      mine = mine.filter((row) => row.id !== params.id);
      others = others.filter((row) => row.id !== params.id);
      return HttpResponse.json({ ok: true });
    }),

    http.post(`${API}/admin/listings/:id/approve`, ({ params }) => {
      if (!isSignedIn()) return unauthorized();
      const item = change(String(params.id), { status: 'APPROVED', rejectionReason: null });
      return item ? HttpResponse.json({ item }) : notFound();
    }),

    http.post(`${API}/admin/listings/:id/reject`, async ({ request, params }) => {
      if (!isSignedIn()) return unauthorized();
      const body = (await request.json()) as { reason?: string };
      if (!body.reason || body.reason.trim().length < 10) {
        return fail(422, 'REASON_REQUIRED', 'a rejection needs a reason');
      }
      const item = change(String(params.id), {
        status: 'REJECTED',
        rejectionReason: body.reason,
        photoKeys: [],
        photoUrls: [],
      });
      reports = reports.map((r) =>
        r.listingId === params.id && r.status === 'OPEN'
          ? { ...r, status: 'ACTIONED', closedAt: new Date().toISOString(), closedById: user.id }
          : r,
      );
      return item ? HttpResponse.json({ item }) : notFound();
    }),

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
      isSignedIn() ? HttpResponse.json({ items: mine }) : unauthorized(),
    ),
    http.get(`${API}/listings/:id`, ({ params }) => {
      const row = feed.find((candidate) => candidate.id === params.id) ?? listing;
      return HttpResponse.json({ item: summaryOf(row) });
    }),
    http.post(`${API}/listings/:id/report`, () => HttpResponse.json({ ok: true }, { status: 202 })),
    http.post(`${API}/notices`, () => HttpResponse.json({ ok: true }, { status: 202 })),

    http.get(`${API}/admin/audit`, ({ request }) => {
      const query = new URL(request.url).searchParams;
      const items = audit.filter(
        (entry) =>
          (!query.get('userId') || entry.userId === query.get('userId')) &&
          (!query.get('listingId') || entry.listingId === query.get('listingId')) &&
          (!query.get('shelterId') || entry.shelterId === query.get('shelterId')),
      );
      return HttpResponse.json({ items, total: items.length, page: 1, limit: 20 });
    }),

    http.get(`${API}/admin/reports`, ({ request }) => {
      const status = new URL(request.url).searchParams.get('status') ?? 'OPEN';
      const items = reports.filter((r) => r.status === status);
      return HttpResponse.json({ items, total: items.length, page: 1, limit: 20 });
    }),
    http.post(`${API}/admin/reports/:id/close`, async ({ request, params }) => {
      const body = (await request.json()) as { outcome: 'ACTIONED' | 'DISMISSED' };
      const report = reports.find((r) => r.id === params.id);
      if (!report) return notFound();
      if (report.status !== 'OPEN') return fail(409, 'ALREADY_CLOSED', 'already closed');
      reports = reports.map((r) =>
        r.id === params.id
          ? { ...r, status: body.outcome, closedAt: new Date().toISOString(), closedById: user.id }
          : r,
      );
      return HttpResponse.json({ ok: true });
    }),

    http.get(`${API}/admin/users`, ({ request }) => {
      const query = new URL(request.url).searchParams;
      const email = query.get('email')?.toLowerCase() ?? '';
      const items = accounts.filter(
        (a) => a.email.includes(email) && (query.get('blocked') !== 'true' || a.blockedAt !== null),
      );
      return HttpResponse.json({ items, total: items.length, page: 1, limit: 20 });
    }),
    http.post(`${API}/admin/users/:id/role`, async ({ request, params }) => {
      const body = (await request.json()) as { role: 'USER' | 'ADMIN' };
      const item = updateAccount(String(params.id), { role: body.role });
      return item ? HttpResponse.json({ item }) : notFound();
    }),
    http.post(`${API}/admin/users/:id/block`, async ({ request, params }) => {
      const body = (await request.json()) as { reason: string };
      const target = accounts.find((a) => a.id === params.id);
      if (target?.role === 'ADMIN') {
        return fail(403, 'FORBIDDEN', 'take the admin role away before blocking this account');
      }
      const item = updateAccount(String(params.id), {
        blockedAt: new Date().toISOString(),
        blockReason: body.reason,
      });
      return item ? HttpResponse.json({ item }) : notFound();
    }),
    http.post(`${API}/admin/users/:id/unblock`, ({ params }) => {
      const item = updateAccount(String(params.id), { blockedAt: null, blockReason: null });
      return item ? HttpResponse.json({ item }) : notFound();
    }),
    http.delete(`${API}/admin/users/:id/sessions`, () => HttpResponse.json({ ok: true })),
    http.post(`${API}/admin/users/:id/mfa/reset`, ({ params }) => {
      const item = updateAccount(String(params.id), { mfaEnabled: false });
      return item ? HttpResponse.json({ item }) : notFound();
    }),

    http.get(`${API}/shelters`, () =>
      HttpResponse.json({
        items: shelters.map(({ id, name, city, sourceUrl, createdAt }) => ({
          id,
          name,
          city,
          sourceUrl,
          createdAt,
        })),
      }),
    ),
    http.get(`${API}/admin/shelters`, () => HttpResponse.json({ items: shelters })),
    // before /admin/shelters/:id/import, for the same reason as /listings/mine above
    http.post(`${API}/admin/shelters/import`, () => {
      const ready = shelters.filter((s) => s.feedUrl && s.feedConsentAt && !s.importRunning);
      for (const shelter of ready) runImport(shelter.id);
      return HttpResponse.json({ shelters: ready.length }, { status: 202 });
    }),
    http.post(`${API}/admin/shelters`, async ({ request }) => {
      const body = (await request.json()) as Schemas['CreateShelterDto'];
      const item: Shelter = {
        id: crypto.randomUUID(),
        name: body.name,
        city: body.city,
        sourceUrl: body.sourceUrl ?? null,
        createdAt: new Date().toISOString(),
        feedUrl: body.feedUrl ?? null,
        feedConsentAt: null,
        feedConsentNote: null,
        lastImportAt: null,
        lastImport: null,
        importRunning: false,
      };
      shelters = [...shelters, item];
      return HttpResponse.json({ item }, { status: 201 });
    }),
    http.patch(`${API}/admin/shelters/:id`, async ({ request, params }) => {
      const body = (await request.json()) as Schemas['UpdateShelterDto'];
      const item = updateShelter(String(params.id), body);
      return item ? HttpResponse.json({ item }) : notFound();
    }),
    http.post(`${API}/admin/shelters/:id/consent`, async ({ request, params }) => {
      const body = (await request.json()) as { note: string };
      const item = updateShelter(String(params.id), {
        feedConsentAt: new Date().toISOString(),
        feedConsentNote: body.note,
      });
      return item ? HttpResponse.json({ item }) : notFound();
    }),
    http.delete(`${API}/admin/shelters/:id/consent`, ({ params }) => {
      updateShelter(String(params.id), { feedConsentAt: null, feedConsentNote: null });
      return HttpResponse.json({ removed: 4 });
    }),
    http.post(`${API}/admin/shelters/:id/import`, ({ params }) => {
      const shelter = shelters.find((s) => s.id === params.id);
      if (!shelter) return notFound();
      if (!shelter.feedConsentAt) return fail(409, 'NO_FEED_CONSENT', 'no consent recorded');
      if (shelter.importRunning) return fail(409, 'IMPORT_RUNNING', 'already importing');
      runImport(shelter.id);
      return HttpResponse.json({ ok: true }, { status: 202 });
    }),

    http.get(`${API}/admin/listings`, ({ request }) => {
      const status = new URL(request.url).searchParams.get('status') ?? 'PENDING';
      const items = [...mine, ...others].filter((row) => row.status === status);
      return HttpResponse.json({ items, total: items.length, page: 1, limit: 20 });
    }),

    // last on purpose: a route with no handler above gets an answer here instead of going
    // out over the network with whatever was typed into the form
    http.all(`${API}/*`, () => fail(501, 'UNKNOWN', 'not part of the demo')),
  );

  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
};
