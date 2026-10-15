'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const config = require('../../settings/config');
const { Logger } = require('../core/logger');
const { ROOT_DIR } = require('../core/paths');

const DISCORD_API = 'https://discord.com/api/v10';
const SESSION_COOKIE = 'forgecord_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24;

function createDashboardServer(bot = null) {
  const app = express();
  const dashboardRoot = path.join(ROOT_DIR, 'dashboard');
  const distRoot = path.join(dashboardRoot, 'dist');
  const sessions = new Map();

  function ensureDashboardBuild() {
    if (fs.existsSync(path.join(distRoot, 'index.html'))) return true;

    const autoBuild = process.env.DASHBOARD_AUTO_BUILD !== 'false';
    if (config.NODE_ENV === 'production' || !autoBuild) {
      Logger.error(`Dashboard build is missing: ${path.join(distRoot, 'index.html')}`);
      return false;
    }

    Logger.warn('Dashboard build is missing. Building the dashboard automatically for development...');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = spawnSync(npm, ['--prefix', dashboardRoot, 'run', 'build'], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      encoding: 'utf8',
      shell: false,
    });

    if (result.status === 0 && fs.existsSync(path.join(distRoot, 'index.html'))) {
      Logger.info('Dashboard production build completed successfully.');
      return true;
    }

    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    if (output) Logger.error('Dashboard build failed. Run `npm run dashboard:build` manually.', output);
    else Logger.error('Dashboard build failed. Run `npm run dashboard:build` manually.');
    return false;
  }

  const dashboardReady = ensureDashboardBuild();
  const oauthStates = new Map();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json());

  const getClientId = () => process.env.DISCORD_CLIENT_ID || config.ID || '';
  const getClientSecret = () => process.env.DISCORD_CLIENT_SECRET || '';

  function getDashboardUrl(req) {
    const configured = process.env.DASHBOARD_URL?.trim();
    if (configured) return configured.replace(/\/$/, '');
    return `${req.protocol}://${req.get('host')}`;
  }

  function getRedirectUri(req) {
    return process.env.DASHBOARD_REDIRECT_URI?.trim() || `${getDashboardUrl(req)}/auth/callback`;
  }

  function isSecureRequest(req) {
    return process.env.DASHBOARD_COOKIE_SECURE === 'true' || req.secure || getDashboardUrl(req).startsWith('https://');
  }

  function parseCookies(req) {
    const header = req.headers.cookie || '';
    return Object.fromEntries(header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
      const index = part.indexOf('=');
      return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    }));
  }

  function setSessionCookie(res, sessionId, secure) {
    const securePart = secure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${securePart}`);
  }

  function clearSessionCookie(res, secure) {
    const securePart = secure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${securePart}`);
  }

  function getSession(req) {
    const sessionId = parseCookies(req)[SESSION_COOKIE];
    if (!sessionId) return null;
    const session = sessions.get(sessionId);
    if (!session || session.expiresAt <= Date.now()) {
      sessions.delete(sessionId);
      return null;
    }
    session.expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    return session;
  }

  async function discordRequest(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    if (!response.ok) {
      const message = body?.message || body?.error_description || `Discord API returned ${response.status}.`;
      throw new Error(message);
    }
    return body;
  }

  app.get('/auth/discord', (req, res) => {
    const clientId = getClientId();
    const clientSecret = getClientSecret();
    if (!clientId || clientId === 'CLIENT_ID' || !clientSecret) {
      return res.status(503).send('Discord OAuth is not configured. Set ID (or DISCORD_CLIENT_ID) and DISCORD_CLIENT_SECRET in .env.');
    }

    const state = crypto.randomBytes(24).toString('hex');
    oauthStates.set(state, Date.now() + 10 * 60 * 1000);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: getRedirectUri(req),
      scope: 'identify guilds',
      state,
    });
    return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
  });

  app.get('/auth/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if (error) return res.redirect('/?oauth_error=cancelled');
    if (typeof code !== 'string' || typeof state !== 'string') return res.status(400).send('Missing OAuth code or state.');

    const expiresAt = oauthStates.get(state);
    oauthStates.delete(state);
    if (!expiresAt || expiresAt <= Date.now()) return res.status(400).send('The OAuth session expired. Please try signing in again.');

    try {
      const clientId = getClientId();
      const clientSecret = getClientSecret();
      const redirectUri = getRedirectUri(req);
      const token = await discordRequest(`${DISCORD_API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      });

      const [user, guilds] = await Promise.all([
        discordRequest(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bearer ${token.access_token}` } }),
        discordRequest(`${DISCORD_API}/users/@me/guilds`, { headers: { Authorization: `Bearer ${token.access_token}` } }),
      ]);

      const normalizedGuilds = Array.isArray(guilds) ? guilds.map(guild => ({
        id: String(guild.id),
        name: String(guild.name),
        icon: guild.icon || null,
        owner: Boolean(guild.owner),
        permissions: String(guild.permissions || '0'),
      })).sort((a, b) => a.name.localeCompare(b.name)) : [];

      const sessionId = crypto.randomBytes(32).toString('hex');
      sessions.set(sessionId, {
        user: {
          id: String(user.id),
          username: String(user.username || 'Discord User'),
          globalName: user.global_name ? String(user.global_name) : null,
          avatar: user.avatar ? String(user.avatar) : null,
        },
        guilds: normalizedGuilds,
        expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
      });

      setSessionCookie(res, sessionId, isSecureRequest(req));
      return res.redirect('/app');
    } catch (error) {
      Logger.error('Discord OAuth callback failed:', error);
      return res.redirect('/?oauth_error=failed');
    }
  });

  app.post('/auth/logout', (req, res) => {
    const sessionId = parseCookies(req)[SESSION_COOKIE];
    if (sessionId) sessions.delete(sessionId);
    clearSessionCookie(res, isSecureRequest(req));
    return res.json({ success: true });
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'forgecord-dashboard' }));

  app.get('/api/session', (req, res) => {
    const session = getSession(req);
    if (!session) return res.json({ authenticated: false, user: null });
    return res.json({ authenticated: true, user: session.user });
  });

  app.get('/api/servers', (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    return res.json(session.guilds);
  });

  app.get('/api/bot', (_req, res) => res.json({
    name: bot?.user?.username || 'Forgecord Bot',
    language: 'JavaScript',
    status: bot?.isReady?.() ? 'online' : 'starting',
    dashboard: 'enabled',
  }));

  if (config.options?.dashboardProduction !== false && dashboardReady) {
    app.use(express.static(distRoot));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
      res.sendFile(path.join(distRoot, 'index.html'), error => error ? next(error) : undefined);
    });
  } else if (config.options?.dashboardProduction !== false && !dashboardReady) {
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
      return res.status(503).send('Dashboard UI is not built. Run `npm run dashboard:build` or enable DASHBOARD_AUTO_BUILD=true in development.');
    });
  }

  return app;
}

function startDashboardServer(bot = null) {
  if (process.env.DASHBOARD_ENABLED !== 'true') return null;
  const port = Number(process.env.DASHBOARD_PORT || 3000);
  const host = process.env.DASHBOARD_HOST || '127.0.0.1';
  const app = createDashboardServer(bot);
  const server = app.listen(port, host, () => Logger.info(`Dashboard API listening on http://${host}:${port}`));
  server.on('error', error => Logger.error('Dashboard server error', error));
  return server;
}

module.exports = { createDashboardServer, startDashboardServer };
