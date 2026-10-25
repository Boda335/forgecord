import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, CircleHelp, LogOut, Menu, Server, Shield, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeControls } from './ThemeControls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DashboardUser } from '@/features/workspace/types';
import{Icon} from '@/components/ui/Icon'
type Props = { user: DashboardUser; children: ReactNode; onLogout: () => void };

export function DashboardLayout({ user, children, onLogout }: Props) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = (user.globalName?.trim() || user.username).slice(0, 1).toUpperCase() || '?';
  const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : undefined;

  return <div className="min-h-screen bg-background text-foreground">
    <div className="ambient-backdrop" aria-hidden="true"><div className="ambient-grain" /></div>
    {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-background/75 backdrop-blur-sm lg:hidden" />}
    <aside className={`fixed inset-y-0 start-0 z-50 flex w-[17rem] flex-col border-e border-border/70 bg-sidebar-background/90 p-4 shadow-xl backdrop-blur-2xl transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : 'max-lg:-translate-x-full'}`}>
      <div className="flex h-14 items-center justify-between px-2">
        <a href="/app" onClick={event => { event.preventDefault(); navigate('/app'); }} className="flex items-center gap-3 rounded-xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-primary/25 bg-primary/12 text-primary"><Icon name="logo" className="h-5 w-5" /></span>
          <span><strong className="block font-display text-sm font-semibold">Forgecord</strong><small className="text-xs text-muted-foreground">Control Center</small></span>
        </a>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></Button>
      </div>

      <div className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Workspace</div>
      <nav aria-label="Main navigation" className="glass rounded-2xl p-2">
        <Button variant="default" className="w-full justify-start gap-3"><Server className="h-4 w-4" />Servers<span className="ms-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/70" /></Button>
      </nav>

      <div className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">More tools</div>
      <div className="space-y-1">
        {['Bots', 'Activity'].map(label => <Button key={label} variant="ghost" disabled className="w-full justify-start gap-3 text-muted-foreground"><Server className="h-4 w-4" />{label}<span className="ms-auto text-[10px]">Soon</span></Button>)}
      </div>

      <div className="mt-auto space-y-3 pt-6">
        <Card className="flex items-start gap-3 rounded-2xl p-3 shadow-none"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Shield className="h-4 w-4" /></span><span><strong className="block text-xs font-semibold">Discord secured</strong><small className="mt-1 block text-[11px] leading-4 text-muted-foreground">Your session is protected by Discord OAuth.</small></span></Card>
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-3 text-start transition-colors hover:border-primary/30 hover:bg-primary/5">
          <Avatar className="h-9 w-9 rounded-xl"><AvatarImage src={avatarUrl} alt="" /><AvatarFallback className="rounded-xl bg-primary/12 text-sm font-semibold text-primary">{initials}</AvatarFallback></Avatar>
          <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{user.globalName || user.username}</strong><small className="block truncate text-[11px] text-muted-foreground">@{user.username}</small></span>
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </aside>

    <main className="relative z-0 min-h-screen lg:ps-[17rem]">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></Button>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><span>Workspace</span><ChevronRight className="h-3.5 w-3.5" /><strong className="truncate font-medium text-foreground">Servers</strong></div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeControls /><Button variant="ghost" size="icon" aria-label="Help"><CircleHelp /></Button>
            <Button variant="ghost" size="icon" aria-label="Notifications"><Bell /></Button>
            <div className="hidden items-center gap-2 rounded-xl border border-border/70 bg-card/70 py-1 ps-1 pe-3 sm:flex"><Avatar className="h-8 w-8 rounded-lg"><AvatarImage src={avatarUrl} alt="" /><AvatarFallback className="rounded-lg bg-primary/12 text-xs text-primary">{initials}</AvatarFallback></Avatar><span className="max-w-36 truncate text-xs font-medium">{user.globalName || user.username}</span></div>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </div>
    </main>
  </div>;
}
