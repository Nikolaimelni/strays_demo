import { z } from 'zod';

// `KEY=` left in a .env file is somebody clearing a value, not setting it to an empty one
const unsetIfEmpty = (value: unknown) => (value === '' ? undefined : value);

export const envSchema = z
  .object({
    VITE_API_URL: z.url(),
    // the public build: msw answers the API in the browser and nothing is collected
    VITE_MOCK_API: z.preprocess(
      unsetIfEmpty,
      z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
    ),
    VITE_CONTACT_EMAIL: z.preprocess(unsetIfEmpty, z.email().optional()),
  })
  .refine((parsed) => parsed.VITE_MOCK_API || parsed.VITE_CONTACT_EMAIL !== undefined, {
    message: 'VITE_CONTACT_EMAIL is required unless the API is mocked',
    path: ['VITE_CONTACT_EMAIL'],
  });

// parse once, fail at boot, and keep every other file out of import.meta.env
export const env = envSchema.parse(import.meta.env);

export const isDemo = env.VITE_MOCK_API;
