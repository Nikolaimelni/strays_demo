import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/app.tsx';
import './shared/i18n/i18n.ts';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');

const start = async () => {
  if (import.meta.env.VITE_MOCK_API === 'true') {
    const { startMockApi } = await import('./test/browser-mock.ts');
    await startMockApi();
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

void start();
