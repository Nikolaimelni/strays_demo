import { describe, expect, it } from 'vitest';
import en from './en.json';
import pt from './pt.json';

// nothing at runtime notices a key present in one language and not the other.
// i18next falls back to English and the page just looks half translated.
const entries = (value: unknown, prefix = ''): [string, unknown][] => {
  if (typeof value !== 'object' || value === null) return [[prefix, value]];
  return Object.entries(value).flatMap(([key, child]) =>
    entries(child, prefix ? `${prefix}.${key}` : key),
  );
};

const keysOf = (bundle: unknown) =>
  entries(bundle)
    .map(([key]) => key)
    .sort();

describe('translations', () => {
  it('has the same keys in every language', () => {
    expect(keysOf(pt)).toEqual(keysOf(en));
  });

  it('has a non-empty string behind every key', () => {
    const bad = [...entries(en), ...entries(pt)].filter(
      ([, value]) => typeof value !== 'string' || value.trim() === '',
    );
    expect(bad).toEqual([]);
  });
});
