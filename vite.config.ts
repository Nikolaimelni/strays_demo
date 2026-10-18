import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

// _headers is generated rather than committed so the CSP can name the real API
// origin. a placeholder would either block every request or get relaxed to *
// by whoever debugged it at 2am.
const pagesArtifacts = (mode: string): Plugin => {
  let outDir = 'dist';

  return {
    name: 'cloudflare-artifacts',
    apply: 'build',
    configResolved: (config) => {
      outDir = config.build.outDir;
    },
    closeBundle: async () => {
      // loadEnv and not process.env: a flag set in .env reaches the bundle but never
      // process.env, and the worker has to ship whenever the bundle is going to ask for it
      const buildEnv = loadEnv(mode, process.cwd(), '');
      const mock = buildEnv.VITE_MOCK_API === 'true';
      // the stock photos in public/demo are the demo's board, and a real deployment has no
      // business serving three megabytes of somebody else's dogs
      if (!mock) {
        await rm(join(outDir, 'mockServiceWorker.js'), { force: true });
        await rm(join(outDir, 'demo'), { recursive: true, force: true });
      }

      const apiUrl = buildEnv.VITE_API_URL;
      if (!apiUrl) throw new Error('VITE_API_URL is baked into the bundle and is missing');

      // connect-src below names this origin, so in the demo anything the mock misses would go
      // straight to it. a .invalid host never resolves, and the miss dies at DNS instead
      if (mock && !new URL(apiUrl).hostname.endsWith('.invalid')) {
        throw new Error('a mocked build wants VITE_API_URL on a .invalid host, not a real API');
      }

      // no VITE_ prefix: nothing in the app reads it, it only names the bucket
      // host for img-src. a wildcard over *.r2.cloudflarestorage.com would let
      // every other tenant's bucket through.
      const mediaUrl = buildEnv.MEDIA_ORIGIN;
      if (!mediaUrl) throw new Error('MEDIA_ORIGIN names the photo host in the CSP and is missing');

      // env.ts parses this too, but that runs in somebody's browser, by which point the
      // deploy has happened and the privacy page points at nothing. fail here instead.
      if (!mock && !buildEnv.VITE_CONTACT_EMAIL) {
        throw new Error('VITE_CONTACT_EMAIL is printed on the privacy page and is missing');
      }

      // msw's worker refetches everything it does not answer itself, map tiles included, and
      // a worker's own fetch is held to connect-src. without the tile host there the demo
      // map stays grey
      const tiles = 'https://*.tile.openstreetmap.org';
      const apiOrigin = new URL(apiUrl).origin;
      const connect = mock ? `${apiOrigin} ${tiles}` : apiOrigin;

      const csp = [
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self'",
        // leaflet writes inline styles on every pane and marker it creates, so
        // there is no version of this without unsafe-inline. scripts are clean.
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob: ${tiles} ${new URL(mediaUrl).origin}`,
        `connect-src 'self' ${connect}`,
        'upgrade-insecure-requests',
      ].join('; ');

      const headers = [
        '/*',
        '  X-Content-Type-Options: nosniff',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        '  X-Frame-Options: DENY',
        '  Permissions-Policy: geolocation=(), camera=(), microphone=()',
        '  Cross-Origin-Opener-Policy: same-origin',
        '  Cross-Origin-Resource-Policy: same-origin',
        '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
        `  Content-Security-Policy: ${csp}`,
        '',
        // a listing is somebody else's photographs and somebody else's animal, and the
        // contact behind it is rate limited per account precisely so the board cannot be
        // harvested. an index of every listing page undoes half of that. see
        // public/robots.txt for the other half of this.
        '/listings/*',
        '  X-Robots-Tag: noindex, nofollow',
        '',
      ].join('\n');

      await writeFile(join(outDir, '_headers'), headers, 'utf8');
    },
  };
};

export default defineConfig(({ mode }) => ({
  // plugin-react v6 runs the compiler through oxc, so no babel plugin here
  plugins: [react({ compiler: true }), tailwindcss(), pagesArtifacts(mode)],
  server: { port: 5173 },
}));
