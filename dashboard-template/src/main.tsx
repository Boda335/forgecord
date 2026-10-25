import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/manrope';
import './styles/index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Dashboard root element was not found.');

createRoot(root).render(
  <StrictMode>
    <Suspense fallback={<div role="status" aria-live="polite" aria-busy="true" className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading Forgecord dashboard…</div>}>
      <App />
    </Suspense>
  </StrictMode>,
);
