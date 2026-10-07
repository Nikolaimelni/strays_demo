import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render.tsx';
import { PrivacyPage } from './privacy-page.tsx';
import { TermsPage } from './terms-page.tsx';

// both pages build their keys by pasting a section name onto a prefix, so a
// renamed or dropped key is not a crash, a type error or a failing axe run.
// It is the literal string `legal.privacyKeepBody` sitting on a page that is
// supposed to be a privacy policy.
describe('legal pages', () => {
  it.each([
    ['privacy', <PrivacyPage key="privacy" />],
    ['terms', <TermsPage key="terms" />],
  ])('resolves every section on the %s page', (_name, element) => {
    const { container } = renderWithProviders(element);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/legal\.[A-Za-z]+/);
  });
});
