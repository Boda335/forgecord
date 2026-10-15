import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { DashboardSession, DiscordServer } from '../types';
import { Icon } from '../components/Icon';
import { navigate } from '../router';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StatCard } from '../components/ui/StatCard';
import { ServerCard } from '../components/ui/ServerCard';

export function ServersPage() {
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

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? servers.filter(s => s.name.toLowerCase().includes(q)) : servers;
  }, [search, servers]);

  const handleLogout = async () => { try { await api.logout(); } finally { navigate('/'); } };
  if (!session?.user && loading) return <div className="loading-screen"><div className="loader" /><span>Preparing your workspace…</span></div>;
  if (!session?.user) return null;

  const user = session.user;
  return <DashboardLayout user={user} onLogout={handleLogout}>
    <section className="page-hero">
      <div>
        <div className="eyebrow"><span className="status-dot" /> All systems operational</div>
        <h1>Good to see you, {user.globalName || user.username}.</h1>
        <p>Manage your Discord workspace from one clean control center.</p>
      </div>
      <button className="button button-primary" onClick={() => document.getElementById('servers')?.scrollIntoView({ behavior: 'smooth' })}><Icon name="server" size={16} /> Browse servers</button>
    </section>

    <section className="stats-grid">
      <StatCard icon="server" label="Available servers" value={servers.length} detail="Discord communities" />
      <StatCard icon="users" label="Access level" value="Member" detail="Discord verified" tone="blue" />
      <StatCard icon="shield" label="Session" value="Secure" detail="OAuth protected" tone="green" />
    </section>

    <section className="content-panel servers-panel servers-panel-wide" id="servers">
      <div className="panel-head">
        <div><span className="section-kicker">Workspace</span><h2>Your servers</h2><p>Select a server to continue.</p></div>
        <span className="count-pill">{servers.length} total</span>
      </div>

      {servers.length > 0 && <div className="server-toolbar">
        <label className="search-box-new"><Icon name="search" size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your servers…" aria-label="Search your servers" /><kbd>⌘ K</kbd></label>
      </div>}

      {loading ? <div className="state-inline"><div className="loader" /><span>Syncing with Discord…</span></div>
      : error ? <div className="state-inline state-error"><div className="state-symbol"><Icon name="x" /></div><strong>Couldn’t load servers</strong><span>{error}</span><button className="button button-ghost" onClick={load}>Try again</button></div>
      : filtered.length === 0 ? <div className="state-inline"><div className="state-symbol"><Icon name="search" /></div><strong>{servers.length ? 'No matching servers' : 'No servers found'}</strong><span>{servers.length ? 'Try a different search term.' : 'There are no Discord servers available for this account.'}</span></div>
      : <div className="server-grid-new">{filtered.map(server => <ServerCard key={server.id} server={server} />)}</div>}
    </section>

    <footer className="dashboard-footer"><span>Forgecord Control Center</span><span>Secure Discord workspace</span></footer>
  </DashboardLayout>;
}
