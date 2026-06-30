import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../test/msw.ts';
import { api, resetRefreshState } from './client.ts';

const API = 'http://localhost:3000';

describe('api client token refresh', () => {
  beforeEach(() => resetRefreshState());
  afterEach(() => resetRefreshState());

  it('refreshes once for many parallel 401s, then retries each call', async () => {
    let refreshCalls = 0;
    let authorized = false;

    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        authorized = true;
        return HttpResponse.json({ ok: true });
      }),
      http.get(`${API}/users/me`, () => {
        if (!authorized) {
          return HttpResponse.json({ code: 'UNAUTHORIZED', message: 'nope' }, { status: 401 });
        }
        return HttpResponse.json({
          user: {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'a@b.c',
            name: 'A',
            role: 'USER',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        });
      }),
    );

    const results = await Promise.all(Array.from({ length: 5 }, () => api.GET('/users/me')));

    expect(refreshCalls).toBe(1);
    for (const result of results) {
      expect(result.error).toBeUndefined();
      expect(result.data?.user.email).toBe('a@b.c');
    }
  });

  it('gives up after one retry when the refresh itself fails', async () => {
    let refreshCalls = 0;
    let meCalls = 0;

    server.use(
      http.post(`${API}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ code: 'REFRESH_TOKEN_INVALID', message: 'no' }, { status: 401 });
      }),
      http.get(`${API}/users/me`, () => {
        meCalls += 1;
        return HttpResponse.json({ code: 'UNAUTHORIZED', message: 'nope' }, { status: 401 });
      }),
    );

    const { error } = await api.GET('/users/me');

    expect(error).toBeDefined();
    expect(refreshCalls).toBe(1);
    expect(meCalls).toBe(1);
  });
});
