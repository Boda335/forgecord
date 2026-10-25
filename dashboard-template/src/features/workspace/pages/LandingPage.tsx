import { useState } from 'react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ArrowRight, ArrowUpRight, Bot, Check, ChevronRight, CircleHelp, LockKeyhole, Server, Shield, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function LandingPage() {
  const [error, setError] = useState('');
  const signIn = () => { setError(''); window.location.href = '/auth/discord'; };

  return <div className="min-h-screen overflow-hidden bg-background text-foreground">
    <div className="ambient-backdrop" aria-hidden="true"><div className="ambient-grain" /></div>
    <SiteHeader onSignIn={signIn} />

    <main className="relative z-0 mx-auto max-w-7xl px-4 sm:px-6">
      <section className="grid min-h-[calc(100svh-5rem)] items-center gap-12 py-12 lg:grid-cols-[1fr_1.05fr] lg:py-16">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-6"><span className="h-1.5 w-1.5 rounded-full bg-success" />Discord-native workspace</Badge>
          <h1 className="type-display max-w-xl">Your Discord workspace, <span className="text-primary">finally under control.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">Forgecord turns server management into a focused control center. Connect with Discord, pick a server, and get straight to work.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4"><Button size="lg" onClick={signIn}>Continue with Discord<ArrowRight className="h-4 w-4" /></Button><span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4 text-primary" />OAuth only · no password to remember</span></div>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" />Secure Discord OAuth</span><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" />Fast workspace access</span><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" />Built for communities</span></div>
        </div>

        <Card className="relative overflow-hidden rounded-3xl p-2 shadow-2xl sm:p-3">
          <div className="absolute -end-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid min-h-[26rem] grid-cols-[10rem_1fr] overflow-hidden rounded-[1.35rem] border border-border/65 bg-background/60 max-sm:grid-cols-1">
            <aside className="hidden border-e border-border/65 bg-card/65 p-4 sm:block"><div className="mb-7 flex items-center gap-2 text-xs font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/12 text-primary"><Shield className="h-4 w-4" /></span>Forgecord</div><div className="space-y-1"><div className="flex items-center gap-2 rounded-lg bg-primary px-2.5 py-2 text-[11px] font-medium text-primary-foreground"><Sparkles className="h-3.5 w-3.5" />Overview</div><div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted-foreground"><Server className="h-3.5 w-3.5" />Servers</div><div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted-foreground"><Bot className="h-3.5 w-3.5" />Bots</div></div><div className="mt-20 flex items-center gap-2 border-t border-border/65 pt-4 text-[10px] text-muted-foreground"><span className="h-7 w-7 rounded-lg bg-primary/10" />Workspace user</div></aside>
            <div className="min-w-0 p-4 sm:p-5"><div className="flex items-center justify-between border-b border-border/65 pb-3 text-[10px] text-muted-foreground"><span>Workspace <ChevronRight className="mx-1 inline h-3 w-3" /> Overview</span><span className="flex gap-2"><CircleHelp className="h-3.5 w-3.5" /><span className="h-4 w-4 rounded-full bg-primary/15" /></span></div>
              <div className="py-5"><Badge variant="secondary" className="mb-2 text-[9px]">OVERVIEW</Badge><strong className="block font-display text-lg font-semibold">Good to see you.</strong><span className="mt-1 block text-[11px] text-muted-foreground">Your workspace is ready.</span></div>
              <div className="grid grid-cols-3 gap-2"><div className="rounded-xl border border-border/65 bg-card/80 p-2.5"><Server className="mb-2 h-3.5 w-3.5 text-primary" /><small className="block text-[9px] text-muted-foreground">Servers</small><b className="text-sm">12</b></div><div className="rounded-xl border border-border/65 bg-card/80 p-2.5"><Users className="mb-2 h-3.5 w-3.5 text-primary" /><small className="block text-[9px] text-muted-foreground">Members</small><b className="text-sm">2.4k</b></div><div className="rounded-xl border border-border/65 bg-card/80 p-2.5"><Shield className="mb-2 h-3.5 w-3.5 text-success" /><small className="block text-[9px] text-muted-foreground">Session</small><b className="text-sm">Secure</b></div></div>
              <div className="mt-3 rounded-xl border border-border/65 bg-card/75 p-3"><div className="mb-2 flex items-center justify-between"><b className="text-xs">Your servers</b><span className="text-[9px] text-muted-foreground">12 total</span></div>{['Arcadia', 'Nexus Community', 'Gaming Hub'].map((name, index) => <div key={name} className="flex items-center gap-2 border-t border-border/50 py-2"><span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-[9px] font-semibold text-primary">{name[0]}</span><b className="min-w-0 flex-1 truncate text-[10px]">{name}</b><span className="text-[9px] text-muted-foreground">{index === 0 ? 'Owner' : 'Manage'}</span></div>)}</div>
            </div>
          </div>
          <CardContent className="flex items-center justify-between gap-3 px-2 pb-1 pt-3 sm:px-3"><span className="inline-flex items-center gap-2 text-xs font-medium"><span className="h-1.5 w-1.5 rounded-full bg-success" />Discord session verified</span><Badge variant="success">LIVE</Badge></CardContent>
        </Card>
      </section>

      <section id="features" className="scroll-mt-20 border-t border-border/70 py-16 sm:py-20"><div className="mx-auto max-w-2xl text-center"><span className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Built for the workflow</span><h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything important, without the clutter.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">A compact command center that keeps the Discord context you need close and everything else out of the way.</p></div><div className="mt-9 grid gap-3 md:grid-cols-3">{[{ icon: Server, title: 'Server-first navigation', body: 'Find your communities quickly and jump directly into the workspace you need.' }, { icon: Bot, title: 'Built to grow', body: 'A scalable shell for bots, activity, automation and management tools as they arrive.' }, { icon: Shield, title: 'Discord-native security', body: 'Authentication stays with Discord OAuth, without a separate dashboard password.' }].map(({ icon: Icon, title, body }, index) => <Card key={title} className="p-5"><CardContent className="p-0"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><span className="font-data text-xs text-muted-foreground">0{index + 1}</span></div><h3 className="mt-5 font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></CardContent></Card>)}</div></section>

      <section id="workflow" className="scroll-mt-20 grid gap-8 border-t border-border/70 py-16 sm:py-20 lg:grid-cols-[.9fr_1.1fr]"><div><span className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Simple by design</span><h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">From Discord to dashboard in seconds.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">No onboarding maze. Connect your Discord account and start from the workspace that matters.</p></div><div className="grid gap-3 sm:grid-cols-3">{[['01', 'Connect', 'Authenticate securely with Discord.'], ['02', 'Choose', 'Select an available server.'], ['03', 'Manage', 'Use the tools available to you.']].map(([step, title, body]) => <Card key={step} className="p-4"><CardContent className="p-0"><span className="font-data text-xs text-primary">{step}</span><h3 className="mt-5 font-display text-base font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p></CardContent></Card>)}</div></section>

      <section id="security" className="scroll-mt-20 py-10"><Card className="flex flex-col items-start justify-between gap-6 rounded-3xl p-5 sm:flex-row sm:items-center sm:p-7"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Shield className="h-6 w-6" /></span><div><span className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Security by default</span><h2 className="mt-2 font-display text-xl font-semibold">Your Discord identity stays with Discord.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Forgecord uses Discord OAuth for sign-in and keeps the dashboard focused on workspace access.</p></div></div><Button variant="outline" onClick={signIn}>Enter workspace<ArrowUpRight className="h-4 w-4" /></Button></Card></section>
    </main>
    <SiteFooter />
  </div>;
}
