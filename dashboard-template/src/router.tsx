import { useEffect, useState, type ReactNode } from 'react';
import { LandingPage } from './pages/LandingPage';
import { ServersPage } from './pages/ServersPage';
import { NotFoundPage } from './pages/NotFoundPage';

export type DashboardRoute = '/' | '/app';

const ROUTES: ReadonlyArray<{ path: DashboardRoute; render: () => ReactNode }> = [
  { path: '/', render: () => <LandingPage /> },
  { path: '/app', render: () => <ServersPage /> },
];

export function navigate(path: DashboardRoute) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function Router() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const match = ROUTES.find((route) => route.path === path);
  return match ? match.render() : <NotFoundPage />;
}
