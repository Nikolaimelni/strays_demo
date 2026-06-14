import { z } from 'zod';

// same idea as the backend's env.ts: parse once, fail loudly, and keep every
// other file out of import.meta.env
const schema = z.object({
  VITE_API_URL: z.url(),
  // only ever 'true' in the e2e build, and the mock module is behind it
  VITE_MOCK_API: z.enum(['true', 'false']).optional(),
});

export const env = schema.parse(import.meta.env);
