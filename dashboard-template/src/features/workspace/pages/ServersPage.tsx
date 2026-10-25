import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bot, Search, Server, Shield, Sparkles } from 'lucide-react';
import{Icon} from '@/components/ui/Icon'
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '../lib/api';
import type { DashboardSession, DiscordServer } from '../types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WorkspaceFooter } from '@/components/layout/WorkspaceFooter';

function ServerTile({ server }: { server: DiscordServer }) {
  const icon = server.icon ? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=128` : null;
  return <button type="button" className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border/70 bg-card/75 p-3 text-start shadow-sm transition-[border-color,background,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card sm:gap-4 sm:p-4">
    {icon ? <img src={icon} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 font-display text-lg font-semibold text-primary">{server.name.slice(0, 1).toUpperCase()}</span>}
    <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold">{server.name}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{server.owner ? 'Server owner' : 'Bot management permission'}</span></span>
    <Badge variant={server.owner ? 'default' : 'secondary'} className="hidden shrink-0 sm:inline-flex">{server.owner ? <Shield className="h-3 w-3" /> : <Bot className="h-3 w-3" />}{server.owner ? 'Owner' : 'Can add bot'}</Badge>
    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
  </button>;
}

export function ServersPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    Promise.all([api.getSession(), api.getServers()])
      .then(([currentSession, currentServers]) => {
        if (!currentSession.authenticated || !currentSession.user) { navigate('/'); return; }
        setSession(currentSession); setServers(currentServers);
      })
      .catch((reason: Error) => {
        if (/401|unauthorized|authentication/i.test(reason.message)) navigate('/');
        else setError(reason.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? servers.filter(server => server.name.toLowerCase().includes(query)) : servers;
  }, [search, servers]);
  const handleLogout = async () => { try { await api.logout(); } finally { navigate('/'); } };

  if (!session?.user && loading) return <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground"><div className="flex items-center gap-3"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />Preparing your workspace…</div></div>;
  if (!session?.user) return null;

  const user = session.user;
  return <DashboardLayout user={user} onLogout={handleLogout}>
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end">
        <div><div className="mb-3 flex items-center gap-2 text-xs font-medium text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" />All systems operational</div><h1 className="type-page-title">Good to see you, {user.globalName || user.username}.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage your Discord workspace from one clean control center.</p></div>
        <Button onClick={() => document.getElementById('servers')?.scrollIntoView({ behavior: 'smooth' })}><Server className="h-4 w-4" />Browse servers</Button>
      </header>

      <section aria-label="Workspace summary" className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-4 sm:p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Server className="h-5 w-5" /></span><span><span className="block text-xs text-muted-foreground">Available servers</span><strong className="mt-1 block font-display text-2xl font-semibold tabular-nums">{servers.length}</strong><span className="text-[11px] text-muted-foreground">Discord communities</span></span></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4 sm:p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Bot className="h-5 w-5" /></span><span><span className="block text-xs text-muted-foreground">Eligible servers</span><strong className="mt-1 block font-display text-2xl font-semibold tabular-nums">{servers.length}</strong><span className="text-[11px] text-muted-foreground">You can add the bot</span></span></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4 sm:p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-success/10 text-success"><Shield className="h-5 w-5" /></span><span><span className="block text-xs text-muted-foreground">Session</span><strong className="mt-1 block font-display text-2xl font-semibold">Secure</strong><span className="text-[11px] text-muted-foreground">OAuth protected</span></span></CardContent></Card>
      </section>

      <Card id="servers" className="scroll-mt-24">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-4 sm:p-6">
          <div><Badge variant="secondary" className="mb-3"><Sparkles className="h-3 w-3" />Workspace</Badge><CardTitle>Your servers</CardTitle><CardDescription className="mt-1.5">Only servers you own or can manage bots in are shown here.</CardDescription></div>
          <Badge variant="outline">{servers.length} total</Badge>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {servers.length > 0 && <label className="relative mb-4 block max-w-sm"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search your servers…" aria-label="Search your servers" className="ps-9" /></label>}
          {loading ? <div role="status" className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted-foreground"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />Syncing with Discord…</div>
            : error ? <div className="grid min-h-44 place-items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 text-center"><Shield className="h-6 w-6 text-destructive" /><strong className="text-sm">Couldn’t load servers</strong><span className="text-xs text-muted-foreground">{error}</span><Button variant="outline" size="sm" onClick={load}>Try again</Button></div>
            : filtered.length === 0 ? <div className="grid min-h-44 place-items-center gap-2 rounded-2xl border border-dashed border-border px-4 text-center"><Search className="h-5 w-5 text-muted-foreground" /><strong className="text-sm">{servers.length ? 'No matching servers' : 'No servers found'}</strong><span className="text-xs text-muted-foreground">{servers.length ? 'Try a different search term.' : 'No servers found where you own the server or have permission to add bots.'}</span></div>
            : <div className="grid gap-3 md:grid-cols-2">{filtered.map(server => <ServerTile key={server.id} server={server} />)}</div>}
        </CardContent>
      </Card>

      <WorkspaceFooter />
    </div>
  </DashboardLayout>;
}
