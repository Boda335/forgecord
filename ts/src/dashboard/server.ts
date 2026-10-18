import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import config from '../../settings/config';
import { Logger } from '../core/logger';
import { ROOT_DIR } from '../core/paths';

type DashboardBot = { user?: { username?: string } | null; isReady?: () => boolean };
type DashboardUser = { id: string; username: string; globalName: string | null; avatar: string | null };
type DiscordServer = { id: string; name: string; icon: string | null; owner: boolean; permissions: string };
type Session = { user: DashboardUser; guilds: DiscordServer[]; expiresAt: number };

const DISCORD_API = 'https://discord.com/api/v10';
const SESSION_COOKIE = 'forgecord_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24;

export function createDashboardServer(bot: DashboardBot | null = null): Express {
  const app = express();
  const dashboardRoot = path.join(ROOT_DIR, 'dashboard');
  const distRoot = path.join(dashboardRoot, 'dist');
  const sessions = new Map<string, Session>();

  function ensureDashboardBuild(): boolean {
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
  const oauthStates = new Map<string, number>();
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

  const dashboardUrl = (req: Request) => {
    const configured = process.env.DASHBOARD_URL?.trim();
    return (configured || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  };
  const redirectUri = (req: Request) => process.env.DASHBOARD_REDIRECT_URI?.trim() || `${dashboardUrl(req)}/auth/callback`;
  const secureRequest = (req: Request) => process.env.DASHBOARD_COOKIE_SECURE === 'true' || req.secure || dashboardUrl(req).startsWith('https://');

  function cookies(req: Request): Record<string, string> {
    const header = req.headers.cookie || '';
    return Object.fromEntries(header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
      const index = part.indexOf('=');
      return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    }));
  }

  function setSessionCookie(res: Response, id: string, secure: boolean) {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure ? '; Secure' : ''}`);
  }

  function clearSessionCookie(res: Response, secure: boolean) {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`);
  }

  function getSession(req: Request) {
    const id = cookies(req)[SESSION_COOKIE];
    if (!id) return null;
    const session = sessions.get(id);
    if (!session || session.expiresAt <= Date.now()) {
      sessions.delete(id);
      return null;
    }
    session.expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    return session;
  }

  async function discordRequest(url: string, init: RequestInit = {}) {
    const response = await fetch(url, init);
    const text = await response.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    if (!response.ok) throw new Error(body?.message || body?.error_description || `Discord API returned ${response.status}.`);
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
    const params = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri(req), scope: 'identify guilds', state });
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
      const token = await discordRequest(`${DISCORD_API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: getClientId(), client_secret: getClientSecret(), grant_type: 'authorization_code', code, redirect_uri: redirectUri(req) }),
      });
      const auth = { Authorization: `Bearer ${token.access_token}` };
      const [user, guilds] = await Promise.all([discordRequest(`${DISCORD_API}/users/@me`, { headers: auth }), discordRequest(`${DISCORD_API}/users/@me/guilds`, { headers: auth })]);
      const normalizedGuilds: DiscordServer[] = Array.isArray(guilds) ? guilds.map((guild: any) => ({
        id: String(guild.id), name: String(guild.name), icon: guild.icon ? String(guild.icon) : null, owner: Boolean(guild.owner), permissions: String(guild.permissions || '0'),
      })).sort((a: DiscordServer, b: DiscordServer) => a.name.localeCompare(b.name)) : [];
      const sessionId = crypto.randomBytes(32).toString('hex');
      sessions.set(sessionId, { user: { id: String(user.id), username: String(user.username || 'Discord User'), globalName: user.global_name ? String(user.global_name) : null, avatar: user.avatar ? String(user.avatar) : null }, guilds: normalizedGuilds, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 });
      setSessionCookie(res, sessionId, secureRequest(req));
      return res.redirect('/app');
    } catch (error) {
      Logger.error('Discord OAuth callback failed:', error);
      return res.redirect('/?oauth_error=failed');
    }
  });

  app.post('/auth/logout', (req, res) => {
    const id = cookies(req)[SESSION_COOKIE];
    if (id) sessions.delete(id);
    clearSessionCookie(res, secureRequest(req));
    return res.json({ success: true });
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'forgecord-dashboard' }));
  app.get('/api/session', (req, res) => {
    const session = getSession(req);
    return res.json(session ? { authenticated: true, user: session.user } : { authenticated: false, user: null });
  });
  app.get('/api/servers', (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
    return res.json(session.guilds);
  });
  app.get('/api/bot', (_req, res) => res.json({ name: bot?.user?.username || 'Forgecord Bot', language: 'TypeScript', status: bot?.isReady?.() ? 'online' : 'starting', dashboard: 'enabled' }));

  if (config.options?.dashboardProduction !== false && dashboardReady) {
    app.use(express.static(distRoot));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
      res.sendFile(path.join(distRoot, 'index.html'), error => error ? next(error) : undefined);
    });
  } else if (config.options?.dashboardProduction !== false && !dashboardReady) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
      return res.status(503).send('Dashboard UI is not built. Run `npm run dashboard:build` or enable DASHBOARD_AUTO_BUILD=true in development.');
    });
  }

  return app;
}

export function startDashboardServer(bot: DashboardBot | null = null) {
  if (process.env.DASHBOARD_ENABLED !== 'true') return null;
  const port = Number(process.env.DASHBOARD_PORT || 3000);
  const host = process.env.DASHBOARD_HOST || '127.0.0.1';
  const app = createDashboardServer(bot);
  const server = app.listen(port, host, () => Logger.info(`Dashboard API listening on http://${host}:${port}`));
  server.on('error', error => Logger.error('Dashboard server error', error));
  return server;
}
