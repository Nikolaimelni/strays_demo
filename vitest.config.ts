import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// no react compiler here: it is a production optimisation, and leaving it out
// keeps failures pointing at the source rather than at compiled output
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: { VITE_API_URL: 'http://localhost:3000', VITE_CONTACT_EMAIL: 'test@example.test' },
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
