import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from './router';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Dashboard root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <Router />
  </StrictMode>,
);
