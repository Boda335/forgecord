'use strict';

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const config = require('../../settings/config');
const { Logger } = require('../core/logger');
const { ROOT_DIR } = require('../core/paths');

const DISCORD_API = 'https://discord.com/api/v10';
const SESSION_COOKIE = 'forgecord_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24;

function createDashboardServer(bot = null) {
  const app = express();
  const distRoot = path.join(ROOT_DIR, 'dashboard', 'dist');
  const sessions = new Map();
  const oauthStates = new Map();
  const OAUTH_STATE_COOKIE = 'forgecord_oauth_state';
  const requestBuckets = new Map();
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, expiry] of oauthStates) if (expiry <= now) oauthStates.delete(key);
    for (const [key, session] of sessions) if (session.expiresAt <= now) sessions.delete(key);
    for (const [key, bucket] of requestBuckets) if (bucket.resetAt <= now) requestBuckets.delete(key);
  }, 60_000);
  cleanupTimer.unref?.();


  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (req.path.startsWith('/auth/')) {
      const key = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      let bucket = requestBuckets.get(key);
      if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + 60_000 };
      bucket.count += 1;
      requestBuckets.set(key, bucket);
      if (bucket.count > 30) return res.status(429).json({ error: 'Too many authentication requests. Try again shortly.' });
    }
    next();
  });
  app.use(express.json({ limit: '100kb' }));

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
    const securePart = isSecureRequest(req) ? '; Secure' : '';
    oauthStates.set(state, Date.now() + 10 * 60 * 1000);
    res.setHeader('Set-Cookie', `${OAUTH_STATE_COOKIE}=${state}; Path=/auth/callback; HttpOnly; SameSite=Lax; Max-Age=600${securePart}`);
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

    const browserState = parseCookies(req)[OAUTH_STATE_COOKIE];
    const expiresAt = oauthStates.get(state);
    oauthStates.delete(state);
    const securePart = isSecureRequest(req) ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${OAUTH_STATE_COOKIE}=; Path=/auth/callback; HttpOnly; SameSite=Lax; Max-Age=0${securePart}`);
    if (!browserState || browserState.length !== state.length ||
        !crypto.timingSafeEqual(Buffer.from(browserState), Buffer.from(state)) ||
        !expiresAt || expiresAt <= Date.now()) {
      return res.status(400).send('The OAuth session expired or could not be verified. Please try signing in again.');
    }

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

      const normalizedGuilds = Array.isArray(guilds) ? guilds.map(guild => {
        const owner = Boolean(guild.owner);
        const permissions = String(guild.permissions || '0');
        const permissionBits = BigInt(permissions);
        const canAddBot = owner || (permissionBits & 0x28n) !== 0n;
        return {
          id: String(guild.id),
          name: String(guild.name),
          icon: guild.icon || null,
          owner,
          permissions,
          canAddBot,
        };
      }).filter(guild => guild.canAddBot).sort((a, b) => a.name.localeCompare(b.name)) : [];

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

  if (config.options?.dashboardProduction !== false) {
    app.use(express.static(distRoot));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
      res.sendFile(path.join(distRoot, 'index.html'), error => error ? next(error) : undefined);
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
