import { ArrowUpRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeControls } from './ThemeControls';

export function SiteHeader({ onSignIn }: { onSignIn: () => void }) {
  return <header className="relative z-10 mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
    <a href="/" className="flex items-center gap-3 rounded-xl"><span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><Shield className="h-5 w-5" /></span><span><strong className="block font-display text-sm font-semibold">Forgecord</strong><small className="text-xs text-muted-foreground">Control Center</small></span></a>
    <nav className="hidden items-center gap-1 rounded-xl border border-border/70 bg-card/65 p-1 md:flex" aria-label="Landing navigation"><a className="rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-primary/5 hover:text-foreground" href="#features">Features</a><a className="rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-primary/5 hover:text-foreground" href="#workflow">How it works</a><a className="rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-primary/5 hover:text-foreground" href="#security">Security</a></nav>
    <div className="flex items-center gap-1"><ThemeControls /><Button variant="outline" onClick={onSignIn}>Sign in<ArrowUpRight className="h-4 w-4" /></Button></div>
  </header>;
}
