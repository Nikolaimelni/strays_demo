import { describe, expect, it } from 'vitest';
import { envSchema } from './env.ts';

const api = { VITE_API_URL: 'https://api.example.com' };

describe('env', () => {
  it('wants a contact address from a build that talks to a real api', () => {
    expect(envSchema.safeParse(api).success).toBe(false);
    expect(envSchema.safeParse({ ...api, VITE_CONTACT_EMAIL: 'hi@example.com' }).success).toBe(
      true,
    );
  });

  it('lets the demo go without one', () => {
    const parsed = envSchema.parse({ ...api, VITE_MOCK_API: 'true' });

    expect(parsed.VITE_MOCK_API).toBe(true);
    expect(parsed.VITE_CONTACT_EMAIL).toBeUndefined();
  });

  // what a .env looks like after somebody deletes the value and keeps the key
  it('reads an empty value as unset', () => {
    const cleared = { ...api, VITE_MOCK_API: '', VITE_CONTACT_EMAIL: 'hi@example.com' };
    expect(envSchema.parse(cleared).VITE_MOCK_API).toBe(false);

    const demo = { ...api, VITE_MOCK_API: 'true', VITE_CONTACT_EMAIL: '' };
    expect(envSchema.safeParse(demo).success).toBe(true);
    expect(envSchema.safeParse({ ...api, VITE_CONTACT_EMAIL: '' }).success).toBe(false);
  });

  it('refuses a flag it cannot read', () => {
    expect(envSchema.safeParse({ ...api, VITE_MOCK_API: 'yes' }).success).toBe(false);
  });
});
