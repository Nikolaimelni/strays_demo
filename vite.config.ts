import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

// msw's service worker has to sit in public/ to be served at the root, which
// also means vite copies it into every build. it's inert without the flag,
// but shipping 12 kB of mocking machinery to production is still wrong.
// both build plugins below write into the output directory, so they have to
// ask vite where that actually is rather than assume the default name
let outDir = 'dist';
const trackOutDir = (): Plugin => ({
  name: 'track-out-dir',
  apply: 'build',
  configResolved: (config) => {
    outDir = config.build.outDir;
  },
});

const dropMockWorker = (mode: string): Plugin => ({
  name: 'drop-mock-worker',
  apply: 'build',
  closeBundle: async () => {
    // loadEnv and not process.env: a flag set in .env reaches the bundle but never
    // process.env, and the worker has to ship whenever the bundle is going to ask for it
    if (loadEnv(mode, process.cwd(), '').VITE_MOCK_API === 'true') return;
    await rm(join(outDir, 'mockServiceWorker.js'), { force: true });
  },
});

// Cloudflare Pages reads dist/_headers. Generating it rather than committing a
// static copy is the only way connect-src can name the real API origin: a
// hard-coded placeholder there would silently block every request the moment
// it shipped, and a CSP that has to be edited by hand after each deploy is a
// CSP that ends up wrong.
const securityHeaders = (mode: string): Plugin => ({
  name: 'security-headers',
  apply: 'build',
  closeBundle: async () => {
    const apiUrl = loadEnv(mode, process.cwd(), '').VITE_API_URL;
    // named rather than left to `new URL('')`, which fails with "Invalid URL"
    // and no hint about which variable nobody set
    if (!apiUrl) {
      throw new Error('VITE_API_URL is required for a build: it is baked into the bundle');
    }
    const apiOrigin = new URL(apiUrl).origin;
    const csp = [
      "default-src 'self'",
      "base-uri 'none'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      // no unsafe-inline for scripts: that is the directive doing the actual
      // work against injected markup
      "script-src 'self'",
      // leaflet positions tiles with inline styles, so this one has no choice
      "style-src 'self' 'unsafe-inline'",
      // blob: covers the local previews shown before an upload finishes
      `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.r2.cloudflarestorage.com`,
      `connect-src 'self' ${apiOrigin}`,
      'upgrade-insecure-requests',
    ].join('; ');

    const headers = [
      '/*',
      '  X-Content-Type-Options: nosniff',
      '  Referrer-Policy: strict-origin-when-cross-origin',
      '  X-Frame-Options: DENY',
      '  Permissions-Policy: geolocation=(), camera=(), microphone=()',
      '  Cross-Origin-Opener-Policy: same-origin',
      `  Content-Security-Policy: ${csp}`,
      '',
    ].join('\n');

    await writeFile(join(outDir, '_headers'), headers, 'utf8');
  },
});

export default defineConfig(({ mode }) => ({
  // plugin-react v6 runs the React Compiler through oxc, not babel, so the
  // old babel-plugin-react-compiler wiring doesn't apply here
  plugins: [
    react({ compiler: true }),
    tailwindcss(),
    trackOutDir(),
    dropMockWorker(mode),
    securityHeaders(mode),
  ],
  server: { port: 5173 },
}));
