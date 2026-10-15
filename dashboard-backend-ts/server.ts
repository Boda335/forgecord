import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import config from '../../settings/config';
import { Logger } from '../core/logger';
import { ROOT_DIR } from '../core/paths';

type DashboardBot = { user?: { username?: string }; isReady?: () => boolean };
type DashboardUser = { id: string; username: string; globalName: string | null; avatar: string | null };
type DiscordServer = { id: string; name: string; icon: string | null; owner: boolean; permissions: string };
type Session = { user: DashboardUser; guilds: DiscordServer[]; expiresAt: number };

const DISCORD_API = 'https://discord.com/api/v10';
const SESSION_COOKIE = 'forgecord_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24;

export function createDashboardServer(bot: DashboardBot | null = null): Express {
  const app = express();
  const distRoot = path.join(ROOT_DIR, 'dashboard', 'dist');
  const sessions = new Map<string, Session>();
  const oauthStates = new Map<string, number>();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json());

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
    oauthStates.set(state, Date.now() + 10 * 60 * 1000);
    const params = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri(req), scope: 'identify guilds', state });
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

  if (config.options?.dashboardProduction !== false) {
    app.use(express.static(distRoot));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
      res.sendFile(path.join(distRoot, 'index.html'), error => error ? next(error) : undefined);
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
