import { z } from 'zod';

// parse once, fail at boot, and keep every other file out of import.meta.env
export const env = z
  .object({
    VITE_API_URL: z.url(),
    // the privacy policy tells people to write to it nine times over; a deploy that forgets
    // it should fail loudly here rather than ship a page pointing at example.com
    VITE_CONTACT_EMAIL: z.email(),
  })
  .parse(import.meta.env);
