# strays

https://strays-demo.nikolai-melnichenko-fe.workers.dev

**This is a demo.** The backend is still in development, so for now msw answers every API
call from a service worker inside your browser, and nothing you type is sent or stored. A
banner on every page says the same.

The idea is a board for found, lost and adoptable animals around Lisbon, all on one map.
People post directly, shelters that agreed send a feed, and a moderator sees a listing
before the public does. The API is a separate repo.

React 19 on Vite, React Router in data mode, TanStack Query, Tailwind v4, Leaflet, msw.

```
pnpm install
pnpm demo
```

That builds the demo and opens it on `localhost:4174`. Sign in with any email and the
password `demo`, or register, which makes you a moderator. `two-step@example.com`
asks for a code, `123456`. Everything resets when the tab reloads.

`pnpm dev` with `.env.example` copied to `.env` runs against the real API instead, which
has to be up. `pnpm test` and `pnpm e2e` need neither.

A few things worth a look: one shared refresh promise in `shared/api/client.ts` so five
401s make one refresh call, the map and the URL kept in sync in
`features/map/viewport-sync.tsx`, and a CSP generated at build time in `vite.config.ts`.
The map stays off until you turn it on, because its tiles are the one request that goes
to somebody else.

Photos on the demo board are Unsplash stock, credited in `public/demo/CREDITS.md`. The
fonts are Inter and Fraunces under the OFL, licences next to the files.
