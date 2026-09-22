import { z } from 'zod';

// parse once, fail at boot, and keep every other file out of import.meta.env
export const env = z.object({ VITE_API_URL: z.url() }).parse(import.meta.env);
