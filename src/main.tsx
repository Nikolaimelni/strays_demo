import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/app.tsx';
import { i18next } from './shared/i18n/i18n.ts';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');

const start = async () => {
  let ready = true;
  if (import.meta.env.VITE_MOCK_API === 'true') {
    // a private window or an in-app browser can refuse the worker, and without it the demo
    // has no api at all. a sentence saying so beats a blank page
    ready = await import('./features/demo/mock-api.ts')
      .then(({ startMockApi }) => startMockApi())
      .then(
        () => true,
        () => false,
      );
  }

  createRoot(root).render(
    <StrictMode>
      {ready ? (
        <App />
      ) : (
        <p className="mx-auto max-w-prose px-4 py-16 text-muted">{i18next.t('demo.noWorker')}</p>
      )}
    </StrictMode>,
  );
};

void start();
