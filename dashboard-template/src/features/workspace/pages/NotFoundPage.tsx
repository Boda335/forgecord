import { Link } from 'react-router-dom';
import { ThemeControls } from '@/components/layout/ThemeControls';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function NotFoundPage() {
  return <div className="min-h-screen bg-background text-foreground"><div className="mx-auto flex max-w-7xl justify-end px-4 pt-4"><ThemeControls /></div><main className="grid min-h-[calc(100svh-5rem)] place-items-center p-4"><Card className="w-full max-w-md rounded-3xl p-6 text-center sm:p-8"><CardContent className="p-0"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><SearchX className="h-6 w-6" /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[.14em] text-primary">404 · Not found</p><h1 className="mt-2 font-display text-2xl font-semibold">This page isn’t here.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">The address may be incorrect, or this page may have moved.</p><Button asChild className="mt-6"><Link to="/"><ArrowLeft className="h-4 w-4" />Back to home</Link></Button></CardContent></Card></main><SiteFooter /></div>;
}
