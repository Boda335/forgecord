import { useState, type ReactNode } from 'react';
import type { DashboardUser } from '../../types';
import { Icon, type IconName } from '../Icon';
import { navigate } from '../../router';

type NavItem = { label: string; icon: IconName; path: '/app' };

const navItems: NavItem[] = [
  { label: 'Overview', icon: 'dashboard', path: '/app' },
];

type Props = { user: DashboardUser; children: ReactNode; onLogout: () => void };

export function DashboardLayout({ user, children, onLogout }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = user.globalName?.trim().slice(0, 1) || user.username.slice(0, 1) || '?';
  const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : null;

  return (
    <div className="dashboard-shell">
      <div className={`mobile-backdrop ${mobileOpen ? 'is-open' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-head">
          <a className="brand" href="/app" onClick={(e) => { e.preventDefault(); navigate('/app'); setMobileOpen(false); }}>
            <span className="brand-mark"><Icon name="spark" size={17} /></span>
            <span className="brand-copy"><strong>Forgecord</strong><small>Control Center</small></span>
          </a>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><Icon name="x" /></button>
        </div>

        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(item => (
            <a key={item.label} className="nav-item active" href={item.path} onClick={(e) => { e.preventDefault(); navigate(item.path); setMobileOpen(false); }}>
              <Icon name={item.icon} size={17} /><span>{item.label}</span><span className="nav-active-dot" />
            </a>
          ))}
        </nav>

        <div className="sidebar-label sidebar-label-spaced">Management</div>
        <div className="sidebar-nav">
          <button className="nav-item nav-disabled" title="Coming soon"><Icon name="server" size={17} /><span>Servers</span><span className="nav-soon">Soon</span></button>
          <button className="nav-item nav-disabled" title="Coming soon"><Icon name="bot" size={17} /><span>Bots</span><span className="nav-soon">Soon</span></button>
          <button className="nav-item nav-disabled" title="Coming soon"><Icon name="activity" size={17} /><span>Activity</span><span className="nav-soon">Soon</span></button>
        </div>

        <div className="sidebar-spacer" />
        <div className="sidebar-card">
          <div className="sidebar-card-icon"><Icon name="shield" size={16} /></div>
          <div><strong>Discord secured</strong><span>Your session is protected by Discord OAuth.</span></div>
        </div>
        <button className="sidebar-user" onClick={onLogout}>
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback">{initials.toUpperCase()}</span>}
          <span className="sidebar-user-copy"><strong>{user.globalName || user.username}</strong><small>@{user.username}</small></span>
          <Icon name="logout" size={16} />
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={13} /><strong>Overview</strong></div>
          <div className="topbar-actions">
            <button className="top-icon" aria-label="Help"><Icon name="help" size={17} /></button>
            <button className="top-icon" aria-label="Notifications"><Icon name="bell" size={17} /><span className="notification-dot" /></button>
            <div className="top-user">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback">{initials.toUpperCase()}</span>}
              <span>{user.globalName || user.username}</span>
            </div>
          </div>
        </header>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
