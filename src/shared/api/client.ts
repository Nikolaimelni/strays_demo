import createClient, { type Middleware } from 'openapi-fetch';
import { env } from '../../env.ts';
import type { paths } from './schema';

const REFRESH_PATH = '/auth/refresh';

// The refresh token rotates on use: the backend deletes the old one and hands
// back a new one atomically. so N parallel 401s must not become N refresh
// calls — the first would win and the rest would present a token that no
// longer exists, get 401 back, and log the user out. one shared promise.
let refreshInFlight: Promise<boolean> | null = null;

const refreshOnce = (): Promise<boolean> => {
  refreshInFlight ??= fetch(`${env.VITE_API_URL}${REFRESH_PATH}`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
};

// a Request body is consumed once sent, so the retry copy has to be taken
// before the first attempt
const pristine = new WeakMap<Request, Request>();

const retryOnceAfterRefresh: Middleware = {
  onRequest({ request }) {
    pristine.set(request, request.clone());
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) return response;
    if (new URL(request.url).pathname.endsWith(REFRESH_PATH)) return response;

    const original = pristine.get(request);
    if (!original) return response;

    const refreshed = await refreshOnce();
    if (!refreshed) return response;

    // plain fetch, not the client: this skips the middleware chain, so a
    // second 401 here cannot start another refresh round
    return fetch(original);
  },
};

export const api = createClient<paths>({
  baseUrl: env.VITE_API_URL,
  credentials: 'include',
  // late-bound: createClient captures globalThis.fetch at import time, which
  // msw can no longer swap out
  fetch: (request) => globalThis.fetch(request),
});

api.use(retryOnceAfterRefresh);

// exported for tests: module-level state otherwise leaks between cases
export const resetRefreshState = () => {
  refreshInFlight = null;
};
