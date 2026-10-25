import { lazy, Suspense, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig, motion } from 'motion/react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/providers/ThemeProvider';

const LandingPage = lazy(() => import('@/features/workspace/pages/LandingPage').then(module => ({ default: module.LandingPage })));
const ServersPage = lazy(() => import('@/features/workspace/pages/ServersPage').then(module => ({ default: module.ServersPage })));
const NotFoundPage = lazy(() => import('@/features/workspace/pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })));
const queryClient = new QueryClient();

function RouteLoading() {
  return <div role="status" aria-live="polite" aria-busy="true" className="ambient-backdrop grid min-h-screen place-items-center p-6 text-sm text-muted-foreground"><div className="w-full max-w-xl rounded-3xl border border-border/70 bg-card/70 p-6 shadow-xl backdrop-blur-xl sm:p-8"><span className="text-xs font-medium uppercase tracking-[.18em] text-primary">Workspace</span><div className="mt-5 h-9 w-2/3 animate-pulse rounded-lg bg-secondary" /><div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-secondary" /><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">{[0,1,2].map(item => <div key={item} className="aspect-[1.25] animate-pulse rounded-xl bg-secondary" />)}</div></div></div>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef(new Map<string, number>());
  const previousLocationKey = useRef(location.key);

  useLayoutEffect(() => {
    scrollPositions.current.set(previousLocationKey.current, window.scrollY);
    previousLocationKey.current = location.key;
    const frame = window.requestAnimationFrame(() => {
      if (location.hash) {
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      } else if (navigationType === 'POP') {
        window.scrollTo(0, scrollPositions.current.get(location.key) ?? 0);
      } else {
        window.scrollTo(0, 0);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location, navigationType]);

  return <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="min-h-full">
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<ServersPage />} />
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </motion.div>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AnimatedRoutes />
          </TooltipProvider>
        </MotionConfig>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>;
}
