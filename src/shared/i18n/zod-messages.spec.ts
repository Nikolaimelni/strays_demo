import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { i18next } from './i18n.ts';

const schema = z.object({
  email: z.email(),
  name: z.string().trim().min(1),
  password: z.string().min(8),
  photos: z.array(z.string()).min(1),
});

const messagesFor = (value: unknown) => {
  const result = schema.safeParse(value);
  return (result.error?.issues ?? []).map((issue) => issue.message);
};

afterAll(async () => {
  await i18next.changeLanguage('en');
});

describe('validation messages', () => {
  it('names the problem rather than repeating zod', () => {
    expect(messagesFor({ email: 'nope', name: '', password: 'short', photos: [] })).toEqual([
      'That does not look like an email address.',
      'Required.',
      'At least 8 characters.',
      'Add at least 1.',
    ]);
  });

  it('follows the chosen language', async () => {
    await i18next.changeLanguage('pt');

    const messages = messagesFor({ email: 'a@b.pt', name: 'Ana', password: 'x', photos: ['k'] });
    expect(messages).toEqual(['Pelo menos 8 caracteres.']);
  });
});
