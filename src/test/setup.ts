import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw.ts';

// jsdom has no layout and throws on scrolling rather than ignoring it. The
// pagination genuinely scrolls, and the throw comes out of an event handler,
// which vitest reports as an unhandled error: every test green, exit code 1.
beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.scrollTo = () => {};
    Element.prototype.scrollIntoView = () => {};
  }
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
