import { useState } from 'react';
import { Icon } from '../components/Icon';

export function LandingPage() {
  const [error, setError] = useState('');
  const signIn = () => {
    setError('');
    window.location.href = '/auth/discord';
  };

  return <div className="landing-shell">
    <div className="landing-noise" />
    <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="ambient ambient-three" />

    <header className="landing-nav">
      <a className="brand" href="/">
        <span className="brand-mark"><Icon name="spark" size={17} /></span>
        <span className="brand-copy"><strong>Forgecord</strong><small>Control Center</small></span>
      </a>
      <nav className="landing-links" aria-label="Landing navigation">
        <a href="#features">Features</a><a href="#workflow">How it works</a><a href="#security">Security</a>
      </nav>
      <button className="landing-login" onClick={signIn}>Sign in <Icon name="arrow" size={14} /></button>
    </header>

    <main>
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="eyebrow"><span className="status-dot" /> Discord-native workspace</div>
          <h1>Your Discord workspace, <em>finally under control.</em></h1>
          <p>Forgecord turns server management into a focused control center. Connect with Discord, pick a server, and get straight to work.</p>
          <div className="landing-actions">
            <button className="button button-primary button-large" onClick={signIn}>Continue with Discord <Icon name="arrow" size={16} /></button>
            <span className="secure-note"><Icon name="shield" size={14} /> OAuth only · no password to remember</span>
          </div>
          {error && <div className="oauth-error">{error}</div>}
          <div className="hero-trust"><span><Icon name="check" size={13} /> Secure Discord OAuth</span><span><Icon name="check" size={13} /> Fast workspace access</span><span><Icon name="check" size={13} /> Built for communities</span></div>
        </div>

        <div className="landing-visual" aria-label="Forgecord dashboard preview">
          <div className="visual-glow" />
          <div className="dashboard-preview">
            <div className="preview-sidebar">
              <div className="preview-brand"><span><Icon name="spark" size={11}/></span><b>Forgecord</b></div>
              <div className="preview-nav active"><Icon name="dashboard" size={12}/> Overview</div>
              <div className="preview-nav"><Icon name="server" size={12}/> Servers</div>
              <div className="preview-nav"><Icon name="bot" size={12}/> Bots</div>
              <div className="preview-nav"><Icon name="activity" size={12}/> Activity</div>
              <div className="preview-spacer" />
              <div className="preview-user"><span /> <i>abdullah</i></div>
            </div>
            <div className="preview-main">
              <div className="preview-bar"><span>Workspace / Overview</span><i /><i /></div>
              <div className="preview-heading"><small>OVERVIEW</small><strong>Good to see you.</strong><span>Your workspace is ready.</span></div>
              <div className="preview-metrics"><div><Icon name="server" size={12}/><small>Servers</small><b>12</b></div><div><Icon name="users" size={12}/><small>Members</small><b>2.4k</b></div><div><Icon name="shield" size={12}/><small>Session</small><b>Secure</b></div></div>
              <div className="preview-workspace"><div className="preview-workspace-head"><b>Your servers</b><span>12 total</span></div><div className="preview-server-list"><i><span>A</span><b>Arcadia</b><em>Owner</em></i><i><span>N</span><b>Nexus Community</b><em>Member</em></i><i><span>G</span><b>Gaming Hub</b><em>Owner</em></i></div></div>
            </div>
          </div>
          <div className="preview-status"><span><i /> LIVE</span><b>Discord session verified</b><small>Everything looks good</small></div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="section-intro"><span className="section-kicker">Built for the workflow</span><h2>Everything important, without the clutter.</h2><p>A compact command center that keeps the Discord context you need close and everything else out of the way.</p></div>
        <div className="feature-grid">
          <article><div className="feature-icon"><Icon name="server" size={19}/></div><span>01</span><h3>Server-first navigation</h3><p>Find your communities quickly and jump directly into the workspace you need.</p></article>
          <article><div className="feature-icon blue"><Icon name="bot" size={19}/></div><span>02</span><h3>Built to grow</h3><p>A scalable shell for bots, activity, automation and management tools as they arrive.</p></article>
          <article><div className="feature-icon green"><Icon name="shield" size={19}/></div><span>03</span><h3>Discord-native security</h3><p>Authentication stays with Discord OAuth so your dashboard never needs a separate password.</p></article>
        </div>
      </section>

      <section className="landing-section workflow-section" id="workflow">
        <div className="workflow-copy"><span className="section-kicker">Simple by design</span><h2>From Discord to dashboard in seconds.</h2><p>No onboarding maze. No unnecessary forms. Connect your Discord account and start from the workspace that matters.</p></div>
        <div className="workflow-steps"><div><b>01</b><span>Connect</span><small>Authenticate securely with Discord.</small></div><div><b>02</b><span>Choose</span><small>Select one of your available servers.</small></div><div><b>03</b><span>Manage</span><small>Use the tools available to your workspace.</small></div></div>
      </section>

      <section className="landing-security" id="security">
        <div><div className="security-icon"><Icon name="shield" size={20}/></div><div><span className="section-kicker">Security by default</span><h2>Your Discord identity stays with Discord.</h2><p>Forgecord uses Discord OAuth for sign-in and keeps the dashboard focused on workspace access rather than collecting another password.</p></div></div>
        <button className="button button-ghost" onClick={signIn}>Enter workspace <Icon name="arrow" size={15}/></button>
      </section>
    </main>

    <footer className="landing-footer"><span>Forgecord Control Center</span><span>Secure by Discord OAuth</span><span>© 2026</span></footer>
  </div>;
}
