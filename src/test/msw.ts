import { setupServer } from 'msw/node';

// no default handlers: every test declares the calls it expects, and setup.ts
// fails on anything unhandled rather than letting it look like a pass
export const server = setupServer();
