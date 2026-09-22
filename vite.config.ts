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
      if (buildEnv.VITE_MOCK_API !== 'true') {
        await rm(join(outDir, 'mockServiceWorker.js'), { force: true });
      }

      const apiUrl = buildEnv.VITE_API_URL;
      if (!apiUrl) throw new Error('VITE_API_URL is baked into the bundle and is missing');

      const csp = [
        "default-src 'self'",
        "base-uri 'none'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.r2.cloudflarestorage.com",
        `connect-src 'self' ${new URL(apiUrl).origin}`,
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
  };
};

export default defineConfig(({ mode }) => ({
  // plugin-react v6 runs the compiler through oxc, so no babel plugin here
  plugins: [react({ compiler: true }), tailwindcss(), pagesArtifacts(mode)],
  server: { port: 5173 },
}));
